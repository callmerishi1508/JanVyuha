/**
 * Vercel serverless — send a free Web Push notification to a user's devices.
 *
 * Zero-cost: Web Push over VAPID is free. Configure once:
 *   npx web-push generate-vapid-keys
 * and set VITE_VAPID_PUBLIC_KEY (client), VAPID_PRIVATE_KEY + VAPID_SUBJECT
 * (server). Reads subscriptions from Supabase using the service-role key.
 *
 * If VAPID keys are absent this responds 503 and the app simply doesn't push.
 *
 * Intended trigger: a Supabase Database Webhook on issue_updates INSERT (or a
 * call from your own backend) POSTs { userId, title, body, url } here.
 */
import webpush from 'web-push'

const PUBLIC = process.env.VITE_VAPID_PUBLIC_KEY
const PRIVATE = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.org'
const SB_URL = process.env.VITE_SUPABASE_URL
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
// Shared secret that ONLY the trusted caller (Supabase DB webhook / your backend)
// knows. Without this, /api/notify was an open push relay: anyone with a user's
// UUID could push arbitrary notifications — with an arbitrary click-through URL —
// under the government app's identity. Set NOTIFY_SECRET in Vercel env and in the
// Supabase webhook's custom header.
const NOTIFY_SECRET = process.env.NOTIFY_SECRET

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

// Best-effort per-IP rate limit (per warm instance) — mirrors api/analyze.ts.
const RATE_MAX = 30
const RATE_WINDOW_MS = 60_000
const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear()
  return arr.length > RATE_MAX
}

/** Force the click-through URL to a same-origin path so a caller can't point a
 *  notification at a phishing site while wearing the app's identity. */
function safePath(url: unknown): string {
  if (typeof url !== 'string' || !url) return '/'
  // Allow only root-relative single-slash paths (not "//host" protocol-relative).
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return '/'
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!PUBLIC || !PRIVATE) return json(res, 503, { error: 'Push not configured' })
  if (!SB_URL || !SB_SERVICE)
    return json(res, 503, { error: 'Supabase service key not configured' })

  // Reject callers that don't present the shared secret. If NOTIFY_SECRET is
  // unset we FAIL CLOSED (503) rather than allow-all — an unconfigured secret
  // must never mean "open to the world".
  if (!NOTIFY_SECRET) return json(res, 503, { error: 'Notify secret not configured' })
  if (req.headers?.['x-notify-secret'] !== NOTIFY_SECRET)
    return json(res, 401, { error: 'Unauthorized' })

  const ip =
    (req.headers?.['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    'unknown'
  if (rateLimited(ip)) return json(res, 429, { error: 'Too many requests' })

  let body: { userId?: string; title?: string; body?: string; url?: string } = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }
  const { userId, title = 'JanVyuha' } = body
  const url = safePath(body.url)
  if (!userId) return json(res, 400, { error: 'userId required' })

  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)

  // Fetch this user's subscriptions via the Supabase REST API (service role).
  const r = await fetch(
    `${SB_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=endpoint,p256dh,auth_key`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
  )
  if (!r.ok) return json(res, 502, { error: 'Could not load subscriptions' })
  const subs = (await r.json()) as {
    endpoint: string
    p256dh: string
    auth_key: string
  }[]

  const payload = JSON.stringify({ title, body: body.body || '', url })
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload
      )
    )
  )
  const sent = results.filter((x) => x.status === 'fulfilled').length
  return json(res, 200, { sent, total: subs.length })
}
