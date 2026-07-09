import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  Lock,
  IdCard,
  Check,
  Mail,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { DEPARTMENT_LIST, DEPARTMENTS, type DepartmentId } from '../data/categories'
import { tDeptShort } from '../lib/i18n'
import { useAuth } from '../store/auth'
import { useTestMode } from '../store/testMode'
import { cn } from '../lib/cn'

export function StakeholderLogin() {
  const { t } = useTranslation()
  const supabase = useTestMode((s) => s.backend) === 'supabase'
  const [dept, setDept] = useState<DepartmentId | null>(null)
  const [officerId, setOfficerId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { loginStakeholder, signInPassword } = useAuth()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Demo backend (no Supabase): instant control-room access for the pilot demo.
    if (!supabase) {
      if (!dept) return toast.error(t('stakeholder.errSelectDept'))
      const d = DEPARTMENT_LIST.find((x) => x.id === dept)!
      if (!officerId.trim() || !password.trim())
        return toast.error(t('stakeholder.errOfficerCreds'))
      loginStakeholder(dept, officerId.trim(), t('stakeholder.dutyOfficer', { dept: d.short }))
      toast.success(t('stakeholder.signedInControl', { dept: d.short }))
      return navigate('/dashboard')
    }

    // Real Supabase auth. Department accounts are provisioned by an administrator
    // (no self-registration) — the role and department come from the profile.
    if (!email || !password)
      return toast.error(t('stakeholder.errOfficialCreds'))
    setBusy(true)
    try {
      const r = await signInPassword(email, password)
      if (r.error) return toast.error(r.error)
      const u = useAuth.getState().user
      if (u?.role === 'admin') {
        toast.success(t('stakeholder.signedInAdmin'))
        navigate('/admin')
      } else if (u?.role === 'stakeholder') {
        toast.success(
          u.department
            ? t('stakeholder.signedInControl', { dept: DEPARTMENTS[u.department].short })
            : t('stakeholder.signedIn')
        )
        navigate('/dashboard')
      } else {
        toast.error(t('stakeholder.notAuthorised'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Link>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-800/10 text-ink-700">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900">
            {t('stakeholder.portalTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('stakeholder.portalSubtitle')}
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 sm:p-8">
          {/* Demo backend: pick a department for instant control-room access. */}
          {!supabase && (
            <>
              <label className="label">{t('stakeholder.selectDept')}</label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DEPARTMENT_LIST.map((d) => {
                  const Icon = d.icon
                  const active = dept === d.id
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDept(d.id)}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                        active
                          ? 'border-ink-500 bg-ink-50 ring-2 ring-ink-500/30'
                          : 'border-slate-200 hover:border-ink-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: d.color + '1a', color: d.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-ink-900">
                          {tDeptShort(d.id)}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {t('stakeholder.helplinePrefix')} {d.helpline}
                        </div>
                      </div>
                      {active && (
                        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-ink-800 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className={cn('grid gap-4 sm:grid-cols-2', !supabase && 'mt-6')}>
            {supabase ? (
              <div className="sm:col-span-2">
                <label htmlFor="dept-email" className="label">
                  {t('stakeholder.officialEmail')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="dept-email"
                    type="email"
                    className="input pl-9"
                    placeholder={t('stakeholder.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="officer-id" className="label">
                  {t('stakeholder.officerId')}
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="officer-id"
                    className="input pl-9"
                    placeholder={t('stakeholder.officerIdPlaceholder')}
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className={supabase ? 'sm:col-span-2' : ''}>
              <label htmlFor="dept-pass" className="label">
                {t('stakeholder.password')}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="dept-pass"
                  type="password"
                  className="input pl-9"
                  placeholder={supabase ? t('stakeholder.passwordReal') : t('stakeholder.passwordDemo')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary mt-6 w-full py-3"
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {supabase ? t('stakeholder.signInSecure') : t('stakeholder.signInDashboard')}
          </button>

          {supabase ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-semibold text-ink-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('stakeholder.authorisedOnly')}
              </p>
              <p className="mt-1">
                <Trans i18nKey="stakeholder.provisionNote">
                  Department and administrator accounts are provisioned by the
                  nodal officer — there is no public self-registration. If you are a
                  department that needs access, contact your administrator or the
                  JanVyuha team via the{' '}
                  <Link to="/contact" className="font-semibold text-ink-700 underline">
                    contact page
                  </Link>
                  .
                </Trans>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-slate-500">
              {t('stakeholder.demoNote')}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
