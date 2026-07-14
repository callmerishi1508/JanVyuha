/**
 * Reverse/forward geocoding for the report wizard (P2-13 hardened).
 *
 * Strategy: round coordinates (~10m) and cache lookups locally, then call our
 * own /api/geocode proxy — it sets the identifying User-Agent + 1 req/s pacing
 * the Nominatim usage policy requires (a browser can't set User-Agent) and adds
 * CDN caching + a Photon fallback. When the proxy isn't there (plain
 * `npm run dev`, static preview) we fall back to calling Nominatim directly,
 * same as before. Failures always degrade to raw coordinates — the report flow
 * never blocks on geocoding, which matters because `district` feeds
 * jurisdiction-scoped RLS.
 */
import { currentLocale } from './i18n'

export interface ReverseResult {
  address: string
  city?: string
  state?: string
  /** Administrative district — used for jurisdiction routing. */
  district?: string
}

const PROXY = '/api/geocode'
/** ~11m grid — plenty for a street address, collapses nearby pins onto one
 * cache entry (and one CDN-cached proxy URL). */
const ROUND = 4

const memReverse = new Map<string, ReverseResult>()
const memSearch = new Map<string, ForwardResult[]>()
const LS_PREFIX = 'jv.geo.'
const LS_TTL_MS = 7 * 86_400_000

function lsGet(key: string): ReverseResult | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const { at, v } = JSON.parse(raw) as { at: number; v: ReverseResult }
    if (Date.now() - at > LS_TTL_MS) return null
    return v
  } catch {
    return null
  }
}

function lsSet(key: string, v: ReverseResult): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ at: Date.now(), v }))
  } catch {
    /* storage full/blocked — memory cache still applies */
  }
}

interface NominatimAddress {
  road?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  state_district?: string
  district?: string
}

function fromNominatim(data: {
  address?: NominatimAddress
  display_name?: string
}): Omit<ReverseResult, 'address'> & { address: string } {
  const a = data.address ?? {}
  const city = a.city || a.town || a.village || a.suburb || a.county || undefined
  const state = a.state || undefined
  // Nominatim exposes district variously depending on region.
  const district = a.state_district || a.district || a.county || city || undefined
  const parts = [a.road || a.neighbourhood || a.suburb, city, state].filter(Boolean)
  return {
    address: parts.join(', ') || data.display_name || '',
    city,
    state,
    district,
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseResult> {
  const rLat = lat.toFixed(ROUND)
  const rLng = lng.toFixed(ROUND)
  const key = `${rLat},${rLng},${currentLocale()}`

  const cached = memReverse.get(key) ?? lsGet(key)
  if (cached) {
    memReverse.set(key, cached)
    return cached
  }

  // 1) Our compliant proxy (identifying UA, throttle, CDN cache, Photon fallback).
  try {
    const res = await fetch(
      `${PROXY}?mode=reverse&lat=${rLat}&lng=${rLng}&lang=${currentLocale()}`
    )
    if (res.ok) {
      const v = (await res.json()) as ReverseResult
      if (v.address) {
        memReverse.set(key, v)
        lsSet(key, v)
        return v
      }
    }
  } catch {
    /* proxy absent (local dev) or down — try direct */
  }

  // 2) Direct Nominatim (dev fallback).
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${rLat}&lon=${rLng}&zoom=16&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': currentLocale() } })
    if (!res.ok) throw new Error('geocode failed')
    const v = fromNominatim(await res.json())
    const out = { ...v, address: v.address || fallback(lat, lng) }
    memReverse.set(key, out)
    lsSet(key, out)
    return out
  } catch {
    return { address: fallback(lat, lng) }
  }
}

function fallback(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export interface ForwardResult {
  label: string
  lat: number
  lng: number
}

/**
 * Forward geocoding — turn a typed address into candidate locations.
 * Biased to India (countrycodes=in) per Nominatim usage policy.
 */
export async function searchAddress(query: string): Promise<ForwardResult[]> {
  const text = query.trim()
  if (text.length < 3) return []
  const key = `${text.toLowerCase()}|${currentLocale()}`
  const cached = memSearch.get(key)
  if (cached) return cached

  // 1) Proxy.
  try {
    const res = await fetch(
      `${PROXY}?mode=search&q=${encodeURIComponent(text)}&lang=${currentLocale()}`
    )
    if (res.ok) {
      const v = (await res.json()) as ForwardResult[]
      memSearch.set(key, v)
      return v
    }
  } catch {
    /* proxy absent — try direct */
  }

  // 2) Direct Nominatim (dev fallback).
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=5&q=${encodeURIComponent(
      text
    )}`
    const res = await fetch(url, { headers: { 'Accept-Language': currentLocale() } })
    if (!res.ok) return []
    const data = (await res.json()) as {
      display_name: string
      lat: string
      lon: string
    }[]
    const v = data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }))
    memSearch.set(key, v)
    return v
  } catch {
    return []
  }
}
