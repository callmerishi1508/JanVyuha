import { Link } from 'react-router-dom'
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
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {title}
        </h1>
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

const UPDATED = 'July 2026'

export function Privacy() {
  return (
    <Page
      icon={ShieldCheck}
      title="Privacy Policy"
      subtitle={`How ${BRAND.product} collects, uses and protects your data. Aligned to India's Digital Personal Data Protection Act, 2023 (DPDP). Last updated ${UPDATED}.`}
    >
      {!BRAND.official && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {BRAND.product} is currently a pilot ({BRAND.authority}) and not yet an
          official government service. This policy describes how the pilot handles
          data and will be finalised with the sponsoring authority before launch.
        </p>
      )}
      <Section title="1. Data we collect">
        <p>
          When you report an issue we collect: the report details (category,
          description, severity), the <strong>location</strong> you set (GPS or a
          map pin), any <strong>photos/videos</strong> you attach, and — unless
          you choose to report anonymously — your <strong>name and phone
          number</strong> so responders can reach you.
        </p>
      </Section>
      <Section title="2. Why we use it (purpose limitation)">
        <p>
          Your data is used solely to route the report to the relevant government
          department(s), enable their response, keep you informed of progress, and
          produce <strong>anonymised, aggregated</strong> statistics for public
          transparency and service improvement. We do not sell your data or use it
          for advertising.
        </p>
      </Section>
      <Section title="3. Who can see it (data minimisation)">
        <p>
          Access is enforced in the database, not just the interface. Only the
          department(s) your report is routed to — within the relevant
          jurisdiction — and authorised administrators can see it. Your phone
          number is shown only to the responding department. The public
          transparency view shows <strong>no personal identity</strong> and only a
          coarsened (~1&nbsp;km) location.
        </p>
      </Section>
      <Section title="4. Storage & security">
        <p>
          Data is stored on managed infrastructure in an <strong>India
          region</strong>. Evidence photos/videos are kept in private storage and
          served only via short-lived signed links. Access is protected by
          row-level security, guard rules and an audit trail.
        </p>
      </Section>
      <Section title="5. Retention">
        <p>
          Reports and evidence are retained while a case is open and for a limited
          period after resolution for accountability, after which personal
          identifiers are removed or the record is deleted, in line with the
          sponsoring authority's records policy.
        </p>
      </Section>
      <Section title="6. Your rights (DPDP)">
        <p>As a Data Principal you may:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access the reports linked to your account (see “My Reports”).</li>
          <li>Correct inaccurate information.</li>
          <li>
            <strong>Erase</strong> a report you filed — use “Delete report” on any
            of your reports.
          </li>
          <li>Withdraw consent and raise a grievance (below).</li>
        </ul>
      </Section>
      <Section title="7. Consent">
        <p>
          You provide consent when you submit a report. You may withdraw it by
          deleting the report or contacting the Grievance Officer. Withdrawing
          consent does not affect action already lawfully taken on an emergency.
        </p>
      </Section>
      <Section title="8. Grievance Officer">
        <p>
          Questions or complaints about your data can be raised via our{' '}
          <Link to="/contact" className="font-semibold text-ink-700 underline">
            contact page
          </Link>
          . A Grievance Officer will be designated with the sponsoring authority
          on official launch, per the DPDP Act.
        </p>
      </Section>
    </Page>
  )
}

export function Terms() {
  return (
    <Page
      icon={FileText}
      title="Terms of Use"
      subtitle={`The terms for using ${BRAND.product}. Last updated ${UPDATED}.`}
    >
      <Section title="Purpose">
        <p>
          {BRAND.product} lets citizens report civic and emergency issues and
          routes them to the appropriate authorities. It <strong>does not
          replace</strong> official emergency numbers. In a life-threatening
          emergency, call 112 (or 100/101/108) immediately.
        </p>
      </Section>
      <Section title="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Report genuine issues with accurate information.</li>
          <li>Do not submit false, malicious, defamatory or unlawful content.</li>
          <li>Do not upload media that violates others' privacy or the law.</li>
          <li>Misuse may lead to moderation, suspension, or referral to authorities.</li>
        </ul>
      </Section>
      <Section title="No warranty">
        <p>
          The service is provided on a best-effort basis. Response times depend on
          the concerned departments. During the pilot phase, availability and data
          are provided without warranty.
        </p>
      </Section>
      <Section title="Content you submit">
        <p>
          You retain your rights to media you upload, and grant the authorities a
          licence to use it for responding to and resolving your report.
        </p>
      </Section>
    </Page>
  )
}

export function AccessibilityPage() {
  return (
    <Page
      icon={AccessibilityIcon}
      title="Accessibility Statement"
      subtitle={`${BRAND.product} aims to be usable by everyone, following the Guidelines for Indian Government Websites (GIGW) and WCAG 2.1 Level AA. Last updated ${UPDATED}.`}
    >
      <Section title="Our commitment">
        <p>
          We build for low-end Android phones and slow networks, support multiple
          languages, and follow accessibility best practices: keyboard navigation,
          screen-reader labels, sufficient colour contrast, resizable text, a
          skip-to-content link, and reduced-motion support.
        </p>
      </Section>
      <Section title="Languages">
        <p>
          The citizen interface is available in English, हिन्दी (Hindi), తెలుగు
          (Telugu) and தமிழ் (Tamil), with more planned.
        </p>
      </Section>
      <Section title="Known limitations & feedback">
        <p>
          As a pilot we are actively improving accessibility. If you encounter a
          barrier, please tell us via the{' '}
          <Link to="/contact" className="font-semibold text-ink-700 underline">
            contact page
          </Link>{' '}
          and we will address it.
        </p>
      </Section>
    </Page>
  )
}

export function About() {
  return (
    <Page
      icon={Info}
      title={`About ${BRAND.product}`}
      subtitle={BRAND.tagline}
    >
      <Section title="What it is">
        <p>
          {BRAND.product} is a unified civic-issue and emergency reporting
          platform. A citizen reports a problem with a photo and location; the
          system routes it to exactly the right department(s) — and only they see
          it — so help reaches people faster and nothing falls through the cracks.
        </p>
      </Section>
      <Section title="How routing works">
        <p>
          Every report has a category. Each category alerts a set of{' '}
          <strong>core</strong> departments always, plus context-dependent
          departments only when warranted — confirmed by the citizen — so no
          unrelated department is ever alerted.
        </p>
      </Section>
      <Section title="Built to run at near-zero cost">
        <p>
          {BRAND.product} runs on free-tier infrastructure and open data
          (OpenStreetMap), making a city-scale pilot possible without a large
          budget, with a clear upgrade path for a full state rollout.
        </p>
      </Section>
      <Section title="Status">
        <p>
          {BRAND.official
            ? 'This is an official deployment.'
            : `This is a pilot (${BRAND.authority}), presented for evaluation and partnership. It is not yet an official government service.`}
        </p>
      </Section>
    </Page>
  )
}

export function Help() {
  return (
    <Page
      icon={HelpCircle}
      title="Help & FAQ"
      subtitle="Answers to common questions."
    >
      <Section title="How do I report an issue?">
        <p>
          Tap “Report an issue”, choose a category, add a photo/video, set the
          location on the map, confirm the departments, and submit. You'll get a
          reference id to track it.
        </p>
      </Section>
      <Section title="Can I report anonymously?">
        <p>
          Yes. Toggle “Report anonymously” — your name won't be shown to
          departments. Note that responders then can't call you for details.
        </p>
      </Section>
      <Section title="How do I track my report?">
        <p>
          Open “My Reports” to see status and the response timeline for each report
          you filed.
        </p>
      </Section>
      <Section title="Is this the emergency number?">
        <p>
          No. For an immediate life-threatening emergency, call{' '}
          <strong>112</strong>. {BRAND.product} complements, and does not replace,
          emergency services.
        </p>
      </Section>
      <Section title="Who sees my report?">
        <p>
          Only the routed department(s) and authorised administrators — enforced in
          the database. See our{' '}
          <Link to="/privacy" className="font-semibold text-ink-700 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </Page>
  )
}

export function Contact() {
  return (
    <Page
      icon={Mail}
      title="Contact & Grievances"
      subtitle="Reach the team behind the pilot."
    >
      <Section title="General & data-privacy queries">
        <p>
          For questions, feedback, accessibility issues, or to exercise your data
          rights, write to the pilot team. A designated Grievance Officer will be
          published with the sponsoring authority on official launch.
        </p>
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          Email:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink-700 underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
      <Section title="Emergencies">
        <p>
          Do not use this form for emergencies. Call <strong>112</strong> (unified),
          100 (police), 101 (fire) or 108 (ambulance).
        </p>
      </Section>
    </Page>
  )
}

export function NotFound() {
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Home className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-600">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">
          Go home
        </Link>
        <Link to="/report" className="btn-outline">
          Report an issue
        </Link>
      </div>
    </div>
  )
}
