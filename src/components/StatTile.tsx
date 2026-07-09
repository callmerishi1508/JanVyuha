import type { LucideIcon } from 'lucide-react'

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'ink',
  hint,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: 'ink' | 'red' | 'amber' | 'green'
  hint?: string
}) {
  const tones: Record<string, string> = {
    ink: 'text-ink-700 bg-ink-800/10',
    red: 'text-red-600 bg-red-500/10',
    amber: 'text-amber-600 bg-amber-500/10',
    green: 'text-ashoka-600 bg-ashoka-500/10',
  }
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-extrabold leading-none text-ink-900">
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
      </div>
    </div>
  )
}
