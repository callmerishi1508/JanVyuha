/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_BACKEND?: string
  readonly VITE_ENABLE_TESTER?: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Build stamp injected by Vite `define` (short commit SHA, or "dev"). */
declare const __BUILD_ID__: string
