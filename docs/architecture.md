# JanVyuha — Architecture

## Overview

A single-page PWA talks to Supabase (managed Postgres with Row-Level Security)
for data/auth/storage/realtime, and to two small Vercel serverless functions for
the paid/secret operations (AI triage, Web Push). Everything has a free tier and
degrades gracefully when a key is absent.

```
        ┌─────────────────────────────────────────────────────────┐
        │  Browser / installed PWA (React + Vite + Tailwind)        │
        │  • EN/HI/TE/TA i18n   • offline shell (service worker)    │
        │  • Leaflet + OpenStreetMap maps                           │
        └───────────┬───────────────────────────┬──────────────────┘
                    │ supabase-js (anon key,     │ fetch()
                    │ RLS-scoped)                │
          ┌─────────▼──────────┐      ┌──────────▼─────────────┐
          │  Supabase          │      │  Vercel serverless     │
          │  • Postgres + RLS  │      │  • /api/analyze (Gemini)│
          │  • Auth            │      │  • /api/notify (WebPush)│
          │  • Storage (private)│     └──────────┬─────────────┘
          │  • Realtime        │                 │ server-only keys
          └─────────┬──────────┘        ┌────────▼─────────┐
                    │                   │ Google Gemini    │
                    │                   │ (free tier)      │
              ┌─────▼──────┐            └──────────────────┘
              │ OpenStreet │
              │ Map / Nomi │  (maps, geocoding — free, keyless)
              └────────────┘
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
- **issue_updates** — citizen-facing timeline. **audit_log** — tamper-evident
  admin trail. **issue_votes / issue_ratings / issue_reports** — engagement +
  moderation. **push_subscriptions** — Web Push endpoints.
- **public_issue_feed** — curated view: no PII, location coarsened to ~1 km, only
  `active` issues; the *only* thing anon can read.

## Security model (enforced in the database)

1. **Visibility** — a row is readable only by its reporter, an admin, or a
   non-suspended stakeholder whose department is routed **and** whose jurisdiction
   covers the issue.
2. **No privilege self-grant** — sign-up always yields `public`; stakeholder/admin
   come only from the admin-managed invite allow-list.
3. **Column guards** — triggers block non-admins from editing routing, reporter
   PII, location, or moderation fields.
4. **Private evidence** — bucket is private; owner-scoped writes; signed-URL reads.
5. **Right to erasure** — reporter (or admin) may delete a report; children cascade.
6. **AI endpoint** — origin allow-list, per-IP rate limit, payload size caps.

See `security-and-dpdp.md` for the full control list.

## Frontend structure

```
src/
  config/brand.ts        white-label presets (VITE_BRAND)
  lib/                   i18n, analytics/SLA, dedupe (haversine), geocode,
                         push, supabase, config
  locales/               en · hi · te · ta
  services/              api (mock) · supabaseApi · admin · ai · index (selector)
  store/                 auth · issues (realtime) · testMode
  components/            Header (mobile nav) · charts · LanguageSwitcher · …
  pages/                 Landing · Report · Dashboard · Admin · Analytics ·
                         Transparency · IssueDetail · MyIssues · info (legal)
api/                     analyze.ts · notify.ts   (Vercel serverless)
supabase/                schema.sql · seed.sql
```

## Backend abstraction

The UI talks to a single `IssuesBackend` interface. Two implementations satisfy
it — an in-browser **mock** (localStorage, zero-setup demo) and **Supabase**. A
runtime selector switches between them, so every flow is demonstrable before any
key is added, and the same UI code runs in production.
