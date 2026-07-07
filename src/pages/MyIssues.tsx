import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusCircle, Inbox, Loader2, Trash2, BellRing } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useIssues } from '../store/issues'
import { IssueCard } from '../components/IssueCard'
import { STATUS_FLOW, STATUS_META, type IssueStatus } from '../data/categories'
import { isPushSupported, enablePush } from '../lib/push'
import { cn } from '../lib/cn'

/**
 * Citizens don't have server-side accounts in this demo, so "My Reports" shows
 * issues they created this session/device. We track created ids in localStorage
 * plus match by reporter name for a fuller demo.
 */
const CREATED_KEY = 'janvyuha.myreports.v1'

function readCreatedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CREATED_KEY) || '[]')
  } catch {
    return []
  }
}

export function MyIssues() {
  const { user } = useAuth()
  const { issues, loaded, loading, refresh, remove } = useIssues()
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all')

  const deleteReport = async (id: string) => {
    if (
      !window.confirm(
        'Delete this report permanently? This exercises your right to erasure and cannot be undone.'
      )
    )
      return
    try {
      await remove(id)
      toast.success('Report deleted')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  const mine = useMemo(() => {
    const ids = new Set(readCreatedIds())
    return issues.filter(
      (i) =>
        ids.has(i.id) ||
        (user?.id && i.reporterId === user.id) ||
        (user?.name && i.reporterName === user.name && !i.id.startsWith('seed'))
    )
  }, [issues, user])

  const shown =
    filter === 'all' ? mine : mine.filter((i) => i.status === filter)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mine.length }
    STATUS_FLOW.forEach((s) => (c[s] = mine.filter((i) => i.status === s).length))
    return c
  }, [mine])

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            My Reports
          </h1>
          <p className="mt-1 text-slate-600">
            Track the issues you've reported and their resolution status.
          </p>
        </div>
        <div className="flex gap-2">
          {isPushSupported() && (
            <button
              onClick={async () => {
                const ok = await enablePush()
                toast[ok ? 'success' : 'error'](
                  ok ? 'Alerts enabled on this device' : 'Could not enable alerts'
                )
              }}
              className="btn-outline"
            >
              <BellRing className="h-4 w-4" />
              Enable alerts
            </button>
          )}
          <Link to="/report" className="btn-accent">
            <PlusCircle className="h-4 w-4" />
            New report
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={counts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {STATUS_FLOW.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_META[s].label}
            count={counts[s]}
            active={filter === s}
            color={STATUS_META[s].color}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading && !loaded ? (
          <div className="grid place-items-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="card grid place-items-center gap-3 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">
                {mine.length === 0
                  ? "You haven't reported anything yet"
                  : 'No reports in this status'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Reports you submit will appear here so you can follow their
                progress.
              </p>
            </div>
            <Link to="/report" className="btn-primary mt-2">
              <PlusCircle className="h-4 w-4" />
              Report an issue
            </Link>
          </div>
        ) : (
          shown.map((issue) => (
            <div key={issue.id} className="relative">
              <IssueCard issue={issue} showRouting />
              <button
                onClick={() => deleteReport(issue.id)}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete report (right to erasure)
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'border-ink-800 bg-ink-800 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      )}
    >
      {color && !active && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 text-xs',
          active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  )
}

/** Records a newly-created issue id so it shows under My Reports. */
export function rememberCreated(id: string) {
  const ids = readCreatedIds()
  ids.unshift(id)
  localStorage.setItem(CREATED_KEY, JSON.stringify(ids.slice(0, 100)))
}
