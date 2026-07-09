import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  MapPin,
  Loader2,
  AlertTriangle,
  Send,
  BellRing,
  Sparkles,
  Wand2,
  Search,
} from 'lucide-react'
import {
  CATEGORIES,
  CATEGORY_LIST,
  DEPARTMENTS,
  SEVERITIES,
  resolveRouting,
  type CategoryId,
  type DepartmentId,
  type ResolvedConditional,
  type Severity,
} from '../data/categories'
import type { GeoLocation, MediaItem } from '../data/types'
import { CategoryIconTile } from '../components/CategoryPill'
import { MediaUpload, MediaThumb } from '../components/MediaUpload'
import { MapView } from '../components/MapView'
import { useAuth } from '../store/auth'
import { useIssues } from '../store/issues'
import { reverseGeocode, searchAddress, type ForwardResult } from '../lib/geocode'
import { findNearby, formatDistance } from '../lib/dedupe'
import { cn } from '../lib/cn'
import { shortId } from '../lib/format'
import { rememberCreated } from './MyIssues'
import { analyzeIssue, type AiSuggestion } from '../services/ai'
import { useTestMode } from '../store/testMode'
import { tCategory, tDept, tDeptShort, tReason, tQuestion } from '../lib/i18n'

const STEP_KEYS = [
  'stepCategory',
  'stepDetails',
  'stepLocation',
  'stepDepartments',
  'stepReview',
] as const

export function ReportIssue() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const preset = (location.state as { category?: CategoryId })?.category
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
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  )
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
    const firstImage = media.find(
      (m) => m.type === 'image' && m.url.startsWith('data:')
    )
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
    return findNearby(
      { lat: picked.lat, lng: picked.lng, category },
      issues,
      { meters: 300, hours: 72 }
    )
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
      prev.map((c) =>
        c.department === dept ? { ...c, selected: !c.selected } : c
      )
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
    try {
      const issue = await createIssue({
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
      })
      rememberCreated(issue.id)

      // Simulate the routed-department notifications (only confirmed departments).
      finalDepartments.forEach((d, idx) => {
        setTimeout(() => {
          toast(
            (tt) => (
              <span className="flex items-center gap-2" onClick={() => toast.dismiss(tt.id)}>
                <BellRing className="h-4 w-4 text-saffron-400" />
                {t('report.alertSentTo')} <b>{tDept(d)}</b>
              </span>
            ),
            { icon: null }
          )
        }, 400 + idx * 700)
      })

      toast.success(t('report.reportSubmitted', { id: shortId(issue.id) }))
      setTimeout(() => navigate(`/issue/${issue.id}`), 500)
    } catch {
      toast.error(t('report.submitFailed'))
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          {t('report.title')}
        </h1>
        <p className="mt-1 text-slate-600">{t('report.subtitle')}</p>
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEP_KEYS.map((key, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={key} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors',
                    done && 'bg-ashoka-500 text-white',
                    active && 'bg-ink-800 text-white ring-4 ring-ink-800/15',
                    !done && !active && 'bg-slate-200 text-slate-500'
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'hidden text-sm font-semibold sm:block',
                    active ? 'text-ink-900' : 'text-slate-500'
                  )}
                >
                  {t(`report.${key}`)}
                </span>
              </div>
              {i < STEP_KEYS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-0.5 flex-1 rounded',
                    i < step ? 'bg-ashoka-500' : 'bg-slate-200'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      <div
        ref={stepRef}
        tabIndex={-1}
        aria-live="polite"
        className="card p-6 sm:p-8 focus:outline-none"
      >
        {/* Step 0 — category */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-ink-900">
              {t('report.whatReporting')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('report.decidesDept')}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {CATEGORY_LIST.map((c) => {
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                      active
                        ? 'border-ink-500 bg-ink-50 ring-2 ring-ink-500/25'
                        : 'border-slate-200 hover:border-ink-300 hover:bg-slate-50'
                    )}
                  >
                    <CategoryIconTile category={c.id} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900">{tCategory(c.id)}</span>
                        {c.emergency && (
                          <span className="chip bg-red-100 text-[10px] text-red-600">
                            {t('report.emergency')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t(`catDesc.${c.id}`)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1 — details */}
        {step === 1 && cat && (
          <div className="animate-fade-in space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <CategoryIconTile category={cat.id} className="h-10 w-10" />
              <div>
                <div className="text-sm font-bold text-ink-900">{tCategory(cat.id)}</div>
                <button
                  className="text-xs font-semibold text-ink-600 hover:underline"
                  onClick={() => setStep(0)}
                >
                  {t('report.changeCategory')}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="issue-title" className="label">
                {t('report.titleLabel')}
              </label>
              <input
                id="issue-title"
                className={cn(
                  'input',
                  title.trim().length > 0 &&
                    title.trim().length < 4 &&
                    'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                )}
                placeholder={t('report.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={90}
                aria-invalid={title.trim().length > 0 && title.trim().length < 4}
              />
              {title.trim().length > 0 && title.trim().length < 4 && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {t('report.titleMin')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="issue-desc" className="label">
                {t('report.descLabel')}
              </label>
              <textarea
                id="issue-desc"
                className={cn(
                  'input min-h-[110px] resize-y',
                  description.trim().length > 0 &&
                    description.trim().length < 8 &&
                    'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                )}
                placeholder={t('report.descPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={600}
                aria-invalid={
                  description.trim().length > 0 && description.trim().length < 8
                }
              />
              {description.trim().length > 0 && description.trim().length < 8 && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {t('report.descMin')}
                </p>
              )}
            </div>

            <div>
              <label className="label">{t('report.howSevere')}</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(SEVERITIES) as Severity[]).map((s) => {
                  const active = severity === s
                  const meta = SEVERITIES[s]
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                        active
                          ? 'text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                      style={
                        active
                          ? { backgroundColor: meta.color, borderColor: meta.color }
                          : undefined
                      }
                    >
                      {t(`severities.${s}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="label">{t('report.evidence')}</label>
              <MediaUpload items={media} onChange={setMedia} />
            </div>

            {/* AI assist */}
            {!aiUnavailable && (
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink-900">
                        {t('report.aiAssist')}
                        {mockAi && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            {t('report.demoAiBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {mockAi ? t('report.aiDescMock') : t('report.aiDescReal')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={runAi}
                    disabled={analyzing}
                    className="btn shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {t('report.analyse')}
                  </button>
                </div>

                {aiSuggestion &&
                  (aiSuggestion.flagged ||
                  !aiSuggestion.category ||
                  aiSuggestion.confidence < 0.4 ? (
                    // The photo/description doesn't clearly show a civic issue —
                    // don't present a confident-looking (and likely wrong) guess.
                    <div className="mt-3 animate-fade-in rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {t('report.notCivicTitle')}
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        {t('report.notCivicBody')}
                      </p>
                      {aiSuggestion.category && (
                        <button
                          type="button"
                          onClick={applyAi}
                          className="mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                        >
                          {t('report.useAnyway')} ({tCategory(aiSuggestion.category)},{' '}
                          {t('report.percentConfident', {
                            pct: Math.round(aiSuggestion.confidence * 100),
                          })}
                          )
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 animate-fade-in rounded-lg border border-indigo-200 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-ink-900">
                          {tCategory(aiSuggestion.category)}
                        </span>
                        <span
                          className="chip text-[11px]"
                          style={{
                            color: SEVERITIES[aiSuggestion.severity].color,
                            backgroundColor:
                              SEVERITIES[aiSuggestion.severity].color + '18',
                          }}
                        >
                          {t(`severities.${aiSuggestion.severity}`)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {t('report.percentConfident', {
                            pct: Math.round(aiSuggestion.confidence * 100),
                          })}
                        </span>
                      </div>
                      {aiSuggestion.title && (
                        <p className="mt-1.5 text-sm font-medium text-ink-800">
                          “{aiSuggestion.title}”
                        </p>
                      )}
                      {aiSuggestion.summary && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {aiSuggestion.summary}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={applyAi}
                        className="btn-outline mt-2.5 py-1.5 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {t('report.useSuggestions')}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — location */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink-900">
                {t('report.whereIssue')}
              </h2>
              <button
                onClick={detectLocation}
                className="btn-outline"
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                {t('report.useCurrentLocation')}
              </button>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {t('report.searchHint')}
            </div>

            {/* Address search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-9"
                placeholder={t('report.searchPlaceholder')}
                aria-label={t('report.searchPlaceholder')}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
              )}
              {searchResults.length > 0 && (
                <ul className="absolute z-[500] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lift">
                  {searchResults.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => pickSearchResult(r)}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" />
                        <span className="text-slate-700">{r.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <MapView
              className="h-[320px] w-full"
              onPlace={placePin}
              picked={picked}
              center={picked ? [picked.lat, picked.lng] : undefined}
              zoom={picked ? 16 : 5}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="loc-address" className="label">{t('report.addressLabel')}</label>
                <input
                  id="loc-address"
                  className="input"
                  placeholder={t('report.addressPlaceholder')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="loc-city" className="label">{t('report.cityLabel')}</label>
                <input
                  id="loc-city"
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('report.cityPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="loc-state" className="label">{t('report.stateLabel')}</label>
                <input
                  id="loc-state"
                  className="input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={t('report.statePlaceholder')}
                />
              </div>
            </div>
            {picked && (
              <p className="text-xs text-slate-500">
                {t('report.pinnedAt', {
                  lat: picked.lat.toFixed(5),
                  lng: picked.lng.toFixed(5),
                })}
              </p>
            )}
          </div>
        )}

        {/* Step 3 — department confirmation */}
        {step === 3 && cat && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                {t('report.whoAlerted')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('report.whoAlertedLead')}
              </p>
            </div>

            {/* Core — always alerted, locked */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('report.alwaysAlerted', { category: tCategory(cat.id) })}
              </div>
              <div className="space-y-2">
                {cat.core.map((d) => {
                  const dep = DEPARTMENTS[d]
                  const Icon = dep.icon
                  return (
                    <div
                      key={d}
                      className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3"
                    >
                      <div
                        className="grid h-9 w-9 place-items-center rounded-lg"
                        style={{ backgroundColor: dep.color + '1a', color: dep.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-ink-900">
                          {tDept(dep.id)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t('report.primaryResponder')}
                        </div>
                      </div>
                      <Check className="h-4 w-4 text-ashoka-600" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conditional — user confirms */}
            {conditionals.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('report.includeIfRelevant')}
                  {aiSuggestion && (
                    <span className="chip bg-indigo-100 py-0 text-[10px] text-indigo-700">
                      <Sparkles className="h-3 w-3" /> {t('report.aiAssisted')}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {conditionals.map((c) => {
                    const dep = DEPARTMENTS[c.department]
                    const Icon = dep.icon
                    return (
                      <button
                        key={c.department}
                        type="button"
                        onClick={() => toggleConditional(c.department)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                          c.selected
                            ? 'border-ink-400 bg-white ring-1 ring-ink-400/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                      >
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{
                            backgroundColor: dep.color + '1a',
                            color: dep.color,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-ink-900">
                              {tDept(dep.id)}
                            </span>
                            {c.matched ? (
                              <span className="chip bg-amber-100 py-0 text-[10px] text-amber-700">
                                {t('report.suggested')}
                              </span>
                            ) : (
                              <span className="chip bg-slate-100 py-0 text-[10px] text-slate-500">
                                {t('report.optional')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.matched
                              ? tReason(cat.id, c.department, c.reason)
                              : tQuestion(cat.id, c.department, c.question)}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                            c.selected
                              ? 'border-ink-700 bg-ink-800 text-white'
                              : 'border-slate-300 bg-white'
                          )}
                        >
                          {c.selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {t('report.deptTip')}
                </p>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-ink-900">
                {finalDepartments.length}
              </span>{' '}
              <span className="text-slate-600">
                {t('report.willBeAlerted', { count: finalDepartments.length })}
              </span>{' '}
              <span className="text-slate-700">
                {finalDepartments.map((d) => tDeptShort(d)).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Step 4 — review & approve */}
        {step === 4 && cat && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                {t('report.reviewApprove')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('report.reviewLead')}
              </p>
            </div>

            {nearby.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  {t('report.similarNearby', { count: nearby.length })}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {t('report.similarLead')}
                </p>
                <div className="mt-2 space-y-1.5">
                  {nearby.slice(0, 3).map(({ issue, distance }) => (
                    <Link
                      key={issue.id}
                      to={`/issue/${issue.id}`}
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs hover:bg-white"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-ink-800">
                        {issue.title}
                      </span>
                      <span className="shrink-0 text-amber-700">
                        {t('report.away', { dist: formatDistance(distance) })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200">
              <div className="flex items-start gap-4 p-4">
                <CategoryIconTile category={cat.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: cat.color }}
                    >
                      {tCategory(cat.id)}
                    </span>
                    <span
                      className="chip text-[10px]"
                      style={{
                        color: SEVERITIES[severity].color,
                        backgroundColor: SEVERITIES[severity].color + '18',
                      }}
                    >
                      {t(`severities.${severity}`)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-bold text-ink-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {address}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-ink-600 underline underline-offset-2 hover:text-ink-800"
                    >
                      {t('report.editDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-ink-600 underline underline-offset-2 hover:text-ink-800"
                    >
                      {t('report.editLocation')}
                    </button>
                  </div>
                </div>
              </div>
              {media.length > 0 && (
                <div className="flex gap-2 border-t border-slate-100 p-3">
                  {media.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200"
                    >
                      <MediaThumb item={m} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Routing preview */}
            <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-saffron-800">
                  <BellRing className="h-4 w-4" />
                  {t('report.willBeSentTo')}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-saffron-800 underline underline-offset-2 hover:text-saffron-900"
                >
                  {t('report.editDepartments')}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {finalDepartments.map((d) => {
                  const dep = DEPARTMENTS[d]
                  const Icon = dep.icon
                  return (
                    <span
                      key={d}
                      className="inline-flex items-center gap-2 rounded-lg border border-white bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 shadow-sm"
                    >
                      <Icon className="h-4 w-4" style={{ color: dep.color }} />
                      {tDept(dep.id)}
                    </span>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-saffron-700/80">
                {t('report.onlyTheseSee')}
              </p>
            </div>

            {/* Reporter */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reporter-name" className="label">
                  {t('report.yourName')}
                </label>
                <input
                  id="reporter-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('report.fullName')}
                  disabled={anonymous}
                />
              </div>
              <div>
                <label htmlFor="reporter-phone" className="label">
                  {t('report.contactOptional')}
                </label>
                <input
                  id="reporter-phone"
                  className={cn(
                    'input',
                    !anonymous &&
                      !validPhone &&
                      'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  )}
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder={t('report.phonePlaceholder')}
                  disabled={anonymous}
                  aria-invalid={!anonymous && !validPhone}
                />
                {!anonymous && !validPhone && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {t('report.phoneInvalid')}
                  </p>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-ink-800 focus:ring-ink-500"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              {t('report.reportAnon')}
            </label>

            {cat.emergency && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t('report.emergencyCall')}{' '}
                <b>
                  {finalDepartments
                    .map((d) => DEPARTMENTS[d].helpline)
                    .join(' / ')}
                </b>
                .
              </div>
            )}

            {/* Mandatory declaration / consent — nothing is filed without this */}
            <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ink-800 focus:ring-ink-500"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                <Trans i18nKey="report.declaration">
                  I confirm the information is true to the best of my knowledge and
                  consent to it being shared with the selected departments for
                  action, per the{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="font-semibold text-ink-700 underline"
                  >
                    Privacy Policy
                  </a>
                  . I understand filing a false report is punishable.
                </Trans>
              </span>
            </label>
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="btn-ghost"
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.back')}
          </button>

          {step < STEP_KEYS.length - 1 ? (
            <button onClick={goNext} className="btn-primary" disabled={!canNext}>
              {t('report.continue')}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              className="btn-accent"
              disabled={submitting || !consent}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('report.submitReport')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
