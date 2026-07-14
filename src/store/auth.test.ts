import { describe, it, expect } from 'vitest'
import { toE164, mapProfileRole } from './auth'

describe('toE164', () => {
  it('prefixes a bare 10-digit Indian mobile number with +91', () => {
    expect(toE164('9876543210')).toBe('+919876543210')
  })

  it('strips spaces/dashes before prefixing', () => {
    expect(toE164('98765 43210')).toBe('+919876543210')
    expect(toE164('987-654-3210')).toBe('+919876543210')
  })

  it('passes through an already-E.164 number unchanged', () => {
    expect(toE164('+919876543210')).toBe('+919876543210')
  })

  it('cleans stray characters out of a +-prefixed number', () => {
    expect(toE164('+91 98765 43210')).toBe('+919876543210')
  })

  it('falls back to a bare + prefix for non-10-digit input', () => {
    expect(toE164('123456')).toBe('+123456')
  })
})

describe('mapProfileRole', () => {
  it('maps admin and stakeholder through', () => {
    expect(mapProfileRole('admin')).toBe('admin')
    expect(mapProfileRole('stakeholder')).toBe('stakeholder')
  })

  it('defaults unknown, null or missing roles to public', () => {
    expect(mapProfileRole('public')).toBe('public')
    expect(mapProfileRole(null)).toBe('public')
    expect(mapProfileRole(undefined)).toBe('public')
    expect(mapProfileRole('bogus')).toBe('public')
  })
})
