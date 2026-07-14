/**
 * Vercel Cron — daily retention sweep (DPDP storage-limitation principle).
 *
 * Reports and evidence are retained while a case is open and for a limited
 * accountability window after resolution (see the Privacy Policy §6), after
 * which personal identifiers are removed. This anonymizes reporter_name/
 * reporter_phone on issues that have been `resolved` for over RETENTION_DAYS.
 * The issue itself (category, location, timeline) is kept — only the
 * citizen's identity is scrubbed; evidence media is left alone (the private
 * evidence bucket already isn't publicly readable).
 *
 * Triggered by vercel.json's `crons` entry, which sends `CRON_SECRET` as a
 * Bearer token automatically — see https://vercel.com/docs/cron-jobs.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.VITE_SUPABASE_URL
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const RETENTION_DAYS = 90

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!CRON_SECRET) return json(res, 503, { error: 'CRON_SECRET not configured' })
  if (req.headers?.authorization !== `Bearer ${CRON_SECRET}`)
    return json(res, 401, { error: 'Unauthorized' })
  if (!SB_URL || !SB_SERVICE)
    return json(res, 503, { error: 'Supabase service key not configured' })

  const admin = createClient(SB_URL, SB_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()
  // Filter on reporter_id (the real identifiability signal), not
  // reporter_name — a citizen who chose "report anonymously" already has
  // reporter_name = 'Anonymous' at submission time, but reporter_id (their
  // auth link) is still set until this sweep clears it.
  const { data, error } = await admin
    .from('issues')
    .update({ reporter_name: 'Anonymous', reporter_phone: null, reporter_id: null })
    .eq('status', 'resolved')
    .lt('updated_at', cutoff)
    .not('reporter_id', 'is', null)
    .select('id')

  if (error) return json(res, 500, { error: error.message })
  return json(res, 200, { anonymized: data?.length ?? 0 })
}
