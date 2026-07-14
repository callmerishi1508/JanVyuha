import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate Vitest config so the jsdom environment + Testing Library setup don't
// affect the production Vite build. Enables component/store tests and coverage.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/locales/**'],
    },
  },
})
