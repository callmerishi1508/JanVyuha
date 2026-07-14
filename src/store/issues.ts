import { create } from 'zustand'
import type { DepartmentId, DeptStatus, IssueStatus } from '../data/categories'
import type { Issue } from '../data/types'
import { data as api, type NewIssueInput } from '../services'
import { getSupabase } from '../lib/supabase'
import { currentBackend } from './testMode'

interface IssuesState {
  issues: Issue[]
  loading: boolean
  loaded: boolean
  /** Set by realtime when a live change arrives, so the UI can flash it. */
  lastRealtimeAt: number | null
  refresh: () => Promise<void>
  create: (input: NewIssueInput) => Promise<Issue>
  updateStatus: (
    id: string,
    status: IssueStatus,
    note: string,
    by: string
  ) => Promise<void>
  updateDeptStatus: (
    id: string,
    department: DepartmentId,
    status: DeptStatus,
    note: string,
    by: string
  ) => Promise<void>
  upvote: (id: string) => Promise<void>
  report: (id: string, reason: string) => Promise<void>
  remove: (id: string) => Promise<void>
  rate: (id: string, stars: number, comment: string) => Promise<void>
  forDepartment: (dept: DepartmentId) => Issue[]
  byId: (id: string) => Issue | undefined
  startRealtime: () => () => void
}

export const useIssues = create<IssuesState>((set, get) => ({
  issues: [],
  loading: false,
  loaded: false,
  lastRealtimeAt: null,
  refresh: async () => {
    set({ loading: true })
    try {
      const issues = await api.getIssues()
      set({ issues, loading: false, loaded: true })
    } catch (e) {
      // Surface nothing to the UI beyond an empty list; keep app alive.
      if (import.meta.env.DEV) console.error('Failed to load issues', e)
      set({ loading: false, loaded: true })
    }
  },
  create: async (input) => {
    const issue = await api.createIssue(input)
    set({ issues: [issue, ...get().issues.filter((i) => i.id !== issue.id)] })
    return issue
  },
  updateStatus: async (id, status, note, by) => {
    const updated = await api.updateStatus(id, status, note, by)
    if (updated) {
      set({ issues: get().issues.map((i) => (i.id === id ? updated : i)) })
    }
  },
  updateDeptStatus: async (id, department, status, note, by) => {
    const updated = await api.updateDeptStatus(id, department, status, note, by)
    if (updated) {
      set({ issues: get().issues.map((i) => (i.id === id ? updated : i)) })
    }
  },
  upvote: async (id) => {
    const updated = await api.upvote(id)
    if (updated) {
      set({ issues: get().issues.map((i) => (i.id === id ? updated : i)) })
    }
  },
  report: async (id, reason) => {
    await api.report?.(id, reason)
    // Reflect the flag locally so the UI updates immediately (mock backend).
    set({
      issues: get().issues.map((i) => (i.id === id ? { ...i, flagged: true } : i)),
    })
  },
  remove: async (id) => {
    await api.deleteIssue?.(id)
    set({ issues: get().issues.filter((i) => i.id !== id) })
  },
  rate: async (id, stars, comment) => {
    await api.rate?.(id, stars, comment)
    const updated = await api.getIssue(id)
    if (updated) set({ issues: get().issues.map((i) => (i.id === id ? updated : i)) })
  },
  forDepartment: (dept) => get().issues.filter((i) => i.routedDepartments.includes(dept)),
  byId: (id) => get().issues.find((i) => i.id === id),

  /**
   * Subscribe to live issue changes when the Supabase backend is active.
   * Returns an unsubscribe function. No-op on the mock backend.
   */
  startRealtime: () => {
    if (currentBackend() !== 'supabase') return () => {}
    const client = getSupabase()
    if (!client) return () => {}

    const channel = client
      .channel('issues-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        set({ lastRealtimeAt: Date.now() })
        // Cheapest correct approach: re-pull the (RLS-scoped) list.
        get().refresh()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issue_updates' },
        () => get().refresh()
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  },
}))
