/**
 * Vercel serverless — geocoding proxy (P2-13).
 *
 * Why a proxy at all: browsers cannot set a custom User-Agent, so direct
 * client calls to Nominatim violate its usage policy (identifying UA with
 * contact required, max 1 req/s) — and policy-violating traffic risks getting
 * blocked, which silently degrades the `district` value our jurisdiction RLS
 * scoping depends on. This function:
 *   - sends a compliant User-Agent (+ contact from GEOCODE_CONTACT or
 *     VAPID_SUBJECT) on every upstream call;
 *   - throttles upstream Nominatim calls to 1/s per instance;
 *   - falls back to Photon (photon.komoot.io, no key) when Nominatim fails;
 *   - sets s-maxage so Vercel's CDN caches responses per URL — the client
 *     rounds coordinates, so nearby pins collapse onto cached URLs and most
 *     lookups never invoke the function at all.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientIp, makeRateLimiter } from './_lib'

const CONTACT =
  process.env.GEOCODE_CONTACT ||
  (process.env.VAPID_SUBJECT || '').replace(/^mailto:/, '') ||
  'unconfigured@example.org'
const UA = `JanVyuha-civic-reporting/1.0 (${CONTACT})`

const rateLimited = makeRateLimiter(30, 60_000) // 30 req/min per IP (per instance)

// Serialize upstream Nominatim calls at >=1s spacing (per warm instance).
let lastNominatim = 0
let queue: Promise<unknown> = Promise.resolve()
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastNominatim + 1000 - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastNominatim = Date.now()
    return fn()
  })
  queue = run.catch(() => undefined)
  return run
}

function json(res: VercelResponse, status: number, body: unknown, cache = false) {
  res.status(status).setHeader('Content-Type', 'application/json')
  if (cache)
    // Cached on Vercel's CDN for a day — geocoding of a fixed point is stable.
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    )
  res.send(JSON.stringify(body))
}

async function fetchJson(url: string, lang: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': lang },
      signal: controller.signal,
    })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(timeout)
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

/** Shared response shape for reverse mode (mirrors the client's ReverseResult). */
function fromNominatimReverse(data: {
  address?: NominatimAddress
  display_name?: string
}) {
  const a = data.address ?? {}
  const city = a.city || a.town || a.village || a.suburb || a.county || undefined
  const state = a.state || undefined
  const district = a.state_district || a.district || a.county || city || undefined
  const parts = [a.road || a.neighbourhood || a.suburb, city, state].filter(Boolean)
  return {
    address: parts.join(', ') || data.display_name || '',
    city,
    state,
    district,
  }
}

interface PhotonFeature {
  properties?: {
    name?: string
    street?: string
    city?: string
    county?: string
    district?: string
    state?: string
  }
  geometry?: { coordinates?: [number, number] }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
  if (rateLimited(clientIp(req))) return json(res, 429, { error: 'Too many requests' })

  const q = req.query ?? {}
  const mode = (q.mode ?? '').toString()
  const lang = (q.lang ?? 'en').toString().slice(0, 5)

  if (mode === 'reverse') {
    const lat = Number(q.lat)
    const lng = Number(q.lng)
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return json(res, 400, { error: 'Invalid coordinates' })
    try {
      const data = (await throttled(() =>
        fetchJson(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
          lang
        )
      )) as { address?: NominatimAddress; display_name?: string }
      return json(res, 200, fromNominatimReverse(data), true)
    } catch {
      // Photon fallback — different provider, no key, generous policy.
      try {
        const data = (await fetchJson(
          `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
          lang
        )) as { features?: PhotonFeature[] }
        const p = data.features?.[0]?.properties ?? {}
        const city = p.city || p.county || undefined
        return json(
          res,
          200,
          {
            address: [p.street || p.name, city, p.state].filter(Boolean).join(', '),
            city,
            state: p.state,
            district: p.district || p.county || city,
          },
          true
        )
      } catch {
        return json(res, 502, { error: 'Geocoding unavailable' })
      }
    }
  }

  if (mode === 'search') {
    const text = (q.q ?? '').toString().trim().slice(0, 200)
    if (text.length < 3) return json(res, 400, { error: 'Query too short' })
    try {
      const data = (await throttled(() =>
        fetchJson(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=5&q=${encodeURIComponent(text)}`,
          lang
        )
      )) as { display_name: string; lat: string; lon: string }[]
      return json(
        res,
        200,
        data.map((d) => ({
          label: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        })),
        true
      )
    } catch {
      try {
        const data = (await fetchJson(
          `https://photon.komoot.io/api?limit=5&q=${encodeURIComponent(text)}`,
          lang
        )) as { features?: PhotonFeature[] }
        return json(
          res,
          200,
          (data.features ?? [])
            .map((f) => {
              const p = f.properties ?? {}
              const [lon, lat] = f.geometry?.coordinates ?? []
              return {
                label: [p.name, p.city, p.state].filter(Boolean).join(', '),
                lat,
                lng: lon,
              }
            })
            .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)),
          true
        )
      } catch {
        return json(res, 502, { error: 'Geocoding unavailable' })
      }
    }
  }

  return json(res, 400, { error: 'Unknown mode' })
}
