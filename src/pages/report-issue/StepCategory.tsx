import { useTranslation } from 'react-i18next'
import { CATEGORY_LIST } from '../../data/categories'
import { CategoryIconTile } from '../../components/CategoryPill'
import { cn } from '../../lib/cn'
import { tCategory } from '../../lib/i18n'
import type { ReportForm } from './useReportForm'

export function StepCategory({ form }: { form: ReportForm }) {
  const { t } = useTranslation()
  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-ink-900">{t('report.whatReporting')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('report.decidesDept')}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {CATEGORY_LIST.map((c) => {
          const active = form.category === c.id
          return (
            <button
              key={c.id}
              onClick={() => form.setCategory(c.id)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                active
                  ? 'border-ink-500 bg-ink-50 ring-2 ring-ink-500/25'
                  : 'border-slate-200 hover:border-ink-300 hover:bg-slate-50'
              )}
            >
              <CategoryIconTile category={c.id} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900">{tCategory(c.id)}</span>
                  {c.emergency && (
                    <span className="chip bg-red-100 text-[10px] text-red-600">
                      {t('report.emergency')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{t(`catDesc.${c.id}`)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
