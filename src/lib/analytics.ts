import {
  CATEGORIES,
  SEVERITIES,
  DEPARTMENT_LIST,
  type Severity,
  type IssueStatus,
} from '../data/categories'
import type { Issue } from '../data/types'

/**
 * SLA definitions + reporting aggregations. Central so the department Dashboard,
 * the officials' Analytics page, and the Admin console all compute the same
 * numbers. Targets are pragmatic pilot defaults — a real deployment would set
 * these per state policy.
 */

export interface Sla {
  /** Time to first acknowledge (ms). */
  ackMs: number
  /** Time to resolve (ms). */
  resolveMs: number
}

const MIN = 60_000
const HOUR = 60 * MIN

export const SLA_BY_SEVERITY: Record<Severity, Sla> = {
  critical: { ackMs: 15 * MIN, resolveMs: 4 * HOUR },
  high: { ackMs: 1 * HOUR, resolveMs: 24 * HOUR },
  moderate: { ackMs: 4 * HOUR, resolveMs: 72 * HOUR },
  low: { ackMs: 24 * HOUR, resolveMs: 7 * 24 * HOUR },
}

export function slaFor(issue: Pick<Issue, 'severity'>): Sla {
  return SLA_BY_SEVERITY[issue.severity]
}

const OPEN_STATUSES: IssueStatus[] = ['reported', 'acknowledged', 'in_progress']

export function isOpen(issue: Pick<Issue, 'status'>): boolean {
  return OPEN_STATUSES.includes(issue.status)
}

/** Resolution time in ms for a resolved issue, else null. */
export function resolutionMs(issue: Issue): number | null {
  if (issue.status !== 'resolved') return null
  const resolved = [...issue.updates]
    .reverse()
    .find((u) => u.status === 'resolved')
  const end = resolved ? new Date(resolved.at).getTime() : new Date(issue.updatedAt).getTime()
  return Math.max(0, end - new Date(issue.createdAt).getTime())
}

/** Is an OPEN issue past its resolution SLA right now? */
export function isResolutionBreached(issue: Issue, now = Date.now()): boolean {
  if (!isOpen(issue)) return false
  return now - new Date(issue.createdAt).getTime() > slaFor(issue).resolveMs
}

/** Is an issue past its acknowledge SLA (still only "reported")? */
export function isAckBreached(issue: Issue, now = Date.now()): boolean {
  if (issue.status !== 'reported') return false
  return now - new Date(issue.createdAt).getTime() > slaFor(issue).ackMs
}

export function humanizeMs(ms: number): string {
  const mins = Math.round(ms / MIN)
  if (mins < 60) return `${mins}m`
  const hrs = ms / HOUR
  if (hrs < 24) return `${hrs.toFixed(hrs < 10 ? 1 : 0)}h`
  return `${(ms / (24 * HOUR)).toFixed(1)}d`
}

export interface Summary {
  total: number
  open: number
  critical: number
  inProgress: number
  resolved: number
  breached: number
  avgResolutionMs: number | null
  resolutionRate: number // 0..1
  /** Mean citizen satisfaction (1–5) over rated issues, or null if none rated. */
  avgRating: number | null
  /** How many resolved issues carry a citizen rating. */
  ratedCount: number
}

/** Mean of the citizen ratings present on the given issues (null if none). */
export function averageRating(issues: Issue[]): number | null {
  const ratings = issues
    .map((i) => i.rating)
    .filter((v): v is number => typeof v === 'number')
  return ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null
}

export function summarize(issues: Issue[], now = Date.now()): Summary {
  const resolvedTimes = issues
    .map(resolutionMs)
    .filter((v): v is number => v != null)
  const resolved = issues.filter((i) => i.status === 'resolved').length
  const ratedCount = issues.filter((i) => typeof i.rating === 'number').length
  return {
    total: issues.length,
    open: issues.filter(isOpen).length,
    critical: issues.filter((i) => i.severity === 'critical' && isOpen(i)).length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved,
    breached: issues.filter((i) => isResolutionBreached(i, now)).length,
    avgResolutionMs: resolvedTimes.length
      ? resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length
      : null,
    resolutionRate: issues.length ? resolved / issues.length : 0,
    avgRating: averageRating(issues),
    ratedCount,
  }
}

/** Count issues grouped by a key function. */
export function countBy<K extends string>(
  issues: Issue[],
  key: (i: Issue) => K
): Record<K, number> {
  const out = {} as Record<K, number>
  for (const i of issues) {
    const k = key(i)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export function byCategory(issues: Issue[]) {
  const counts = countBy(issues, (i) => i.category)
  return Object.entries(CATEGORIES).map(([id, c]) => ({
    id,
    label: c.name,
    color: c.color,
    count: (counts as Record<string, number>)[id] ?? 0,
  }))
}

export function bySeverity(issues: Issue[]) {
  const counts = countBy(issues, (i) => i.severity)
  return (Object.keys(SEVERITIES) as Severity[]).map((s) => ({
    id: s,
    label: SEVERITIES[s].label,
    color: SEVERITIES[s].color,
    count: counts[s] ?? 0,
  }))
}

/** Daily new-issue counts for the last `days` days (for trend charts). */
export function dailyTrend(issues: Issue[], days = 14, now = Date.now()) {
  const buckets: { date: string; count: number }[] = []
  const dayMs = 24 * HOUR
  for (let d = days - 1; d >= 0; d--) {
    const start = new Date(now - d * dayMs)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + dayMs
    const count = issues.filter((i) => {
      const t = new Date(i.createdAt).getTime()
      return t >= start.getTime() && t < end
    }).length
    buckets.push({
      date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count,
    })
  }
  return buckets
}

/** Group by administrative district (jurisdiction heatmap). */
export function byDistrict(issues: Issue[]) {
  const counts = countBy(issues, (i) => i.location.district || i.location.city || 'Unknown')
  return Object.entries(counts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
}

/** Per-department performance table (routed issues → resolution + SLA). */
export function departmentPerformance(issues: Issue[], now = Date.now()) {
  return DEPARTMENT_LIST.map((d) => {
    const mine = issues.filter((i) => i.routedDepartments.includes(d.id))
    const s = summarize(mine, now)
    return {
      id: d.id,
      label: d.short,
      color: d.color,
      total: s.total,
      open: s.open,
      resolved: s.resolved,
      breached: s.breached,
      avgResolutionMs: s.avgResolutionMs,
      resolutionRate: s.resolutionRate,
      avgRating: s.avgRating,
    }
  }).filter((r) => r.total > 0)
}

/** SLA compliance across the set: share of issues currently within SLA. */
export function slaCompliance(issues: Issue[], now = Date.now()): number {
  if (issues.length === 0) return 1
  const withinSla = issues.filter((i) => !isResolutionBreached(i, now)).length
  return withinSla / issues.length
}

/** Export issues to a CSV string (officials love a spreadsheet). */
export function toCsv(issues: Issue[]): string {
  const cols = [
    'ref_id', 'title', 'category', 'severity', 'status',
    'district', 'state', 'departments', 'upvotes',
    'created_at', 'updated_at', 'resolution',
  ]
  const rows = issues.map((i) => {
    const r = resolutionMs(i)
    return [
      i.refId,
      i.title,
      i.category,
      i.severity,
      i.status,
      i.location.district || i.location.city || '',
      i.location.state || '',
      i.routedDepartments.join('|'),
      String(i.upvotes),
      i.createdAt,
      i.updatedAt,
      r == null ? '' : humanizeMs(r),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  })
  return [cols.join(','), ...rows].join('\n')
}
