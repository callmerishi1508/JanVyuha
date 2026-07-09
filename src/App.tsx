import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Header } from './components/Header'
import { RoleGuard } from './components/RoleGuard'
// Landing is the first paint for most visitors — keep it eager. Everything else
// is code-split so the initial bundle (and low-end-phone load time) stays small.
import { Landing } from './pages/Landing'
import { Footer } from './components/Footer'
import { TesterPanel } from './components/TesterPanel'
import { useAuth } from './store/auth'
import { useIssues } from './store/issues'

const LoginChoose = lazy(() => import('./pages/LoginChoose').then((m) => ({ default: m.LoginChoose })))
const PublicLogin = lazy(() => import('./pages/PublicLogin').then((m) => ({ default: m.PublicLogin })))
const StakeholderLogin = lazy(() => import('./pages/StakeholderLogin').then((m) => ({ default: m.StakeholderLogin })))
const ReportIssue = lazy(() => import('./pages/ReportIssue').then((m) => ({ default: m.ReportIssue })))
const MyIssues = lazy(() => import('./pages/MyIssues').then((m) => ({ default: m.MyIssues })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })))
const Transparency = lazy(() => import('./pages/Transparency').then((m) => ({ default: m.Transparency })))
const IssueDetail = lazy(() => import('./pages/IssueDetail').then((m) => ({ default: m.IssueDetail })))
const Privacy = lazy(() => import('./pages/info').then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => import('./pages/info').then((m) => ({ default: m.Terms })))
const AccessibilityPage = lazy(() => import('./pages/info').then((m) => ({ default: m.AccessibilityPage })))
const About = lazy(() => import('./pages/info').then((m) => ({ default: m.About })))
const Help = lazy(() => import('./pages/info').then((m) => ({ default: m.Help })))
const Contact = lazy(() => import('./pages/info').then((m) => ({ default: m.Contact })))
const NotFound = lazy(() => import('./pages/info').then((m) => ({ default: m.NotFound })))

function RouteFallback() {
  return (
    <div className="grid place-items-center py-32 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

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
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
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
