import { api as mockApi } from './api'
import { supabaseApi } from './supabaseApi'
import { currentBackend } from '../store/testMode'
import type { IssuesBackend } from './types'

/**
 * The app's single data entrypoint. It dispatches to whichever backend is
 * active *at call time* (read from Tester Mode / config), so switching backends
 * in the tester panel takes effect immediately without a reload.
 */
function backend(): IssuesBackend {
  return currentBackend() === 'supabase' ? supabaseApi : (mockApi as IssuesBackend)
}

export const data: IssuesBackend = {
  getIssues: () => backend().getIssues(),
  getIssue: (id) => backend().getIssue(id),
  getIssuesForDepartment: (dept) => backend().getIssuesForDepartment(dept),
  createIssue: (input) => backend().createIssue(input),
  updateStatus: (id, status, note, by) =>
    backend().updateStatus(id, status, note, by),
  updateDeptStatus: (id, department, status, note, by) =>
    backend().updateDeptStatus(id, department, status, note, by),
  upvote: (id) => backend().upvote(id),
  report: (id, reason) => backend().report?.(id, reason) ?? Promise.resolve(),
  deleteIssue: (id) => backend().deleteIssue?.(id) ?? Promise.resolve(),
  rate: (id, stars, comment) =>
    backend().rate?.(id, stars, comment) ?? Promise.resolve(),
  reset: () => backend().reset?.() ?? Promise.resolve(),
}

export type { NewIssueInput } from './types'
