import { describe, it, expect } from 'vitest'
import { haversineMeters, findNearby } from './dedupe'
import type { Issue } from '../data/types'

function issueAt(id: string, lat: number, lng: number, over: Partial<Issue> = {}): Issue {
  return {
    id,
    refId: 'JV-' + id,
    title: 'issue ' + id,
    category: 'fire',
    description: '',
    severity: 'high',
    status: 'reported',
    location: { lat, lng, address: '' },
    media: [],
    reporterName: 'A',
    anonymous: false,
    routedDepartments: ['fire'],
    departmentStatus: [],
    upvotes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updates: [],
    ...over,
  }
}

describe('haversineMeters', () => {
  it('is ~0 for the same point', () => {
    expect(haversineMeters(12.97, 77.59, 12.97, 77.59)).toBeLessThan(1)
  })
  it('roughly measures a short distance', () => {
    // ~111 m per 0.001° latitude near the equator/India.
    const d = haversineMeters(12.97, 77.59, 12.971, 77.59)
    expect(d).toBeGreaterThan(90)
    expect(d).toBeLessThan(130)
  })
})

describe('findNearby', () => {
  const base = { lat: 12.97, lng: 77.59, category: 'fire' as const }

  it('finds same-category issues within the radius, nearest first', () => {
    const issues = [
      issueAt('self', 12.97, 77.59),
      issueAt('close', 12.9701, 77.59), // ~11 m
      issueAt('mid', 12.971, 77.59), // ~111 m
      issueAt('far', 12.99, 77.61), // > 2 km
    ]
    const near = findNearby(base, issues, { excludeId: 'self', meters: 200 })
    expect(near.map((n) => n.issue.id)).toEqual(['close', 'mid'])
  })

  it('excludes different categories', () => {
    const issues = [issueAt('other', 12.9701, 77.59, { category: 'water' })]
    expect(findNearby(base, issues, { meters: 200 })).toHaveLength(0)
  })

  it('excludes resolved issues', () => {
    const issues = [issueAt('done', 12.9701, 77.59, { status: 'resolved' })]
    expect(findNearby(base, issues, { meters: 200 })).toHaveLength(0)
  })
})
