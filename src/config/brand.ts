/**
 * White-label brand configuration.
 *
 * JanVyuha is deployment-neutral: one codebase can be presented under different
 * sponsoring authorities (a state government, or a national framing for NITI
 * Aayog), or as an independent civic-tech pilot. The active brand is chosen at
 * build time via `VITE_BRAND`; with no value set it falls back to the neutral
 * "independent pilot" identity so we never claim an authorization we don't have.
 *
 * IMPORTANT (positioning): until a real MoU/authorization exists, keep
 * `official = false`. That keeps the UI honest — it presents JanVyuha as a
 * pilot *proposed to* an authority, not as an already-official government site.
 */

export type BrandId = 'neutral' | 'telangana' | 'andhra' | 'tamilnadu' | 'national'

export interface Brand {
  id: BrandId
  /** Product name (kept constant across deployments). */
  product: string
  /** The sponsoring / target authority shown in headers, footers, docs. */
  authority: string
  /** Short authority label for tight spaces. */
  authorityShort: string
  /** One-line positioning tagline. */
  tagline: string
  /** Geographic scope label used by dashboards & analytics ("Telangana", "India"). */
  jurisdiction: string
  /** Primary/theme colour (also used for <meta theme-color> and PWA). */
  themeColor: string
  /** Locale to default the UI to for this audience. */
  defaultLocale: 'en' | 'hi' | 'te' | 'ta'
  /**
   * True only when an actual authorization exists. While false, the UI shows a
   * clear "pilot proposal / not yet an official government service" disclosure
   * instead of unearned "official Government of…" claims.
   */
  official: boolean
}

const BRANDS: Record<BrandId, Brand> = {
  neutral: {
    id: 'neutral',
    product: 'JanVyuha',
    authority: 'Independent Civic-Technology Pilot',
    authorityShort: 'Civic Pilot',
    tagline: 'Citizen reporting, routed to the right responders.',
    jurisdiction: 'India',
    themeColor: '#1f2a52',
    defaultLocale: 'en',
    official: false,
  },
  telangana: {
    id: 'telangana',
    product: 'JanVyuha',
    authority: 'Proposed pilot for the Government of Telangana',
    authorityShort: 'Telangana (proposed)',
    tagline: 'Report civic & emergency issues — routed to the right department.',
    jurisdiction: 'Telangana',
    themeColor: '#0f8a4f',
    defaultLocale: 'te',
    official: false,
  },
  andhra: {
    id: 'andhra',
    product: 'JanVyuha',
    authority: 'Proposed pilot for the Government of Andhra Pradesh',
    authorityShort: 'Andhra Pradesh (proposed)',
    tagline: 'Report civic & emergency issues — routed to the right department.',
    jurisdiction: 'Andhra Pradesh',
    themeColor: '#0277bd',
    defaultLocale: 'te',
    official: false,
  },
  tamilnadu: {
    id: 'tamilnadu',
    product: 'JanVyuha',
    authority: 'Proposed pilot for the Government of Tamil Nadu',
    authorityShort: 'Tamil Nadu (proposed)',
    tagline: 'Report civic & emergency issues — routed to the right department.',
    jurisdiction: 'Tamil Nadu',
    themeColor: '#c2185b',
    defaultLocale: 'ta',
    official: false,
  },
  national: {
    id: 'national',
    product: 'JanVyuha',
    authority: 'National civic-response framework (for NITI Aayog review)',
    authorityShort: 'National (NITI Aayog)',
    tagline: 'A zero-cost, scalable civic-response layer for Indian cities.',
    jurisdiction: 'India',
    themeColor: '#1f2a52',
    defaultLocale: 'hi',
    official: false,
  },
}

function resolveBrand(): Brand {
  const id = (import.meta.env.VITE_BRAND as string | undefined)?.trim() as
    | BrandId
    | undefined
  if (id && id in BRANDS) return BRANDS[id]
  return BRANDS.neutral
}

/** The active brand for this build. */
export const BRAND: Brand = resolveBrand()

/** All presets — used by docs and the (dev-only) tester panel to preview brands. */
export const ALL_BRANDS = BRANDS

/**
 * Public contact / grievance email, set per deployment via VITE_CONTACT_EMAIL.
 * Falls back to a clearly-fake placeholder so it's obvious if left unset.
 */
export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ||
  'contact@janvyuha.example'
