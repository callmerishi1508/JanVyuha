import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabase } from './config'

/**
 * Lazily-created Supabase singleton. Returns null when the project isn't
 * configured, so callers can fall back to the mock backend without crashing.
 */
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

/** Storage bucket that holds citizen-uploaded photos and videos. */
export const EVIDENCE_BUCKET = 'evidence'
