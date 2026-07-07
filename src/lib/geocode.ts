/**
 * Lightweight reverse-geocoding via OpenStreetMap Nominatim (no API key).
 * Falls back gracefully to coordinates if the network is unavailable, so the
 * report flow never blocks on it.
 */
import { currentLocale } from './i18n'

export interface ReverseResult {
  address: string
  city?: string
  state?: string
  /** Administrative district — used for jurisdiction routing. */
  district?: string
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': currentLocale() },
    })
    if (!res.ok) throw new Error('geocode failed')
    const data = await res.json()
    const a = data.address ?? {}
    const city =
      a.city || a.town || a.village || a.suburb || a.county || undefined
    const state = a.state || undefined
    // Nominatim exposes district variously depending on region.
    const district =
      a.state_district || a.district || a.county || city || undefined
    const parts = [
      a.road || a.neighbourhood || a.suburb,
      city,
      state,
    ].filter(Boolean)
    return {
      address: parts.join(', ') || data.display_name || fallback(lat, lng),
      city,
      state,
      district,
    }
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
  if (query.trim().length < 3) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=5&q=${encodeURIComponent(
      query
    )}`
    const res = await fetch(url, {
      headers: { 'Accept-Language': currentLocale() },
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      display_name: string
      lat: string
      lon: string
    }[]
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }))
  } catch {
    return []
  }
}
