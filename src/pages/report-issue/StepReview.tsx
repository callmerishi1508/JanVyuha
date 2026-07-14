import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { MapPin, AlertTriangle, BellRing } from 'lucide-react'
import { DEPARTMENTS, SEVERITIES } from '../../data/categories'
import { CategoryIconTile } from '../../components/CategoryPill'
import { MediaThumb } from '../../components/MediaUpload'
import { formatDistance } from '../../lib/dedupe'
import { cn } from '../../lib/cn'
import { tCategory, tDept } from '../../lib/i18n'
import type { ReportForm } from './useReportForm'

export function StepReview({ form }: { form: ReportForm }) {
  const { t } = useTranslation()
  const cat = form.cat
  if (!cat) return null
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900">{t('report.reviewApprove')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('report.reviewLead')}</p>
      </div>

      {form.nearby.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            {t('report.similarNearby', { count: form.nearby.length })}
          </p>
          <p className="mt-1 text-xs text-amber-700">{t('report.similarLead')}</p>
          <div className="mt-2 space-y-1.5">
            {form.nearby.slice(0, 3).map(({ issue, distance }) => (
              <Link
                key={issue.id}
                to={`/issue/${issue.id}`}
                className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs hover:bg-white"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-ink-800">
                  {issue.title}
                </span>
                <span className="shrink-0 text-amber-700">
                  {t('report.away', { dist: formatDistance(distance) })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200">
        <div className="flex items-start gap-4 p-4">
          <CategoryIconTile category={cat.id} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: cat.color }}
              >
                {tCategory(cat.id)}
              </span>
              <span
                className="chip text-[10px]"
                style={{
                  color: SEVERITIES[form.severity].color,
                  backgroundColor: SEVERITIES[form.severity].color + '18',
                }}
              >
                {t(`severities.${form.severity}`)}
              </span>
            </div>
            <h3 className="mt-1 font-bold text-ink-900">{form.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{form.description}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {form.address}
            </p>
            <div className="mt-2 flex gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => form.setStep(1)}
                className="text-ink-600 underline underline-offset-2 hover:text-ink-800"
              >
                {t('report.editDetails')}
              </button>
              <button
                type="button"
                onClick={() => form.setStep(2)}
                className="text-ink-600 underline underline-offset-2 hover:text-ink-800"
              >
                {t('report.editLocation')}
              </button>
            </div>
          </div>
        </div>
        {form.media.length > 0 && (
          <div className="flex gap-2 border-t border-slate-100 p-3">
            {form.media.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200"
              >
                <MediaThumb item={m} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routing preview */}
      <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-saffron-800">
            <BellRing className="h-4 w-4" />
            {t('report.willBeSentTo')}
          </div>
          <button
            type="button"
            onClick={() => form.setStep(3)}
            className="text-xs font-semibold text-saffron-800 underline underline-offset-2 hover:text-saffron-900"
          >
            {t('report.editDepartments')}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {form.finalDepartments.map((d) => {
            const dep = DEPARTMENTS[d]
            const Icon = dep.icon
            return (
              <span
                key={d}
                className="inline-flex items-center gap-2 rounded-lg border border-white bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 shadow-sm"
              >
                <Icon className="h-4 w-4" style={{ color: dep.color }} />
                {tDept(dep.id)}
              </span>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-saffron-700/80">{t('report.onlyTheseSee')}</p>
      </div>

      {/* Reporter */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reporter-name" className="label">
            {t('report.yourName')}
          </label>
          <input
            id="reporter-name"
            className="input"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder={t('report.fullName')}
            disabled={form.anonymous}
          />
        </div>
        <div>
          <label htmlFor="reporter-phone" className="label">
            {t('report.contactOptional')}
          </label>
          <input
            id="reporter-phone"
            className={cn(
              'input',
              !form.anonymous &&
                !form.validPhone &&
                'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            )}
            inputMode="numeric"
            value={form.phone}
            onChange={(e) =>
              form.setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            placeholder={t('report.phonePlaceholder')}
            disabled={form.anonymous}
            aria-invalid={!form.anonymous && !form.validPhone}
          />
          {!form.anonymous && !form.validPhone && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {t('report.phoneInvalid')}
            </p>
          )}
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-ink-800 focus:ring-ink-500"
          checked={form.anonymous}
          onChange={(e) => form.setAnonymous(e.target.checked)}
        />
        {t('report.reportAnon')}
      </label>

      {cat.emergency && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('report.emergencyCall')}{' '}
          <b>{form.finalDepartments.map((d) => DEPARTMENTS[d].helpline).join(' / ')}</b>.
        </div>
      )}

      {/* Mandatory declaration / consent — nothing is filed without this */}
      <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ink-800 focus:ring-ink-500"
          checked={form.consent}
          onChange={(e) => form.setConsent(e.target.checked)}
        />
        <span>
          <Trans i18nKey="report.declaration">
            I confirm the information is true to the best of my knowledge and consent to
            it being shared with the selected departments for action, per the{' '}
            <a
              href="/privacy"
              target="_blank"
              className="font-semibold text-ink-700 underline"
            >
              Privacy Policy
            </a>
            . I understand filing a false report is punishable.
          </Trans>
        </span>
      </label>
    </div>
  )
}
