import { useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tDeptShort } from '../lib/i18n'
import { Wordmark } from './Brand'
import { NotificationBell } from './NotificationBell'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../store/auth'
import { cn } from '../lib/cn'

interface NavDef {
  to: string
  label: string
  icon: typeof PlusCircle
}

export function Header() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile menu whenever the route changes.
  const go = (to: string) => {
    setMobileOpen(false)
    navigate(to)
  }

  const links: NavDef[] = !user
    ? [{ to: '/report', label: t('nav.report'), icon: PlusCircle }]
    : user.role === 'public'
      ? [
          { to: '/report', label: t('nav.report'), icon: PlusCircle },
          { to: '/my-issues', label: t('nav.myReports'), icon: ListChecks },
        ]
      : user.role === 'stakeholder'
        ? [
            { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
            { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
          ]
        : [
            { to: '/admin', label: t('nav.admin'), icon: ShieldCheck },
            { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
          ]

  const navItem = ({ to, label, icon: Icon }: NavDef) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
          isActive ? 'bg-ink-800 text-white' : 'text-ink-700 hover:bg-slate-100'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="tricolour h-1 w-full" />
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="shrink-0" aria-label={`${'JanVyuha'} home`}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(navItem)}
          {!user && (
            <a
              href="/#how"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-100"
            >
              {t('nav.how')}
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {!user ? (
            <>
              <Link to="/report" className="btn-accent hidden sm:inline-flex">
                <PlusCircle className="h-4 w-4" />
                {t('nav.reportCta')}
              </Link>
              <Link to="/login" className="btn-primary hidden sm:inline-flex">
                {t('nav.login')}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <div className="max-w-[140px] truncate text-sm font-semibold leading-tight text-ink-900">
                  {user.name}
                </div>
                <div className="text-xs leading-tight text-slate-600">
                  {user.role === 'stakeholder' && user.department ? (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {tDeptShort(user.department)}
                    </span>
                  ) : user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {t('nav.administrator')}
                    </span>
                  ) : (
                    t('nav.citizenAccount')
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="btn-outline hidden sm:inline-flex"
                title={t('nav.logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-ghost px-2 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
            {links.map((l) => (
              <button
                key={l.to}
                onClick={() => go(l.to)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold',
                  location.pathname === l.to
                    ? 'bg-ink-800 text-white'
                    : 'text-ink-700 hover:bg-slate-100'
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </button>
            ))}
            {!user ? (
              <>
                <a
                  href="/#how"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-700 hover:bg-slate-100"
                >
                  {t('nav.how')}
                </a>
                <button
                  onClick={() => go('/login')}
                  className="btn-primary mt-1 justify-start"
                >
                  {t('nav.login')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  logout()
                  go('/')
                }}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
