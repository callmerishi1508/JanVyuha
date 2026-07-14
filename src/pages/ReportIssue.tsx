import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { useReportForm, STEP_KEYS } from './report-issue/useReportForm'
import { Stepper } from './report-issue/Stepper'
import { StepCategory } from './report-issue/StepCategory'
import { StepDetails } from './report-issue/StepDetails'
import { StepLocation } from './report-issue/StepLocation'
import { StepDepartments } from './report-issue/StepDepartments'
import { StepReview } from './report-issue/StepReview'

export function ReportIssue() {
  const { t } = useTranslation()
  const form = useReportForm()

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          {t('report.title')}
        </h1>
        <p className="mt-1 text-slate-600">{t('report.subtitle')}</p>
      </div>

      <Stepper step={form.step} />

      <div
        ref={form.stepRef}
        tabIndex={-1}
        aria-live="polite"
        className="card p-6 sm:p-8 focus:outline-none"
      >
        {form.step === 0 && <StepCategory form={form} />}
        {form.step === 1 && form.cat && <StepDetails form={form} />}
        {form.step === 2 && <StepLocation form={form} />}
        {form.step === 3 && form.cat && <StepDepartments form={form} />}
        {form.step === 4 && form.cat && <StepReview form={form} />}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
          <button
            onClick={() => form.setStep((s) => Math.max(0, s - 1))}
            className="btn-ghost"
            disabled={form.step === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.back')}
          </button>

          {form.step < STEP_KEYS.length - 1 ? (
            <button
              onClick={form.goNext}
              className="btn-primary"
              disabled={!form.canNext}
            >
              {t('report.continue')}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={form.submit}
              className="btn-accent"
              disabled={form.submitting || !form.consent}
            >
              {form.submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('report.submitReport')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
