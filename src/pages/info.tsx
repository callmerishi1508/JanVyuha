import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import {
  ShieldCheck,
  FileText,
  Accessibility as AccessibilityIcon,
  Info,
  HelpCircle,
  Mail,
  Home,
} from 'lucide-react'
import { BRAND, CONTACT_EMAIL } from '../config/brand'

/**
 * Static compliance & information pages. Content is white-label (driven by
 * BRAND) and written to be honest for a pre-authorization pilot. The privacy
 * page is aligned to India's DPDP Act 2023 and the accessibility page to GIGW /
 * WCAG 2.1 AA. NOT legal advice — a real deployment must have counsel review.
 */

function Page({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Info
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <div className="mb-8">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-ink-800/10 text-ink-700">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      <div className="space-y-6 text-[15px] leading-relaxed text-slate-700">
        {children}
      </div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-ink-900">{children}</h2>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <H2>{title}</H2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

export function Privacy() {
  const { t } = useTranslation()
  return (
    <Page
      icon={ShieldCheck}
      title={t('info.privacyTitle')}
      subtitle={t('info.privacySubtitle', {
        product: BRAND.product,
        updated: t('info.updated'),
      })}
    >
      {!BRAND.official && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('info.privacyPilot', {
            product: BRAND.product,
            authority: BRAND.authority,
          })}
        </p>
      )}
      <Section title={t('info.privacyS1Title')}>
        <p>{t('info.privacyS1Body')}</p>
      </Section>
      <Section title={t('info.privacyS2Title')}>
        <p>{t('info.privacyS2Body')}</p>
      </Section>
      <Section title={t('info.privacyS3Title')}>
        <p>{t('info.privacyS3Body')}</p>
      </Section>
      <Section title={t('info.privacyS4Title')}>
        <p>{t('info.privacyS4Body')}</p>
      </Section>
      <Section title={t('info.privacyS5Title')}>
        <p>{t('info.privacyS5Body')}</p>
      </Section>
      <Section title={t('info.privacyS6Title')}>
        <p>{t('info.privacyS6Body')}</p>
      </Section>
      <Section title={t('info.privacyS7Title')}>
        <p>{t('info.privacyS7Intro')}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('info.privacyS7Li1')}</li>
          <li>{t('info.privacyS7Li2')}</li>
          <li>{t('info.privacyS7Li3')}</li>
          <li>{t('info.privacyS7Li4')}</li>
        </ul>
      </Section>
      <Section title={t('info.privacyS8Title')}>
        <p>{t('info.privacyS8Body')}</p>
      </Section>
      <Section title={t('info.privacyS9Title')}>
        <p>
          <Trans i18nKey="info.privacyS9Body">
            Questions or complaints about your data can be raised via our{' '}
            <Link to="/contact" className="font-semibold text-ink-700 underline">
              contact page
            </Link>
            .
          </Trans>
        </p>
      </Section>
    </Page>
  )
}

export function Terms() {
  const { t } = useTranslation()
  return (
    <Page
      icon={FileText}
      title={t('info.termsTitle')}
      subtitle={t('info.termsSubtitle', {
        product: BRAND.product,
        updated: t('info.updated'),
      })}
    >
      <Section title={t('info.termsPurposeTitle')}>
        <p>{t('info.termsPurposeBody', { product: BRAND.product })}</p>
      </Section>
      <Section title={t('info.termsAcceptableTitle')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('info.termsAcceptableLi1')}</li>
          <li>{t('info.termsAcceptableLi2')}</li>
          <li>{t('info.termsAcceptableLi3')}</li>
          <li>{t('info.termsAcceptableLi4')}</li>
        </ul>
      </Section>
      <Section title={t('info.termsWarrantyTitle')}>
        <p>{t('info.termsWarrantyBody')}</p>
      </Section>
      <Section title={t('info.termsContentTitle')}>
        <p>{t('info.termsContentBody')}</p>
      </Section>
    </Page>
  )
}

export function AccessibilityPage() {
  const { t } = useTranslation()
  return (
    <Page
      icon={AccessibilityIcon}
      title={t('info.a11yTitle')}
      subtitle={t('info.a11ySubtitle', {
        product: BRAND.product,
        updated: t('info.updated'),
      })}
    >
      <Section title={t('info.a11yCommitTitle')}>
        <p>{t('info.a11yCommitBody')}</p>
      </Section>
      <Section title={t('info.a11yLangTitle')}>
        <p>{t('info.a11yLangBody')}</p>
      </Section>
      <Section title={t('info.a11yLimitsTitle')}>
        <p>
          <Trans i18nKey="info.a11yLimitsBody">
            As a pilot we are actively improving accessibility. If you encounter a
            barrier, please tell us via the{' '}
            <Link to="/contact" className="font-semibold text-ink-700 underline">
              contact page
            </Link>{' '}
            and we will address it.
          </Trans>
        </p>
      </Section>
    </Page>
  )
}

export function About() {
  const { t } = useTranslation()
  return (
    <Page
      icon={Info}
      title={t('info.aboutTitle', { product: BRAND.product })}
      subtitle={BRAND.tagline}
    >
      <Section title={t('info.aboutWhatTitle')}>
        <p>{t('info.aboutWhatBody', { product: BRAND.product })}</p>
      </Section>
      <Section title={t('info.aboutRoutingTitle')}>
        <p>{t('info.aboutRoutingBody')}</p>
      </Section>
      <Section title={t('info.aboutCostTitle')}>
        <p>{t('info.aboutCostBody', { product: BRAND.product })}</p>
      </Section>
      <Section title={t('info.aboutStatusTitle')}>
        <p>
          {BRAND.official
            ? t('info.aboutStatusOfficial')
            : t('info.aboutStatusPilot', { authority: BRAND.authority })}
        </p>
      </Section>
    </Page>
  )
}

export function Help() {
  const { t } = useTranslation()
  return (
    <Page icon={HelpCircle} title={t('info.helpTitle')} subtitle={t('info.helpSubtitle')}>
      <Section title={t('info.helpQ1')}>
        <p>{t('info.helpA1')}</p>
      </Section>
      <Section title={t('info.helpQ2')}>
        <p>{t('info.helpA2')}</p>
      </Section>
      <Section title={t('info.helpQ3')}>
        <p>{t('info.helpA3')}</p>
      </Section>
      <Section title={t('info.helpQ4')}>
        <p>{t('info.helpA4', { product: BRAND.product })}</p>
      </Section>
      <Section title={t('info.helpQ5')}>
        <p>
          <Trans i18nKey="info.helpA5">
            Only the routed department(s) and authorised administrators — enforced in the
            database. See our{' '}
            <Link to="/privacy" className="font-semibold text-ink-700 underline">
              Privacy Policy
            </Link>
            .
          </Trans>
        </p>
      </Section>
    </Page>
  )
}

export function Contact() {
  const { t } = useTranslation()
  return (
    <Page icon={Mail} title={t('info.contactTitle')} subtitle={t('info.contactSubtitle')}>
      <Section title={t('info.contactGeneralTitle')}>
        <p>{t('info.contactGeneralBody')}</p>
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          {t('info.contactEmail')}{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-ink-700 underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
      <Section title={t('info.contactEmergTitle')}>
        <p>{t('info.contactEmergBody')}</p>
      </Section>
    </Page>
  )
}

export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Home className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold text-ink-900">
        {t('info.notFoundTitle')}
      </h1>
      <p className="mt-2 max-w-md text-slate-600">{t('info.notFoundBody')}</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">
          {t('info.goHome')}
        </Link>
        <Link to="/report" className="btn-outline">
          {t('info.reportIssue')}
        </Link>
      </div>
    </div>
  )
}
