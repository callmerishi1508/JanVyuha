import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe2, CheckCircle2, Clock, Gauge } from 'lucide-react'
import type { Issue } from '../data/types'
import { data } from '../services'
import { summarize, byCategory, byDistrict, humanizeMs } from '../lib/analytics'
import { BarChart, Donut, Legend } from '../components/charts'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryPill } from '../components/CategoryPill'
import { BRAND } from '../config/brand'
import { timeAgo } from '../lib/format'

/**
 * Public transparency dashboard — no login, no personal data. Reads the
 * coarsened `public_issue_feed` view (PII-free, ~1km location, granted to anon)
 * via getPublicFeed(), so it works logged-out — NOT the RLS-scoped issues store,
 * which returns nothing for anonymous visitors.
 */
export function Transparency() {
  const { t } = useTranslation()
  const [active, setActive] = useState<Issue[]>([])

  useEffect(() => {
    let alive = true
    data
      .getPublicFeed()
      .then((rows) => {
        if (alive) setActive(rows)
      })
      .catch(() => {
        /* leave empty — the page renders "No data." states */
      })
    return () => {
      alive = false
    }
  }, [])

  const s = summarize(active)
  const cats = byCategory(active)
    .filter((c) => c.count > 0)
    .map((c) => ({ label: c.label, value: c.count, color: c.color }))
  const districts = byDistrict(active)
    .slice(0, 8)
    .map((d) => ({ label: d.district, value: d.count }))

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-ashoka-500/15 text-ashoka-600">
          <Globe2 className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t('transparency.title')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('transparency.subtitle', { jurisdiction: BRAND.jurisdiction })}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label={t('transparency.reports')} value={s.total} icon={Gauge} />
        <Tile
          label={t('transparency.resolved')}
          value={s.resolved}
          icon={CheckCircle2}
          tone="green"
        />
        <Tile label={t('transparency.open')} value={s.open} icon={Clock} tone="amber" />
        <Tile
          label={t('transparency.avgResolution')}
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">
            {t('transparency.byCategory')}
          </h3>
          <div className="mt-3">
            {cats.length ? (
              <BarChart data={cats} title={t('transparency.byCategory')} />
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                {t('transparency.noData')}
              </p>
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">
            {t('transparency.resolutionSplit')}
          </h3>
          <div className="mt-3">
            <Donut
              data={[
                {
                  label: t('transparency.resolved'),
                  value: s.resolved,
                  color: '#0f8a4f',
                },
                { label: t('transparency.open'), value: s.open, color: '#ea580c' },
              ]}
              title={t('transparency.resolvedVsOpen')}
            />
            <div className="mt-3">
              <Legend
                data={[
                  {
                    label: t('transparency.resolved'),
                    value: s.resolved,
                    color: '#0f8a4f',
                  },
                  { label: t('transparency.open'), value: s.open, color: '#ea580c' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">
            {t('transparency.byDistrict')}
          </h3>
          <div className="mt-3">
            {districts.length ? (
              <BarChart
                data={districts}
                accent="#0f8a4f"
                title={t('transparency.byDistrict')}
              />
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                {t('transparency.noData')}
              </p>
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">
            {t('transparency.recentReports')}
          </h3>
          <p className="text-xs text-slate-500">{t('transparency.identityHidden')}</p>
          <div className="mt-3 divide-y divide-slate-100">
            {active.slice(0, 8).map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-2.5">
                <CategoryPill category={i.category} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {i.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {i.location.district || i.location.city || '—'} ·{' '}
                    {timeAgo(i.createdAt)}
                  </div>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
            {active.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                {t('transparency.noReportsYet')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/report" className="btn-accent">
          {t('hero.report')}
        </Link>
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  icon: Icon,
  tone = 'slate',
}: {
  label: string
  value: number | string
  icon: typeof Gauge
  tone?: 'slate' | 'green' | 'amber'
}) {
  const tones = {
    slate: 'text-slate-600',
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
