import { describe, it, expect } from 'vitest'
import { mapRow, type IssueRow } from './supabaseApi'

function makeRow(over: Partial<IssueRow> = {}): IssueRow {
  return {
    id: 'r1',
    ref_id: 'JV-0001',
    title: 'Pothole on MG Road',
    category: 'road_damage',
    description: 'Large pothole near the junction',
    severity: 'high',
    status: 'reported',
    lat: 17.385,
    lng: 78.4867,
    address: 'MG Road',
    city: 'Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad',
    reporter_id: null,
    reporter_name: 'A Citizen',
    reporter_phone: null,
    anonymous: false,
    routed_departments: ['municipal'],
    upvotes: 0,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ai_meta: null,
    moderation_status: 'active',
    flagged: null,
    duplicate_of: null,
    ...over,
  }
}

describe('mapRow', () => {
  it('maps nullable DB columns to undefined domain fields', () => {
    const issue = mapRow(makeRow())
    expect(issue.reporterId).toBeUndefined()
    expect(issue.reporterPhone).toBeUndefined()
    expect(issue.duplicateOf).toBeUndefined()
    expect(issue.flagged).toBe(false)
    expect(issue.moderationStatus).toBe('active')
  })

  it('defaults missing relational arrays to empty', () => {
    const issue = mapRow(makeRow())
    expect(issue.media).toEqual([])
    expect(issue.updates).toEqual([])
    expect(issue.departmentStatus).toEqual([])
    expect(issue.rating).toBeUndefined()
  })

  it('maps and sorts nested relations by time', () => {
    const issue = mapRow(
      makeRow({
        issue_media: [{ id: 'm1', type: 'video', url: 'https://x/v.mp4', label: null }],
        issue_updates: [
          {
            id: 'u2',
            status: 'in_progress',
            note: 'later',
            by_name: 'Officer',
            created_at: '2026-07-02T00:00:00.000Z',
          },
          {
            id: 'u1',
            status: 'reported',
            note: 'first',
            by_name: 'System',
            created_at: '2026-07-01T00:00:00.000Z',
          },
        ],
        issue_department_status: [
          {
            department: 'municipal',
            status: 'responding',
            updated_by: 'Officer',
            updated_at: '2026-07-02T00:00:00.000Z',
          },
        ],
        issue_ratings: [{ stars: 4 }],
      })
    )
    expect(issue.media).toEqual([
      { id: 'm1', type: 'video', url: 'https://x/v.mp4', label: undefined },
    ])
    expect(issue.updates.map((u) => u.id)).toEqual(['u1', 'u2'])
    expect(issue.departmentStatus[0]).toMatchObject({
      department: 'municipal',
      status: 'responding',
    })
    expect(issue.rating).toBe(4)
  })

  it('carries reporter id and phone through when present', () => {
    const issue = mapRow(
      makeRow({ reporter_id: 'auth-1', reporter_phone: '+919876543210' })
    )
    expect(issue.reporterId).toBe('auth-1')
    expect(issue.reporterPhone).toBe('+919876543210')
  })
})
