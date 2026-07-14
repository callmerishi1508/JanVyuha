/**
 * Vercel serverless — self-serve account deletion (DPDP right to erasure).
 *
 * The browser client can't delete its own auth.users row (no such grant), so
 * this endpoint verifies the caller's own access token, then uses the
 * service-role key to:
 *  1. Anonymize the PII embedded directly in their past reports —
 *     reporter_name/reporter_phone are plain text columns, not foreign keys,
 *     so they are NOT cleared by the reporter_id cascade below.
 *  2. Delete the auth user, which cascades to remove their profile, ratings,
 *     votes and push subscriptions (see supabase/schema.sql foreign keys).
 * Their issues themselves are kept for civic accountability/transparency —
 * only fully disassociated from their identity.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { clientIp, makeRateLimiter } from './_lib'

const SB_URL = process.env.VITE_SUPABASE_URL
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

const rateLimited = makeRateLimiter(10, 60_000) // 10 req/min, per IP (per warm instance)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!SB_URL || !SB_SERVICE)
    return json(res, 503, { error: 'Supabase service key not configured' })
  if (rateLimited(clientIp(req))) return json(res, 429, { error: 'Too many requests' })

  const authHeader = (req.headers?.authorization || '').toString()
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return json(res, 401, { error: 'Missing access token' })

  const admin = createClient(SB_URL, SB_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verifies the token against Supabase Auth — this is the caller proving
  // who they are; we only ever delete THIS resolved user, never one passed
  // in the request body.
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) return json(res, 401, { error: 'Invalid session' })
  const userId = userData.user.id

  const { error: scrubErr } = await admin
    .from('issues')
    .update({ reporter_name: 'Anonymous', reporter_phone: null })
    .eq('reporter_id', userId)
  if (scrubErr) return json(res, 500, { error: 'Could not anonymise past reports' })

  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) return json(res, 500, { error: 'Could not delete account' })

  return json(res, 200, { ok: true })
}
