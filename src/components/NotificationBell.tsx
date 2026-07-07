import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useIssues } from '../store/issues'
import { CATEGORIES } from '../data/categories'
import { timeAgo, shortId } from '../lib/format'
import { cn } from '../lib/cn'

/**
 * Role-aware notification bell.
 *  • Stakeholders: unread = issues routed to their department they haven't opened.
 *  • Public: unread = status changes on issues they reported.
 * "Seen" state is tracked in localStorage keyed by the latest updatedAt, so the
 * badge clears once the user opens the dropdown.
 */
const SEEN_KEY = 'janvyuha.notif.seen.v1'

function loadSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
  } catch {
    return {}
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const issues = useIssues((s) => s.issues)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Record<string, string>>(loadSeen)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const relevant = useMemo(() => {
    if (!user) return []
    if (user.role === 'stakeholder' && user.department) {
      return issues
        .filter((i) => i.routedDepartments.includes(user.department!))
        .slice(0, 12)
    }
    // Public: their own reports — match by auth id on the real backend, falling
    // back to name on the mock (which has no user ids).
    return issues
      .filter((i) =>
        user.id
          ? i.reporterId === user.id
          : !i.id.startsWith('seed') && i.reporterName === user.name
      )
      .slice(0, 12)
  }, [issues, user])

  const unread = relevant.filter((i) => seen[i.id] !== i.updatedAt)

  if (!user) return null

  const markAllSeen = () => {
    const next = { ...seen }
    relevant.forEach((i) => (next[i.id] = i.updatedAt))
    setSeen(next)
    localStorage.setItem(SEEN_KEY, JSON.stringify(next))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          // Mark seen when CLOSING (after the user has had a chance to read),
          // so the badge doesn't clear the instant the panel opens.
          if (open) markAllSeen()
          setOpen((o) => !o)
        }}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-700 hover:bg-slate-100"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-ink-900">Notifications</span>
            <span className="text-xs text-slate-400">{relevant.length}</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {relevant.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Nothing yet.
              </div>
            ) : (
              relevant.map((i) => {
                const cat = CATEGORIES[i.category]
                const Icon = cat.icon
                return (
                  <button
                    key={i.id}
                    onClick={() => {
                      navigate(`/issue/${i.id}`)
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: cat.color + '18', color: cat.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {i.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {shortId(i.id)} · {i.status.replace('_', ' ')} ·{' '}
                        {timeAgo(i.updatedAt)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        seen[i.id] !== i.updatedAt ? 'bg-saffron-500' : 'bg-transparent'
                      )}
                    />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
