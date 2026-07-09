import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { tCategory, tDeptShort } from '../lib/i18n'

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
  const { t } = useTranslation()
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
    label: t(`severities.${x.id}`),
    value: x.count,
    color: x.color,
  }))
  const districts = byDistrict(scoped)
    .slice(0, 8)
    .map((d) => ({ label: d.district, value: d.count }))
  const trend = dailyTrend(scoped, 14).map((row) => ({
    label: row.date,
    count: row.count,
  }))
  const perf = departmentPerformance(scoped)
  const compliance = Math.round(slaCompliance(scoped) * 100)

  return (
    <div className="container-page py-8 print:py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
            <BarChart3 className="h-6 w-6 text-ink-700" />
            {t('analytics.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('analytics.subtitle', { jurisdiction: BRAND.jurisdiction })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {user?.role === 'admin' && (
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as 'all' | DepartmentId)}
              aria-label={t('analytics.filterByDept')}
              className="input max-w-[190px]"
            >
              <option value="all">{t('analytics.allDepartments')}</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d.id} value={d.id}>
                  {tDeptShort(d.id)}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => download(`janvyuha-analytics-${Date.now()}.csv`, toCsv(scoped))}
            className="btn-outline"
          >
            <Download className="h-4 w-4" /> {t('analytics.csv')}
          </button>
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="h-4 w-4" /> {t('analytics.pdfPrint')}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label={t('analytics.kpiTotal')} value={s.total} icon={Gauge} />
        <Kpi label={t('analytics.kpiOpen')} value={s.open} icon={Clock} tone="blue" />
        <Kpi label={t('analytics.kpiCriticalOpen')} value={s.critical} icon={AlertTriangle} tone="red" />
        <Kpi label={t('analytics.kpiResolved')} value={s.resolved} icon={CheckCircle2} tone="green" />
        <Kpi
          label={t('analytics.kpiAvgResolution')}
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
        />
        <Kpi label={t('analytics.kpiSla')} value={`${compliance}%`} icon={ShieldCheck} tone={compliance >= 80 ? 'green' : 'amber'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">{t('analytics.trendTitle')}</h3>
          <div className="mt-3">
            <TrendChart data={trend} title={t('analytics.trendChartTitle')} />
          </div>
        </div>

        {/* Severity donut */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">{t('analytics.bySeverity')}</h3>
          <div className="mt-3">
            <Donut data={sev} title={t('analytics.severityChartTitle')} />
            <div className="mt-3">
              <Legend data={sev} />
            </div>
          </div>
        </div>

        {/* Category bar */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">{t('analytics.byCategory')}</h3>
          <div className="mt-3">
            <BarChart data={cats.map((c) => ({ label: tCategory(c.id as Parameters<typeof tCategory>[0]), value: c.count, color: c.color }))} title={t('analytics.categoryChartTitle')} />
          </div>
        </div>

        {/* District heatmap */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">{t('analytics.topDistricts')}</h3>
          <p className="text-xs text-slate-500">{t('analytics.reportingConcentration')}</p>
          <div className="mt-3">
            {districts.length ? (
              <BarChart data={districts} accent="#0f8a4f" title={t('analytics.districtChartTitle')} />
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">{t('analytics.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Department performance */}
      <div className="mt-6 card p-5">
        <h3 className="text-sm font-bold text-ink-900">{t('analytics.deptPerformance')}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">{t('analytics.thDepartment')}</th>
                <th className="py-2 pr-4">{t('analytics.thTotal')}</th>
                <th className="py-2 pr-4">{t('analytics.thOpen')}</th>
                <th className="py-2 pr-4">{t('analytics.thResolved')}</th>
                <th className="py-2 pr-4">{t('analytics.thResolutionRate')}</th>
                <th className="py-2 pr-4">{t('analytics.thAvgResolve')}</th>
                <th className="py-2 pr-4">{t('analytics.thSlaBreaches')}</th>
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
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {perf.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    {t('analytics.noIssuesYet')}
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
            {t('analytics.backToConsole')}
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
