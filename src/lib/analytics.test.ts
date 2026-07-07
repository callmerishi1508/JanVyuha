import { describe, it, expect } from 'vitest'
import {
  slaFor,
  isResolutionBreached,
  isOpen,
  summarize,
  resolutionMs,
} from './analytics'
import type { Issue } from '../data/types'

const HOUR = 3_600_000

function makeIssue(over: Partial<Issue> = {}): Issue {
  const now = Date.now()
  return {
    id: 'x',
    refId: 'JV-0001',
    title: 't',
    category: 'fire',
    description: '',
    severity: 'critical',
    status: 'reported',
    location: { lat: 0, lng: 0, address: '' },
    media: [],
    reporterName: 'A',
    anonymous: false,
    routedDepartments: ['fire'],
    departmentStatus: [],
    upvotes: 0,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    updates: [],
    ...over,
  }
}

describe('SLA', () => {
  it('critical has the tightest resolve target', () => {
    expect(slaFor({ severity: 'critical' }).resolveMs).toBeLessThan(
      slaFor({ severity: 'low' }).resolveMs
    )
  })

  it('flags an open critical issue past its resolve target as breached', () => {
    const old = makeIssue({
      createdAt: new Date(Date.now() - 10 * HOUR).toISOString(),
    })
    expect(isResolutionBreached(old)).toBe(true)
  })

  it('does not flag a resolved issue as breached', () => {
    const resolved = makeIssue({
      status: 'resolved',
      createdAt: new Date(Date.now() - 100 * HOUR).toISOString(),
    })
    expect(isResolutionBreached(resolved)).toBe(false)
    expect(isOpen(resolved)).toBe(false)
  })
})

describe('summarize', () => {
  it('counts open, resolved and computes resolution rate', () => {
    const issues = [
      makeIssue({ id: '1', status: 'resolved' }),
      makeIssue({ id: '2', status: 'reported' }),
      makeIssue({ id: '3', status: 'in_progress' }),
    ]
    const s = summarize(issues)
    expect(s.total).toBe(3)
    expect(s.resolved).toBe(1)
    expect(s.open).toBe(2)
    expect(s.resolutionRate).toBeCloseTo(1 / 3)
  })
})

describe('resolutionMs', () => {
  it('is null for unresolved issues', () => {
    expect(resolutionMs(makeIssue({ status: 'reported' }))).toBeNull()
  })

  it('measures from created to the resolved update', () => {
    const created = Date.now() - 5 * HOUR
    const iss = makeIssue({
      status: 'resolved',
      createdAt: new Date(created).toISOString(),
      updates: [
        {
          id: 'u',
          status: 'resolved',
          note: '',
          by: 'x',
          at: new Date(created + 2 * HOUR).toISOString(),
        },
      ],
    })
    const ms = resolutionMs(iss)!
    expect(ms).toBeGreaterThan(1.9 * HOUR)
    expect(ms).toBeLessThan(2.1 * HOUR)
  })
})
