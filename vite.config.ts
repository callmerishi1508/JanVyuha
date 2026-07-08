import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build stamp shown in the footer (makes "we ship and iterate" tangible and
// gives pilot feedback a version to reference). Vercel exposes the commit SHA
// as VERCEL_GIT_COMMIT_SHA at build time; falls back to "dev" locally.
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(commit),
  },
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, independently-cacheable vendors out of the main bundle so
        // the first paint on low-end phones (the target audience) is faster and
        // returning visitors re-download less. Grouped by change cadence.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
})
