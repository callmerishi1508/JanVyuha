# JanVyuha — Next-Level Roadmap (Zero-Budget)

A full-project inspection (security/backend, frontend/UX/a11y/perf, product/features, code-quality/tests/DX) with every fix, improvement, and new capability that can be shipped on **free tiers only** — no paid services, no procurement.

**Inspected:** 2026-07-09 · **Verdict:** the core is genuinely strong and secure; the work below is (1) closing a handful of real security/correctness gaps, (2) *finishing* features that are claimed but wired only halfway, and (3) a prioritized set of free, high-leverage additions.

**Legend:** P0 = do before any serious demo/pitch · P1 = high value, do soon · P2 = next-level features · P3 = quality/DX foundation
**Effort:** S ≈ <½ day · M ≈ 1–2 days · L ≈ 3–5 days · **All items are ₹0** (Supabase free, Vercel Hobby, Gemini free tier, OSM/Nominatim, web-push, Telegram Bot API, Brevo/Resend free email, GitHub Actions).

---

## 0. What's already excellent (preserve — don't rebuild)
So this list reads as "level up," not "it's broken":
- **Server-enforced security:** RLS everywhere, invite-only officials, `profiles_guard` + `issues_guard` triggers against privilege escalation, private `evidence` bucket + short-lived signed URLs, audit log, admin RPCs with internal role checks.
- **Solid AI proxy:** `api/analyze.ts` has rate-limit, size caps, same-origin check, 20s timeout, strict output validation; retired-model + origin bugs already fixed.
- **Clean architecture:** one `IssuesBackend` seam (mock vs Supabase), shared pure logic, graceful degradation everywhere (no keys → mock; geocode fail → coords; AI 503 → hidden).
- **Full i18n EN/HI/TE/TA including the data layer** (`tDept`/`tReason` wired), PWA offline *shell*, a11y basics (skip-link, reduced-motion, focus rings), error boundary, code-splitting.
- **Meaningful tests** (routing, SLA, dept-status derivation, mock-AI, URL normalization) — 31 passing.

---

## P0 — Critical (security + broken/misleading features) — do first

| # | Item | File | Fix (zero-budget) | Effort |
|---|------|------|-------------------|--------|
| P0-1 | **`/api/notify` is a fully open, unauthenticated push sender** — anyone with a user UUID can push arbitrary notifications (with arbitrary click-through URL) under the gov app's identity. *Verified: no origin/secret/rate guard; reads subs with service-role key.* | `api/notify.ts` | Require `x-notify-secret` header (`NOTIFY_SECRET` env, shared with the Supabase webhook); add the same IP rate-limiter as `analyze.ts`; constrain `url` to a same-origin path. | S |
| P0-2 | **`VITE_ENABLE_TESTER=true` is live in `.env`** — a prod build would ship the Tester panel that mints client-side admin/stakeholder sessions. *Verified: line 65.* | `.env`, Vercel env | Blank it (`VITE_ENABLE_TESTER=`); ensure Vercel var is unset; verify `grep -c ENABLE_TESTER dist/assets/*.js` = 0 after rebuild. | S |
| P0-3 | **Rotate real secrets sitting in the working tree** — anon key, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (bypasses all RLS), VAPID private, email key are plaintext in `.env`. Not committed, but "assume seen" (zip for pitch, mis-scoped deploy). | `.env` | Roll each key in its console (Supabase/AI Studio/Resend), regenerate VAPID; store only in Vercel/Supabase env. | S |
| P0-4 | **Public Transparency page is broken on the real backend** — it reads `getIssues()` (RLS-scoped → **empty for logged-out visitors**), NOT the coarsened `public_issue_feed` view. The view (PII-safe, `anon`-granted) is **never queried by any client code**, and the file's own comment falsely claims it uses it. *Verified.* | `Transparency.tsx`, `supabaseApi.ts` | Add `getPublicFeed()` selecting from `public_issue_feed`; Transparency (and anon Landing stats) call it. | S |
| P0-5 | **Any stakeholder can DELETE/READ every citizen rating** platform-wide — a dept can silently erase its own negative feedback; comments (PII) leak cross-department. `issue_ratings` policy `using (… OR my_role() in (admin,stakeholder))` governs DELETE. | `supabase/schema.sql` (`issue_ratings`) | Split policy: owner read/write; stakeholders/admins **SELECT-only**, scoped via the `issues`-visibility EXISTS pattern; no DELETE/UPDATE for stakeholders. | S |
| P0-6 | **`write_audit` EXECUTE not revoked** — Postgres grants EXECUTE to PUBLIC by default; `write_audit` has no internal role check, so any authenticated user can inject/flood audit entries, weakening the "tamper-evident" claim. | `supabase/schema.sql` | `revoke execute on function public.write_audit from public, anon, authenticated;` (call only from security-definer fns). Audit all helper fns; grant back only the safe RPCs. | S |
| P0-7 | **`issues_guard` misses `upvotes`, `flagged`, `city`, `ai_meta`, `created_at`** — a routed stakeholder can inflate upvotes (gaming priority/transparency), backdate `created_at` (skewing avg-resolution KPI), rewrite `city`. | `supabase/schema.sql` (`issues_guard`) | Add those columns to the immutability list; add a `with check` to the issues UPDATE policy. | S |

> **P0 is ~1 day total** and every item is a real credibility risk in front of a government reviewer who *will* poke the endpoints and the public dashboard.

---

## P1 — High-value fixes (correctness, cost, field-reality)

### Backend / privacy
- **P1-1 (M5) DPDP cross-border disclosure.** Citizen photos (faces, plates, minors, injuries) are sent to Google Gemini (US) with no notice — contradicts the "India data residency" pitch. **Fix:** make the photo→AI step explicitly opt-in, disclose Google as sub-processor in `/privacy` + consent copy, strip EXIF before upload, default to text-only triage. *(Pairs with P2 image-downscale.)*
- **P1-2 (M2) AI cost-abuse.** `ALLOWED_ORIGINS` blank → any site can burn your Gemini quota; rate-limiter keys on spoofable `x-forwarded-for[0]` and resets per warm instance. **Fix:** set `ALLOWED_ORIGINS` to the real domain; use Vercel's trusted client IP; (post-pilot) front with Upstash Ratelimit free tier.
- **P1-3 (M6) Citizen can forge dept progress.** `issue_department_status` reporter-insert branch allows any `status`; a malicious reporter can seed `'done'` → false "resolved". **Fix:** `and status = 'notified'` on that branch.
- **P1-4 No retention/erasure job + no self-serve account deletion.** DPDP expects both. **Fix (free):** a scheduled **Supabase pg_cron / Edge Function** to age-out PII on long-resolved issues; add a "delete my account" flow.

### Frontend correctness / cost
- **P1-5 (C1-fe) Photos never downscaled** — a raw 3–8 MB camera photo becomes a ~5–11 MB base64 kept in React state (re-rendered every keystroke) and uploaded raw, burning free-tier storage/egress and failing on 2G/3G. **Fix (code-only, ~30 lines, no dep):** canvas-downscale to ~1600px longest edge + `toBlob(jpeg, 0.75)` before storing. Cuts payloads 10–30× and also shrinks the AI request. **Highest ROI single change for the target audience.**
- **P1-6 (H2-fe) Remove-photo button is hover-only** — `opacity-0 group-hover:opacity-100` is unreachable on touch, so citizens can't delete a wrong photo on a phone. **Fix:** always-visible on small screens / `group-focus-within`, ≥44px hit area.
- **P1-7 (M1-fe) Relative times hardcoded English.** `lib/format.ts` `timeAgo` ("min ago", "day ago") + `'en-IN'` show English in HI/TE/TA across 13 places. **Fix:** move unit strings to locale files with i18next plurals; pass `currentLocale()` to `toLocaleString`.
- **P1-8 (M2-fe) Hardcoded English on Transparency** ("Reports by category", "By district", "No data.", etc.) + minor `MapView` popup / `IssueDetail` aria-label. **Fix:** route through `t(...)`, add keys to all 4 locales.
- **P1-9 (M6-fe) Contrast: `text-slate-400` on white ≈ 2.8:1** (fails WCAG AA) used pervasively for secondary text. **Fix:** shift to `slate-500/600`; bump `text-[9px]` chips to `[11px]`.
- **P1-10 Accessibility: unlabelled inputs + no focus management.** Address/city/state labels lack `htmlFor`/`id`; two search inputs are placeholder-only; wizard step change doesn't move focus or announce. **Fix:** add id/for + `aria-label`; on step change focus the `<h2>` (`tabIndex=-1`) and/or `aria-live="polite"`.

### Reliability
- **P1-11 `IssueDetail` upvote has no try/catch** → unhandled rejection + silent no-op on failure. **Fix:** wrap in try/catch + error toast. Audit other store-mutation call sites.
- **P1-12 `createIssue` isn't atomic** — issue insert then dept-status + first timeline inserts are fire-and-forget, no error check; partial failure leaves an orphaned issue. **Fix:** one Postgres `create_issue` RPC (atomic), or at least check each `error`.
- **P1-13 Route-level error boundary.** Global boundary white-replaces the whole app on a lazy **chunk-load failure** (common after redeploy on flaky mobile). **Fix:** lightweight boundary around `<Routes>` with reset on `pathname` + "reload to update" toast.

---

## P2 — Next-level features (all zero-budget), prioritized

### Tier 1 — finish what's claimed, add the field-real ones
- **P2-1 Make Web Push actually fire (it's vaporware today).** UI + service worker + `api/notify` all exist, but **nothing triggers a notification** — verified no client calls `/api/notify` and no DB webhook exists. **Fix (S):** create a free **Supabase Database Webhook** on `issue_updates` INSERT → POST `/api/notify` (with the P0-1 secret); resolve `reporter_id` + routed-dept subscriptions inside the function and send. *iOS needs installed PWA (16.4+); Android/desktop fine.*
- **P2-2 Email notifications (claimed in env/docs, no code).** Realistic free channel for officials (govt email); **SMS isn't free in India**. **Fix (S):** `sendEmail()` in `api/notify.ts` via **Brevo (300/day free, no card)** or Resend; trigger from the same webhook. Note the daily cap in `scaling-and-cost.md`.
- **P2-3 Offline report queue** — the single most field-credible feature for India. Today submit just fails offline and a refresh wipes the whole wizard. **Fix (M):** (a) debounced draft persistence to `localStorage` + rehydrate on mount; (b) on offline submit, queue payload (media as blobs) in IndexedDB, show "saved — will send when online", flush on `window 'online'` (Background Sync where available).
- **P2-4 CSAT analytics** — ratings are collected but **never aggregated**; the mock even drops the stars. Citizen satisfaction is the most persuasive gov KPI. **Fix (S):** add `avgRating`/`csat` to `summarize()` + a tile on Analytics and the dept-performance table (join `issue_ratings`).

### Tier 2 — official productivity + the "wow" features
- **P2-5 SLA auto-escalation + bulk actions.** `analytics.ts` already computes breaches; there's no escalate action and every issue is touched one at a time. **Fix (S-M):** "Breaching SLA" filter + one-click escalate (notify supervisor via P2-1/2, write audit); multi-select bulk status-change on the dept queue; a free **Vercel Cron** (`api/escalate.ts`) daily sweep of open+breached issues.
- **P2-6 Hotspot / cluster view.** `haversine`/`findNearby` power per-report dedupe but there's no aggregate "where do complaints cluster" map — exactly what a commissioner wants, and the natural home for **bulk duplicate-merge** (today one-at-a-time). **Fix (M):** client-side grid/DBSCAN clustering over loaded issues on the existing Leaflet map (`leaflet.markercluster`, free); `byDistrict()` gives the table.
- **P2-7 Telegram bot — the free "SMS alternative."** Telegram Bot API is 100% free/unlimited, works on low-end phones, supports photo+location natively. **Fix (M):** `api/telegram.ts` webhook; `/start <ref_id>` deep-link to subscribe to an issue; inbound photo+location creates an issue via service-role reusing `resolveRouting`; extend the notify webhook to push Telegram too. *Position as an add-on channel (WhatsApp Business API is not free).*
- **P2-8 Canned responses / quick notes.** Officials retype the same updates. **Fix (S):** localized picklist in `src/data/` feeding the existing `updateDeptStatus` note. Pairs with bulk actions.

### Tier 3 — transparency, AI upgrades, growth, equity
- **P2-9 Public leaderboard + open-data export + weekly digest.** `public_issue_feed` + `analytics.ts` already have everything: department resolution-rate/avg-time/CSAT leaderboard, "most-supported open issues", a public CSV/JSON download (anon-safe view only), and a free **Vercel Cron** weekly email to admins. Governments respond to transparency pressure. *(Gate leaderboard visibility behind a `VITE_` flag.)*
- **P2-10 Gemini free-tier upgrades:** (a) **auto-translate** a citizen's report into the official's locale (already calling Gemini); (b) route AI-`flagged` content to the **moderation queue** automatically (today the flag isn't auto-actioned); (c) EXIF strip + safety gate. Keep the cheap explainable geo+keyword dedupe as primary; treat embeddings as optional.
- **P2-11 Voice + icon-first low-literacy flow.** Free browser **Web Speech API** (`hi-IN`/`te-IN`/`ta-IN`) for voice-to-text in the description step; additive, never required. Big equity win for the stated audience.
- **P2-12 Growth: QR posters + deep links + embeddable widget.** Extend `/report` to accept `?category=water` (wizard already takes preset category) so printed QR at a water-office pre-fills; mint category QR posters in the admin console (`qrcode` npm, free); a lightweight `/embed` iframe (report button + local transparency stats) for municipal sites.
- **P2-13 Reverse-geocode caching + Nominatim policy.** Every pin-drop hits Nominatim uncached with no identifying header (policy risk; failures degrade the district value **jurisdiction RLS depends on**). **Fix (S):** round-and-cache lookups; proxy through a tiny Vercel fn to set a compliant `User-Agent`+email and 1s throttle; Photon as fallback.

### Scale hygiene (note, not urgent)
- **P2-14 Realtime refetch storm + list/marker virtualization.** `startRealtime` full-refetches on every change; dashboards render every card + individual marker. Fine for a pilot; for a real tenant apply the realtime payload delta, add `react-window` + marker clustering. Flagging as a known trade-off.

---

## P3 — Quality / DX foundation (free, biggest credibility gap for a gov pitch)

- **P3-1 No CI, ESLint, Prettier, or pre-commit** — zero automated quality gate. **Fix (all free):** ESLint (`typescript-eslint` + `react-hooks` + `react-refresh`) + Prettier; a **GitHub Actions** PR workflow (`ci`: typecheck + test + build + lint); enable **Dependabot**. Single biggest "we take engineering seriously" signal.
- **P3-2 Unlock component/store tests** — no jsdom env, so `RoleGuard`/form tests are impossible today. **Fix:** add `environment: 'jsdom'` + `@testing-library/react` (free devDeps) + Vitest `--coverage` (built-in v8).
- **P3-3 Highest-value missing unit tests** (pure fns, no infra): `toE164()` (phone→login), `supabaseApi.mapRow()` (row→domain, full of unchecked union casts), `analytics.toCsv()` + `departmentPerformance/dailyTrend/byDistrict` (officials export; CSV-escaping bug-prone), mock `api.ts` round-trip, auth role-mapping.
- **P3-4 Type the serverless handlers** — `req/res/parsed/parts` are `any`; `@vercel/node` is already a devDep → use `VercelRequest`/`VercelResponse` + `Partial<AnalyzeResult>`. Add runtime `isCategoryId`/`isDepartmentId` guards to `mapRow`'s union casts.
- **P3-5 Dev-only `npm audit`: 9 vulns (6 high)** all transitive via `@vercel/node`/`vite`/`vitest`; **none ship to prod** (prod audit = 0). Let Dependabot + non-breaking `audit fix` handle; defer the breaking majors.
- **P3-6 Split the 1,129-line `ReportIssue.tsx`** into per-step children + a `useReportForm` hook (also helps P1-5/P2-3). `AdminDashboard`/`IssueDetail`/`PublicLogin` are large but coherent.
- **P3-7 Minor:** consolidate 3 ref-id notions into one `lib` helper; unify/doc the mock-vs-Supabase `report()` semantics divergence; log (don't return) Gemini upstream error text (`analyze.ts`); fix the "max ~1.5MB" message (cap is 3.5MB).
- **P3-8 PWA icons** — manifest only has `icon.svg`; many Android launchers won't render SVG home-screen/splash. **Fix:** add real 192 & 512 + maskable PNGs; optional `screenshots` for a richer install sheet; capture `beforeinstallprompt` for an "Add to Home Screen" button.

---

## Suggested phased plan (each phase leaves the app shippable & green)

**Phase A — Trust & correctness (≈1–1.5 days, do before pitching):**
P0-1…P0-7 (security + broken transparency) → P1-1/P1-2 (DPDP disclosure + AI abuse) → P1-11/P1-12/P1-13 (reliability). *Result: nothing embarrassing when a reviewer pokes it.*

**Phase B — Field-real UX (≈2 days):**
P1-5 image downscale → P1-6 touch delete → P1-7/P1-8 i18n gaps → P1-9/P1-10 a11y → P2-3 offline queue + draft persistence. *Result: actually works on a cheap phone at a real incident.*

**Phase C — The demo "wow" (≈2–3 days):**
P2-1/P2-2 notifications actually fire → P2-4 CSAT → P2-5 SLA escalation + bulk → P2-6 hotspots. *Result: the officials'-productivity + accountability story lands.*

**Phase D — Reach & foundation (≈2–3 days, parallelizable):**
P2-7 Telegram → P2-9 transparency/open-data → P2-11 voice → P3-1/P3-2/P3-3 CI+lint+tests. *Result: growth channels + an engineering-credible repo.*

---

## Free-tier stack this roadmap relies on
| Capability | Free service | Limit to remember |
|-----------|--------------|-------------------|
| DB / Auth / Storage / Realtime / Cron | **Supabase free** | 500MB DB, 1GB storage, pg_cron/Edge Functions free |
| Hosting + serverless + cron | **Vercel Hobby** | Cron limited frequency; 4.5MB request body |
| AI triage / translate | **Gemini free tier** | RPM/RPD caps — keep off the critical submit path |
| Maps / geocoding | **OSM tiles + Nominatim/Photon** | ≤1 req/s, needs identifying header (proxy it) |
| Citizen alerts | **Web Push (VAPID)** + **Telegram Bot** | Web Push unlimited/free; iOS needs installed PWA |
| Official email | **Brevo 300/day** or Resend 3k/mo | Daily cap → pilot-scale only |
| CI / security | **GitHub Actions + Dependabot** | Free for the repo |

*Everything above is achievable at ₹0. The only thing that costs money — real SMS in India — is deliberately replaced by Web Push + Telegram + email.*
