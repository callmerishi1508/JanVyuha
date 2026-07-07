import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { timeAgo, shortId } from '../lib/format'
import { isResolutionBreached, isAckBreached } from '../lib/analytics'
import { AlarmClock } from 'lucide-react'
import { cn } from '../lib/cn'

type StatusFilter = IssueStatus | 'all' | 'open'

export function Dashboard() {
  const { user } = useAuth()
  const { issues, loaded, loading, refresh } = useIssues()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [query, setQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

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
    else if (statusFilter !== 'all')
      list = list.filter((i) => i.status === statusFilter)
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
                  {department.name}
                </h1>
                <p className="text-xs text-slate-500">
                  Response Dashboard · Control room · Helpline {department.helpline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input w-56 pl-9"
                  placeholder="Search issues…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Total routed" value={stats.total} icon={Inbox} />
            <StatTile label="Open" value={stats.open} icon={CircleDot} tone="amber" />
            <StatTile
              label="Critical"
              value={stats.critical}
              icon={Flame}
              tone="red"
            />
            <StatTile
              label="In progress"
              value={stats.inProgress}
              icon={Loader2}
              tone="amber"
            />
            <StatTile
              label="SLA overdue"
              value={stats.breached}
              icon={AlarmClock}
              tone={stats.breached > 0 ? 'red' : 'green'}
            />
            <StatTile
              label="Resolved"
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
            <Filter className="mr-1 h-4 w-4 shrink-0 text-slate-400" />
            {(
              [
                ['open', 'Open'],
                ['all', 'All'],
                ['reported', 'Reported'],
                ['acknowledged', 'Acknowledged'],
                ['in_progress', 'In Progress'],
                ['resolved', 'Resolved'],
              ] as [StatusFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  statusFilter === key
                    ? 'bg-ink-800 text-white'
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
            <div className="grid place-items-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState catNames={responsibleCats.map((c) => c.name)} />
          ) : (
            <div className="space-y-3">
              {filtered.map((issue) => (
                <DashboardRow
                  key={issue.id}
                  issue={issue}
                  onOpen={() => navigate(`/issue/${issue.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          className={cn(
            'min-h-0',
            mobileView === 'list' && 'hidden lg:block'
          )}
        >
          <MapView
            issues={filtered}
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
}: {
  issue: Issue
  onOpen: () => void
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
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          <span>{shortId(issue.id)}</span>
          {cat.emergency && (
            <span className="chip bg-red-100 py-0 text-[9px] text-red-600">
              Emergency
            </span>
          )}
          {overdue ? (
            <span className="chip bg-red-100 py-0 text-[9px] text-red-700">
              <AlarmClock className="h-2.5 w-2.5" /> SLA overdue
            </span>
          ) : ackLate ? (
            <span className="chip bg-amber-100 py-0 text-[9px] text-amber-700">
              Awaiting ack
            </span>
          ) : null}
        </div>
        <StatusBadge status={issue.status} />
      </div>
      <h3 className="mt-1 font-bold text-ink-900 group-hover:text-ink-700">
        {issue.title}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
        {issue.description}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <CategoryPill category={issue.category} />
        <SeverityBadge severity={issue.severity} />
        <span className="text-xs text-slate-500">{issue.location.address}</span>
        <span className="ml-auto text-xs text-slate-400">
          {timeAgo(issue.createdAt)}
        </span>
      </div>
    </button>
  )
}

function EmptyState({ catNames }: { catNames: string[] }) {
  return (
    <div className="card grid place-items-center gap-3 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-ink-900">No issues to show</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Your department handles: {catNames.join(', ')}. New reports in these
          categories will appear here instantly.
        </p>
      </div>
    </div>
  )
}
