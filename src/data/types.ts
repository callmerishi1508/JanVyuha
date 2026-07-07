import type {
  CategoryId,
  DepartmentId,
  DeptStatus,
  IssueStatus,
  Severity,
} from './categories'

export interface DepartmentStatus {
  department: DepartmentId
  status: DeptStatus
  updatedBy?: string
  at: string
}

export interface GeoLocation {
  lat: number
  lng: number
  address: string
  city?: string
  state?: string
  /** Administrative district (for jurisdiction routing). Falls back to city. */
  district?: string
}

export interface MediaItem {
  id: string
  type: 'image' | 'video'
  /** Data URL (uploaded) or remote/gradient placeholder for seeds. */
  url: string
  label?: string
}

export interface IssueUpdate {
  id: string
  status: IssueStatus
  note: string
  by: string
  at: string
}

export interface Issue {
  id: string
  refId: string
  title: string
  category: CategoryId
  description: string
  severity: Severity
  status: IssueStatus
  location: GeoLocation
  media: MediaItem[]
  /** Auth user id of the reporter (Supabase). Absent for mock/anonymous seeds. */
  reporterId?: string
  reporterName: string
  reporterPhone?: string
  anonymous: boolean
  /** Departments this issue was routed to (core + confirmed conditional). */
  routedDepartments: DepartmentId[]
  /** Independent action state per routed department (multi-dept coordination). */
  departmentStatus: DepartmentStatus[]
  upvotes: number
  createdAt: string
  updatedAt: string
  updates: IssueUpdate[]
  /** Moderation state (admin oversight). Defaults to 'active'. */
  moderationStatus?: ModerationStatus
  /** True when AI or a citizen flagged this as spam/abuse/not-genuine. */
  flagged?: boolean
  /** When merged as a duplicate, the id of the canonical issue. */
  duplicateOf?: string
}

export type ModerationStatus =
  | 'active'
  | 'flagged'
  | 'held'
  | 'merged'
  | 'rejected'

export type Role = 'public' | 'stakeholder' | 'admin'

export interface AuthUser {
  role: Role
  /** Supabase auth user id (present on the real backend; absent for local/tester). */
  id?: string
  name: string
  /** Present only for stakeholders. */
  department?: DepartmentId
  /** Geographic scope for stakeholders/admins (district or state); undefined = all. */
  jurisdiction?: string
  phone?: string
  designation?: string
}
