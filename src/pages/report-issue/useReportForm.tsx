import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { BellRing } from 'lucide-react'
import {
  CATEGORIES,
  isCategoryId,
  resolveRouting,
  type CategoryId,
  type DepartmentId,
  type ResolvedConditional,
  type Severity,
} from '../../data/categories'
import type { GeoLocation, MediaItem } from '../../data/types'
import { useAuth } from '../../store/auth'
import { useIssues } from '../../store/issues'
import { reverseGeocode, searchAddress, type ForwardResult } from '../../lib/geocode'
import { findNearby } from '../../lib/dedupe'
import { rememberCreated } from '../MyIssues'
import { analyzeIssue, type AiSuggestion } from '../../services/ai'
import { useTestMode } from '../../store/testMode'
import { tDept } from '../../lib/i18n'
import { enqueue } from '../../lib/outbox'

/** Draft persistence — survive a refresh or the OS killing a low-RAM tab. */
const DRAFT_KEY = 'janvyuha.reportDraft.v1'
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export const STEP_KEYS = [
  'stepCategory',
  'stepDetails',
  'stepLocation',
  'stepDepartments',
  'stepReview',
] as const

/**
 * Owns all state, persistence and submit logic for the report wizard. Split out
 * of ReportIssue.tsx so each step's JSX can live in its own component while
 * still sharing one source of truth.
 */
export function useReportForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  // Deep-link support: a printed QR poster or shared link can pre-fill the
  // category via `/report?category=water` (state, from an in-app Link, wins
  // if both are somehow present).
  const [searchParams] = useSearchParams()
  const queryCategory = searchParams.get('category')
  const preset =
    (location.state as { category?: CategoryId })?.category ??
    (isCategoryId(queryCategory) ? queryCategory : undefined)
  const { user } = useAuth()
  const mockAi = useTestMode((s) => s.mockAi)
  const createIssue = useIssues((s) => s.create)
  const refresh = useIssues((s) => s.refresh)
  const loaded = useIssues((s) => s.loaded)
  const issues = useIssues((s) => s.issues)

  const [step, setStep] = useState(preset ? 1 : 0)
  const [category, setCategory] = useState<CategoryId | null>(preset ?? null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('high')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [locating, setLocating] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  // DPDP: photo→AI is a nested opt-in — the citizen must separately choose to
  // send an image (not just typed text) to Google Gemini, a cross-border
  // third party. Defaults off, so "Analyse" is text-only unless checked.
  const [aiIncludePhoto, setAiIncludePhoto] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<ForwardResult[]>([])
  const [searching, setSearching] = useState(false)
  // Department confirmation + mandatory approval gate.
  const [conditionals, setConditionals] = useState<ResolvedConditional[]>([])
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  // Accessibility: when the wizard step changes, move focus to the step panel so
  // screen-reader users are taken to the new content (not left on the old button).
  // Skip the very first render so we don't steal focus on page load.
  const stepRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    stepRef.current?.focus()
  }, [step])

  // Restore a saved draft once on mount (unless a category preset was passed).
  // Restored step is clamped to <=2 so the departments step recomputes cleanly.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (!preset) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (d.category) setCategory(d.category)
          if (d.title) setTitle(d.title)
          if (d.description) setDescription(d.description)
          if (d.severity) setSeverity(d.severity)
          if (Array.isArray(d.media)) setMedia(d.media)
          if (d.picked) setPicked(d.picked)
          if (d.address) setAddress(d.address)
          if (d.city) setCity(d.city)
          if (d.state) setState(d.state)
          if (d.district) setDistrict(d.district)
          if (d.name) setName(d.name)
          if (d.phone) setPhone(d.phone)
          if (typeof d.anonymous === 'boolean') setAnonymous(d.anonymous)
          if (typeof d.step === 'number') setStep(Math.min(d.step, 2))
          toast(t('report.draftRestored'), { icon: '📝' })
        }
      } catch {
        /* ignore a corrupt draft */
      }
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist the draft as the citizen fills it in (debounced).
  useEffect(() => {
    if (!hydrated) return
    const handle = setTimeout(() => {
      const draft = {
        category,
        title,
        description,
        severity,
        media,
        picked,
        address,
        city,
        state,
        district,
        name,
        phone,
        anonymous,
        step,
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {
        // Quota (large media) — keep the text so it's not lost.
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, media: [] }))
        } catch {
          /* give up silently */
        }
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [
    hydrated,
    category,
    title,
    description,
    severity,
    media,
    picked,
    address,
    city,
    state,
    district,
    name,
    phone,
    anonymous,
    step,
  ])

  const cat = category ? CATEGORIES[category] : null

  /** Recompute the conditional-department suggestions (AI + keyword driven). */
  const computeConditionals = (): ResolvedConditional[] => {
    if (!category) return []
    const decision = resolveRouting(category, {
      text: `${title} ${description}`,
      aiDepartments: aiSuggestion?.departments,
    })
    return decision.conditional
  }

  /** The final department list = core (locked) + selected conditional. */
  const finalDepartments: DepartmentId[] = category
    ? Array.from(
        new Set([
          ...CATEGORIES[category].core,
          ...conditionals.filter((c) => c.selected).map((c) => c.department),
        ])
      )
    : []

  /** Ask the AI to triage from the first image + description. */
  const runAi = async () => {
    const firstImage = aiIncludePhoto
      ? media.find((m) => m.type === 'image' && m.url.startsWith('data:'))
      : undefined
    if (!firstImage && description.trim().length < 8) {
      toast.error(t('report.aiNeedInput'))
      return
    }
    setAnalyzing(true)
    setAiSuggestion(null)
    const res = await analyzeIssue({
      description,
      imageDataUrl: firstImage?.url,
    })
    setAnalyzing(false)
    if (!res.ok) {
      if (res.reason === 'unavailable') {
        setAiUnavailable(true)
        toast(t('report.aiNotConfigured'), {
          icon: 'ℹ️',
        })
      } else {
        toast.error(t('report.aiError'))
      }
      return
    }
    setAiSuggestion(res.suggestion)
    toast.success(t('report.aiReady'))
  }

  const applyAi = () => {
    if (!aiSuggestion) return
    if (aiSuggestion.category) setCategory(aiSuggestion.category)
    if (aiSuggestion.title) setTitle(aiSuggestion.title)
    if (aiSuggestion.summary && description.trim().length === 0)
      setDescription(aiSuggestion.summary)
    setSeverity(aiSuggestion.severity)
    toast.success(t('report.aiApplied'))
  }

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t('report.geoUnsupported'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setPicked({ lat: latitude, lng: longitude })
        const r = await reverseGeocode(latitude, longitude)
        setAddress(r.address)
        if (r.city) setCity(r.city)
        if (r.state) setState(r.state)
        if (r.district) setDistrict(r.district)
        setLocating(false)
        toast.success(t('report.locationDetected'))
      },
      () => {
        setLocating(false)
        toast.error(t('report.locationFailed'))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const placePin = async (lat: number, lng: number) => {
    setPicked({ lat, lng })
    const r = await reverseGeocode(lat, lng)
    setAddress(r.address)
    if (r.city) setCity(r.city)
    if (r.state) setState(r.state)
    if (r.district) setDistrict(r.district)
  }

  const validPhone = phone === '' || /^\d{10}$/.test(phone)

  // Possible duplicates: same-category reports near the chosen location.
  const nearby = useMemo(() => {
    if (!category || !picked) return []
    return findNearby({ lat: picked.lat, lng: picked.lng, category }, issues, {
      meters: 300,
      hours: 72,
    })
  }, [category, picked, issues])

  // Debounced forward-address search for the location step.
  useEffect(() => {
    if (step !== 2) return
    const q = searchQ.trim()
    if (q.length < 3) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const handle = setTimeout(async () => {
      const results = await searchAddress(q)
      setSearchResults(results)
      setSearching(false)
    }, 500)
    return () => clearTimeout(handle)
  }, [searchQ, step])

  const pickSearchResult = (r: ForwardResult) => {
    setPicked({ lat: r.lat, lng: r.lng })
    setAddress(r.label)
    setSearchResults([])
    setSearchQ('')
  }

  const canNext = useMemo(() => {
    if (step === 0) return !!category
    if (step === 1) return title.trim().length >= 4 && description.trim().length >= 8
    if (step === 2) return !!picked && address.trim().length > 2
    if (step === 3) return true // department confirmation — any selection allowed
    return true
  }, [step, category, title, description, picked, address])

  /** Advance one step; recompute department suggestions when entering that step. */
  const goNext = () => {
    if (!canNext) return
    setStep((s) => {
      const next = s + 1
      if (next === 3) setConditionals(computeConditionals())
      return next
    })
  }

  const toggleConditional = (dept: DepartmentId) => {
    setConditionals((prev) =>
      prev.map((c) => (c.department === dept ? { ...c, selected: !c.selected } : c))
    )
  }

  const submit = async () => {
    if (!category || !picked) return
    if (!anonymous && !name.trim()) {
      toast.error(t('report.errName'))
      return
    }
    if (!anonymous && !validPhone) {
      toast.error(t('report.errPhone'))
      return
    }
    if (!consent) {
      toast.error(t('report.errConsent'))
      return
    }
    setSubmitting(true)
    const loc: GeoLocation = {
      lat: picked.lat,
      lng: picked.lng,
      address: address.trim(),
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      district: district.trim() || city.trim() || undefined,
    }
    const input = {
      title: title.trim(),
      category,
      description: description.trim(),
      severity,
      location: loc,
      media,
      reporterName: name,
      reporterPhone: phone || undefined,
      anonymous,
      routedDepartments: finalDepartments,
      // Carries the AI's own spam/abuse verdict through to createIssue, which
      // auto-routes flagged content to the moderation queue — today a citizen
      // could dismiss the "doesn't look like a civic issue" warning and submit
      // anyway, and nothing downstream ever acted on that verdict.
      aiMeta: aiSuggestion
        ? { flagged: aiSuggestion.flagged, confidence: aiSuggestion.confidence }
        : undefined,
    }
    try {
      const issue = await createIssue(input)
      rememberCreated(issue.id)

      // Simulate the routed-department notifications (only confirmed departments).
      finalDepartments.forEach((d, idx) => {
        setTimeout(
          () => {
            toast(
              (tt) => (
                <span
                  className="flex items-center gap-2"
                  onClick={() => toast.dismiss(tt.id)}
                >
                  <BellRing className="h-4 w-4 text-saffron-400" />
                  {t('report.alertSentTo')} <b>{tDept(d)}</b>
                </span>
              ),
              { icon: null }
            )
          },
          400 + idx * 700
        )
      })

      clearDraft()
      toast.success(t('report.reportSubmitted', { id: issue.refId }))
      setTimeout(() => navigate(`/issue/${issue.id}`), 500)
    } catch {
      // Offline (or the network dropped mid-submit): queue the report and let it
      // send automatically when connectivity returns, instead of losing it.
      if (!navigator.onLine) {
        enqueue(input)
        clearDraft()
        toast.success(t('report.queuedOffline'), { duration: 6000 })
        setTimeout(() => navigate('/my-issues'), 800)
      } else {
        toast.error(t('report.submitFailed'))
        setSubmitting(false)
      }
    }
  }

  return {
    step,
    setStep,
    category,
    setCategory,
    title,
    setTitle,
    description,
    setDescription,
    severity,
    setSeverity,
    media,
    setMedia,
    picked,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    locating,
    name,
    setName,
    phone,
    setPhone,
    anonymous,
    setAnonymous,
    submitting,
    analyzing,
    aiSuggestion,
    aiUnavailable,
    aiIncludePhoto,
    setAiIncludePhoto,
    mockAi,
    searchQ,
    setSearchQ,
    searchResults,
    searching,
    conditionals,
    consent,
    setConsent,
    cat,
    finalDepartments,
    runAi,
    applyAi,
    detectLocation,
    placePin,
    validPhone,
    nearby,
    pickSearchResult,
    canNext,
    goNext,
    toggleConditional,
    submit,
    stepRef,
  }
}

export type ReportForm = ReturnType<typeof useReportForm>
