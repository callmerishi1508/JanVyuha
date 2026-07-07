import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Building2, ArrowRight, ShieldCheck } from 'lucide-react'
import { Wordmark } from '../components/Brand'
import { isDemoMode } from '../lib/config'

export function LoginChoose() {
  const { t } = useTranslation()
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex justify-center">
          <Wordmark subtitle={false} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900">
          {t('loginChoose.title')}
        </h1>
        <p className="mt-2 text-slate-600">
          JanVyuha serves both citizens and government departments.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* General Public */}
        <Link
          to="/login/public"
          className="card group relative overflow-hidden p-7 transition-all hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-saffron-500/15 text-saffron-600">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink-900">
            {t('loginChoose.citizen')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {t('loginChoose.citizenDesc')}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-600">
            {t('loginChoose.citizen')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        {/* Stakeholder */}
        <Link
          to="/login/stakeholder"
          className="card group relative overflow-hidden p-7 transition-all hover:-translate-y-1 hover:shadow-lift"
        >
          <span className="absolute right-4 top-4 chip bg-ink-800/10 text-ink-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official
          </span>
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-ink-800/10 text-ink-700">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink-900">
            {t('loginChoose.stakeholder')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {t('loginChoose.stakeholderDesc')}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
            {t('loginChoose.stakeholder')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      {isDemoMode() && (
        <p className="mx-auto mt-8 max-w-md text-center text-xs text-slate-400">
          This is a demonstration environment. Authentication is simulated — no
          real credentials or OTP are required.
        </p>
      )}
    </div>
  )
}
