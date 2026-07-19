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
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientIp, makeRateLimiter } from './_lib'

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

/** App languages a report can be translated into (P2-10 translate mode). */
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
}

interface AnalyzeBody {
  description?: string
  /** data URL or bare base64 of an image. */
  image?: string
  mimeType?: string
  /** 'translate' switches this endpoint to text translation (same guards). */
  mode?: string
  /** translate mode: the text to translate. */
  text?: string
  /** translate mode: BCP-47-ish target ('en' | 'hi' | 'te' | 'ta'). */
  targetLang?: string
}

/** Shape returned to the client; also what we coerce Gemini's output into. */
interface AnalyzeResult {
  category: (typeof CATEGORIES)[number] | null
  severity: (typeof SEVERITIES)[number]
  title: string
  summary: string
  departments: (typeof DEPARTMENTS)[number][]
  flagged: boolean
  confidence: number
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } }

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

/** Narrow an unknown value to a member of a readonly string-literal tuple. */
function isOneOf<T extends string>(arr: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (arr as readonly string[]).includes(v)
}

/**
 * One JSON-mode Gemini round-trip: send parts, parse the JSON object out of the
 * reply (or null if unparseable). Throws on network/timeout; the caller maps
 * upstream !ok to a logged 502 the same way for both triage and translate.
 */
async function callGemini(
  key: string,
  parts: GeminiPart[],
  timeoutMs: number
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const gRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    })
    if (!gRes.ok) {
      // Log server-side only — the upstream body can echo back request details
      // (e.g. the API key query param on some error paths) that must not reach the client.
      console.error('[analyze] Gemini upstream error', gRes.status, await gRes.text())
      return null
    }
    const data = await gRes.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    try {
      return JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      return m ? JSON.parse(m[0]) : null
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Abuse / cost protection (this endpoint spends money per call) ────────────
// Best-effort, zero-dependency guards. For a production state rollout, add a
// proper edge rate-limiter (Vercel WAF or Upstash free tier) — documented in
// docs/security-and-dpdp.md. These caps still stop the obvious script-it-in-a-loop
// abuse. ~3.5MB of base64 ≈ a 2.6MB image. Kept safely under Vercel's 4.5MB
// request body limit (base64 inflates the raw image ~1.33×, plus prompt/JSON overhead).
const MAX_IMAGE_BYTES = 3_500_000
const MAX_DESC_CHARS = 4000
const rateLimited = makeRateLimiter(20, 60_000) // 20 req/min, per IP (per warm instance)

function originAllowed(req: VercelRequest): boolean {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const key = process.env.GEMINI_API_KEY
  if (!key) return json(res, 503, { error: 'AI not configured' })

  if (!originAllowed(req)) return json(res, 403, { error: 'Origin not allowed' })

  if (rateLimited(clientIp(req)))
    return json(res, 429, { error: 'Too many requests, slow down' })

  let body: AnalyzeBody
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  // ── Translate mode (P2-10a): reuses this endpoint's key + guards ───────────
  // Officials read citizen reports written in another of the app's languages.
  // Text-only, so it shares the description length cap; called lazily from the
  // detail view (never on the citizen submit path — Gemini free tier has RPM/RPD
  // caps we must keep away from report submission).
  if (body.mode === 'translate') {
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const target = LANG_NAMES[body.targetLang ?? '']
    if (!text) return json(res, 400, { error: 'Provide text' })
    if (!target) return json(res, 400, { error: 'Unsupported target language' })
    if (text.length > MAX_DESC_CHARS) return json(res, 413, { error: 'Text too long' })
    try {
      const out = await callGemini(
        key,
        [
          {
            text: `Translate the citizen-report text between the markers into ${target}.
Keep it faithful and plain; do not add commentary. If it is already in ${target},
return it unchanged. Return ONLY JSON: {"text": "<translation>"}
<<<${text.slice(0, MAX_DESC_CHARS)}>>>`,
          },
        ],
        10_000
      )
      const p = (out ?? {}) as Record<string, unknown>
      const translated = typeof p.text === 'string' ? p.text.slice(0, MAX_DESC_CHARS) : ''
      if (!translated) return json(res, 502, { error: 'Could not parse AI response' })
      return json(res, 200, { text: translated })
    } catch (e: unknown) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      return json(res, aborted ? 504 : 502, {
        error: aborted ? 'AI timed out' : 'AI upstream error',
      })
    }
  }

  const { description = '', image, mimeType } = body
  if (!description && !image)
    return json(res, 400, { error: 'Provide a description or an image' })
  if (description.length > MAX_DESC_CHARS)
    return json(res, 413, { error: 'Description too long' })
  if (image && image.length > MAX_IMAGE_BYTES)
    return json(res, 413, { error: 'Image too large (max ~2.6MB)' })
  if (
    image &&
    !/^data:image\//.test(image) &&
    !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 64))
  )
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

  const parts: GeminiPart[] = [{ text: prompt }]
  if (image) {
    const b64 = image.startsWith('data:') ? image.split(',')[1] : image
    const mt =
      mimeType ||
      (image.startsWith('data:') ? image.slice(5, image.indexOf(';')) : 'image/jpeg')
    parts.push({ inline_data: { mime_type: mt, data: b64 } })
  }

  try {
    const parsed = await callGemini(key, parts, 20_000)
    if (!parsed || typeof parsed !== 'object')
      return json(res, 502, { error: 'Could not parse AI response' })
    const p = parsed as Record<string, unknown>

    // Validate/normalise against our unions.
    const result: AnalyzeResult = {
      category: isOneOf(CATEGORIES, p.category) ? p.category : null,
      severity: isOneOf(SEVERITIES, p.severity) ? p.severity : 'moderate',
      title: typeof p.title === 'string' ? p.title.slice(0, 90) : '',
      summary: typeof p.summary === 'string' ? p.summary.slice(0, 300) : '',
      departments: Array.isArray(p.departments)
        ? p.departments.filter((d: unknown): d is (typeof DEPARTMENTS)[number] =>
            isOneOf(DEPARTMENTS, d)
          )
        : [],
      flagged: p.flagged === true,
      confidence:
        typeof p.confidence === 'number' ? Math.max(0, Math.min(1, p.confidence)) : 0.5,
    }
    return json(res, 200, result)
  } catch (e: unknown) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return json(res, aborted ? 504 : 500, {
      error: aborted ? 'AI timed out' : 'AI request failed',
    })
  }
}
