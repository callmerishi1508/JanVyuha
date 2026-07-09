import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, ArrowUp, Clock } from 'lucide-react'
import type { Issue } from '../data/types'
import { CATEGORIES } from '../data/categories'
import { StatusBadge, SeverityBadge } from './StatusBadge'
import { CategoryIconTile } from './CategoryPill'
import { MediaThumb } from './MediaUpload'
import { timeAgo, shortId } from '../lib/format'
import { tCategory, tDeptShort } from '../lib/i18n'

export function IssueCard({
  issue,
  showRouting = false,
}: {
  issue: Issue
  showRouting?: boolean
}) {
  const { t } = useTranslation()
  const cat = CATEGORIES[issue.category]
  return (
    <Link
      to={`/issue/${issue.id}`}
      className="card group flex gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
        {issue.media[0] ? (
          <MediaThumb item={issue.media[0]} />
        ) : (
          <CategoryIconTile category={issue.category} className="h-full w-full" />
        )}
        {cat.emergency && (
          <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            SOS
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <span>{shortId(issue.id)}</span>
              <span style={{ color: cat.color }}>{tCategory(issue.category)}</span>
            </div>
            <h3 className="mt-0.5 truncate text-sm font-bold text-ink-900 group-hover:text-ink-700 sm:text-base">
              {issue.title}
            </h3>
          </div>
          <StatusBadge status={issue.status} />
        </div>

        <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
          {issue.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {issue.location.address}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(issue.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" />
            {issue.upvotes}
          </span>
          <SeverityBadge severity={issue.severity} />
        </div>

        {showRouting && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              {t('common.routedTo')}
            </span>
            {issue.routedDepartments.map((d) => (
              <span
                key={d}
                className="chip bg-slate-100 text-[11px] text-slate-600"
              >
                {tDeptShort(d)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
