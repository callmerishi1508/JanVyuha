import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BRAND } from './config/brand'
import './lib/i18n'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Apply the active white-label brand to document chrome (title + theme colour).
document.title = `${BRAND.product} — ${BRAND.tagline}`
document
  .querySelector('meta[name="theme-color"]')
  ?.setAttribute('content', BRAND.themeColor)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

// Register the PWA service worker (production only, so dev HMR is untouched).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement — ignore failures */
    })
  })
}
