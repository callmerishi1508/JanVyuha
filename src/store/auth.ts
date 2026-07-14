import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DepartmentId } from '../data/categories'
import type { AuthUser } from '../data/types'
import { getSupabase } from '../lib/supabase'
import { currentBackend } from './testMode'

/**
 * Auth store that works with BOTH backends:
 *  • mock backend (and Tester Mode)  → instant local sessions, no network.
 *  • supabase backend                → real email/password + magic-link auth,
 *                                       role/department read from `profiles`.
 * The rest of the app only reads `user`, so it doesn't care which path was used.
 */

interface AuthResult {
  error?: string
  /** True when a magic link / confirmation email was sent (no session yet). */
  pending?: boolean
}

interface AuthState {
  user: AuthUser | null
  ready: boolean

  // --- local / tester sessions (instant) ---
  loginPublic: (name: string, phone?: string) => void
  loginStakeholder: (department: DepartmentId, name: string, designation: string) => void
  loginAdmin: (name: string) => void
  setLocalUser: (user: AuthUser | null) => void

  // --- real Supabase auth ---
  init: () => Promise<void>
  signInPassword: (email: string, password: string) => Promise<AuthResult>
  signUpPassword: (
    email: string,
    password: string,
    meta: { name: string; role: 'public' | 'stakeholder'; department?: DepartmentId }
  ) => Promise<AuthResult>
  sendMagicLink: (
    email: string,
    meta: { name: string; role: 'public' | 'stakeholder'; department?: DepartmentId }
  ) => Promise<AuthResult>
  /** OAuth sign-in (redirects the browser to the provider). */
  signInWithGoogle: (redirectPath?: string) => Promise<AuthResult>
  /** Send an SMS OTP to a phone number (E.164 or 10-digit Indian). */
  sendPhoneOtp: (phone: string, name?: string) => Promise<AuthResult>
  /** Verify the SMS OTP and establish the session. */
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>
  /** DPDP right to erasure: delete the account (server-side) and sign out. */
  deleteAccount: () => Promise<AuthResult>

  logout: () => void
}

/** Normalise an Indian mobile number to E.164 (+91…) for Supabase phone auth. */
export function toE164(phone: string): string {
  const p = phone.trim()
  if (p.startsWith('+')) return p.replace(/[^\d+]/g, '')
  const digits = p.replace(/\D/g, '')
  return digits.length === 10 ? `+91${digits}` : `+${digits}`
}

/** Map a raw `profiles.role` DB value to the app's role union, defaulting unknown values to 'public'. */
export function mapProfileRole(raw: string | null | undefined): AuthUser['role'] {
  return raw === 'admin' ? 'admin' : raw === 'stakeholder' ? 'stakeholder' : 'public'
}

async function hydrateFromSupabase(): Promise<AuthUser | null> {
  const client = getSupabase()
  if (!client) return null
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return null
  const { data: profile } = await client
    .from('profiles')
    .select('role, name, department, jurisdiction, phone')
    .eq('id', user.id)
    .maybeSingle()
  const role = mapProfileRole(profile?.role)
  return {
    role,
    id: user.id,
    name: profile?.name ?? user.email ?? 'User',
    department: (profile?.department ?? undefined) as DepartmentId | undefined,
    jurisdiction: profile?.jurisdiction ?? undefined,
    phone: profile?.phone ?? undefined,
    designation:
      role === 'admin'
        ? 'System Administrator'
        : profile?.department
          ? 'Duty Officer'
          : undefined,
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      ready: false,

      loginPublic: (name, phone) =>
        set({
          user: { role: 'public', name: name.trim() || 'Citizen', phone },
        }),

      loginStakeholder: (department, name, designation) =>
        set({
          user: {
            role: 'stakeholder',
            department,
            name: name.trim() || 'Officer',
            designation,
          },
        }),

      loginAdmin: (name) =>
        set({
          user: {
            role: 'admin',
            name: name.trim() || 'Administrator',
            designation: 'System Administrator',
          },
        }),

      setLocalUser: (user) => set({ user }),

      init: async () => {
        if (currentBackend() !== 'supabase') {
          set({ ready: true })
          return
        }
        const client = getSupabase()
        if (!client) {
          set({ ready: true })
          return
        }
        const user = await hydrateFromSupabase()
        set({ user: user ?? get().user, ready: true })
        // Keep the session in sync on future auth changes.
        client.auth.onAuthStateChange(async () => {
          const u = await hydrateFromSupabase()
          set({ user: u })
        })
      },

      signInPassword: async (email, password) => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { error } = await client.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        const user = await hydrateFromSupabase()
        set({ user })
        return {}
      },

      signUpPassword: async (email, password, meta) => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: meta },
        })
        if (error) return { error: error.message }
        if (!data.session) return { pending: true } // email confirmation on
        const user = await hydrateFromSupabase()
        set({ user })
        return {}
      },

      sendMagicLink: async (email, meta) => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { data: meta, emailRedirectTo: window.location.origin },
        })
        if (error) return { error: error.message }
        return { pending: true }
      },

      signInWithGoogle: async (redirectPath = '/report') => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + redirectPath },
        })
        if (error) return { error: error.message }
        // The browser is redirecting to Google; the session is picked up on return.
        return { pending: true }
      },

      sendPhoneOtp: async (phone, name) => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { error } = await client.auth.signInWithOtp({
          phone: toE164(phone),
          options: name ? { data: { name, role: 'public' } } : undefined,
        })
        if (error) return { error: error.message }
        return { pending: true }
      },

      verifyPhoneOtp: async (phone, token) => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const { error } = await client.auth.verifyOtp({
          phone: toE164(phone),
          token,
          type: 'sms',
        })
        if (error) return { error: error.message }
        const user = await hydrateFromSupabase()
        set({ user })
        return {}
      },

      deleteAccount: async () => {
        const client = getSupabase()
        if (!client) return { error: 'Backend not configured' }
        const {
          data: { session },
        } = await client.auth.getSession()
        if (!session) return { error: 'Not signed in' }
        const res = await fetch('/api/delete-account', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          return { error: body.error || 'Could not delete account' }
        }
        await client.auth.signOut()
        set({ user: null })
        return {}
      },

      logout: () => {
        const client = getSupabase()
        client?.auth.signOut()
        set({ user: null })
      },
    }),
    {
      name: 'janvyuha.auth.v1',
      // Only persist the local user (Supabase manages its own session).
      partialize: (s) => ({ user: s.user }),
    }
  )
)
