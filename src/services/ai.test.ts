import { describe, it, expect, beforeEach } from 'vitest'
import { analyzeIssue } from './ai'
import { useTestMode } from '../store/testMode'

// Force the offline mock AI for these tests (no network).
beforeEach(() => {
  useTestMode.setState({ mockAi: true })
})

async function classify(description: string) {
  const res = await analyzeIssue({ description })
  if (!res.ok) throw new Error('expected ok')
  return res.suggestion
}

describe('mock AI classification', () => {
  it('classifies the phrase "road damage" (the reported bug)', async () => {
    const s = await classify('There is road damage near the market')
    expect(s.category).toBe('road_damage')
    expect(s.confidence).toBeGreaterThan(0.5)
  })

  it('classifies "pothole" as road damage', async () => {
    const s = await classify('Huge pothole on the main road')
    expect(s.category).toBe('road_damage')
  })

  it('classifies a fire report and marks it high severity', async () => {
    const s = await classify('Fire and smoke coming from the building')
    expect(s.category).toBe('fire')
    expect(s.severity).toBe('high')
    expect(s.departments).toContain('fire')
  })

  it('picks the BEST match, not the first, when multiple could apply', async () => {
    // "water" also appears, but "road damage"/"pothole" should dominate.
    const s = await classify('Broken road with a pothole collecting water')
    expect(s.category).toBe('road_damage')
  })

  it('falls back to low confidence when nothing matches', async () => {
    const s = await classify('xyzzy something totally unrelated qwerty')
    expect(s.category).toBeNull()
    expect(s.confidence).toBeLessThan(0.4)
  })
})
