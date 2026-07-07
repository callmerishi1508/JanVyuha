import { cn } from '../lib/cn'

/** The JanVyuha emblem — a neutral, government-appropriate mark. */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-ink-800" />
      <circle
        cx="32"
        cy="32"
        r="15"
        fill="none"
        className="stroke-saffron-500"
        strokeWidth="2.5"
      />
      <g className="stroke-white" strokeWidth="1.4">
        <line x1="32" y1="17" x2="32" y2="47" />
        <line x1="17" y1="32" x2="47" y2="32" />
        <line x1="21.4" y1="21.4" x2="42.6" y2="42.6" />
        <line x1="42.6" y1="21.4" x2="21.4" y2="42.6" />
      </g>
      <circle cx="32" cy="32" r="4.2" className="fill-saffron-500" />
    </svg>
  )
}

export function Wordmark({
  className,
  subtitle = true,
}: {
  className?: string
  subtitle?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Emblem className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className="text-lg font-extrabold tracking-tight text-ink-900">
          Jan<span className="text-saffron-600">Vyuha</span>
        </div>
        {subtitle && (
          <div className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
            Citizen · Governance · Response
          </div>
        )}
      </div>
    </div>
  )
}
