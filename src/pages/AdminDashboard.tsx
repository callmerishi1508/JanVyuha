import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  QrCode,
} from 'lucide-react'
import { useIssues } from '../store/issues'
import { useAuth } from '../store/auth'
import { DEPARTMENT_LIST } from '../data/categories'
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
import { QrPosters } from '../components/QrPosters'
import { tStatus, tDeptShort } from '../lib/i18n'
import { cn } from '../lib/cn'

type Tab = 'overview' | 'moderation' | 'accounts' | 'audit' | 'outreach'

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
  const { t } = useTranslation()
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
            {t('admin.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('admin.subtitle', { jurisdiction: BRAND.jurisdiction })}
            {user?.jurisdiction ? t('admin.scope', { scope: user.jurisdiction }) : ''}
          </p>
        </div>
        <Link to="/analytics" className="btn-outline">
          <BarChart3 className="h-4 w-4" />
          {t('admin.fullAnalytics')}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {(
          [
            ['overview', t('admin.tabOverview'), Gauge],
            ['moderation', t('admin.tabModeration'), Flag],
            ['accounts', t('admin.tabAccounts'), Users],
            ['audit', t('admin.tabAudit'), ScrollText],
            ['outreach', t('admin.tabOutreach'), QrCode],
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
        {tab === 'outreach' && <QrPosters />}
      </div>
    </div>
  )
}

// ── Overview ────────────────────────────────────────────────────────────────
function Overview({ issues }: { issues: Issue[] }) {
  const { t } = useTranslation()
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
        <Tile label={t('admin.tileTotal')} value={s.total} icon={Gauge} tone="slate" />
        <Tile label={t('admin.tileOpen')} value={s.open} icon={Clock} tone="blue" />
        <Tile
          label={t('admin.tileCriticalOpen')}
          value={s.critical}
          icon={AlertTriangle}
          tone="red"
        />
        <Tile
          label={t('admin.tileResolved')}
          value={s.resolved}
          icon={CheckCircle2}
          tone="green"
        />
        <Tile
          label={t('admin.tileSlaBreached')}
          value={s.breached}
          icon={AlertTriangle}
          tone="amber"
        />
        <Tile
          label={t('admin.tileAvgResolve')}
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
          tone="slate"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                aria-label={t('admin.searchAria')}
                className="input pl-9"
              />
            </div>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as 'all' | DepartmentId)}
              aria-label={t('admin.filterByDept')}
              className="input max-w-[190px]"
            >
              <option value="all">{t('admin.allDepartments')}</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d.id} value={d.id}>
                  {tDeptShort(d.id)}
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
              {t('admin.csv')}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t('admin.thRef')}</th>
                  <th className="px-3 py-2">{t('admin.thIssue')}</th>
                  <th className="px-3 py-2">{t('admin.thSeverity')}</th>
                  <th className="px-3 py-2">{t('admin.thStatus')}</th>
                  <th className="px-3 py-2">{t('admin.thSla')}</th>
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
                    <td className="px-3 py-2">{t(`severities.${i.severity}`)}</td>
                    <td className="px-3 py-2">
                      <span>{tStatus(i.status)}</span>
                    </td>
                    <td className="px-3 py-2">
                      {isResolutionBreached(i) ? (
                        <span className="chip bg-red-100 text-red-700">
                          {t('admin.breached')}
                        </span>
                      ) : (
                        <span className="chip bg-emerald-100 text-emerald-700">
                          {t('admin.onTrack')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      {t('admin.noIssuesMatch')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">{t('admin.topDistricts')}</h3>
            <p className="mb-3 text-xs text-slate-500">{t('admin.whereConcentrated')}</p>
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
                <p className="text-xs text-slate-500">{t('admin.noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Moderation ──────────────────────────────────────────────────────────────
function Moderation({ issues, onChange }: { issues: Issue[]; onChange: () => void }) {
  const { t } = useTranslation()
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
      toast.error(t('admin.modNeedsSupabase'))
      return
    }
    try {
      await adminApi.moderate(id, status)
      toast.success(t('admin.marked', { status }))
      onChange()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div>
      {!ready && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('admin.demoBackendNote')}
        </div>
      )}
      {queue.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center text-slate-500">
          <Flag className="h-8 w-8 text-slate-300" />
          <p>{t('admin.queueClear')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((i) => (
            <div key={i.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="chip bg-red-100 text-red-700">
                    {i.flagged ? t('admin.flagged') : i.moderationStatus}
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
                  <Ban className="h-3.5 w-3.5" /> {t('admin.hold')}
                </button>
                <button
                  onClick={() => act(i.id, 'rejected')}
                  className="btn-outline text-xs"
                >
                  {t('admin.reject')}
                </button>
                <button
                  onClick={() => act(i.id, 'active')}
                  className="btn-outline text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> {t('admin.restore')}
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
  const { t } = useTranslation()
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
    if (!email) return toast.error(t('admin.enterEmail'))
    setBusy(true)
    try {
      await adminApi.invite(
        email,
        role,
        role === 'admin' ? null : dept,
        jurisdiction || null
      )
      toast.success(t('admin.inviteSaved'))
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
          <UserPlus className="h-4 w-4" /> {t('admin.provisionTitle')}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{t('admin.provisionLead')}</p>
        {!ready && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('admin.provisionNeedsSupabase')}
          </div>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="inv-email" className="label">
              {t('admin.govEmail')}
            </label>
            <input
              id="inv-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('admin.emailPlaceholder')}
              className="input"
              disabled={!ready}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-role" className="label">
                {t('admin.role')}
              </label>
              <select
                id="inv-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'stakeholder' | 'admin')}
                className="input"
                disabled={!ready}
              >
                <option value="stakeholder">{t('admin.roleStakeholder')}</option>
                <option value="admin">{t('admin.roleAdmin')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-dept" className="label">
                {t('admin.department')}
              </label>
              <select
                id="inv-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value as DepartmentId)}
                className="input"
                disabled={!ready || role === 'admin'}
              >
                {DEPARTMENT_LIST.map((d) => (
                  <option key={d.id} value={d.id}>
                    {tDeptShort(d.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="inv-jur" className="label">
              {t('admin.jurisdictionLabel')}
            </label>
            <input
              id="inv-jur"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder={t('admin.jurisdictionPlaceholder')}
              className="input"
              disabled={!ready}
            />
          </div>
          <button
            onClick={invite}
            disabled={!ready || busy}
            className="btn-primary w-full"
          >
            {busy ? t('admin.saving') : t('admin.addAllowlist')}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-ink-900">{t('admin.accounts')}</h3>
        <div className="mt-3 divide-y divide-slate-100">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-900">{p.name}</div>
                <div className="text-xs text-slate-500">
                  {p.role}
                  {p.department ? ` · ${tDeptShort(p.department)}` : ''}
                  {p.jurisdiction ? ` · ${p.jurisdiction}` : ''}
                </div>
              </div>
              {p.role !== 'admin' && (
                <button
                  onClick={async () => {
                    try {
                      await adminApi.setSuspended(p.id, !p.suspended)
                      toast.success(
                        p.suspended ? t('admin.reinstated') : t('admin.suspended')
                      )
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
                  {p.suspended ? t('admin.suspended') : t('admin.active')}
                </button>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              {ready ? t('admin.noAccounts') : t('admin.connectSupabaseAccounts')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Audit ───────────────────────────────────────────────────────────────────
function Audit() {
  const { t } = useTranslation()
  const ready = adminBackendReady()
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminApi.auditLog>>>([])
  useEffect(() => {
    if (ready)
      adminApi
        .auditLog()
        .then(setRows)
        .catch(() => {})
  }, [ready])

  if (!ready)
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        {t('admin.auditNeedsSupabase')}
      </div>
    )

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">{t('admin.thWhen')}</th>
            <th className="px-3 py-2">{t('admin.thActor')}</th>
            <th className="px-3 py-2">{t('admin.thAction')}</th>
            <th className="px-3 py-2">{t('admin.thDetail')}</th>
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
              <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                {t('admin.noAudit')}
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
