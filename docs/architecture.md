# JanVyuha — Architecture

## Overview

A single-page PWA talks to Supabase (managed Postgres with Row-Level Security)
for data/auth/storage/realtime, and to a small set of Vercel serverless
functions for the secret-bearing operations (AI triage/translation, Web Push +
email delivery, geocoding proxy, DPDP jobs). Everything runs on managed
services and degrades gracefully when a key is absent.

```
        ┌─────────────────────────────────────────────────────────┐
        │  Browser / installed PWA (React + Vite + Tailwind)        │
        │  • EN/HI/TE/TA i18n   • offline drafts + queued submit    │
        │  • Leaflet + OpenStreetMap maps (hotspot clustering)      │
        │  • voice input (Web Speech) · service worker + Web Push   │
        └───────────┬───────────────────────────┬──────────────────┘
                    │ supabase-js (anon key,     │ fetch()
                    │ RLS-scoped)                │
          ┌─────────▼──────────┐      ┌──────────▼──────────────────┐
          │  Supabase          │      │  Vercel serverless           │
          │  • Postgres + RLS  │      │  /api/analyze  Gemini triage │
          │  • Auth            │      │                + translate   │
          │  • Storage (private)│     │  /api/notify   Web Push+email│
          │  • Realtime        │      │  /api/geocode  Nominatim/    │
          │  • DB Webhook ─────┼──────►                Photon proxy  │
          └─────────┬──────────┘      │  /api/delete-account (DPDP)  │
                    │                 │  /api/retention-sweep (cron) │
                    │                 │  /api/weekly-digest  (cron)  │
              ┌─────▼──────┐         └──────────┬───────────────────┘
              │ OpenStreet │                    │ server-only keys
              │ Map tiles  │           ┌────────▼─────────┐
              └────────────┘           │ Google Gemini ·  │
                                       │ Resend (email) · │
                                       │ Web Push (VAPID) │
                                       └──────────────────┘
```

## Data model (Postgres)

- **profiles** — role (`public`/`stakeholder`/`admin`), department, jurisdiction,
  suspended. Privileged fields are immutable to the user (guard trigger); granted
  only via `department_invites` (admin allow-list) at sign-up.
- **issues** — the report; `routed_departments[]`, `state`/`district`,
  `moderation_status`, `ai_meta`. Column-immutability guard: a stakeholder may
  change only `status`.
- **issue_department_status** — per-department independent progress (the
  multi-department coordination model).
- **issue_media** — evidence; stored as private paths, served via signed URLs.
- **issue_updates** — citizen-facing timeline; an INSERT here fires the
  Database Webhook → `/api/notify` → Web Push + email to the reporter.
- **audit_log** — tamper-evident admin trail. **issue_votes / issue_ratings /
  issue_reports** — engagement, satisfaction (CSAT), moderation.
  **push_subscriptions** — Web Push endpoints.
- **public_issue_feed** — curated view: no PII, location coarsened to ~1 km, only
  `active` issues; the *only* thing anon can read. Feeds the public
  Transparency dashboard and the CSV/JSON open-data export.

## Security model (enforced in the database)

1. **Visibility** — a row is readable only by its reporter, an admin, or a
   non-suspended stakeholder whose department is routed **and** whose jurisdiction
   covers the issue.
2. **No privilege self-grant** — sign-up always yields `public`; stakeholder/admin
   come only from the admin-managed invite allow-list.
3. **Column guards** — triggers block non-admins from editing routing, reporter
   PII, location, votes, timestamps, or moderation fields.
4. **Private evidence** — bucket is private; owner-scoped writes; signed-URL reads.
5. **Erasure & retention** — reporter (or admin) may delete a report;
   self-serve account deletion anonymises history; a daily cron anonymises
   long-resolved reports automatically.
6. **Serverless endpoints** — origin checks, per-IP rate limits, payload size
   caps; notification and cron endpoints are shared-secret gated and fail
   closed.

See `security-and-dpdp.md` for the full control list.

## Frontend structure

```
src/
  config/brand.ts        white-label presets (VITE_BRAND)
  lib/                   i18n · analytics/SLA · dedupe (haversine) · geocode
                         (cached) · push · speech · pwa · offline queue ·
                         supabase · config · format
  locales/               en · hi · te · ta (full parity, incl. data layer)
  services/              api (mock) · supabaseApi · admin · ai · index (selector)
  store/                 auth · issues (realtime) · testMode
  components/            Header (mobile nav) · charts · LanguageSwitcher ·
                         ErrorBoundary · …
  pages/                 Landing · report-issue/ (wizard steps + useReportForm)
                         · Dashboard · Admin (incl. Outreach QR posters) ·
                         Analytics · Transparency · IssueDetail · MyIssues ·
                         info (legal)
api/                     analyze · notify · geocode · delete-account ·
                         retention-sweep · weekly-digest · _lib   (Vercel)
supabase/                schema.sql · seed.sql
.github/workflows/       ci.yml (format · lint · typecheck · test · build)
```

## Backend abstraction

The UI talks to a single `IssuesBackend` interface. Two implementations satisfy
it — an in-browser **mock** (localStorage, zero-setup demo) and **Supabase**. A
runtime selector switches between them, so every flow is demonstrable before any
key is added, and the same UI code runs in production.

## Quality gate

GitHub Actions CI runs Prettier, ESLint, `tsc`, the Vitest suite (55 tests:
routing, SLA analytics, dedupe, CSV/PII regression, auth mapping, URL
normalisation, mock round-trips), and the production build on every push.
