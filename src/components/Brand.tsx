import { cn } from '../lib/cn'

/** The JanVyuha emblem — a neutral, government-appropriate mark. */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-ink-800" />
      {/* Chakra-inspired ring — India / governance */}
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        className="stroke-saffron-500"
        strokeWidth="1.4"
        opacity="0.85"
      />
      {/* Hub-and-spoke: one report routed out to the responsible departments */}
      <g className="stroke-white" strokeWidth="2.2" strokeLinecap="round">
        <line x1="32" y1="32" x2="32" y2="16.5" />
        <line x1="32" y1="32" x2="45.42" y2="24.25" />
        <line x1="32" y1="32" x2="45.42" y2="39.75" />
        <line x1="32" y1="32" x2="32" y2="47.5" />
        <line x1="32" y1="32" x2="18.58" y2="39.75" />
        <line x1="32" y1="32" x2="18.58" y2="24.25" />
      </g>
      <g className="fill-white">
        <circle cx="32" cy="16.5" r="2.8" />
        <circle cx="45.42" cy="24.25" r="2.8" />
        <circle cx="45.42" cy="39.75" r="2.8" />
        <circle cx="32" cy="47.5" r="2.8" />
        <circle cx="18.58" cy="39.75" r="2.8" />
        <circle cx="18.58" cy="24.25" r="2.8" />
      </g>
      {/* Central locator target — the citizen report */}
      <circle cx="32" cy="32" r="6" className="fill-white" />
      <circle cx="32" cy="32" r="3.6" className="fill-saffron-500" />
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
