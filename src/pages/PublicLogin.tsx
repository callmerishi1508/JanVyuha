import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users,
  Phone,
  User,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useTestMode } from '../store/testMode'

export function PublicLogin() {
  const backend = useTestMode((s) => s.backend)
  if (backend === 'supabase') return <SupabaseAuth />
  return <DemoAuth />
}

/* ------------------------------------------------------------------ */
/* Real Supabase auth — Google + Phone OTP (primary), email (fallback) */
/* ------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function SupabaseAuth() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [code, setCode] = useState('')
  const [emailMode, setEmailMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const {
    signInPassword,
    signUpPassword,
    sendMagicLink,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from
  const dest = from && from !== '/login/public' ? from : '/report'
  const validPhone = /^\d{10}$/.test(phone)

  const google = async () => {
    setBusy(true)
    const r = await signInWithGoogle(dest)
    if (r.error) {
      setBusy(false)
      toast.error(r.error)
    }
    // On success the browser redirects to Google.
  }

  const phoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (!otpSent) {
        if (!validPhone) return toast.error('Enter a valid 10-digit mobile number')
        const r = await sendPhoneOtp(phone, name)
        if (r.error) return toast.error(r.error)
        setOtpSent(true)
        return toast.success('OTP sent to your phone')
      }
      if (code.length < 4) return toast.error('Enter the OTP you received')
      const r = await verifyPhoneOtp(phone, code)
      if (r.error) return toast.error(r.error)
      toast.success(`Welcome${name ? ', ' + name.split(' ')[0] : ''}!`)
      navigate(dest)
    } finally {
      setBusy(false)
    }
  }

  const emailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Enter your email')
    setBusy(true)
    try {
      if (emailMode === 'magic') {
        const r = await sendMagicLink(email, { name, role: 'public' })
        if (r.error) return toast.error(r.error)
        return toast.success('Magic link sent — check your email inbox.')
      }
      const r =
        emailMode === 'signup'
          ? await signUpPassword(email, password, { name, role: 'public' })
          : await signInPassword(email, password)
      if (r.error) return toast.error(r.error)
      if (r.pending) return toast.success('Confirm your email, then sign in.')
      toast.success('Welcome to JanVyuha!')
      navigate(dest)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-ink-900">Citizen sign-in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Report issues and track them to resolution.
      </p>

      {/* Google */}
      <button
        onClick={google}
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {method === 'phone' ? (
        <form onSubmit={phoneSubmit} className="space-y-4">
          {!otpSent && (
            <Field icon={User} label="Full name (optional)">
              <input
                className="input pl-9"
                placeholder="e.g. Rohan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          )}
          <Field icon={Phone} label="Mobile number">
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                +91
              </span>
              <input
                className="input rounded-l-none pl-3"
                placeholder="10-digit number"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                disabled={otpSent}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
              />
            </div>
          </Field>
          {otpSent && (
            <div className="animate-fade-in">
              <label htmlFor="otp" className="label">
                Enter the OTP sent to +91 {phone}
              </label>
              <input
                id="otp"
                className="input tracking-[0.4em]"
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false)
                  setCode('')
                }}
                className="mt-1.5 text-xs font-semibold text-slate-500 hover:text-ink-800"
              >
                Change number
              </button>
            </div>
          )}
          <button type="submit" className="btn-accent w-full py-3" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {otpSent ? 'Verify & continue' : 'Send OTP'}
          </button>
          <button
            type="button"
            onClick={() => setMethod('email')}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-ink-800"
          >
            Use email instead
          </button>
        </form>
      ) : (
        <form onSubmit={emailSubmit} className="space-y-4">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {(
              [
                ['signin', 'Sign in'],
                ['signup', 'Sign up'],
                ['magic', 'Magic link'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setEmailMode(m)}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  emailMode === m ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {emailMode !== 'signin' && (
            <Field icon={User} label="Full name">
              <input
                className="input pl-9"
                placeholder="e.g. Rohan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          )}
          <Field icon={Mail} label="Email">
            <input
              type="email"
              className="input pl-9"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {emailMode !== 'magic' && (
            <Field icon={Lock} label="Password">
              <input
                type="password"
                className="input pl-9"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          <button type="submit" className="btn-accent w-full py-3" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : emailMode === 'magic' ? (
              <Sparkles className="h-4 w-4" />
            ) : null}
            {emailMode === 'signup'
              ? 'Create account'
              : emailMode === 'magic'
                ? 'Send magic link'
                : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => setMethod('phone')}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-ink-800"
          >
            Use phone number instead
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Department official?{' '}
        <Link
          to="/login/stakeholder"
          className="font-semibold text-ink-700 hover:underline"
        >
          Official portal
        </Link>
      </p>
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* Demo flow (mock backend / Tester Mode) — name + phone + OTP 1234    */
/* ------------------------------------------------------------------ */
function DemoAuth() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const loginPublic = useAuth((s) => s.loginPublic)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const validPhone = /^\d{10}$/.test(phone)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpSent) {
      if (!validPhone) return toast.error('Enter a valid 10-digit mobile number')
      setOtpSent(true)
      return toast.success('OTP sent (demo): use 1234')
    }
    if (otp !== '1234') return toast.error('Invalid OTP. For this demo, use 1234.')
    loginPublic(name, phone)
    toast.success(`Welcome${name ? ', ' + name.split(' ')[0] : ''}!`)
    navigate(from && from !== '/login/public' ? from : '/report')
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-ink-900">Citizen sign-in</h1>
      <p className="mt-1 text-sm text-slate-500">
        We use your mobile number to send status updates.
      </p>

      <button
        onClick={() => {
          loginPublic(name || 'Google User', phone)
          toast.success('Signed in (demo)')
          navigate(from && from !== '/login/public' ? from : '/report')
        }}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-ink-800 hover:bg-slate-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field icon={User} label="Full name (optional)">
          <input
            className="input pl-9"
            placeholder="e.g. Rohan Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field icon={Phone} label="Mobile number">
          <input
            className="input pl-9"
            placeholder="10-digit number"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            disabled={otpSent}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
          />
        </Field>
        {otpSent && (
          <div className="animate-fade-in">
            <label className="label">Enter OTP</label>
            <input
              className="input tracking-[0.5em]"
              placeholder="1234"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Demo OTP is <span className="font-semibold">1234</span>.
            </p>
          </div>
        )}
        <button type="submit" className="btn-accent w-full py-3">
          {otpSent ? 'Verify & continue' : 'Send OTP'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Are you a department official?{' '}
        <Link
          to="/login/stakeholder"
          className="font-semibold text-ink-700 hover:underline"
        >
          Stakeholder login
        </Link>
      </p>
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* Shared layout                                                       */
/* ------------------------------------------------------------------ */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-12 sm:py-16">
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-slate-200 shadow-card lg:grid-cols-2">
        <div className="relative hidden bg-gradient-to-br from-saffron-500 to-saffron-700 p-10 text-white lg:block">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/20">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Citizen Sign-in</h2>
          <p className="mt-3 text-white/85">
            Your voice keeps the city safe and running. Report an issue and we'll
            make sure it reaches the right people.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Reports routed to the right
              department
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Track status from report to
              resolution
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Option to report anonymously
            </li>
          </ul>
        </div>
        <div className="bg-white p-8 sm:p-10">{children}</div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {children}
      </div>
    </div>
  )
}
