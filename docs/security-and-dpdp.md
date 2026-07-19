# JanVyuha — Security & DPDP Compliance Overview

> For a government technical/legal review. Not legal advice — a deployment must
> have the sponsoring authority's counsel finalise policy specifics.

## Security controls (enforced in Postgres, verifiable)

| Control | How |
|---|---|
| Department isolation | RLS `SELECT` policy on `issues`: reporter OR admin OR non-suspended stakeholder whose department ∈ `routed_departments` AND jurisdiction matches `state`/`district`. |
| No privilege self-grant | `handle_new_user()` always sets `role='public'`; stakeholder/admin only via admin-managed `department_invites` allow-list. |
| Column immutability | `profiles_guard` / `issues_guard` triggers block non-admins from changing role/department/jurisdiction, routing, reporter PII, location, moderation. |
| Private evidence | Storage bucket `public=false`; owner-scoped write paths; reads via short-lived **signed URLs** only. |
| Deduped voting | `cast_vote` RPC + unique `(issue, user)` — no vote stuffing. |
| Admin actions | `admin_invite` / `admin_set_suspended` RPCs are `SECURITY DEFINER` + admin-checked; every action written to `audit_log`. |
| Public data | `public_issue_feed` view exposes **no PII** and coarsens location to ~1 km; the `issues` table has **no** anon-readable policy. |
| AI endpoint abuse/cost | `/api/analyze`: origin allow-list, per-IP rate limit, description/image size caps, image mime check. Upstream error text is logged server-side, never echoed to clients. |
| Media hygiene | Photos are re-encoded client-side (canvas downscale) before upload — strips EXIF (incl. GPS) and cuts payload size 10–30×. AI-flagged content is auto-routed to the moderation queue. |
| Notification endpoint | `/api/notify` requires a shared secret header (`NOTIFY_SECRET`), rate-limits per IP, and constrains click-through URLs to same-origin paths; fails closed if unconfigured. |
| Geocoding | `/api/geocode` proxy sets a compliant identifying User-Agent, throttles to 1 req/s upstream, and caches; client rounds coordinates (~11 m) before lookup. |
| Secrets | `GEMINI_API_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFY_SECRET`, `CRON_SECRET` are server-only (never `VITE_`). Anon key is safe to expose (RLS-gated). |
| Retention sweep | `api/retention-sweep.ts`, on a daily Vercel Cron (`CRON_SECRET`-gated), anonymizes `reporter_name`/`reporter_phone`/`reporter_id` on issues `resolved` for 90+ days. |
| Account deletion | `api/delete-account.ts` verifies the caller's own access token, scrubs PII on their past reports, then deletes their `auth.users` row (service-role only — the client can't do this itself). |
| Data residency | Create the Supabase project in the India region (ap-south-1 / Mumbai). |

## DPDP Act 2023 mapping

| Principle | Implementation |
|---|---|
| **Consent** | Explicit consent at report submission, linked to a real Privacy Policy (`/privacy`). |
| **Purpose limitation** | Data used only to route, respond, inform, and produce anonymised statistics. |
| **Data minimisation** | Phone shown only to the responding department; anonymous reporting supported; public feed carries no identity. |
| **Storage limitation / retention** | Retained while open + a 90-day post-resolution window; a daily Cron (`api/retention-sweep.ts`) then anonymizes the reporter identity automatically. |
| **Right to access** | "My Reports" lists the citizen's reports and status. |
| **Right to correction** | Reporter can edit; departments cannot alter reporter data (guarded). |
| **Right to erasure** | "Delete report" removes a single report; "Delete my account" (`api/delete-account.ts`) anonymizes all past reports and deletes the account entirely. |
| **Grievance redressal** | `/contact`; a Grievance Officer to be designated with the authority on launch. |
| **Security safeguards** | RLS, guard triggers, private storage, audit log, least-privilege keys. |

## Accessibility (GIGW / WCAG 2.1 AA)

Keyboard navigation, screen-reader labels, form-label associations, skip-to-content
link, `prefers-reduced-motion`, focus-visible styling, multilingual UI, mobile-first
for low-end Android. Accessibility statement at `/accessibility`.

## Known limitations (honest disclosure)

- Machine-assisted HI/TE/TA translations pending native-speaker review.
- The serverless rate limiters are per-instance (in-memory); a production
  rollout should add an edge rate-limiter (Vercel WAF / Upstash) in front of
  the API routes.
- Web Push on iOS requires the PWA to be installed to the home screen (a
  platform constraint, 16.4+); Android and desktop work in-browser.
- Delivery of push/email requires the one-time Supabase Database Webhook setup
  described in `notifications-setup.md`; until then the in-app notification
  bell still works.
- An independent third-party security review / penetration test has not yet
  been commissioned; the RLS model is covered by automated tests and is
  designed to be verified live during evaluation (see `deploy-guide.md` §7).
