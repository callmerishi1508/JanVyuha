import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  MapPin,
  Clock,
  ArrowUp,
  User,
  Phone,
  BellRing,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Flag,
  MapPinned,
  Star,
  Languages,
} from 'lucide-react'
import { useIssues } from '../store/issues'
import { useAuth } from '../store/auth'
import { findNearby, formatDistance } from '../lib/dedupe'
import { adminApi, adminBackendReady } from '../services/admin'
import {
  CATEGORIES,
  DEPARTMENTS,
  DEPT_STATUS_FLOW,
  DEPT_STATUS_META,
  STATUS_META,
  type DeptStatus,
} from '../data/categories'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import { CategoryPill } from '../components/CategoryPill'
import { MediaThumb } from '../components/MediaUpload'
import { MapView } from '../components/MapView'
import { formatDateTime, timeAgo } from '../lib/format'
import { tStatus, tDeptShort, currentLocale } from '../lib/i18n'
import { translateText } from '../services/ai'
import { cn } from '../lib/cn'

export function IssueDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { issues, loaded, refresh, updateDeptStatus, upvote, report, rate } = useIssues()
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [stars, setStars] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [rated, setRated] = useState(false)
  // P2-10a translation (officials/admin only, lazy, cached for the visit).
  const [translated, setTranslated] = useState<string | null>(null)
  const [showTranslated, setShowTranslated] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateFailed, setTranslateFailed] = useState(false)

  const nearby = useMemo(() => {
    if (!id) return []
    const self = issues.find((i) => i.id === id)
    if (!self) return []
    return findNearby(
      { lat: self.location.lat, lng: self.location.lng, category: self.category },
      issues,
      { excludeId: id, meters: 400, hours: 72 }
    )
  }, [issues, id])

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  const issue = useMemo(() => issues.find((i) => i.id === id), [issues, id])

  if (loaded && !issue) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-lg font-semibold text-ink-900">{t('issueDetail.notFound')}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          {t('issueDetail.goHome')}
        </Link>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="grid place-items-center py-32 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const cat = CATEGORIES[issue.category]
  const myDept = user?.role === 'stakeholder' ? user.department : undefined
  const isOwningDept = !!myDept && issue.routedDepartments.includes(myDept)

  // Translation is an officials'/admin tool (citizens wrote the text); hidden
  // after a failed attempt so a broken proxy doesn't leave a dead button.
  const canTranslate =
    (user?.role === 'stakeholder' || user?.role === 'admin') &&
    !!issue.description.trim() &&
    !translateFailed

  const handleTranslate = async () => {
    if (showTranslated) {
      setShowTranslated(false)
      return
    }
    if (translated) {
      setShowTranslated(true)
      return
    }
    setTranslating(true)
    const r = await translateText(issue.description, currentLocale())
    setTranslating(false)
    if (r.ok) {
      setTranslated(r.text)
      setShowTranslated(true)
    } else {
      setTranslateFailed(true)
      if (r.reason === 'error') toast.error(t('issueDetail.translateFailed'))
    }
  }

  // This department's own progress on the issue.
  const myDeptStatus =
    (myDept && issue.departmentStatus.find((d) => d.department === myDept)?.status) ||
    'notified'
  const myIdx = DEPT_STATUS_FLOW.indexOf(myDeptStatus as DeptStatus)
  const nextDeptStatus: DeptStatus | null =
    myIdx < DEPT_STATUS_FLOW.length - 1 ? DEPT_STATUS_FLOW[myIdx + 1] : null

  const advanceDept = async (to: DeptStatus) => {
    if (!user || !myDept) return
    setBusy(true)
    try {
      await updateDeptStatus(
        issue.id,
        myDept,
        to,
        note.trim() || `${DEPARTMENTS[myDept].short}: ${t(`deptStatuses.${to}`)}.`,
        `${user.name} · ${DEPARTMENTS[myDept].short}`
      )
      setNote('')
      toast.success(t('issueDetail.deptMarked', { status: t(`deptStatuses.${to}`) }))
    } catch {
      toast.error(t('issueDetail.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page max-w-6xl py-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header card */}
          <div className="card overflow-hidden">
            {cat.emergency && (
              <div className="flex items-center gap-2 bg-red-600 px-5 py-2 text-sm font-semibold text-white">
                <BellRing className="h-4 w-4" />
                {t('issueDetail.emergencyBanner')}
              </div>
            )}
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>{issue.refId}</span>
                <span>·</span>
                <span>{formatDateTime(issue.createdAt)}</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">
                {issue.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CategoryPill category={issue.category} size="md" />
                <SeverityBadge severity={issue.severity} />
                <StatusBadge status={issue.status} />
              </div>
              <p className="mt-4 text-slate-700">
                {showTranslated && translated ? translated : issue.description}
              </p>
              {/* P2-10a: lazy Gemini translation for officials reading a report
                  written in another app language. Hidden for citizens, in mock
                  mode, and when the proxy reports AI unavailable. */}
              {canTranslate && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={translating}
                    className="inline-flex items-center gap-1.5 font-semibold text-ashoka-600 hover:text-ashoka-700 disabled:opacity-50"
                  >
                    {translating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Languages className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {showTranslated
                      ? t('issueDetail.showOriginal')
                      : t('issueDetail.translate')}
                  </button>
                  {showTranslated && (
                    <span className="text-slate-400">
                      {t('issueDetail.aiTranslated')}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {issue.location.address}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {timeAgo(issue.createdAt)}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await upvote(issue.id)
                      toast.success(t('issueDetail.markedThanks'))
                    } catch {
                      toast.error(t('issueDetail.actionFailed'))
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 font-semibold text-ink-700 hover:bg-slate-50"
                >
                  <ArrowUp className="h-4 w-4" />
                  {t('issueDetail.alsoAffected', { count: issue.upvotes })}
                </button>
              </div>
            </div>

            {/* Media */}
            {issue.media.length > 0 && (
              <div className="grid grid-cols-2 gap-1 border-t border-slate-100 sm:grid-cols-3">
                {issue.media.map((m) => (
                  <div key={m.id} className="aspect-video overflow-hidden">
                    <MediaThumb item={m} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-bold text-ink-900">
              {t('issueDetail.location')}
            </div>
            <MapView
              issues={[issue]}
              center={[issue.location.lat, issue.location.lng]}
              zoom={15}
              className="h-64 w-full rounded-none border-0"
            />
          </div>

          {/* Related reports nearby (possible duplicates / same incident) */}
          {nearby.length > 0 && (
            <div className="card p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <MapPinned className="h-4 w-4 text-ink-700" />
                {t('issueDetail.relatedNearby', { count: nearby.length })}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('issueDetail.relatedLeadBase')}
                {user?.role === 'admin'
                  ? t('issueDetail.relatedLeadAdmin')
                  : t('issueDetail.relatedLeadOfficial')}
              </p>
              <div className="mt-3 space-y-2">
                {nearby.slice(0, 5).map(({ issue: n, distance }) => (
                  <div
                    key={n.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5"
                  >
                    <Link
                      to={`/issue/${n.id}`}
                      className="min-w-0 flex-1 hover:opacity-80"
                    >
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {n.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t('issueDetail.awayAgo', {
                          dist: formatDistance(distance),
                          ago: timeAgo(n.createdAt),
                        })}
                      </div>
                    </Link>
                    {user?.role === 'admin' && adminBackendReady() ? (
                      <button
                        onClick={async () => {
                          try {
                            await adminApi.mergeDuplicate(n.id, issue.id)
                            toast.success(t('issueDetail.mergedDup'))
                            refresh()
                          } catch (e) {
                            toast.error((e as Error).message)
                          }
                        }}
                        className="btn-outline shrink-0 px-2.5 py-1.5 text-xs"
                      >
                        {t('issueDetail.mergeIn')}
                      </button>
                    ) : (
                      <StatusBadge status={n.status} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Response by department (multi-department coordination) */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">
              {t('issueDetail.responseByDept')}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('issueDetail.responseByDeptLead')}
            </p>
            <div className="mt-3 space-y-2">
              {issue.routedDepartments.map((d) => {
                const dep = DEPARTMENTS[d]
                const Icon = dep.icon
                const st =
                  issue.departmentStatus.find((x) => x.department === d)?.status ??
                  'notified'
                const meta = DEPT_STATUS_META[st]
                const isMe = d === myDept
                return (
                  <div
                    key={d}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2.5',
                      isMe ? 'border-ink-300 bg-ink-50/50' : 'border-slate-200'
                    )}
                  >
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{
                        backgroundColor: dep.color + '18',
                        color: dep.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {tDeptShort(d)}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] font-bold uppercase text-ink-500">
                            {t('issueDetail.you')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t('issueDetail.helpline')} {dep.helpline}
                      </div>
                    </div>
                    <span
                      className="chip shrink-0 text-[11px]"
                      style={{ color: meta.color, backgroundColor: meta.bg }}
                    >
                      {t(`deptStatuses.${st}`)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reporter */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">
              {t('issueDetail.reportedBy')}
            </h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4 text-slate-500" />
              {issue.reporterName}
            </div>
            {issue.reporterPhone && isOwningDept && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-500" />
                {issue.reporterPhone}
              </div>
            )}
          </div>

          {/* Department action panel — acts on THIS department's sub-status */}
          {isOwningDept ? (
            <div className="card border-ink-200 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-ink-700" />
                <h3 className="text-sm font-bold text-ink-900">
                  {t('issueDetail.yourAction', { dept: tDeptShort(myDept!) })}
                </h3>
              </div>

              {myDeptStatus === 'done' ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-ashoka-500/10 p-3 text-sm font-semibold text-ashoka-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('issueDetail.deptCompleted')}
                </div>
              ) : (
                <>
                  {nextDeptStatus && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(
                        t(`cannedNotes.${nextDeptStatus}`, {
                          returnObjects: true,
                        }) as string[]
                      ).map((text, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNote(text)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            note === text
                              ? 'border-ink-700 bg-ink-800 text-white'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="input mt-3 min-h-[70px] resize-y text-sm"
                    placeholder={t('issueDetail.updateNotePlaceholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="mt-3 flex flex-col gap-2">
                    {nextDeptStatus && (
                      <button
                        onClick={() => advanceDept(nextDeptStatus)}
                        className="btn-primary w-full"
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {t('issueDetail.markAs', {
                          status: t(`deptStatuses.${nextDeptStatus}`),
                        })}
                      </button>
                    )}
                    {nextDeptStatus !== 'done' && (
                      <button
                        onClick={() => advanceDept('done')}
                        className="btn-outline w-full"
                        disabled={busy}
                      >
                        {t('issueDetail.markComplete')}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {t('issueDetail.updatesOnly', {
                      dept: tDeptShort(myDept!),
                    })}
                  </p>
                </>
              )}
            </div>
          ) : (
            !user && (
              <div className="card bg-ink-50/50 p-5 text-sm text-slate-600">
                <p className="font-semibold text-ink-900">{t('issueDetail.respDeptQ')}</p>
                <p className="mt-1">{t('issueDetail.respDeptLead')}</p>
                <Link to="/login/stakeholder" className="btn-primary mt-3 w-full">
                  {t('issueDetail.stakeholderLogin')}
                </Link>
              </div>
            )
          )}

          {/* Post-resolution citizen rating */}
          {issue.status === 'resolved' &&
            user?.role !== 'stakeholder' &&
            user?.role !== 'admin' &&
            (!user ||
              (user.id
                ? issue.reporterId === user.id
                : issue.reporterName === user.name)) && (
              <div className="card border-ashoka-200 bg-ashoka-500/5 p-5">
                <h3 className="text-sm font-bold text-ink-900">
                  {t('issueDetail.howResolution')}
                </h3>
                {rated ? (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ashoka-600">
                    <CheckCircle2 className="h-4 w-4" /> {t('issueDetail.thankFeedback')}
                  </p>
                ) : (
                  <>
                    <div
                      className="mt-3 flex gap-1"
                      role="radiogroup"
                      aria-label={t('common.rating')}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setStars(n)}
                          role="radio"
                          aria-checked={stars === n}
                          aria-label={t('issueDetail.starAria', { count: n })}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              'h-7 w-7',
                              n <= stars
                                ? 'fill-saffron-400 text-saffron-500'
                                : 'text-slate-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="input mt-3 min-h-[60px] resize-y text-sm"
                      placeholder={t('issueDetail.ratingCommentPlaceholder')}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                    <button
                      onClick={async () => {
                        if (stars === 0) return toast.error(t('issueDetail.pickRating'))
                        try {
                          await rate(issue.id, stars, ratingComment.trim())
                          setRated(true)
                          toast.success(t('issueDetail.feedbackSubmitted'))
                        } catch {
                          toast.error(t('issueDetail.actionFailed'))
                        }
                      }}
                      className="btn-primary mt-3 w-full"
                    >
                      {t('issueDetail.submitFeedback')}
                    </button>
                  </>
                )}
              </div>
            )}

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">
              {t('issueDetail.activityTimeline')}
            </h3>
            <ol className="mt-4 space-y-0">
              {issue.updates
                .slice()
                .reverse()
                .map((u, idx, arr) => {
                  const meta = STATUS_META[u.status]
                  const last = idx === arr.length - 1
                  return (
                    <li key={u.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {!last && (
                        <span className="absolute left-[7px] top-5 h-full w-0.5 bg-slate-200" />
                      )}
                      <span
                        className={cn(
                          'relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white'
                        )}
                        style={{ backgroundColor: meta.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900">
                          {tStatus(u.status)}
                        </div>
                        <p className="text-xs text-slate-600">{u.note}</p>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {u.by} · {formatDateTime(u.at)}
                        </div>
                      </div>
                    </li>
                  )
                })}
            </ol>
          </div>

          {/* Report abuse — feeds the admin moderation queue */}
          {user?.role !== 'stakeholder' && user?.role !== 'admin' && (
            <button
              onClick={async () => {
                if (issue.flagged) return
                try {
                  await report(issue.id, 'Reported by a citizen as spam / not genuine')
                  toast.success(t('issueDetail.reportedThanks'))
                } catch {
                  toast.error(t('issueDetail.actionFailed'))
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600"
            >
              <Flag className="h-3.5 w-3.5" />
              {issue.flagged
                ? t('issueDetail.reportedForReview')
                : t('issueDetail.reportNotGenuine')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
