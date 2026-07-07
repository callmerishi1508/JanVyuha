import { describe, it, expect } from 'vitest'
import { normalizeSupabaseUrl } from './config'

const ROOT = 'https://vfbotszzyvefiparesbf.supabase.co'

describe('normalizeSupabaseUrl', () => {
  it('passes a clean project URL through unchanged', () => {
    expect(normalizeSupabaseUrl(ROOT)).toBe(ROOT)
  })

  it('strips an accidental /rest/v1 suffix (the Google-login bug)', () => {
    expect(normalizeSupabaseUrl(`${ROOT}/rest/v1/`)).toBe(ROOT)
    expect(normalizeSupabaseUrl(`${ROOT}/rest/v1`)).toBe(ROOT)
  })

  it('strips /auth/v1 and /storage/v1 suffixes too', () => {
    expect(normalizeSupabaseUrl(`${ROOT}/auth/v1`)).toBe(ROOT)
    expect(normalizeSupabaseUrl(`${ROOT}/storage/v1/`)).toBe(ROOT)
  })

  it('trims surrounding whitespace and trailing slashes', () => {
    expect(normalizeSupabaseUrl(`  ${ROOT}/  `)).toBe(ROOT)
    expect(normalizeSupabaseUrl(`${ROOT}///`)).toBe(ROOT)
  })

  it('handles empty and undefined without throwing', () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined()
    expect(normalizeSupabaseUrl('   ')).toBeUndefined()
  })
})
