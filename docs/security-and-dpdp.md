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
| AI endpoint abuse/cost | `/api/analyze`: origin allow-list, per-IP rate limit, description/image size caps, image mime check. |
| Secrets | `GEMINI_API_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are server-only (never `VITE_`). Anon key is safe to expose (RLS-gated). |
| Data residency | Create the Supabase project in the India region (ap-south-1 / Mumbai). |

## DPDP Act 2023 mapping

| Principle | Implementation |
|---|---|
| **Consent** | Explicit consent at report submission, linked to a real Privacy Policy (`/privacy`). |
| **Purpose limitation** | Data used only to route, respond, inform, and produce anonymised statistics. |
| **Data minimisation** | Phone shown only to the responding department; anonymous reporting supported; public feed carries no identity. |
| **Storage limitation / retention** | Retained while open + a limited post-resolution window; identifiers then removed/deleted per authority policy. |
| **Right to access** | "My Reports" lists the citizen's reports and status. |
| **Right to correction** | Reporter can edit; departments cannot alter reporter data (guarded). |
| **Right to erasure** | "Delete report" removes the report; child records cascade. |
| **Grievance redressal** | `/contact`; a Grievance Officer to be designated with the authority on launch. |
| **Security safeguards** | RLS, guard triggers, private storage, audit log, least-privilege keys. |

## Accessibility (GIGW / WCAG 2.1 AA)

Keyboard navigation, screen-reader labels, form-label associations, skip-to-content
link, `prefers-reduced-motion`, focus-visible styling, multilingual UI, mobile-first
for low-end Android. Accessibility statement at `/accessibility`.

## Known limitations (honest disclosure)

- Machine-assisted HI/TE/TA translations pending native review.
- Deep field-level validation and a broad colour-contrast sweep are in progress.
- Web Push/email require free self-serve keys; without them the in-app bell still works.
- A production rollout should add an edge rate-limiter (Vercel WAF / Upstash free
  tier) in front of `/api/analyze`, and a Supabase Database Webhook to trigger
  `/api/notify` on status changes.
