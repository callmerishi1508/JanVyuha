/**
 * Central runtime configuration. Reads Vite env vars and decides which backend
 * is active. Everything degrades gracefully: with no keys, the app uses the
 * in-browser mock so it always runs.
 */

/**
 * Normalise a pasted Supabase Project URL down to its bare origin.
 *
 * `createClient()` expects only the project root (e.g.
 * `https://xyz.supabase.co`) and appends the service sub-paths itself
 * (`/auth/v1`, `/rest/v1`, `/storage/v1`). A URL that already carries one of
 * those suffixes — a very easy copy-paste mistake from the Supabase dashboard —
 * yields broken calls like `.../rest/v1/auth/v1/authorize`, which hit PostgREST
 * and fail with "No API key found in request". We strip trailing slashes and any
 * accidental service path so a mispaste can't break auth again.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw
  let url = raw.trim()
  if (!url) return undefined
  // Drop an accidental /rest/v1, /auth/v1, /storage/v1 (with optional trailing slash).
  url = url.replace(/\/(rest|auth|storage)\/v1\/?$/i, '')
  // Drop any remaining trailing slash(es).
  url = url.replace(/\/+$/, '')
  return url
}

export const SUPABASE_URL = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL as string | undefined
)
export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
)?.trim()

/** True when both Supabase credentials are present. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export type BackendKind = 'mock' | 'supabase'

/**
 * The active backend. Honours an explicit VITE_BACKEND override, otherwise
 * auto-detects: Supabase when configured, mock otherwise. Tester Mode can
 * override this at runtime (see store/testMode).
 */
function resolveBackend(): BackendKind {
  const forced = (import.meta.env.VITE_BACKEND as string | undefined)?.trim()
  if (forced === 'mock' || forced === 'supabase') return forced
  return hasSupabase ? 'supabase' : 'mock'
}

export const DEFAULT_BACKEND: BackendKind = resolveBackend()

/** AI assist is available whenever the serverless proxy can reach a key.
 *  The client can't see GEMINI_API_KEY (server-only), so we optimistically
 *  enable the UI and let the /api/analyze call tell us if it's unavailable. */
export const AI_ENDPOINT = '/api/analyze'

export const IS_DEV = import.meta.env.DEV

/**
 * Whether the Tester Mode panel may be shown. Always in dev; in production ONLY
 * when a build explicitly opts in via `VITE_ENABLE_TESTER=true`.
 *
 * Security: earlier this honoured a `?tester=1` URL flag and a localStorage
 * flag, which meant anyone could open the internal dev panel (and mint fake
 * stakeholder/admin sessions) on a shipped build. Those escape hatches are
 * removed — a production pitch build has the panel hard-off.
 */
export function testerAllowed(): boolean {
  if (IS_DEV) return true
  return (import.meta.env.VITE_ENABLE_TESTER as string | undefined) === 'true'
}

/**
 * Demo mode = the app is running against the in-browser mock (no real backend).
 * UI uses this to show honest "demonstration data" disclosures and to hide the
 * demo-only convenience copy (e.g. "any password works") from real deployments.
 */
export function isDemoMode(): boolean {
  return !hasSupabase
}

/** Preferred UI locale for this build (brand default; user choice overrides). */
export const DEFAULT_LOCALE =
  (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined)?.trim() || undefined

/**
 * Whether the public Transparency page shows the department resolution
 * leaderboard. On by default (transparency pressure is the point); a tenant can
 * hide the ranked comparison during onboarding via `VITE_PUBLIC_LEADERBOARD=false`.
 */
export function publicLeaderboardEnabled(): boolean {
  return (import.meta.env.VITE_PUBLIC_LEADERBOARD as string | undefined) !== 'false'
}
