import { defaultDepartments, deriveIssueStatus } from '../data/categories'
import type {
  DepartmentId,
  DeptStatus,
  IssueStatus,
} from '../data/categories'
import type {
  DepartmentStatus,
  Issue,
  IssueUpdate,
  MediaItem,
} from '../data/types'
import { getSupabase, EVIDENCE_BUCKET } from '../lib/supabase'
import type { IssuesBackend } from './types'

/**
 * Supabase-backed implementation of IssuesBackend. Row shapes are mapped to the
 * app's `Issue` type here so the rest of the app is storage-agnostic.
 *
 * Expected tables (see supabase/schema.sql): issues, issue_updates, issue_media,
 * profiles. Department isolation is enforced by RLS on the server, so reads here
 * simply return whatever the authenticated user is allowed to see.
 */

interface IssueRow {
  id: string
  ref_id: string
  title: string
  category: string
  description: string
  severity: Issue['severity']
  status: IssueStatus
  lat: number
  lng: number
  address: string
  city: string | null
  state: string | null
  district: string | null
  reporter_id: string | null
  reporter_name: string
  reporter_phone: string | null
  anonymous: boolean
  routed_departments: string[]
  upvotes: number
  created_at: string
  updated_at: string
  ai_meta: Record<string, unknown> | null
  moderation_status: Issue['moderationStatus']
  flagged: boolean | null
  duplicate_of: string | null
  issue_media?: { id: string; type: string; url: string; label: string | null }[]
  issue_updates?: {
    id: string
    status: IssueStatus
    note: string
    by_name: string
    created_at: string
  }[]
  issue_department_status?: {
    department: string
    status: DeptStatus
    updated_by: string | null
    updated_at: string
  }[]
}

const SELECT =
  '*, issue_media(id,type,url,label), issue_updates(id,status,note,by_name,created_at), issue_department_status(department,status,updated_by,updated_at)'

function mapRow(row: IssueRow): Issue {
  const media: MediaItem[] = (row.issue_media ?? []).map((m) => ({
    id: m.id,
    type: m.type === 'video' ? 'video' : 'image',
    url: m.url,
    label: m.label ?? undefined,
  }))
  const updates: IssueUpdate[] = (row.issue_updates ?? [])
    .map((u) => ({
      id: u.id,
      status: u.status,
      note: u.note,
      by: u.by_name,
      at: u.created_at,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  const departmentStatus: DepartmentStatus[] = (
    row.issue_department_status ?? []
  ).map((d) => ({
    department: d.department as DepartmentId,
    status: d.status,
    updatedBy: d.updated_by ?? undefined,
    at: d.updated_at,
  }))

  return {
    id: row.id,
    refId: row.ref_id,
    title: row.title,
    category: row.category as Issue['category'],
    description: row.description,
    severity: row.severity,
    status: row.status,
    location: {
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      district: row.district ?? undefined,
    },
    media,
    reporterId: row.reporter_id ?? undefined,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone ?? undefined,
    anonymous: row.anonymous,
    routedDepartments: row.routed_departments as DepartmentId[],
    departmentStatus,
    upvotes: row.upvotes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updates,
    moderationStatus: row.moderation_status ?? 'active',
    flagged: row.flagged ?? false,
    duplicateOf: row.duplicate_of ?? undefined,
  }
}

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Supabase is not configured')
  return client
}

/** True for values that are already displayable and must NOT be signed. */
function isDisplayableUrl(url: string): boolean {
  return (
    url.startsWith('gradient:') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  )
}

/**
 * Uploads any data-URL media to the PRIVATE evidence bucket and returns rows.
 * We store the storage *path* (not a public URL) — reads are served later via
 * short-lived signed URLs, so evidence is never world-readable.
 */
async function uploadMedia(
  issueId: string,
  media: MediaItem[]
): Promise<{ type: string; url: string; label: string | null }[]> {
  const client = sb()
  const out: { type: string; url: string; label: string | null }[] = []
  for (const m of media) {
    if (!m.url.startsWith('data:')) {
      // A seed gradient or an existing remote URL — store as-is (pass-through).
      out.push({ type: m.type, url: m.url, label: m.label ?? null })
      continue
    }
    const blob = await (await fetch(m.url)).blob()
    const ext = blob.type.split('/')[1]?.split(';')[0] || 'bin'
    const path = `${issueId}/${m.id}.${ext}`
    const { error } = await client.storage
      .from(EVIDENCE_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true })
    if (error) {
      // Non-fatal: skip this file rather than failing the whole report.
      continue
    }
    // Store the path; it will be signed on read.
    out.push({ type: m.type, url: path, label: m.label ?? null })
  }
  return out
}

/**
 * Replace stored storage paths with short-lived signed URLs so private evidence
 * renders in the browser without being publicly accessible. Pass-through values
 * (gradient/http/data) are left untouched.
 */
async function signMedia(issues: Issue[]): Promise<Issue[]> {
  const client = sb()
  const toSign = new Set<string>()
  for (const iss of issues)
    for (const m of iss.media)
      if (m.url && !isDisplayableUrl(m.url)) toSign.add(m.url)
  if (toSign.size === 0) return issues

  const signed = new Map<string, string>()
  await Promise.all(
    [...toSign].map(async (path) => {
      const { data } = await client.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(path, 60 * 60) // 1 hour
      if (data?.signedUrl) signed.set(path, data.signedUrl)
    })
  )
  return issues.map((iss) => ({
    ...iss,
    media: iss.media.map((m) =>
      signed.has(m.url) ? { ...m, url: signed.get(m.url)! } : m
    ),
  }))
}

function refId(): string {
  return 'JV-' + Math.floor(1000 + Math.random() * 9000)
}

export const supabaseApi: IssuesBackend = {
  async getIssues() {
    const { data, error } = await sb()
      .from('issues')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error) throw error
    return signMedia((data as IssueRow[]).map(mapRow))
  },

  async getIssue(id) {
    const { data, error } = await sb()
      .from('issues')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return undefined
    return (await signMedia([mapRow(data as IssueRow)]))[0]
  },

  async getIssuesForDepartment(dept) {
    // RLS already restricts to this department; the filter is belt-and-braces.
    const { data, error } = await sb()
      .from('issues')
      .select(SELECT)
      .contains('routed_departments', [dept])
      .order('created_at', { ascending: false })
    if (error) throw error
    return signMedia((data as IssueRow[]).map(mapRow))
  },

  async createIssue(input) {
    const client = sb()
    const routed =
      input.routedDepartments && input.routedDepartments.length
        ? input.routedDepartments
        : defaultDepartments(input.category)
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data: inserted, error } = await client
      .from('issues')
      .insert({
        ref_id: refId(),
        title: input.title,
        category: input.category,
        description: input.description,
        severity: input.severity,
        status: 'reported',
        lat: input.location.lat,
        lng: input.location.lng,
        address: input.location.address,
        city: input.location.city ?? null,
        state: input.location.state ?? null,
        district: input.location.district ?? input.location.city ?? null,
        reporter_name: input.anonymous ? 'Anonymous' : input.reporterName,
        reporter_phone: input.anonymous ? null : input.reporterPhone ?? null,
        anonymous: input.anonymous,
        routed_departments: routed,
        ai_meta: input.aiMeta ?? null,
        reporter_id: user?.id ?? null,
      })
      .select('id, ref_id, created_at')
      .single()
    if (error) throw error

    const issueId = inserted.id as string

    // Media
    if (input.media.length) {
      const rows = await uploadMedia(issueId, input.media)
      if (rows.length) {
        await client
          .from('issue_media')
          .insert(rows.map((r) => ({ issue_id: issueId, ...r })))
      }
    }

    // Per-department status rows (each routed dept starts "notified")
    await client.from('issue_department_status').insert(
      routed.map((department) => ({
        issue_id: issueId,
        department,
        status: 'notified',
      }))
    )

    // First timeline entry
    await client.from('issue_updates').insert({
      issue_id: issueId,
      status: 'reported',
      note: 'Issue reported and routed to the concerned department(s).',
      by_name: 'JanVyuha System',
    })

    const full = await this.getIssue(issueId)
    if (!full) throw new Error('Failed to load created issue')
    return full
  },

  async updateDeptStatus(id, department, status, note, by) {
    const client = sb()
    const now = new Date().toISOString()
    // Upsert this department's row.
    await client
      .from('issue_department_status')
      .upsert(
        { issue_id: id, department, status, updated_by: by, updated_at: now },
        { onConflict: 'issue_id,department' }
      )

    // Recompute the overall status from all department rows.
    const { data: rows } = await client
      .from('issue_department_status')
      .select('status')
      .eq('issue_id', id)
    const overall = deriveIssueStatus(
      (rows as { status: DeptStatus }[] | null) ?? []
    )

    await client
      .from('issues')
      .update({ status: overall, updated_at: now })
      .eq('id', id)

    await client.from('issue_updates').insert({
      issue_id: id,
      status: overall,
      note: note || `Department update: ${status.replace('_', ' ')}.`,
      by_name: by,
    })
    return this.getIssue(id)
  },

  async updateStatus(id, status, note, by) {
    const client = sb()
    const { error: upErr } = await client
      .from('issues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (upErr) throw upErr

    await client.from('issue_updates').insert({
      issue_id: id,
      status,
      note: note || `Status updated to ${status.replace('_', ' ')}.`,
      by_name: by,
    })
    return this.getIssue(id)
  },

  async upvote(id) {
    const client = sb()
    // Deduped, atomic vote (one per user) via RPC.
    await client.rpc('cast_vote', { p_issue: id })
    return this.getIssue(id)
  },

  async report(id, reason) {
    // A citizen may only insert a report row (RLS). The admin moderation queue
    // reads issue_reports; an admin then decides whether to hold/reject.
    await sb().from('issue_reports').insert({ issue_id: id, reason })
  },

  async deleteIssue(id) {
    // RLS allows only the reporter (or an admin) to delete; children cascade.
    const { error } = await sb().from('issues').delete().eq('id', id)
    if (error) throw error
  },

  async rate(id, stars, comment) {
    const client = sb()
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) throw new Error('Sign in to rate')
    const { error } = await client.from('issue_ratings').upsert(
      { issue_id: id, user_id: user.id, stars, comment: comment || null },
      { onConflict: 'issue_id,user_id' }
    )
    if (error) throw error
  },
}
