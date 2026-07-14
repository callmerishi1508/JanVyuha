import { AI_ENDPOINT } from '../lib/config'
import type { CategoryId, DepartmentId, Severity } from '../data/categories'
import { CATEGORIES, resolveRouting } from '../data/categories'
import { useTestMode } from '../store/testMode'

export interface AiSuggestion {
  category: CategoryId | null
  severity: Severity
  title: string
  summary: string
  /** Departments the AI judged relevant to THIS incident (context-aware). */
  departments: DepartmentId[]
  /** True if the content looks like spam/abuse/not-a-civic-issue. */
  flagged: boolean
  confidence: number
}

export type AiResult =
  | { ok: true; suggestion: AiSuggestion }
  | { ok: false; reason: 'unavailable' | 'error'; message?: string }

/**
 * Offline heuristic used by Tester Mode's "mock AI" toggle (no network, no key).
 *
 * NOTE: this is a text-only stand-in — it CANNOT see the uploaded photo (only
 * the real Gemini proxy in /api/analyze does). To keep the demo believable it
 * scores the description against a rich keyword set per category (including the
 * category's own display name and common synonyms), so typing "road damage",
 * "pothole", "broken road", etc. all classify correctly. Best score wins.
 */
const MOCK_KEYWORDS: Record<CategoryId, string[]> = {
  fire: [
    'fire',
    'smoke',
    'flame',
    'burning',
    'burnt',
    'gas leak',
    'blaze',
    'explosion',
    'cylinder',
  ],
  road_accident: [
    'road accident',
    'accident',
    'collision',
    'crash',
    'hit and run',
    'vehicle hit',
    'bike fell',
    'overturn',
    'rammed',
  ],
  missing_person: [
    'missing person',
    'missing',
    'lost child',
    'disappeared',
    'kidnap',
    'untraceable',
    'not returned home',
  ],
  medical: [
    'medical',
    'collapse',
    'unconscious',
    'injured',
    'ambulance',
    'bleeding',
    'heart attack',
    'fainted',
    'emergency patient',
  ],
  tree_fall: [
    'tree fall',
    'tree fell',
    'fallen tree',
    'branch fell',
    'uprooted',
    'tree blocking',
    'tree collapsed',
  ],
  road_damage: [
    'road damage',
    'road damaged',
    'damaged road',
    'broken road',
    'road broken',
    'pothole',
    'pot hole',
    'crack',
    'cracked road',
    'footpath',
    'sunken road',
    'caved',
    'bad road',
    'crater',
    'flyover crack',
  ],
  public_nuisance: [
    'public nuisance',
    'nuisance',
    'loudspeaker',
    'loud noise',
    'noise',
    'encroach',
    'illegal parking',
    'disturbance',
    'eve teasing',
  ],
  electricity: [
    'electricity',
    'electric',
    'power cut',
    'power',
    'spark',
    'sparking',
    'pole',
    'wire',
    'shock',
    'transformer',
    'short circuit',
    'no current',
  ],
  water: [
    'water',
    'pipeline',
    'pipe burst',
    'leak',
    'leakage',
    'sewage',
    'flood',
    'no water',
    'contaminated water',
    'drainage overflow',
  ],
  garbage: [
    'garbage',
    'trash',
    'waste',
    'rubbish',
    'dump',
    'drain',
    'sanitation',
    'sewage smell',
    'not collected',
    'dead animal',
  ],
}

function mockSuggest(description: string): AiSuggestion {
  const text = ' ' + description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' '

  // Score every category by how many (and how specific) keywords match.
  let category: CategoryId | null = null
  let bestScore = 0
  for (const [cat, kws] of Object.entries(MOCK_KEYWORDS) as [CategoryId, string[]][]) {
    let score = 0
    for (const k of kws) {
      if (text.includes(' ' + k + ' ') || text.includes(' ' + k)) {
        // Longer, multi-word phrases are stronger signals than single words.
        score += k.includes(' ') ? 2 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      category = cat
    }
  }

  const emergency = category ? CATEGORIES[category].emergency : false
  // Derive relevant departments from the keyword resolver so the mock behaves
  // like the real context-aware routing.
  const departments: DepartmentId[] = category
    ? [
        ...CATEGORIES[category].core,
        ...resolveRouting(category, { text: description })
          .conditional.filter((c) => c.matched)
          .map((c) => c.department),
      ]
    : []

  // A clean, human title: prefer the category name when the description is just
  // the category, otherwise use the first sentence of what the user wrote.
  const firstSentence = description.trim().split(/[.\n]/)[0].slice(0, 60)
  const title =
    category && firstSentence.length < 4
      ? CATEGORIES[category].name
      : firstSentence || (category ? CATEGORIES[category].name : 'Reported issue')

  // Confidence scales with match strength (capped), so a strong multi-keyword
  // match reads as high-confidence and a no-match stays low.
  const confidence = category ? Math.min(0.9, 0.55 + bestScore * 0.12) : 0.3

  return {
    category,
    severity: emergency ? 'high' : 'moderate',
    title,
    summary:
      description.trim().slice(0, 160) || (category ? CATEGORIES[category].name : ''),
    departments: Array.from(new Set(departments)),
    flagged: false,
    confidence,
  }
}

/**
 * Ask the AI to triage an issue from a photo and/or description.
 * Returns { ok:false, reason:'unavailable' } when no AI key is configured on the
 * server — callers use that to hide the feature gracefully.
 */
export async function analyzeIssue(input: {
  description?: string
  imageDataUrl?: string
}): Promise<AiResult> {
  // Tester Mode: return a canned suggestion without any network call.
  if (useTestMode.getState().mockAi) {
    await new Promise((r) => setTimeout(r, 500))
    return { ok: true, suggestion: mockSuggest(input.description ?? '') }
  }

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: input.description ?? '',
        image: input.imageDataUrl,
      }),
    })
    if (res.status === 503) return { ok: false, reason: 'unavailable' }
    if (!res.ok) return { ok: false, reason: 'error', message: `HTTP ${res.status}` }
    const raw = (await res.json()) as Partial<AiSuggestion>
    return {
      ok: true,
      suggestion: {
        category: raw.category ?? null,
        severity: raw.severity ?? 'moderate',
        title: raw.title ?? '',
        summary: raw.summary ?? '',
        departments: Array.isArray(raw.departments) ? raw.departments : [],
        flagged: raw.flagged === true,
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
      },
    }
  } catch (e) {
    return { ok: false, reason: 'error', message: (e as Error).message }
  }
}
