import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_BACKEND, hasSupabase, type BackendKind } from '../lib/config'

/**
 * Tester Mode state. Lets you (the developer) exercise every flow before wiring
 * real keys: force a backend, simulate AI responses, and toggle the panel.
 * Persisted so a page reload keeps your test setup.
 */
interface TestModeState {
  /** Backend override chosen in the tester panel. */
  backend: BackendKind
  /** When true, AI assist returns a canned suggestion instead of calling the API. */
  mockAi: boolean
  /** Whether the floating panel is expanded. */
  panelOpen: boolean
  setBackend: (b: BackendKind) => void
  setMockAi: (v: boolean) => void
  setPanelOpen: (v: boolean) => void
}

export const useTestMode = create<TestModeState>()(
  persist(
    (set) => ({
      // If Supabase isn't configured we can't force it on — clamp to mock.
      backend: DEFAULT_BACKEND,
      mockAi: !hasSupabase ? true : false,
      panelOpen: false,
      setBackend: (backend) =>
        set({ backend: backend === 'supabase' && !hasSupabase ? 'mock' : backend }),
      setMockAi: (mockAi) => set({ mockAi }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
    }),
    { name: 'janvyuha.testmode.v1' }
  )
)

/** Non-reactive read for use inside plain modules (services). */
export function currentBackend(): BackendKind {
  return useTestMode.getState().backend
}
