import { defaultDepartments, deriveIssueStatus } from '../data/categories'
import type {
  CategoryId,
  DepartmentId,
  DeptStatus,
  IssueStatus,
} from '../data/categories'
import { buildSeedIssues } from '../data/seed'
import type { DepartmentStatus, Issue, MediaItem } from '../data/types'

/**
 * Data-access layer. Everything the UI needs goes through this module so a real
 * REST/GraphQL backend can replace the localStorage implementation later without
 * touching component code. All methods are async to mirror a network API.
 */

const STORAGE_KEY = 'janvyuha.issues.v1'
const LATENCY = 260 // ms — a touch of realism so loading states are visible

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))
}

function load(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Issue[]
  } catch {
    /* corrupt storage — fall through to reseed */
  }
  const seeded = buildSeedIssues()
  save(seeded)
  return seeded
}

function save(issues: Issue[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
}

function uid(prefix: string): string {
  return (
    prefix +
    '_' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  )
}

export interface NewIssueInput {
  title: string
  category: CategoryId
  description: string
  severity: Issue['severity']
  location: Issue['location']
  media: MediaItem[]
  reporterName: string
  reporterPhone?: string
  anonymous: boolean
  /** Departments the citizen confirmed in the wizard. Falls back to defaults. */
  routedDepartments?: DepartmentId[]
  /** AI triage metadata (category/severity/confidence/flagged) if AI was used. */
  aiMeta?: Record<string, unknown>
}

export const api = {
  async getIssues(): Promise<Issue[]> {
    const issues = load().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return delay(issues)
  },

  async getIssue(id: string): Promise<Issue | undefined> {
    return delay(load().find((i) => i.id === id))
  },

  /** Public transparency feed (mock): active, non-held issues, newest first. */
  async getPublicFeed(): Promise<Issue[]> {
    const issues = load()
      .filter((i) => (i.moderationStatus ?? 'active') === 'active')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    return delay(issues)
  },

  /** Issues visible to a department — filtered by category routing. */
  async getIssuesForDepartment(dept: DepartmentId): Promise<Issue[]> {
    const issues = load()
      .filter((i) => i.routedDepartments.includes(dept))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    return delay(issues)
  },

  async createIssue(input: NewIssueInput): Promise<Issue> {
    const now = new Date().toISOString()
    const routed =
      input.routedDepartments && input.routedDepartments.length
        ? input.routedDepartments
        : defaultDepartments(input.category)
    const id = uid('iss')
    const departmentStatus: DepartmentStatus[] = routed.map((department) => ({
      department,
      status: 'notified',
      at: now,
    }))
    const issue: Issue = {
      id,
      refId: 'JV-' + Math.floor(1000 + Math.random() * 9000),
      title: input.title,
      category: input.category,
      description: input.description,
      severity: input.severity,
      status: 'reported',
      location: input.location,
      media: input.media,
      reporterName: input.anonymous ? 'Anonymous' : input.reporterName,
      reporterPhone: input.reporterPhone,
      anonymous: input.anonymous,
      routedDepartments: routed,
      departmentStatus,
      upvotes: 0,
      createdAt: now,
      updatedAt: now,
      updates: [
        {
          id: uid('u'),
          status: 'reported',
          note: 'Issue reported and routed to the concerned department(s).',
          by: 'JanVyuha System',
          at: now,
        },
      ],
    }
    const issues = load()
    issues.unshift(issue)
    save(issues)
    return delay(issue)
  },

  /** Update ONE department's progress; the overall status is derived. */
  async updateDeptStatus(
    id: string,
    department: DepartmentId,
    status: DeptStatus,
    note: string,
    by: string
  ): Promise<Issue | undefined> {
    const issues = load()
    const issue = issues.find((i) => i.id === id)
    if (!issue) return delay(undefined)
    const now = new Date().toISOString()
    const entry = issue.departmentStatus.find((d) => d.department === department)
    if (entry) {
      entry.status = status
      entry.updatedBy = by
      entry.at = now
    } else {
      issue.departmentStatus.push({ department, status, updatedBy: by, at: now })
    }
    issue.status = deriveIssueStatus(issue.departmentStatus)
    issue.updatedAt = now
    issue.updates.push({
      id: uid('u'),
      status: issue.status,
      note: note || `Department update: ${status.replace('_', ' ')}.`,
      by,
      at: now,
    })
    save(issues)
    return delay(issue)
  },

  async updateStatus(
    id: string,
    status: IssueStatus,
    note: string,
    by: string
  ): Promise<Issue | undefined> {
    const issues = load()
    const issue = issues.find((i) => i.id === id)
    if (!issue) return delay(undefined)
    const now = new Date().toISOString()
    issue.status = status
    issue.updatedAt = now
    // Admin override of the headline status also settles all departments when resolved.
    if (status === 'resolved') {
      issue.departmentStatus = issue.departmentStatus.map((d) => ({
        ...d,
        status: 'done',
        updatedBy: by,
        at: now,
      }))
    }
    issue.updates.push({
      id: uid('u'),
      status,
      note:
        note ||
        `Status updated to ${status.replace('_', ' ')} by the department.`,
      by,
      at: now,
    })
    save(issues)
    return delay(issue)
  },

  async upvote(id: string): Promise<Issue | undefined> {
    const issues = load()
    const issue = issues.find((i) => i.id === id)
    if (!issue) return delay(undefined)
    issue.upvotes += 1
    save(issues)
    return delay(issue)
  },

  /** Flag an issue for moderation (demo: mark flagged locally). */
  async report(id: string, _reason: string): Promise<void> {
    const issues = load()
    const issue = issues.find((i) => i.id === id)
    if (issue) {
      issue.flagged = true
      issue.moderationStatus = issue.moderationStatus ?? 'flagged'
      save(issues)
    }
    return delay(undefined)
  },

  /** Record a citizen satisfaction rating (demo: append to the timeline). */
  async rate(id: string, stars: number, comment: string): Promise<void> {
    const issues = load()
    const issue = issues.find((i) => i.id === id)
    if (issue) {
      issue.updates.push({
        id: uid('u'),
        status: issue.status,
        note: `Citizen rated the resolution ${stars}★${comment ? ` — “${comment}”` : ''}.`,
        by: issue.reporterName,
        at: new Date().toISOString(),
      })
      save(issues)
    }
    return delay(undefined)
  },

  /** Right to erasure — remove a report from local storage. */
  async deleteIssue(id: string): Promise<void> {
    const issues = load().filter((i) => i.id !== id)
    save(issues)
    return delay(undefined)
  },

  /** Test/demo helper — wipe and reseed. */
  async reset(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
    load()
    return delay(undefined)
  },
}
