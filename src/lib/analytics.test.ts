import { describe, it, expect } from 'vitest'
import {
  slaFor,
  isResolutionBreached,
  isOpen,
  summarize,
  resolutionMs,
  toCsv,
  toPublicJson,
  byDistrict,
  dailyTrend,
  departmentPerformance,
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

describe('byDistrict', () => {
  it('groups by district, falling back to city, sorted by count desc', () => {
    const issues = [
      makeIssue({
        id: '1',
        location: { lat: 0, lng: 0, address: '', district: 'Hyderabad' },
      }),
      makeIssue({
        id: '2',
        location: { lat: 0, lng: 0, address: '', district: 'Hyderabad' },
      }),
      makeIssue({ id: '3', location: { lat: 0, lng: 0, address: '', city: 'Chennai' } }),
      makeIssue({ id: '4', location: { lat: 0, lng: 0, address: '' } }),
    ]
    expect(byDistrict(issues)).toEqual([
      { district: 'Hyderabad', count: 2 },
      { district: 'Chennai', count: 1 },
      { district: 'Unknown', count: 1 },
    ])
  })
})

describe('dailyTrend', () => {
  it('buckets issues by calendar day for the requested window', () => {
    const now = Date.now()
    const today = new Date(now)
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today.getTime() - 24 * HOUR)
    const issues = [
      makeIssue({ id: '1', createdAt: today.toISOString() }),
      makeIssue({ id: '2', createdAt: today.toISOString() }),
      makeIssue({ id: '3', createdAt: yesterday.toISOString() }),
    ]
    const trend = dailyTrend(issues, 3, now)
    expect(trend).toHaveLength(3)
    expect(trend[trend.length - 1].count).toBe(2)
    expect(trend[trend.length - 2].count).toBe(1)
  })
})

describe('departmentPerformance', () => {
  it('only includes departments with routed issues, with correct aggregates', () => {
    const issues = [
      makeIssue({ id: '1', routedDepartments: ['fire'], status: 'resolved' }),
      makeIssue({ id: '2', routedDepartments: ['fire'], status: 'reported' }),
      makeIssue({ id: '3', routedDepartments: ['water'], status: 'reported' }),
    ]
    const perf = departmentPerformance(issues)
    const fire = perf.find((p) => p.id === 'fire')!
    const water = perf.find((p) => p.id === 'water')!
    expect(fire.total).toBe(2)
    expect(fire.resolved).toBe(1)
    expect(water.total).toBe(1)
    expect(perf.find((p) => p.id === 'police')).toBeUndefined()
  })
})

describe('toCsv', () => {
  it('produces a header row plus one quoted row per issue', () => {
    const issue = makeIssue({
      refId: 'JV-0042',
      title: 'Water leak, "urgent"',
      location: {
        lat: 0,
        lng: 0,
        address: '',
        district: 'Hyderabad',
        state: 'Telangana',
      },
    })
    const csv = toCsv([issue])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(
      'ref_id,title,category,severity,status,district,state,departments,upvotes,created_at,updated_at,resolution'
    )
    // Embedded double quotes are escaped by doubling, per CSV convention.
    expect(lines[1]).toContain('"Water leak, ""urgent"""')
    expect(lines[1]).toContain('"JV-0042"')
    expect(lines[1]).toContain('"Hyderabad"')
  })

  it('leaves resolution blank for unresolved issues', () => {
    const csv = toCsv([makeIssue({ status: 'reported' })])
    const cols = csv.split('\n')[1].split(',')
    expect(cols[cols.length - 1]).toBe('""')
  })
})

describe('toPublicJson', () => {
  it('projects an explicit allow-list — never reporter identity or address', () => {
    const issue = makeIssue({
      reporterName: 'Asha Rao',
      reporterPhone: '+919876543210',
      reporterId: 'user-uuid-1',
      description: 'My house is at 12 MG Road',
      location: {
        lat: 17.4,
        lng: 78.5,
        address: '12 MG Road, flat 3B',
        district: 'Hyderabad',
        state: 'Telangana',
      },
    } as Partial<Issue>)
    const parsed = JSON.parse(toPublicJson([issue]))
    expect(parsed).toHaveLength(1)
    const row = parsed[0]
    expect(row.refId).toBe('JV-0001')
    expect(row.district).toBe('Hyderabad')
    expect(row.departments).toEqual(['fire'])
    // The whole serialized row must not leak PII fields or their values.
    const raw = JSON.stringify(row)
    expect(raw).not.toContain('Asha')
    expect(raw).not.toContain('9876543210')
    expect(raw).not.toContain('user-uuid-1')
    expect(raw).not.toContain('MG Road')
    expect(row.reporterName).toBeUndefined()
    expect(row.address).toBeUndefined()
    expect(row.description).toBeUndefined()
  })
})
