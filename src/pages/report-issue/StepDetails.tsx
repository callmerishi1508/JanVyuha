import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, AlertTriangle, Sparkles, Wand2, Mic, Square } from 'lucide-react'
import { SEVERITIES, type Severity } from '../../data/categories'
import { CategoryIconTile } from '../../components/CategoryPill'
import { MediaUpload } from '../../components/MediaUpload'
import { cn } from '../../lib/cn'
import { tCategory } from '../../lib/i18n'
import { useSpeechInput } from '../../lib/speech'
import type { ReportForm } from './useReportForm'

export function StepDetails({ form }: { form: ReportForm }) {
  const { t } = useTranslation()
  // P2-11 voice input: append each spoken phrase to the description. The mic
  // renders only where the browser supports the Web Speech API. Functional
  // update — consecutive phrases must not clobber each other mid-render.
  const speech = useSpeechInput((phrase) =>
    form.setDescription((prev) =>
      ((prev ? prev.replace(/\s+$/, '') + ' ' : '') + phrase).slice(0, 600)
    )
  )
  const cat = form.cat
  if (!cat) return null
  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
        <CategoryIconTile category={cat.id} className="h-10 w-10" />
        <div>
          <div className="text-sm font-bold text-ink-900">{tCategory(cat.id)}</div>
          <button
            className="text-xs font-semibold text-ink-600 hover:underline"
            onClick={() => form.setStep(0)}
          >
            {t('report.changeCategory')}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="issue-title" className="label">
          {t('report.titleLabel')}
        </label>
        <input
          id="issue-title"
          className={cn(
            'input',
            form.title.trim().length > 0 &&
              form.title.trim().length < 4 &&
              'border-red-400 focus:border-red-500 focus:ring-red-500/20'
          )}
          placeholder={t('report.titlePlaceholder')}
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          maxLength={90}
          aria-invalid={form.title.trim().length > 0 && form.title.trim().length < 4}
        />
        {form.title.trim().length > 0 && form.title.trim().length < 4 && (
          <p className="mt-1 text-xs font-medium text-red-600">{t('report.titleMin')}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="issue-desc" className="label">
            {t('report.descLabel')}
          </label>
          {speech.supported && (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              aria-pressed={speech.listening}
              className={cn(
                'mb-1 inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                speech.listening
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {speech.listening ? (
                <>
                  <Square className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                  {t('report.voiceStop')}
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" aria-hidden />
                  {t('report.voiceStart')}
                </>
              )}
            </button>
          )}
        </div>
        <textarea
          id="issue-desc"
          className={cn(
            'input min-h-[110px] resize-y',
            form.description.trim().length > 0 &&
              form.description.trim().length < 8 &&
              'border-red-400 focus:border-red-500 focus:ring-red-500/20'
          )}
          placeholder={t('report.descPlaceholder')}
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          maxLength={600}
          aria-invalid={
            form.description.trim().length > 0 && form.description.trim().length < 8
          }
        />
        <p aria-live="polite" className="mt-1 text-xs font-medium text-slate-500">
          {speech.listening ? t('report.voiceListening') : ''}
        </p>
        {form.description.trim().length > 0 && form.description.trim().length < 8 && (
          <p className="mt-1 text-xs font-medium text-red-600">{t('report.descMin')}</p>
        )}
      </div>

      <div>
        <label className="label">{t('report.howSevere')}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(SEVERITIES) as Severity[]).map((s) => {
            const active = form.severity === s
            const meta = SEVERITIES[s]
            return (
              <button
                key={s}
                onClick={() => form.setSeverity(s)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
                style={
                  active
                    ? { backgroundColor: meta.color, borderColor: meta.color }
                    : undefined
                }
              >
                {t(`severities.${s}`)}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="label">{t('report.evidence')}</label>
        <MediaUpload items={form.media} onChange={form.setMedia} />
      </div>

      {/* AI assist */}
      {!form.aiUnavailable && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">
                  {t('report.aiAssist')}
                  {form.mockAi && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      {t('report.demoAiBadge')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {form.mockAi ? t('report.aiDescMock') : t('report.aiDescReal')}
                  {!form.mockAi && (
                    <>
                      {' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="font-semibold text-indigo-700 underline underline-offset-2"
                      >
                        {t('report.aiPrivacyLink')}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={form.runAi}
              disabled={form.analyzing}
              className="btn shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {form.analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {t('report.analyse')}
            </button>
          </div>

          {!form.mockAi && form.media.some((m) => m.type === 'image') && (
            <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={form.aiIncludePhoto}
                onChange={(e) => form.setAiIncludePhoto(e.target.checked)}
              />
              {t('report.aiIncludePhoto')}
            </label>
          )}

          {form.aiSuggestion &&
            (form.aiSuggestion.flagged ||
            !form.aiSuggestion.category ||
            form.aiSuggestion.confidence < 0.4 ? (
              // The photo/description doesn't clearly show a civic issue —
              // don't present a confident-looking (and likely wrong) guess.
              <div className="mt-3 animate-fade-in rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t('report.notCivicTitle')}
                </p>
                <p className="mt-1 text-xs text-amber-700">{t('report.notCivicBody')}</p>
                {form.aiSuggestion.category && (
                  <button
                    type="button"
                    onClick={form.applyAi}
                    className="mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                  >
                    {t('report.useAnyway')} ({tCategory(form.aiSuggestion.category)},{' '}
                    {t('report.percentConfident', {
                      pct: Math.round(form.aiSuggestion.confidence * 100),
                    })}
                    )
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-3 animate-fade-in rounded-lg border border-indigo-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-ink-900">
                    {tCategory(form.aiSuggestion.category)}
                  </span>
                  <span
                    className="chip text-[11px]"
                    style={{
                      color: SEVERITIES[form.aiSuggestion.severity].color,
                      backgroundColor:
                        SEVERITIES[form.aiSuggestion.severity].color + '18',
                    }}
                  >
                    {t(`severities.${form.aiSuggestion.severity}`)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t('report.percentConfident', {
                      pct: Math.round(form.aiSuggestion.confidence * 100),
                    })}
                  </span>
                </div>
                {form.aiSuggestion.title && (
                  <p className="mt-1.5 text-sm font-medium text-ink-800">
                    “{form.aiSuggestion.title}”
                  </p>
                )}
                {form.aiSuggestion.summary && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {form.aiSuggestion.summary}
                  </p>
                )}
                <button
                  type="button"
                  onClick={form.applyAi}
                  className="btn-outline mt-2.5 py-1.5 text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t('report.useSuggestions')}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
