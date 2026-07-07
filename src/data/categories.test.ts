import { describe, it, expect } from 'vitest'
import {
  resolveRouting,
  deriveIssueStatus,
  defaultDepartments,
  possibleDepartments,
} from './categories'

describe('routing engine', () => {
  it('always includes core departments', () => {
    const r = resolveRouting('fire')
    expect(r.core).toContain('fire')
  })

  it('fire defaults to Fire + Ambulance (ambulance is defaultOn)', () => {
    const defaults = defaultDepartments('fire')
    expect(defaults).toContain('fire')
    expect(defaults).toContain('ambulance')
    // Never routes to unrelated departments by default.
    expect(defaults).not.toContain('police')
    expect(defaults).not.toContain('electricity')
  })

  it('matches a conditional department from description keywords', () => {
    const r = resolveRouting('fire', { text: 'sparking transformer near the wire' })
    const electricity = r.conditional.find((c) => c.department === 'electricity')
    expect(electricity?.matched).toBe(true)
    expect(electricity?.selected).toBe(true)
  })

  it('does not select an unmatched, non-default conditional', () => {
    const r = resolveRouting('fire', { text: 'small kitchen fire' })
    const animal = r.conditional.find((c) => c.department === 'animal')
    expect(animal?.selected).toBe(false)
  })

  it('honours AI-suggested departments', () => {
    const r = resolveRouting('road_accident', { aiDepartments: ['animal'] })
    const animal = r.conditional.find((c) => c.department === 'animal')
    expect(animal?.matched).toBe(true)
  })

  it('possibleDepartments = core + all conditionals, de-duplicated', () => {
    const p = possibleDepartments('tree_fall')
    expect(p).toContain('municipal') // core
    expect(p).toContain('animal') // conditional
    expect(new Set(p).size).toBe(p.length)
  })
})

describe('deriveIssueStatus (multi-department coordination)', () => {
  it('is resolved only when ALL departments are done', () => {
    expect(
      deriveIssueStatus([{ status: 'done' }, { status: 'done' }])
    ).toBe('resolved')
    expect(
      deriveIssueStatus([{ status: 'done' }, { status: 'responding' }])
    ).not.toBe('resolved')
  })

  it('surfaces in_progress if any department is responding', () => {
    expect(
      deriveIssueStatus([{ status: 'notified' }, { status: 'responding' }])
    ).toBe('in_progress')
  })

  it('acknowledged when some acknowledged but none responding', () => {
    expect(
      deriveIssueStatus([{ status: 'notified' }, { status: 'acknowledged' }])
    ).toBe('acknowledged')
  })

  it('empty list is reported', () => {
    expect(deriveIssueStatus([])).toBe('reported')
  })
})
