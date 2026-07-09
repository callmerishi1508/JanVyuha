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
          Public Transparency Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Anonymised, real-time civic-response data for {BRAND.jurisdiction}. No
          personal information is shown — locations are approximate.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Reports" value={s.total} icon={Gauge} />
        <Tile label="Resolved" value={s.resolved} icon={CheckCircle2} tone="green" />
        <Tile label="Open" value={s.open} icon={Clock} tone="amber" />
        <Tile
          label="Avg resolution"
          value={s.avgResolutionMs == null ? '—' : humanizeMs(s.avgResolutionMs)}
          icon={Gauge}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">Reports by category</h3>
          <div className="mt-3">
            {cats.length ? (
              <BarChart data={cats} title="Reports by category" />
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No data.</p>
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">Resolution split</h3>
          <div className="mt-3">
            <Donut
              data={[
                { label: 'Resolved', value: s.resolved, color: '#0f8a4f' },
                { label: 'Open', value: s.open, color: '#ea580c' },
              ]}
              title="Resolved vs open"
            />
            <div className="mt-3">
              <Legend
                data={[
                  { label: 'Resolved', value: s.resolved, color: '#0f8a4f' },
                  { label: 'Open', value: s.open, color: '#ea580c' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink-900">By district</h3>
          <div className="mt-3">
            {districts.length ? (
              <BarChart data={districts} accent="#0f8a4f" title="Reports by district" />
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No data.</p>
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-ink-900">Recent public reports</h3>
          <p className="text-xs text-slate-500">Identity hidden · approximate area</p>
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
              <p className="py-6 text-center text-sm text-slate-400">
                No public reports yet.
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
  const tones = { slate: 'text-slate-600', green: 'text-emerald-600', amber: 'text-amber-600' }
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
