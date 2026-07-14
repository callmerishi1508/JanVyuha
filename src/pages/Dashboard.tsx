import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Inbox,
  Flame,
  CircleDot,
  CheckCircle2,
  Search,
  Filter,
  Map as MapIcon,
  List,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useIssues } from '../store/issues'
import {
  CATEGORIES,
  DEPARTMENTS,
  SEVERITIES,
  categoriesForDepartment,
  type IssueStatus,
} from '../data/categories'
import type { Issue } from '../data/types'
import { StatTile } from '../components/StatTile'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import { CategoryPill } from '../components/CategoryPill'
import { MapView } from '../components/MapView'
import { timeAgo } from '../lib/format'
import { tCategory, tDept } from '../lib/i18n'
import { isResolutionBreached, isAckBreached } from '../lib/analytics'
import { AlarmClock } from 'lucide-react'
import { cn } from '../lib/cn'
import type { TFunction } from 'i18next'

type StatusFilter = IssueStatus | 'all' | 'open' | 'breaching'

export function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { issues, loaded, loading, refresh, updateDeptStatus } = useIssues()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [query, setQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [hotspots, setHotspots] = useState(false)

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  const dept = user?.department
  const department = dept ? DEPARTMENTS[dept] : null

  const deptIssues = useMemo(
    () => (dept ? issues.filter((i) => i.routedDepartments.includes(dept)) : []),
    [issues, dept]
  )

  const stats = useMemo(() => {
    const open = deptIssues.filter((i) => i.status !== 'resolved').length
    const critical = deptIssues.filter(
      (i) => i.severity === 'critical' && i.status !== 'resolved'
    ).length
    const inProgress = deptIssues.filter((i) => i.status === 'in_progress').length
    const resolved = deptIssues.filter((i) => i.status === 'resolved').length
    const breached = deptIssues.filter((i) => isResolutionBreached(i)).length
    return { total: deptIssues.length, open, critical, inProgress, resolved, breached }
  }, [deptIssues])

  const filtered = useMemo(() => {
    let list = deptIssues
    if (statusFilter === 'open') list = list.filter((i) => i.status !== 'resolved')
    else if (statusFilter === 'breaching')
      list = list.filter((i) => isResolutionBreached(i))
    else if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.location.address.toLowerCase().includes(q) ||
          CATEGORIES[i.category].name.toLowerCase().includes(q)
      )
    }
    // Emergencies & criticals float to the top, then newest.
    return [...list].sort((a, b) => {
      const sev = SEVERITIES[b.severity].rank - SEVERITIES[a.severity].rank
      if (sev !== 0) return sev
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [deptIssues, statusFilter, query])

  const toggleSel = (id: string, on: boolean) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (on) n.add(id)
      else n.delete(id)
      return n
    })
  const clearSel = () => setSelected(new Set())

  /** Advance this department's sub-status on every selected issue at once. */
  const bulkAdvance = async (to: 'acknowledged' | 'done') => {
    if (!dept || !user || selected.size === 0) return
    setBulkBusy(true)
    const by = `${user.name} · ${DEPARTMENTS[dept].short}`
    const note = t('issueDetail.deptMarked', { status: t(`deptStatuses.${to}`) })
    const n = selected.size
    for (const id of selected) {
      try {
        await updateDeptStatus(id, dept, to, note, by)
      } catch {
        /* skip failures; others still apply */
      }
    }
    setBulkBusy(false)
    clearSel()
    refresh()
    toast.success(t('dashboard.bulkUpdated', { count: n }))
  }

  if (!department) return null

  const DeptIcon = department.icon
  const responsibleCats = categoriesForDepartment(department.id)

  return (
    <div className="flex h-[calc(100vh-4.25rem)] flex-col">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{
                  backgroundColor: department.color + '1a',
                  color: department.color,
                }}
              >
                <DeptIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold leading-tight text-ink-900">
                  {tDept(department.id)}
                </h1>
                <p className="text-xs text-slate-500">
                  {t('dashboard.controlRoom', { helpline: department.helpline })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className="input w-56 pl-9"
                  placeholder={t('dashboard.searchIssues')}
                  aria-label={t('dashboard.searchIssues')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile
              label={t('dashboard.totalRouted')}
              value={stats.total}
              icon={Inbox}
            />
            <StatTile
              label={t('dashboard.open')}
              value={stats.open}
              icon={CircleDot}
              tone="amber"
            />
            <StatTile
              label={t('dashboard.critical')}
              value={stats.critical}
              icon={Flame}
              tone="red"
            />
            <StatTile
              label={t('dashboard.inProgress')}
              value={stats.inProgress}
              icon={Loader2}
              tone="amber"
            />
            <StatTile
              label={t('dashboard.slaOverdue')}
              value={stats.breached}
              icon={AlarmClock}
              tone={stats.breached > 0 ? 'red' : 'green'}
            />
            <StatTile
              label={t('dashboard.resolved')}
              value={stats.resolved}
              icon={CheckCircle2}
              tone="green"
            />
          </div>
        </div>
      </div>

      {/* Filters + mobile toggle */}
      <div className="border-b border-slate-200 bg-white/70">
        <div className="container-page flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Filter className="mr-1 h-4 w-4 shrink-0 text-slate-500" />
            {(
              [
                ['open', t('dashboard.filterOpen')],
                ['all', t('dashboard.filterAll')],
                ['reported', t('dashboard.filterReported')],
                ['acknowledged', t('dashboard.filterAcknowledged')],
                ['in_progress', t('dashboard.filterInProgress')],
                ['resolved', t('dashboard.filterResolved')],
                ['breaching', t('dashboard.filterBreaching')],
              ] as [StatusFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  statusFilter === key
                    ? 'bg-ink-800 text-white'
                    : key === 'breaching'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 p-0.5 lg:hidden">
            <button
              onClick={() => setMobileView('list')}
              className={cn(
                'rounded-md px-2.5 py-1.5',
                mobileView === 'list' ? 'bg-ink-800 text-white' : 'text-slate-500'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={cn(
                'rounded-md px-2.5 py-1.5',
                mobileView === 'map' ? 'bg-ink-800 text-white' : 'text-slate-500'
              )}
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="container-page grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* List */}
        <div
          className={cn(
            'min-h-0 overflow-y-auto pr-1',
            mobileView === 'map' && 'hidden lg:block'
          )}
        >
          {loading && !loaded ? (
            <div className="grid place-items-center py-20 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState catNames={responsibleCats.map((c) => tCategory(c.id))} t={t} />
          ) : (
            <div className="space-y-3">
              {/* Bulk action bar — appears once one or more issues are selected. */}
              {selected.size > 0 && (
                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 shadow-sm">
                  <span className="text-sm font-semibold text-ink-900">
                    {t('dashboard.selectedCount', { count: selected.size })}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => bulkAdvance('acknowledged')}
                      disabled={bulkBusy}
                      className="btn-outline py-1.5 text-xs"
                    >
                      {bulkBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {t('dashboard.bulkAcknowledge')}
                    </button>
                    <button
                      onClick={() => bulkAdvance('done')}
                      disabled={bulkBusy}
                      className="btn-primary py-1.5 text-xs"
                    >
                      {t('dashboard.bulkResolve')}
                    </button>
                    <button
                      onClick={clearSel}
                      className="text-xs font-semibold text-slate-500 hover:text-ink-800"
                    >
                      {t('dashboard.clearSelection')}
                    </button>
                  </div>
                </div>
              )}
              {filtered.map((issue) => (
                <div key={issue.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(issue.id)}
                    onChange={(e) => toggleSel(issue.id, e.target.checked)}
                    aria-label={issue.title}
                    className="mt-4 h-4 w-4 shrink-0 rounded border-slate-300 text-ink-800 focus:ring-ink-500"
                  />
                  <div className="min-w-0 flex-1">
                    <DashboardRow
                      issue={issue}
                      onOpen={() => navigate(`/issue/${issue.id}`)}
                      t={t}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          className={cn('relative min-h-0', mobileView === 'list' && 'hidden lg:block')}
        >
          <button
            onClick={() => setHotspots((h) => !h)}
            aria-pressed={hotspots}
            className={cn(
              'absolute right-2 top-2 z-[500] inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors',
              hotspots
                ? 'border-ink-800 bg-ink-800 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            {t('dashboard.hotspots')}
          </button>
          <MapView
            issues={filtered}
            cluster={hotspots}
            className="h-full min-h-[300px] w-full"
            zoom={12}
            onSelectIssue={(i) => navigate(`/issue/${i.id}`)}
          />
        </div>
      </div>
    </div>
  )
}

function DashboardRow({
  issue,
  onOpen,
  t,
}: {
  issue: Issue
  onOpen: () => void
  t: TFunction
}) {
  const cat = CATEGORIES[issue.category]
  const overdue = isResolutionBreached(issue)
  const ackLate = isAckBreached(issue)
  return (
    <button
      onClick={onOpen}
      className={cn(
        'card group w-full p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift',
        overdue && 'ring-1 ring-red-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <span>{issue.refId}</span>
          {cat.emergency && (
            <span className="chip bg-red-100 py-0 text-[9px] text-red-600">
              {t('dashboard.emergency')}
            </span>
          )}
          {overdue ? (
            <span className="chip bg-red-100 py-0 text-[9px] text-red-700">
              <AlarmClock className="h-2.5 w-2.5" /> {t('dashboard.slaOverdueChip')}
            </span>
          ) : ackLate ? (
            <span className="chip bg-amber-100 py-0 text-[9px] text-amber-700">
              {t('dashboard.awaitingAck')}
            </span>
          ) : null}
        </div>
        <StatusBadge status={issue.status} />
      </div>
      <h3 className="mt-1 font-bold text-ink-900 group-hover:text-ink-700">
        {issue.title}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{issue.description}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <CategoryPill category={issue.category} />
        <SeverityBadge severity={issue.severity} />
        <span className="text-xs text-slate-500">{issue.location.address}</span>
        <span className="ml-auto text-xs text-slate-500">{timeAgo(issue.createdAt)}</span>
      </div>
    </button>
  )
}

function EmptyState({ catNames, t }: { catNames: string[]; t: TFunction }) {
  return (
    <div className="card grid place-items-center gap-3 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-ink-900">{t('dashboard.emptyTitle')}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {t('dashboard.emptyLead', { cats: catNames.join(', ') })}
        </p>
      </div>
    </div>
  )
}
