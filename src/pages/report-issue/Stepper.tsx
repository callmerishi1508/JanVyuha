import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { STEP_KEYS } from './useReportForm'

export function Stepper({ step }: { step: number }) {
  const { t } = useTranslation()
  return (
    <ol className="mb-8 flex items-center">
      {STEP_KEYS.map((key, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors',
                  done && 'bg-ashoka-500 text-white',
                  active && 'bg-ink-800 text-white ring-4 ring-ink-800/15',
                  !done && !active && 'bg-slate-200 text-slate-500'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-sm font-semibold sm:block',
                  active ? 'text-ink-900' : 'text-slate-500'
                )}
              >
                {t(`report.${key}`)}
              </span>
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div
                className={cn(
                  'mx-3 h-0.5 flex-1 rounded',
                  i < step ? 'bg-ashoka-500' : 'bg-slate-200'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
