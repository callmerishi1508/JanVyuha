import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MapPin,
  Bell,
  ShieldCheck,
  Gauge,
  Camera,
  Users,
  Building2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORY_LIST, DEPARTMENT_LIST } from '../data/categories'
import { CategoryIconTile } from '../components/CategoryPill'
import { BRAND } from '../config/brand'
import { tCategory, tDeptShort } from '../lib/i18n'

export function Landing() {
  const { t } = useTranslation()
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #ff7d10 0, transparent 40%), radial-gradient(circle at 85% 30%, #4c67ad 0, transparent 45%)',
          }}
        />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="chip bg-white/10 text-white ring-1 ring-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-saffron-400" />
              {BRAND.authority}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              {t('hero.title1')}{' '}
              <span className="text-saffron-400">{t('hero.route')}</span>{' '}
              {t('hero.title2')}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">{t('hero.lead')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/report" className="btn-accent px-5 py-3 text-base">
                <Camera className="h-5 w-5" />
                {t('hero.report')}
              </Link>
              <Link
                to="/login/stakeholder"
                className="btn px-5 py-3 text-base bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15"
              >
                <Building2 className="h-5 w-5" />
                {t('hero.deptLogin')}
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-white/60">
              <div>
                <span className="text-xl font-bold text-white">
                  {DEPARTMENT_LIST.length}
                </span>{' '}
                {t('hero.statDepartments')}
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  {CATEGORY_LIST.length}
                </span>{' '}
                {t('hero.statCategories')}
              </div>
              <div>
                <span className="text-xl font-bold text-white">24×7</span>{' '}
                {t('hero.statResponse')}
              </div>
            </div>
          </div>

          {/* Floating category preview */}
          <div className="relative hidden lg:block">
            <div className="animate-fade-in rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/80">
                  {t('hero.previewTitle')}
                </div>
                <span className="chip bg-white/15 text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" />
                  {t('hero.example')}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {CATEGORY_LIST.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3"
                  >
                    <CategoryIconTile category={c.id} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {c.name}
                      </div>
                      <div className="truncate text-xs text-white/50">
                        → {c.core.length} core
                        {c.conditional.length > 0
                          ? ` + up to ${c.conditional.length} more`
                          : ''}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-saffron-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container-page py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Camera, title: t('value.captureT'), body: t('value.captureB') },
            { icon: MapPin, title: t('value.locationT'), body: t('value.locationB') },
            { icon: Bell, title: t('value.routingT'), body: t('value.routingB') },
            { icon: Gauge, title: t('value.trackT'), body: t('value.trackB') },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink-800/10 text-ink-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink-900">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-200 bg-white py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">
              {t('how.title')}
            </h2>
            <p className="mt-3 text-slate-600">{t('how.lead')}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', icon: Users, title: t('how.s1t'), body: t('how.s1b') },
              { step: '02', icon: Bell, title: t('how.s2t'), body: t('how.s2b') },
              { step: '03', icon: ShieldCheck, title: t('how.s3t'), body: t('how.s3b') },
            ].map((s) => (
              <div
                key={s.step}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span
                  className="pointer-events-none absolute -right-1 -top-3 select-none text-7xl font-black text-slate-100"
                  aria-hidden="true"
                >
                  {s.step}
                </span>
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-saffron-500/15 text-saffron-600">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">
              {t('cats.title')}
            </h2>
            <p className="mt-2 text-slate-600">{t('cats.lead')}</p>
          </div>
          <Link
            to="/report"
            className="hidden items-center gap-1 text-sm font-semibold text-ink-700 hover:text-saffron-600 sm:inline-flex"
          >
            {t('cats.start')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_LIST.map((c) => (
            <Link
              key={c.id}
              to="/report"
              state={{ category: c.id }}
              className="card group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <CategoryIconTile category={c.id} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink-900">{tCategory(c.id)}</h3>
                  {c.emergency && (
                    <span className="chip bg-red-100 text-[10px] text-red-600">
                      {t('cats.emergency')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Departments band */}
      <section className="bg-ink-900 py-14 text-white">
        <div className="container-page">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{t('deptsBand.title')}</h2>
            <p className="mt-2 text-white/70">{t('deptsBand.lead')}</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {DEPARTMENT_LIST.map((d) => {
              const Icon = d.icon
              return (
                <div
                  key={d.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-center"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-lg"
                    style={{ backgroundColor: d.color + '30', color: '#fff' }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold text-white/80">
                    {tDeptShort(d.id)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 to-ink-950 p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold">{t('cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{t('cta.lead')}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/report" className="btn-accent px-6 py-3 text-base">
              {t('cta.report')}
            </Link>
            <Link
              to="/login"
              className="btn px-6 py-3 text-base bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15"
            >
              {t('cta.login')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
