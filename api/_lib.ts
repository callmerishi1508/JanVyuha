/** Shared helpers for the serverless handlers in this directory. */
import type { VercelRequest } from '@vercel/node'

/**
 * Best-effort client IP for per-IP rate limiting.
 *
 * On a direct-to-Vercel deployment (no reverse proxy/CDN of your own in front
 * — true for this app, see vercel.json), Vercel's edge network computes
 * `x-forwarded-for` itself and overwrites/strips whatever the client sent, so
 * it is NOT spoofable here the way it would be on a self-hosted server reading
 * client-supplied headers directly. `x-vercel-forwarded-for` carries the same
 * value but is documented as more robust if a proxy is ever added in front
 * later, so prefer it. Ref: https://vercel.com/docs/headers/request-headers
 */
export function clientIp(req: VercelRequest): string {
  const header =
    req.headers?.['x-vercel-forwarded-for'] ?? req.headers?.['x-forwarded-for']
  return (header || '').toString().split(',')[0].trim() || 'unknown'
}

/**
 * Simple in-memory sliding-window rate limiter. KNOWN LIMITATION: the map is
 * per warm serverless instance, not global — under real concurrent load,
 * Vercel may run several instances in parallel, each with its own counter, so
 * the effective limit is "max per instance" rather than a hard global cap.
 * Good enough to stop casual/scripted abuse for a free-tier pilot; a real
 * global limit needs an external store (e.g. Upstash Ratelimit free tier) —
 * see docs/security-and-dpdp.md.
 */
export function makeRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return function rateLimited(ip: string): boolean {
    const now = Date.now()
    const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
    arr.push(now)
    hits.set(ip, arr)
    if (hits.size > 5000) hits.clear() // bound memory
    return arr.length > max
  }
}
