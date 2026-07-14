import { useTranslation } from 'react-i18next'
import { Check, Sparkles } from 'lucide-react'
import { DEPARTMENTS } from '../../data/categories'
import { cn } from '../../lib/cn'
import { tCategory, tDept, tDeptShort, tReason, tQuestion } from '../../lib/i18n'
import type { ReportForm } from './useReportForm'

export function StepDepartments({ form }: { form: ReportForm }) {
  const { t } = useTranslation()
  const cat = form.cat
  if (!cat) return null
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900">{t('report.whoAlerted')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('report.whoAlertedLead')}</p>
      </div>

      {/* Core — always alerted, locked */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          {t('report.alwaysAlerted', { category: tCategory(cat.id) })}
        </div>
        <div className="space-y-2">
          {cat.core.map((d) => {
            const dep = DEPARTMENTS[d]
            const Icon = dep.icon
            return (
              <div
                key={d}
                className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3"
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ backgroundColor: dep.color + '1a', color: dep.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink-900">{tDept(dep.id)}</div>
                  <div className="text-xs text-slate-500">
                    {t('report.primaryResponder')}
                  </div>
                </div>
                <Check className="h-4 w-4 text-ashoka-600" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Conditional — user confirms */}
      {form.conditionals.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('report.includeIfRelevant')}
            {form.aiSuggestion && (
              <span className="chip bg-indigo-100 py-0 text-[10px] text-indigo-700">
                <Sparkles className="h-3 w-3" /> {t('report.aiAssisted')}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {form.conditionals.map((c) => {
              const dep = DEPARTMENTS[c.department]
              const Icon = dep.icon
              return (
                <button
                  key={c.department}
                  type="button"
                  onClick={() => form.toggleConditional(c.department)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                    c.selected
                      ? 'border-ink-400 bg-white ring-1 ring-ink-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{
                      backgroundColor: dep.color + '1a',
                      color: dep.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">
                        {tDept(dep.id)}
                      </span>
                      {c.matched ? (
                        <span className="chip bg-amber-100 py-0 text-[10px] text-amber-700">
                          {t('report.suggested')}
                        </span>
                      ) : (
                        <span className="chip bg-slate-100 py-0 text-[10px] text-slate-500">
                          {t('report.optional')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.matched
                        ? tReason(cat.id, c.department, c.reason)
                        : tQuestion(cat.id, c.department, c.question)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                      c.selected
                        ? 'border-ink-700 bg-ink-800 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {c.selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{t('report.deptTip')}</p>
        </div>
      )}

      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <span className="font-semibold text-ink-900">{form.finalDepartments.length}</span>{' '}
        <span className="text-slate-600">
          {t('report.willBeAlerted', { count: form.finalDepartments.length })}
        </span>{' '}
        <span className="text-slate-700">
          {form.finalDepartments.map((d) => tDeptShort(d)).join(', ')}
        </span>
      </div>
    </div>
  )
}
