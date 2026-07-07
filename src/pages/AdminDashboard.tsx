import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ShieldCheck,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Users,
  Flag,
  ScrollText,
  Search,
  BarChart3,
  Ban,
  RotateCcw,
  UserPlus,
} from 'lucide-react'
import { useIssues } from '../store/issues'
import { useAuth } from '../store/auth'
import { DEPARTMENT_LIST, DEPARTMENTS } from '../data/categories'
import type { DepartmentId } from '../data/categories'
import type { Issue, ModerationStatus } from '../data/types'
import {
  summarize,
  humanizeMs,
  isResolutionBreached,
  byDistrict,
  toCsv,
} from '../lib/analytics'
import { adminApi, adminBackendReady, type ProfileRow } from '../services/admin'
import { BRAND } from '../config/brand'
import { cn } from '../lib/cn'

type Tab = 'overview' | 'moderation' | 'accounts' | 'audit'

function download(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminDashboard() {
  const { issues, loaded, refresh } = useIssues()
  const user = useAuth((s) => s.user)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
            <ShieldCheck className="h-6 w-6 text-ink-700" />
            Administration Console
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cross-department oversight · {BRAND.jurisdiction}
            {user?.jurisdiction ? ` · scope: ${user.jurisdiction}` : ''}
          </p>
        </div>
        <Link to="/analytics" className="btn-outline">
          <BarChart3 className="h-4 w-4" />
          Full analytics
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {(
          [
            ['overview', 'Overview', Gauge],
            ['moderation', 'Moderation', Flag],
            ['accounts', 'Accounts', Users],
            ['audit', 'Audit log', ScrollText],
          ] as [Tab, string, typeof Gauge][]
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              tab === id
                ? 'border-b-2 border-ink-800 text-ink-900'
                : 'text-slate-500 hover:text-ink-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview issues={issues} />}
        {tab === 'moderation' && <Moderation issues={issues} onChange={refresh} />}
        {tab === 'accounts' && <Accounts />}
        {tab === 'audit' && <Audit />}
      </div>
    </div>
  )
}

// ── Overview ────────────────────────────────────────────────────────────────
function Overview({ issues }: { issues: Issue[] }) {
  const [dept, setDept] = useState<'all' | DepartmentId>('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      if (dept !== 'all' && !i.routedDepartments.includes(dept)) return false
      if (q) {
        const s = q.toLowerCase()
        if (
          !i.title.toLowerCase().includes(s) &&
          !i.refId.toLowerCase().includes(s) &&
          !(i.location.district || '').toLowerCase().includes(s)
        )
          return false
      }
      return true
    })
  }, [issues, dept, q])

  const s = summarize(filtered)
  const districts = byDistrict(filtered).slice(0, 6)
  const maxDistrict = districts[0]?.count || 1

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tile label="Total" value={s.total} icon={Gauge} tone="slate" />
        <Tile label="Open" value={s.open} icon={Clock} tone="blue" />
        <Tile label="Critical open" value={s.critical} icon={AlertTriangle} tone="red" />
        <Tile label="Resolved" value={s.resolved} icon={CheckCircle2} tone="green" />
        <Tile label="SLA breached" value={s.breached} icon={AlertTriangle} tone="amber" />
        <Tile
          label="Avg resolve"
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
          tone="slate"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, ref-id or district…"
                aria-label="Search issues"
                className="input pl-9"
              />
            </div>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as 'all' | DepartmentId)}
              aria-label="Filter by department"
              className="input max-w-[190px]"
            >
              <option value="all">All departments</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.short}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                download(`janvyuha-issues-${Date.now()}.csv`, toCsv(filtered))
              }
              className="btn-outline"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">Issue</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 60).map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      <Link to={`/issue/${i.id}`} className="hover:text-ink-800">
                        {i.refId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[280px] truncate font-medium text-ink-900">
                        {i.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {i.location.district || i.location.city || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{i.severity}</td>
                    <td className="px-3 py-2">
                      <span className="capitalize">{i.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-3 py-2">
                      {isResolutionBreached(i) ? (
                        <span className="chip bg-red-100 text-red-700">Breached</span>
                      ) : (
                        <span className="chip bg-emerald-100 text-emerald-700">On track</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                      No issues match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">Top districts</h3>
            <p className="mb-3 text-xs text-slate-500">
              Where reports are concentrated.
            </p>
            <div className="space-y-2">
              {districts.map((d) => (
                <div key={d.district}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate text-ink-800">{d.district}</span>
                    <span className="font-semibold text-slate-500">{d.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-ink-700"
                      style={{ width: `${(d.count / maxDistrict) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {districts.length === 0 && (
                <p className="text-xs text-slate-400">No data.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Moderation ──────────────────────────────────────────────────────────────
function Moderation({
  issues,
  onChange,
}: {
  issues: Issue[]
  onChange: () => void
}) {
  const ready = adminBackendReady()
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (ready)
      adminApi
        .reports()
        .then((rs) => setReportedIds(new Set(rs.map((r) => r.issue_id))))
        .catch(() => {})
  }, [ready])

  const queue = issues.filter(
    (i) =>
      i.flagged ||
      reportedIds.has(i.id) ||
      (i.moderationStatus && i.moderationStatus !== 'active')
  )

  const act = async (id: string, status: ModerationStatus) => {
    if (!ready) {
      toast.error('Moderation actions need the Supabase backend')
      return
    }
    try {
      await adminApi.moderate(id, status)
      toast.success(`Marked ${status}`)
      onChange()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div>
      {!ready && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are on the demo (mock) backend. The moderation queue lists flagged
          items, but taking action writes to the database and needs Supabase.
        </div>
      )}
      {queue.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center text-slate-500">
          <Flag className="h-8 w-8 text-slate-300" />
          <p>Nothing awaiting moderation. The queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((i) => (
            <div key={i.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="chip bg-red-100 text-red-700">
                    {i.flagged ? 'Flagged' : i.moderationStatus}
                  </span>
                  <Link
                    to={`/issue/${i.id}`}
                    className="truncate font-semibold text-ink-900 hover:underline"
                  >
                    {i.title}
                  </Link>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {i.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act(i.id, 'held')} className="btn-outline text-xs">
                  <Ban className="h-3.5 w-3.5" /> Hold
                </button>
                <button onClick={() => act(i.id, 'rejected')} className="btn-outline text-xs">
                  Reject
                </button>
                <button onClick={() => act(i.id, 'active')} className="btn-outline text-xs">
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Accounts ────────────────────────────────────────────────────────────────
function Accounts() {
  const ready = adminBackendReady()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'stakeholder' | 'admin'>('stakeholder')
  const [dept, setDept] = useState<DepartmentId>('police')
  const [jurisdiction, setJurisdiction] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setProfiles(await adminApi.listProfiles())
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  useEffect(() => {
    if (ready) load()
  }, [ready])

  const invite = async () => {
    if (!email) return toast.error('Enter an email')
    setBusy(true)
    try {
      await adminApi.invite(
        email,
        role,
        role === 'admin' ? null : dept,
        jurisdiction || null
      )
      toast.success('Invite saved — they get the role on sign-up')
      setEmail('')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <UserPlus className="h-4 w-4" /> Provision a department / admin account
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Officials can never self-register. You add them to the allow-list here;
          when they sign up with this email they are granted the role
          automatically — enforced in the database.
        </p>
        {!ready && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Requires the Supabase backend. On the demo backend, use the Tester
            panel to switch roles instantly.
          </div>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="inv-email" className="label">Government email</label>
            <input
              id="inv-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@dept.gov.in"
              className="input"
              disabled={!ready}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-role" className="label">Role</label>
              <select
                id="inv-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'stakeholder' | 'admin')}
                className="input"
                disabled={!ready}
              >
                <option value="stakeholder">Department stakeholder</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-dept" className="label">Department</label>
              <select
                id="inv-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value as DepartmentId)}
                className="input"
                disabled={!ready || role === 'admin'}
              >
                {DEPARTMENT_LIST.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.short}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="inv-jur" className="label">
              Jurisdiction (district or state; blank = all)
            </label>
            <input
              id="inv-jur"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder="e.g. Hyderabad"
              className="input"
              disabled={!ready}
            />
          </div>
          <button onClick={invite} disabled={!ready || busy} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Add to allow-list'}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-ink-900">Accounts</h3>
        <div className="mt-3 divide-y divide-slate-100">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-900">
                  {p.name}
                </div>
                <div className="text-xs text-slate-500">
                  {p.role}
                  {p.department ? ` · ${DEPARTMENTS[p.department].short}` : ''}
                  {p.jurisdiction ? ` · ${p.jurisdiction}` : ''}
                </div>
              </div>
              {p.role !== 'admin' && (
                <button
                  onClick={async () => {
                    try {
                      await adminApi.setSuspended(p.id, !p.suspended)
                      toast.success(p.suspended ? 'Reinstated' : 'Suspended')
                      load()
                    } catch (e) {
                      toast.error((e as Error).message)
                    }
                  }}
                  className={cn(
                    'chip',
                    p.suspended
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {p.suspended ? 'Suspended' : 'Active'}
                </button>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              {ready ? 'No accounts yet.' : 'Connect Supabase to manage accounts.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Audit ───────────────────────────────────────────────────────────────────
function Audit() {
  const ready = adminBackendReady()
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminApi.auditLog>>>([])
  useEffect(() => {
    if (ready) adminApi.auditLog().then(setRows).catch(() => {})
  }, [ready])

  if (!ready)
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        The tamper-evident audit trail (who changed what, when) is recorded in the
        database. Connect Supabase to view it.
      </div>
    )

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Actor</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 text-xs text-slate-500">
                {new Date(r.created_at).toLocaleString('en-IN')}
              </td>
              <td className="px-3 py-2">{r.actor_name}</td>
              <td className="px-3 py-2 font-medium">{r.action}</td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {r.detail ? JSON.stringify(r.detail) : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Small tile ──────────────────────────────────────────────────────────────
function Tile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  icon: typeof Gauge
  tone: 'slate' | 'blue' | 'red' | 'green' | 'amber'
}) {
  const tones = {
    slate: 'text-slate-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <Icon className={cn('h-4 w-4', tones[tone])} />
      </div>
      <div className="mt-1 text-2xl font-extrabold text-ink-900">{value}</div>
    </div>
  )
}
