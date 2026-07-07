import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/Header'
import { RoleGuard } from './components/RoleGuard'
import { Landing } from './pages/Landing'
import { LoginChoose } from './pages/LoginChoose'
import { PublicLogin } from './pages/PublicLogin'
import { StakeholderLogin } from './pages/StakeholderLogin'
import { ReportIssue } from './pages/ReportIssue'
import { MyIssues } from './pages/MyIssues'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { Analytics } from './pages/Analytics'
import { Transparency } from './pages/Transparency'
import {
  Privacy,
  Terms,
  AccessibilityPage,
  About,
  Help,
  Contact,
  NotFound,
} from './pages/info'
import { IssueDetail } from './pages/IssueDetail'
import { Footer } from './components/Footer'
import { TesterPanel } from './components/TesterPanel'
import { useAuth } from './store/auth'
import { useIssues } from './store/issues'

export default function App() {
  const location = useLocation()
  const { t } = useTranslation()
  // The dashboard manages its own full-height layout; other pages get the footer.
  const isDashboard =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin')

  const initAuth = useAuth((s) => s.init)
  const startRealtime = useIssues((s) => s.startRealtime)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Live updates from the backend (no-op on the mock backend).
  useEffect(() => {
    const stop = startRealtime()
    return stop
  }, [startRealtime])

  // Scroll to a hash target (e.g. "/#how") after navigation — SPA-friendly.
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash, location.pathname])

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginChoose />} />
          <Route path="/login/public" element={<PublicLogin />} />
          <Route path="/login/stakeholder" element={<StakeholderLogin />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/issue/:id" element={<IssueDetail />} />
          <Route
            path="/my-issues"
            element={
              <RoleGuard role="public">
                <MyIssues />
              </RoleGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleGuard role="stakeholder">
                <Dashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleGuard role="admin">
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/analytics"
            element={
              <RoleGuard role={['admin', 'stakeholder']}>
                <Analytics />
              </RoleGuard>
            }
          />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4200,
          style: {
            borderRadius: '12px',
            background: '#1f2a52',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />
      <TesterPanel />
    </div>
  )
}
