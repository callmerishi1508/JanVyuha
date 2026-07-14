/**
 * Vercel serverless — deliver a status-update notification to a citizen.
 *
 * FREE channels only: Web Push over VAPID (unlimited/free) and, if configured,
 * transactional email (Resend/Brevo free tier). SMS is intentionally NOT used —
 * it isn't free in India.
 *
 * TRIGGER (the piece that makes it actually fire): a Supabase Database Webhook
 * on `issue_updates` INSERT. Dashboard → Database → Webhooks → create:
 *   - Table: public.issue_updates, Events: INSERT
 *   - Type: HTTP POST → https://<your-app>/api/notify
 *   - HTTP header: x-notify-secret: <NOTIFY_SECRET>   (must match Vercel env)
 * The webhook body is { type, table, record, ... } where `record` is the new
 * issue_updates row. We resolve that issue's reporter and notify them.
 *
 * Also supports a DIRECT body { userId, title, body, url } for your own backend.
 * Both paths require the x-notify-secret header (fails closed if unset).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { clientIp, makeRateLimiter } from './_lib'

const PUBLIC = process.env.VITE_VAPID_PUBLIC_KEY
const PRIVATE = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.org'
const SB_URL = process.env.VITE_SUPABASE_URL
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const NOTIFY_SECRET = process.env.NOTIFY_SECRET
// Optional email (Resend by default; any provider with a simple REST API works).
const EMAIL_API_KEY = process.env.EMAIL_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM // e.g. "JanVyuha <updates@yourdomain>"

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

const sbHeaders = { apikey: SB_SERVICE as string, Authorization: `Bearer ${SB_SERVICE}` }

const rateLimited = makeRateLimiter(60, 60_000) // 60 req/min, per IP (per warm instance)

/** Force the click-through URL to a same-origin path (anti-phishing). */
function safePath(url: unknown): string {
  if (typeof url !== 'string' || !url) return '/'
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return '/'
}

const STATUS_LABEL: Record<string, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged by the department',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

/** Push a payload to every registered device of a user. Returns count sent. */
async function pushToUser(
  userId: string,
  title: string,
  bodyText: string,
  url: string
): Promise<{ sent: number; total: number }> {
  const r = await fetch(
    `${SB_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=endpoint,p256dh,auth_key`,
    { headers: sbHeaders }
  )
  if (!r.ok) return { sent: 0, total: 0 }
  const subs = (await r.json()) as {
    endpoint: string
    p256dh: string
    auth_key: string
  }[]
  const payload = JSON.stringify({ title, body: bodyText, url })
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload
      )
    )
  )
  return {
    sent: results.filter((x) => x.status === 'fulfilled').length,
    total: subs.length,
  }
}

/** Look up a user's email via the Supabase admin API (service role). */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const r = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      headers: sbHeaders,
    })
    if (!r.ok) return null
    const u = (await r.json()) as { email?: string }
    return u.email || null
  } catch {
    return null
  }
}

/** Send a transactional email via Resend (no-op if EMAIL_API_KEY unset). */
async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!EMAIL_API_KEY || !EMAIL_FROM) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html: `<p>${text}</p><p style="color:#64748b;font-size:12px">JanVyuha — civic issue reporting. You are receiving this because you filed a report.</p>`,
      }),
    })
    return r.ok
  } catch {
    return false
  }
}

/** Supabase Database Webhook payload (`issue_updates` INSERT) or a direct-call body. */
interface NotifyBody {
  table?: string
  type?: string
  record?: { issue_id?: string; status?: string; note?: string }
  userId?: string
  title?: string
  body?: string
  url?: string
}

interface IssueLookupRow {
  reporter_id?: string
  ref_id: string
  title: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!PUBLIC || !PRIVATE) return json(res, 503, { error: 'Push not configured' })
  if (!SB_URL || !SB_SERVICE)
    return json(res, 503, { error: 'Supabase service key not configured' })
  if (!NOTIFY_SECRET) return json(res, 503, { error: 'Notify secret not configured' })
  if (req.headers?.['x-notify-secret'] !== NOTIFY_SECRET)
    return json(res, 401, { error: 'Unauthorized' })

  if (rateLimited(clientIp(req))) return json(res, 429, { error: 'Too many requests' })

  let body: NotifyBody = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)

  // ── Webhook mode: an issue_updates row was inserted → notify the reporter ──
  if (body.record && (body.table === 'issue_updates' || body.type)) {
    const rec = body.record
    if (!rec.issue_id) return json(res, 200, { skipped: 'no issue_id' })

    const ir = await fetch(
      `${SB_URL}/rest/v1/issues?id=eq.${rec.issue_id}&select=reporter_id,ref_id,title`,
      { headers: sbHeaders }
    )
    if (!ir.ok) return json(res, 502, { error: 'Could not load issue' })
    const issue = ((await ir.json()) as IssueLookupRow[])[0]
    if (!issue?.reporter_id) return json(res, 200, { skipped: 'no reporter' })

    const label = STATUS_LABEL[rec.status || ''] || rec.status || 'Updated'
    const title = 'JanVyuha'
    const text = `Report ${issue.ref_id}: ${label}.${rec.note ? ` ${rec.note}` : ''}`
    const url = '/my-issues'

    const push = await pushToUser(issue.reporter_id, title, text, url)
    let emailed = false
    if (EMAIL_API_KEY) {
      const email = await getUserEmail(issue.reporter_id)
      if (email)
        emailed = await sendEmail(email, `${title} — ${issue.ref_id} ${label}`, text)
    }
    return json(res, 200, { mode: 'webhook', pushed: push.sent, of: push.total, emailed })
  }

  // ── Direct mode: { userId, title, body, url } from your own backend ──
  const userId = body.userId
  if (!userId) return json(res, 400, { error: 'userId required' })
  const title = body.title || 'JanVyuha'
  const text = body.body || ''
  const url = safePath(body.url)
  const push = await pushToUser(userId, title, text, url)
  return json(res, 200, { mode: 'direct', pushed: push.sent, of: push.total })
}
