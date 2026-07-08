import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { tDeptShort } from '../lib/i18n'
import { Wordmark } from './Brand'
import { DEPARTMENT_LIST } from '../data/categories'
import { BRAND } from '../config/brand'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="tricolour h-1 w-full" />
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-slate-500">{t('footer.blurb')}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {t('footer.citizens')}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link to="/report" className="hover:text-ink-800">
                {t('footer.report')}
              </Link>
            </li>
            <li>
              <Link to="/login/public" className="hover:text-ink-800">
                {t('footer.track')}
              </Link>
            </li>
            <li>
              <a href="/#how" className="hover:text-ink-800">
                {t('footer.how')}
              </a>
            </li>
            <li>
              <Link to="/help" className="hover:text-ink-800">
                {t('footer.help')}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-ink-800">
                {t('footer.contact')}
              </Link>
            </li>
            <li>
              <Link to="/transparency" className="hover:text-ink-800">
                Public dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {t('footer.departments')}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {DEPARTMENT_LIST.slice(0, 5).map((d) => (
              <li key={d.id}>{tDeptShort(d.id)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {t('footer.helplines')}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Police — 100</li>
            <li>Fire — 101</li>
            <li>Ambulance — 108</li>
            <li>Unified Emergency — 112</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND.product} · {BRAND.authority}.
            {!BRAND.official && ` ${t('footer.pilotNote')}`}
            <span className="ml-1 text-slate-400">· build {__BUILD_ID__}</span>
          </p>
          <p className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-ink-800">
              {t('footer.privacy')}
            </Link>
            <Link to="/accessibility" className="hover:text-ink-800">
              {t('footer.accessibility')}
            </Link>
            <Link to="/terms" className="hover:text-ink-800">
              {t('footer.terms')}
            </Link>
            <Link to="/about" className="hover:text-ink-800">
              {t('footer.about')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
