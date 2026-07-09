import type { DepartmentId, DeptStatus, IssueStatus } from '../data/categories'
import type { Issue } from '../data/types'
import type { NewIssueInput } from './api'

/**
 * The contract every backend implements. The mock (localStorage) and the
 * Supabase backend both satisfy this, so the UI never needs to know which is
 * active. Kept intentionally small — this is the seam for the whole app.
 */
export interface IssuesBackend {
  getIssues(): Promise<Issue[]>
  getIssue(id: string): Promise<Issue | undefined>
  getIssuesForDepartment(dept: DepartmentId): Promise<Issue[]>
  /**
   * Public, privacy-curated feed for the anonymous Transparency dashboard.
   * On Supabase this reads the coarsened `public_issue_feed` view (no PII,
   * ~1km location) which is granted to anon — so it works logged-out. The mock
   * backend returns its active issues.
   */
  getPublicFeed(): Promise<Issue[]>
  createIssue(input: NewIssueInput): Promise<Issue>
  updateStatus(
    id: string,
    status: IssueStatus,
    note: string,
    by: string
  ): Promise<Issue | undefined>
  updateDeptStatus(
    id: string,
    department: DepartmentId,
    status: DeptStatus,
    note: string,
    by: string
  ): Promise<Issue | undefined>
  upvote(id: string): Promise<Issue | undefined>
  /** Citizen reports an issue as spam/abuse/not-genuine → moderation queue. */
  report?(id: string, reason: string): Promise<void>
  /** Right to erasure (DPDP): delete a report the caller owns. */
  deleteIssue?(id: string): Promise<void>
  /** Post-resolution citizen satisfaction rating (1–5 + optional comment). */
  rate?(id: string, stars: number, comment: string): Promise<void>
  reset?(): Promise<void>
}

export type { NewIssueInput }
