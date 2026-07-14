import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import type { Issue } from '../data/types'
import { data } from '../services'
import { summarize } from '../lib/analytics'
import { Wordmark } from '../components/Brand'
import { BRAND } from '../config/brand'

/**
 * Lightweight, iframe-embeddable widget for a municipal website: brand +
 * a couple of live public stats + a "Report an issue" button that opens the
 * full app in a new tab (the wizard needs real screen space, not an iframe).
 * No Header/Footer (see App.tsx's `isEmbed` check) — this is meant to sit
 * inside someone else's page, not look like a page of its own.
 */
export function Embed() {
  const { t } = useTranslation()
  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    let alive = true
    data
      .getPublicFeed()
      .then((rows) => {
        if (alive) setIssues(rows)
      })
      .catch(() => {
        /* leave empty — stats just don't render */
      })
    return () => {
      alive = false
    }
  }, [])

  const s = summarize(issues)

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Wordmark subtitle={false} />
      <p className="mt-2 text-sm text-slate-600">
        {t('embed.tagline', { jurisdiction: BRAND.jurisdiction })}
      </p>

      {issues.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-xl font-extrabold text-ink-900">{s.total}</div>
            <div className="text-[11px] text-slate-500">{t('embed.totalReports')}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-xl font-extrabold text-ashoka-600">
              {Math.round(s.resolutionRate * 100)}%
            </div>
            <div className="text-[11px] text-slate-500">{t('embed.resolved')}</div>
          </div>
        </div>
      )}

      <a
        href="/report"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-accent mt-4 w-full"
      >
        <Send className="h-4 w-4" />
        {t('embed.reportButton')}
      </a>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs font-semibold text-slate-500 hover:text-ink-700"
      >
        {t('embed.poweredBy', { product: BRAND.product })}
      </a>
    </div>
  )
}
