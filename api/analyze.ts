/**
 * Vercel serverless function — Gemini Vision AI triage proxy.
 *
 * Keeps GEMINI_API_KEY server-side (never shipped to the browser). Accepts an
 * optional image + description, asks Gemini to classify the civic issue, and
 * returns a STRICT JSON suggestion the client validates against its own unions.
 *
 * Free to run: Vercel Hobby + Google AI Studio free tier.
 * If GEMINI_API_KEY is unset, responds 503 so the client hides the feature.
 *
 * Deploy target: Vercel. Runs on the Node.js runtime (default).
 */

const CATEGORIES = [
  'fire',
  'road_accident',
  'missing_person',
  'tree_fall',
  'road_damage',
  'public_nuisance',
  'electricity',
  'water',
  'medical',
  'garbage',
] as const

const SEVERITIES = ['critical', 'high', 'moderate', 'low'] as const

const DEPARTMENTS = [
  'fire',
  'ambulance',
  'police',
  'municipal',
  'electricity',
  'water',
  'animal',
] as const

// Gemini model for triage. Note: Google retires older model ids (gemini-1.5-flash
// was retired in 2025 and now 404s, which surfaced as "AI could not analyse this
// right now"). Keep this on a current, multimodal, free-tier flash model. Verify
// availability with: GET generativelanguage.googleapis.com/v1beta/models?key=…
const MODEL = 'gemini-2.5-flash'

interface AnalyzeBody {
  description?: string
  /** data URL or bare base64 of an image. */
  image?: string
  mimeType?: string
}

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

// ── Abuse / cost protection (this endpoint spends money per call) ────────────
// Best-effort, zero-dependency guards. For a production state rollout, add a
// proper edge rate-limiter (Vercel WAF or Upstash free tier) — documented in
// docs/security.md. These caps still stop the obvious script-it-in-a-loop abuse.
// ~3.5MB of base64 ≈ a 2.6MB image. Kept safely under Vercel's 4.5MB request
// body limit (base64 inflates the raw image ~1.33×, plus prompt/JSON overhead).
const MAX_IMAGE_BYTES = 3_500_000
const MAX_DESC_CHARS = 4000
const RATE_MAX = 20 // requests
const RATE_WINDOW_MS = 60_000 // per minute, per IP (per warm instance)
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear() // bound memory
  return arr.length > RATE_MAX
}

function originAllowed(req: any): boolean {
  const origin = req.headers?.origin || ''
  const host = req.headers?.host || ''

  // Same-origin requests — the deployed app calling its own /api — are always
  // allowed. This automatically covers every Vercel domain (production, preview
  // deployments, and custom domains) without needing to enumerate them, which
  // was the bug: an exact ALLOWED_ORIGINS prefix rejected preview URLs (and even
  // a hyphen/no-hyphen typo) with 403, so the request never reached Gemini.
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return true
    } catch {
      /* malformed Origin header — fall through to the allow-list */
    }
  }

  // Otherwise honour an explicit cross-origin allow-list. Blank = allow all
  // (dev / preview / unconfigured).
  const allow = (process.env.ALLOWED_ORIGINS || '').trim()
  if (!allow) return true
  const ref = origin || req.headers?.referer || ''
  return allow.split(',').some((o) => o.trim() && ref.startsWith(o.trim()))
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const key = process.env.GEMINI_API_KEY
  if (!key) return json(res, 503, { error: 'AI not configured' })

  if (!originAllowed(req)) return json(res, 403, { error: 'Origin not allowed' })

  const ip =
    (req.headers?.['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    'unknown'
  if (rateLimited(ip))
    return json(res, 429, { error: 'Too many requests, slow down' })

  let body: AnalyzeBody = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const { description = '', image, mimeType } = body
  if (!description && !image)
    return json(res, 400, { error: 'Provide a description or an image' })
  if (description.length > MAX_DESC_CHARS)
    return json(res, 413, { error: 'Description too long' })
  if (image && image.length > MAX_IMAGE_BYTES)
    return json(res, 413, { error: 'Image too large (max ~1.5MB)' })
  if (image && !/^data:image\//.test(image) && !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 64)))
    return json(res, 415, { error: 'Unsupported image format' })

  const prompt = `You are the triage assistant for JanVyuha, an Indian government civic-issue
reporting platform. Classify the reported issue from the citizen's photo and/or text.

Return ONLY a compact JSON object (no markdown, no prose) with exactly these keys:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "severity": one of ${JSON.stringify(SEVERITIES)},
  "title": a short, factual 4-9 word title,
  "summary": one clear sentence describing the issue for responders,
  "departments": array of department ids that should be alerted, each one of
    ${JSON.stringify(DEPARTMENTS)},
  "flagged": true only if the content looks like spam, abuse, or not a genuine civic issue,
  "confidence": a number 0-1
}

Guidance:
- Pick the SINGLE best category. Fires, road accidents, missing persons and medical
  emergencies are usually "critical" or "high".
- For "departments", include ONLY those genuinely relevant to THIS incident. Think about
  who is actually affected: a building fire endangers people (add "ambulance"); a tree on
  fire with nobody around does NOT need "ambulance"; if animals are hurt add "animal"; if
  electric wires are involved add "electricity". Never include an unrelated department.
- If the photo does not clearly show a civic issue, still give your best guess with low confidence.
Citizen description: """${description.slice(0, 1200)}"""`

  const parts: any[] = [{ text: prompt }]
  if (image) {
    const b64 = image.startsWith('data:') ? image.split(',')[1] : image
    const mt =
      mimeType ||
      (image.startsWith('data:')
        ? image.slice(5, image.indexOf(';'))
        : 'image/jpeg')
    parts.push({ inline_data: { mime_type: mt, data: b64 } })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    const gRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    })
    clearTimeout(timeout)

    if (!gRes.ok) {
      const detail = await gRes.text()
      return json(res, 502, { error: 'AI upstream error', detail: detail.slice(0, 300) })
    }

    const data = await gRes.json()
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : null
    }
    if (!parsed) return json(res, 502, { error: 'Could not parse AI response' })

    // Validate/normalise against our unions.
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : null
    const severity = SEVERITIES.includes(parsed.severity)
      ? parsed.severity
      : 'moderate'
    const departments = Array.isArray(parsed.departments)
      ? parsed.departments.filter((d: unknown) =>
          DEPARTMENTS.includes(d as (typeof DEPARTMENTS)[number])
        )
      : []
    return json(res, 200, {
      category,
      severity,
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 90) : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 300) : '',
      departments,
      flagged: parsed.flagged === true,
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5,
    })
  } catch (e: any) {
    const aborted = e?.name === 'AbortError'
    return json(res, aborted ? 504 : 500, {
      error: aborted ? 'AI timed out' : 'AI request failed',
    })
  }
}
