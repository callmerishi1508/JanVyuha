import { getSupabase } from '../lib/supabase'
import { currentBackend } from '../store/testMode'
import type { DepartmentId } from '../data/categories'
import type { ModerationStatus } from '../data/types'

/**
 * Admin/oversight operations. These are Supabase-only (they touch the
 * admin-provisioning, audit and moderation surfaces enforced by RLS). On the
 * mock backend they degrade gracefully to empty results / no-ops so the Admin
 * console still renders in the zero-setup demo.
 */

export interface ProfileRow {
  id: string
  role: 'public' | 'stakeholder' | 'admin'
  name: string
  department: DepartmentId | null
  jurisdiction: string | null
  suspended: boolean
  created_at: string
}

export interface InviteRow {
  email: string
  role: 'stakeholder' | 'admin'
  department: DepartmentId | null
  jurisdiction: string | null
  created_at: string
}

export interface AuditRow {
  id: number
  actor_name: string | null
  action: string
  issue_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}

export interface ReportRow {
  id: string
  issue_id: string
  reason: string
  created_at: string
}

/** True when admin features can talk to a real backend. */
export function adminBackendReady(): boolean {
  return currentBackend() === 'supabase' && !!getSupabase()
}

function sb() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase not configured')
  return c
}

export const adminApi = {
  async listProfiles(): Promise<ProfileRow[]> {
    if (!adminBackendReady()) return []
    const { data, error } = await sb()
      .from('profiles')
      .select('id, role, name, department, jurisdiction, suspended, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as ProfileRow[]) ?? []
  },

  async listInvites(): Promise<InviteRow[]> {
    if (!adminBackendReady()) return []
    const { data, error } = await sb()
      .from('department_invites')
      .select('email, role, department, jurisdiction, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as InviteRow[]) ?? []
  },

  async invite(
    email: string,
    role: 'stakeholder' | 'admin',
    department: DepartmentId | null,
    jurisdiction: string | null
  ): Promise<void> {
    const { error } = await sb().rpc('admin_invite', {
      p_email: email,
      p_role: role,
      p_department: department,
      p_jurisdiction: jurisdiction,
    })
    if (error) throw error
  },

  async setSuspended(userId: string, suspended: boolean): Promise<void> {
    const { error } = await sb().rpc('admin_set_suspended', {
      p_user: userId,
      p_bool: suspended,
    })
    if (error) throw error
  },

  async moderate(issueId: string, status: ModerationStatus): Promise<void> {
    const { error } = await sb()
      .from('issues')
      .update({ moderation_status: status, flagged: status === 'flagged' })
      .eq('id', issueId)
    if (error) throw error
    await sb().rpc('write_audit', {
      p_action: 'moderate',
      p_issue: issueId,
      p_detail: { status },
    })
  },

  async mergeDuplicate(issueId: string, canonicalId: string): Promise<void> {
    const { error } = await sb()
      .from('issues')
      .update({ moderation_status: 'merged', duplicate_of: canonicalId })
      .eq('id', issueId)
    if (error) throw error
    await sb().rpc('write_audit', {
      p_action: 'merge',
      p_issue: issueId,
      p_detail: { canonical: canonicalId },
    })
  },

  async auditLog(limit = 100): Promise<AuditRow[]> {
    if (!adminBackendReady()) return []
    const { data, error } = await sb()
      .from('audit_log')
      .select('id, actor_name, action, issue_id, detail, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as AuditRow[]) ?? []
  },

  async reports(): Promise<ReportRow[]> {
    if (!adminBackendReady()) return []
    const { data, error } = await sb()
      .from('issue_reports')
      .select('id, issue_id, reason, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as ReportRow[]) ?? []
  },
}
