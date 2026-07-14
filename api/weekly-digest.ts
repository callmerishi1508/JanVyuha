/**
 * Vercel Cron — weekly transparency digest emailed to administrators.
 *
 * Governments respond to a steady accountability drumbeat. Once a week this
 * summarises the last 7 days (new vs resolved, backlog, top categories, and a
 * per-department resolution leaderboard) and emails it to the admin recipients.
 *
 * Recipients come from DIGEST_RECIPIENTS (comma-separated emails) — a simple,
 * free-tier-friendly list; if unset OR email isn't configured (EMAIL_API_KEY),
 * this is a no-op, so the digest is entirely optional.
 *
 * Triggered by vercel.json's `crons` entry, which sends `CRON_SECRET` as a
 * Bearer token automatically — see https://vercel.com/docs/cron-jobs.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './_lib'

const SB_URL = process.env.VITE_SUPABASE_URL
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const RECIPIENTS = (process.env.DIGEST_RECIPIENTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

interface Row {
  category: string | null
  status: string | null
  routed_departments: string[] | null
  created_at: string
  updated_at: string
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!CRON_SECRET) return json(res, 503, { error: 'CRON_SECRET not configured' })
  if (req.headers?.authorization !== `Bearer ${CRON_SECRET}`)
    return json(res, 401, { error: 'Unauthorized' })
  if (!SB_URL || !SB_SERVICE)
    return json(res, 503, { error: 'Supabase service key not configured' })
  if (RECIPIENTS.length === 0)
    return json(res, 200, { skipped: 'no DIGEST_RECIPIENTS configured' })

  const admin = createClient(SB_URL, SB_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const { data, error } = await admin
    .from('issues')
    .select('category,status,routed_departments,created_at,updated_at')
    .eq('moderation_status', 'active')
  if (error) return json(res, 500, { error: error.message })

  const rows = (data ?? []) as Row[]
  const isResolved = (r: Row) => r.status === 'resolved'
  const newThisWeek = rows.filter((r) => r.created_at >= cutoff)
  const resolvedThisWeek = rows.filter((r) => isResolved(r) && r.updated_at >= cutoff)
  const openTotal = rows.filter((r) => !isResolved(r)).length

  // Top categories among this week's new reports.
  const catCounts = new Map<string, number>()
  for (const r of newThisWeek) {
    const c = r.category || 'other'
    catCounts.set(c, (catCounts.get(c) ?? 0) + 1)
  }
  const topCats = [...catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Per-department: total routed + resolved (all-time on the active set).
  const dept = new Map<string, { total: number; resolved: number }>()
  for (const r of rows) {
    for (const d of r.routed_departments ?? []) {
      const cur = dept.get(d) ?? { total: 0, resolved: 0 }
      cur.total += 1
      if (isResolved(r)) cur.resolved += 1
      dept.set(d, cur)
    }
  }
  const leaderboard = [...dept.entries()]
    .map(([id, v]) => ({
      id,
      total: v.total,
      resolved: v.resolved,
      rate: v.total ? Math.round((v.resolved / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.total - a.total)

  const th = 'padding:6px 10px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:13px'
  const td = 'padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px'
  const html = `
    <h2 style="font-family:system-ui,sans-serif;color:#0f172a">JanVyuha — weekly digest</h2>
    <p style="font-family:system-ui,sans-serif;color:#334155">Last 7 days across all active reports.</p>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif">
      <tr><td style="${td}">New reports</td><td style="${td}"><b>${newThisWeek.length}</b></td></tr>
      <tr><td style="${td}">Resolved</td><td style="${td}"><b>${resolvedThisWeek.length}</b></td></tr>
      <tr><td style="${td}">Open backlog</td><td style="${td}"><b>${openTotal}</b></td></tr>
    </table>
    <h3 style="font-family:system-ui,sans-serif;color:#0f172a">Top categories this week</h3>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif">
      ${topCats.map(([c, n]) => `<tr><td style="${td}">${esc(c)}</td><td style="${td}">${n}</td></tr>`).join('') || `<tr><td style="${td}">No new reports</td></tr>`}
    </table>
    <h3 style="font-family:system-ui,sans-serif;color:#0f172a">Department resolution leaderboard</h3>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif">
      <tr><th style="${th}">Department</th><th style="${th}">Resolved</th><th style="${th}">Total</th><th style="${th}">Rate</th></tr>
      ${leaderboard.map((d) => `<tr><td style="${td}">${esc(d.id)}</td><td style="${td}">${d.resolved}</td><td style="${td}">${d.total}</td><td style="${td}">${d.rate}%</td></tr>`).join('') || `<tr><td style="${td}">No routed issues</td></tr>`}
    </table>
    <p style="font-family:system-ui,sans-serif;color:#64748b;font-size:12px">JanVyuha — civic issue reporting. Automated weekly digest.</p>`

  const subject = `JanVyuha weekly digest — ${newThisWeek.length} new, ${resolvedThisWeek.length} resolved`
  const text = `New: ${newThisWeek.length} · Resolved: ${resolvedThisWeek.length} · Open backlog: ${openTotal}`

  let sent = 0
  for (const to of RECIPIENTS) {
    if (await sendEmail(to, subject, text, html)) sent += 1
  }
  return json(res, 200, { recipients: RECIPIENTS.length, sent })
}
