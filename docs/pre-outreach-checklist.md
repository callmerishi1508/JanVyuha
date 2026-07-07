# Pre-Outreach Checklist — before emailing for a tie-up

Everything to verify, fix, polish, and prepare before sending JanVyuha to
Telangana / Andhra Pradesh / Tamil Nadu / NITI Aayog. Ordered by priority.
**Legend:** 🔴 blocker · 🟠 strongly recommended · 🟢 nice-to-have.

---

## 0 · Prove it actually works (do this FIRST)

- 🔴 **Run the build & tests**: `npm run build && npm test`. (The latest login/auth
  changes were written while the sandbox verifier was down — they've been code-
  reviewed but not compiler-verified. Confirm green before anything else.)
- 🔴 **Exercise the demo end-to-end in a browser** (`npm run dev`): the 60-second
  fire-routing story, all 4 languages, mobile view (hamburger nav), admin console,
  analytics, transparency page, report → dashboard → resolve → rate.
- 🔴 **Stand up a REAL Supabase project** (India region, `ap-south-1`), run
  `supabase/schema.sql` then `supabase/seed.sql`, and **verify the security claims
  on real infra, not the mock**:
  - a citizen account cannot see another citizen's report or a department's queue;
  - a department sees only its routed + in-jurisdiction issues;
  - evidence photos are NOT reachable by public URL;
  - admin provisioning + moderation + audit log work;
  - Google + phone sign-in work (after enabling providers — see §4).
  > The entire pitch rests on "security enforced in Postgres." It must be tested
  > against a live database before you claim it.

---

## 1 · Credibility — must-do before the email

- 🔴 **Deploy a live hosted demo** (Vercel prod, HTTPS, a real URL). Officials will
  click a link, not run `npm`.
- 🔴 **Lock down the production build**: `VITE_ENABLE_TESTER` unset (Tester panel
  OFF), demo copy hidden, `VITE_BRAND` set to the recipient (telangana/andhra/…).
- 🟠 **Seed demo data for the TARGET city** (Hyderabad / Vijayawada / Chennai) — not
  Bengaluru — so a Telangana official sees Telangana places on the map.
- 🟠 **Fill the placeholders**: contact email (currently `contact@janvyuha.example`),
  grievance officer, footer authority, any "example.org" strings.
- 🟠 **Real 192/512 PNG app icons** (the one deferred PWA item; currently SVG only).
- 🟠 **Native-speaker review of Hindi/Telugu/Tamil** (translations are machine-
  assisted and flagged for review — a wrong word in an official's language hurts).
- 🟠 **A 2–3 min demo video + 5–6 screenshots** for the email (officials skim).
- 🟠 **Proofread all `docs/`**, confirm numbers match the app, export the deck to PDF.
- 🟢 **Intentional logo/emblem** (current mark is a neutral placeholder).

---

## 2 · Product gaps & improvements (deferred in the build — "better to have")

- 🟠 **Report-time "similar reports nearby" hint** (dedup currently shows only on the
  issue detail page, not while filing).
- 🟠 **Inline field validation + 10-digit phone validation** in the report wizard
  (currently toast-only gating; no red field states).
- 🟠 **Wizard leave-guard** (navigating away mid-report loses the draft).
- 🟠 **Notification matching by `reporter_id`, not name** (the bell + rating gate on
  name match — collides on common names, breaks for anonymous reports).
- 🟠 **Wire email notifications + a Supabase DB webhook** to trigger `/api/notify` on
  status change (push/email infra is ready but nothing fires it yet).
- 🟢 **Colour-contrast sweep** (some `slate-400` body text fails WCAG AA).
- 🟢 **Admin "merge duplicate" button** (the API/schema exist; no UI yet).
- 🟢 **i18n for the report wizard + dashboards** (only landing/nav/legal + category/
  status labels are translated; officials' console is English by design).
- 🟢 **Code-split the bundle** (~700 KB; lazy-load admin/analytics/maps for low-end
  phones).
- 🟢 **Offline report queue** (offline is shell-only today).
- 🟢 **Edge rate-limiter** for `/api/analyze` (in-memory only; add Vercel WAF or
  Upstash free tier).

---

## 3 · Security & compliance (before real citizen data)

*Not required for a demo, but be ready to answer these — a govt CTO will ask.*

- 🟠 **Independent RLS/security review** + a basic pen-test of the isolation rules.
- 🔴 **Set `ALLOWED_ORIGINS`** in the production environment (locks the AI endpoint).
- 🟠 **Automated data-retention/deletion job** (currently documented, not implemented).
- 🟠 **Persist a consent record + version** per report (documented, not stored).
- 🟠 **Supabase backups + auto-pause mitigation** (free projects sleep after ~7 days
  idle — schedule a keep-alive ping, or upgrade before a scheduled official viewing
  so the demo isn't asleep).
- 🟠 **DPDP**: designate a Grievance Officer; have the privacy policy reviewed by
  counsel before real data.
- 🟢 **Error tracking (Sentry free) + uptime monitor + privacy-friendly analytics**
  (Plausible/GA) so you can later show adoption numbers.

---

## 4 · Deployment / ops

- 🔴 **Supabase**: project in `ap-south-1`; run schema + seed; create the first admin
  via a `department_invites` row; enable **Google** provider (free) and, when funded,
  a **phone/SMS** provider.
- 🔴 **Vercel**: deploy; set ALL env vars (Supabase URL/anon, `GEMINI_API_KEY`,
  `ALLOWED_ORIGINS`, `VITE_BRAND`, VAPID keys, `SUPABASE_SERVICE_ROLE_KEY`).
- 🟠 **Generate VAPID keys**: `npx web-push generate-vapid-keys` (for Web Push).
- 🟢 **Custom domain** so it doesn't read as a hobby project.

---

## 5 · The outreach package (email + attachments)

- 🔴 **Identify the RIGHT recipients** (research): state IT / e-Governance secretary,
  district collector, municipal commissioner, police/fire nodal officers; for NITI
  Aayog, the relevant vertical/adviser.
- 🔴 **A tight cover email** (can be drafted for you): problem → one-line solution →
  live demo link → the ask (a supervised, zero-cost single-district pilot).
- 🟠 **Attach**: one-pager (PDF), pitch deck (PDF), pilot proposal. **Link**: live
  demo + demo video.
- 🟠 **Honest positioning**: independent pilot proposal, not an official service,
  ₹0 to run. (Already baked into the app copy.)
- 🟢 **A follow-up plan** (polite nudge after 7–10 days).

---

## 6 · Legal / organisational (the "who are you?" question)

- 🔴 **Who is "we"?** A person or registered entity able to sign an MoU / data-
  sharing agreement. Officials will ask on first contact.
- 🟠 **Liability disclaimer** — especially because it touches emergencies ("does not
  replace 112"; already stated in Terms, keep it prominent).
- 🟠 **Data ownership clarity** — citizen/government data belongs to them, not you.
- 🟢 **Terms reviewed**; IP ownership stated.

---

## Already prepared for you (in this repo)

- ✅ **Cover email drafts** (state + NITI Aayog + follow-up) — `outreach-email.md`.
- ✅ **Demo scripts** (60-second video + full walkthrough + Q&A) — `demo-script.md`.
- ✅ **Demo data reseeded** for Hyderabad / Vijayawada / Visakhapatnam / Chennai
  (Telangana, AP, Tamil Nadu) in both `src/data/seed.ts` and `supabase/seed.sql`.
- ✅ **Full pitch docs** — one-pager, deck, pilot proposal, architecture,
  security/DPDP, SLA/KPI, scaling/cost.

## Quick "tonight" shortlist (highest impact, least effort)

1. `npm run build && npm test` — confirm green.
2. Deploy to Vercel + a real Supabase project (India region); test the security on
   real infra.
3. Enable Google login; set `VITE_BRAND`, turn the Tester panel off.
4. Reseed demo data for one target city; fill contact/grievance placeholders.
5. Record a 2-minute demo video; export the deck to PDF.
6. Decide who "we" are and draft the cover email.

Everything below the shortlist can follow after first contact.
