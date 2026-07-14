/**
 * Tiny dependency-free SVG charts, styled to the app's design system and built
 * for accessibility (each carries role="img" + a <title> summary). Kept minimal
 * so the bundle stays lean — no charting library. Colours are passed in so they
 * stay consistent with category/severity palettes.
 */

export interface Datum {
  label: string
  value: number
  color?: string
}

/** Horizontal bar chart — good for categories/districts (many labels). */
export function BarChart({
  data,
  height = 220,
  accent = '#1f2a52',
  title,
}: {
  data: Datum[]
  height?: number
  accent?: string
  title?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const barH = 22
  const gap = 10
  const total = data.length * (barH + gap)
  return (
    <svg
      viewBox={`0 0 320 ${Math.max(height, total)}`}
      className="w-full"
      role="img"
      aria-label={title || 'Bar chart'}
    >
      {title && <title>{title}</title>}
      {data.map((d, i) => {
        const y = i * (barH + gap)
        const w = (d.value / max) * 210
        return (
          <g key={d.label} transform={`translate(0 ${y})`}>
            <text x="0" y={barH / 2 + 4} className="fill-slate-600" fontSize="11">
              {d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label}
            </text>
            <rect
              x="100"
              y="2"
              width="210"
              height={barH - 4}
              rx="4"
              className="fill-slate-100"
            />
            <rect
              x="100"
              y="2"
              width={Math.max(2, w)}
              height={barH - 4}
              rx="4"
              fill={d.color || accent}
            />
            <text
              x={100 + Math.max(2, w) + 6}
              y={barH / 2 + 4}
              className="fill-slate-500"
              fontSize="11"
              fontWeight="600"
            >
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Area/line trend chart for time series. */
export function TrendChart({
  data,
  height = 120,
  accent = '#0f8a4f',
  title,
}: {
  data: { label: string; count: number }[]
  height?: number
  accent?: string
  title?: string
}) {
  const w = 320
  const h = height
  const pad = 6
  const max = Math.max(1, ...data.map((d) => d.count))
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const pts = data.map((d, i) => {
    const x = pad + i * step
    const y = h - pad - (d.count / max) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const area = `${line} L${pts[pts.length - 1]?.[0] ?? pad},${h - pad} L${pts[0]?.[0] ?? pad},${h - pad} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label={title || 'Trend chart'}
    >
      {title && <title>{title}</title>}
      <path d={area} fill={accent} opacity="0.12" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill={accent} />
      ))}
    </svg>
  )
}

/** Donut chart for a small number of segments (e.g. severity split). */
export function Donut({
  data,
  size = 160,
  title,
}: {
  data: Datum[]
  size?: number
  title?: string
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  const r = size / 2
  const stroke = 22
  const radius = r - stroke / 2
  const circ = 2 * Math.PI * radius
  let offset = 0
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={title || 'Donut chart'}
    >
      {title && <title>{title}</title>}
      <g transform={`translate(${r} ${r}) rotate(-90)`}>
        <circle r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {data.map((d) => {
          const frac = d.value / total
          const len = frac * circ
          const seg = (
            <circle
              key={d.label}
              r={radius}
              fill="none"
              stroke={d.color || '#1f2a52'}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return seg
        })}
      </g>
      <text
        x={r}
        y={r - 2}
        textAnchor="middle"
        className="fill-ink-900"
        fontSize="22"
        fontWeight="800"
      >
        {total}
      </text>
      <text x={r} y={r + 16} textAnchor="middle" className="fill-slate-500" fontSize="10">
        total
      </text>
    </svg>
  )
}

/** Simple legend row for a set of coloured data. */
export function Legend({ data }: { data: Datum[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {data.map((d) => (
        <li key={d.label} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: d.color || '#1f2a52' }}
          />
          {d.label} <span className="font-semibold text-slate-500">{d.value}</span>
        </li>
      ))}
    </ul>
  )
}
