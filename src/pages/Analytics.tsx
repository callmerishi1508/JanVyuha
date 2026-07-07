import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Download,
  Printer,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { useIssues } from '../store/issues'
import { useAuth } from '../store/auth'
import { DEPARTMENT_LIST } from '../data/categories'
import type { DepartmentId } from '../data/categories'
import {
  summarize,
  humanizeMs,
  byCategory,
  bySeverity,
  byDistrict,
  dailyTrend,
  departmentPerformance,
  slaCompliance,
  toCsv,
} from '../lib/analytics'
import { BarChart, TrendChart, Donut, Legend } from '../components/charts'
import { BRAND } from '../config/brand'

function download(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function Analytics() {
  const { issues, loaded, refresh } = useIssues()
  const user = useAuth((s) => s.user)
  // A stakeholder sees only their department's slice; admins see everything.
  const [dept, setDept] = useState<'all' | DepartmentId>(
    user?.role === 'stakeholder' && user.department ? user.department : 'all'
  )

  useEffect(() => {
    if (!loaded) refresh()
  }, [loaded, refresh])

  const scoped = useMemo(
    () =>
      dept === 'all'
        ? issues
        : issues.filter((i) => i.routedDepartments.includes(dept)),
    [issues, dept]
  )

  const s = summarize(scoped)
  const cats = byCategory(scoped).filter((c) => c.count > 0)
  const sev = bySeverity(scoped).map((x) => ({
    label: x.label,
    value: x.count,
    color: x.color,
  }))
  const districts = byDistrict(scoped)
    .slice(0, 8)
    .map((d) => ({ label: d.district, value: d.count }))
  const trend = dailyTrend(scoped, 14).map((t) => ({
    label: t.date,
    count: t.count,
  }))
  const perf = departmentPerformance(scoped)
  const compliance = Math.round(slaCompliance(scoped) * 100)

  return (
    <div className="container-page py-8 print:py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
            <BarChart3 className="h-6 w-6 text-ink-700" />
            Analytics & Performance
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {BRAND.jurisdiction} · operational reporting for officials
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {user?.role === 'admin' && (
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
          )}
          <button
            onClick={() => download(`janvyuha-analytics-${Date.now()}.csv`, toCsv(scoped))}
            className="btn-outline"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="h-4 w-4" /> PDF / Print
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total reports" value={s.total} icon={Gauge} />
        <Kpi label="Open" value={s.open} icon={Clock} tone="blue" />
        <Kpi label="Critical open" value={s.critical} icon={AlertTriangle} tone="red" />
        <Kpi label="Resolved" value={s.resolved} icon={CheckCircle2} tone="green" />
        <Kpi
          label="Avg resolution"
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
        />
        <Kpi label="SLA compliance" value={`${compliance}%`} icon={ShieldCheck} tone={compliance >= 80 ? 'green' : 'amber'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">Reports over the last 14 days</h3>
          <div className="mt-3">
            <TrendChart data={trend} title="Daily reports, last 14 days" />
          </div>
        </div>

        {/* Severity donut */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">By severity</h3>
          <div className="mt-3">
            <Donut data={sev} title="Issues by severity" />
            <div className="mt-3">
              <Legend data={sev} />
            </div>
          </div>
        </div>

        {/* Category bar */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">By category</h3>
          <div className="mt-3">
            <BarChart data={cats.map((c) => ({ label: c.label, value: c.count, color: c.color }))} title="Issues by category" />
          </div>
        </div>

        {/* District heatmap */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">Top districts</h3>
          <p className="text-xs text-slate-500">Reporting concentration</p>
          <div className="mt-3">
            {districts.length ? (
              <BarChart data={districts} accent="#0f8a4f" title="Issues by district" />
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Department performance */}
      <div className="mt-6 card p-5">
        <h3 className="text-sm font-bold text-ink-900">Department performance</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Open</th>
                <th className="py-2 pr-4">Resolved</th>
                <th className="py-2 pr-4">Resolution rate</th>
                <th className="py-2 pr-4">Avg resolve</th>
                <th className="py-2 pr-4">SLA breaches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perf.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{p.total}</td>
                  <td className="py-2 pr-4">{p.open}</td>
                  <td className="py-2 pr-4">{p.resolved}</td>
                  <td className="py-2 pr-4">{Math.round(p.resolutionRate * 100)}%</td>
                  <td className="py-2 pr-4">
                    {p.avgResolutionMs == null ? '—' : humanizeMs(p.avgResolutionMs)}
                  </td>
                  <td className="py-2 pr-4">
                    {p.breached > 0 ? (
                      <span className="chip bg-red-100 text-red-700">{p.breached}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {perf.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No issues yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-6 print:hidden">
          <Link to="/admin" className="text-sm font-semibold text-ink-700 hover:text-saffron-600">
            ← Back to Administration Console
          </Link>
        </div>
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = 'slate',
}: {
  label: string
  value: number | string
  icon: typeof Gauge
  tone?: 'slate' | 'blue' | 'red' | 'green' | 'amber'
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
        <Icon className={`h-4 w-4 ${tones[tone]}`} />
      </div>
      <div className="mt-1 text-2xl font-extrabold text-ink-900">{value}</div>
    </div>
  )
}
