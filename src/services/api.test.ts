import { describe, it, expect, beforeEach } from 'vitest'
import { api } from './api'
import type { NewIssueInput } from './api'

const INPUT: NewIssueInput = {
  title: 'Streetlight out',
  category: 'electricity',
  description: 'Pole near the bus stop has been dark for a week',
  severity: 'moderate',
  location: { lat: 17.4, lng: 78.5, address: 'Bus stop, Ameerpet' },
  media: [],
  reporterName: 'A Citizen',
  anonymous: false,
}

beforeEach(() => {
  localStorage.clear()
})

describe('mock api round-trip', () => {
  it('creates an issue and reads it back with derived defaults', async () => {
    const created = await api.createIssue(INPUT)
    expect(created.status).toBe('reported')
    expect(created.routedDepartments.length).toBeGreaterThan(0)
    expect(created.departmentStatus.every((d) => d.status === 'notified')).toBe(true)

    const fetched = await api.getIssue(created.id)
    expect(fetched).toEqual(created)
  })

  it('derives overall status from per-department progress', async () => {
    const created = await api.createIssue(INPUT)
    const dept = created.routedDepartments[0]
    const updated = await api.updateDeptStatus(
      created.id,
      dept,
      'done',
      'fixed it',
      'Officer'
    )
    expect(updated!.status).toBe('resolved')
    expect(updated!.departmentStatus.find((d) => d.department === dept)!.status).toBe(
      'done'
    )
  })

  it('upvote increments and persists across loads', async () => {
    const created = await api.createIssue(INPUT)
    await api.upvote(created.id)
    await api.upvote(created.id)
    const fetched = await api.getIssue(created.id)
    expect(fetched!.upvotes).toBe(2)
  })

  it('deleteIssue removes it from both getIssue and getIssues', async () => {
    const created = await api.createIssue(INPUT)
    await api.deleteIssue(created.id)
    expect(await api.getIssue(created.id)).toBeUndefined()
    const all = await api.getIssues()
    expect(all.find((i) => i.id === created.id)).toBeUndefined()
  })

  it('report() flags an issue for moderation', async () => {
    const created = await api.createIssue(INPUT)
    await api.report(created.id, 'spam')
    const fetched = await api.getIssue(created.id)
    expect(fetched!.flagged).toBe(true)
    expect(fetched!.moderationStatus).toBe('flagged')
  })

  it('auto-routes to moderation when the AI itself flagged the report', async () => {
    const created = await api.createIssue({
      ...INPUT,
      aiMeta: { flagged: true, confidence: 0.2 },
    })
    expect(created.flagged).toBe(true)
    expect(created.moderationStatus).toBe('flagged')
  })

  it('does not flag a normal AI-assisted report', async () => {
    const created = await api.createIssue({
      ...INPUT,
      aiMeta: { flagged: false, confidence: 0.9 },
    })
    expect(created.flagged).toBe(false)
    expect(created.moderationStatus).toBe('active')
  })
})
