# Pre-Outreach Checklist — final gate before sending

Updated 2026-07-19 to reflect the shipped state (all roadmap phases A–D2 done;
55 tests + CI green; deployed at `jan-vyuha.vercel.app`). Most of the original
list is complete — what remains is verification, one-time console wiring, and
the outreach package itself.
**Legend:** 🔴 blocker · 🟠 strongly recommended · 🟢 nice-to-have · ✅ done.

---

## 0 · Verify the live deploy (do this FIRST — ~15 minutes)

- 🔴 **Smoke-test the production URL on a phone** (the React 19 / router 7 /
  react-leaflet 5 upgrades were machine-verified, not clicked through):
  1. Footer shows the current `build <sha>` stamp (not a stale cache).
  2. Landing loads; switch EN→TE→TA→HI — UI, department names, wizard all translate.
  3. Login (Google or phone) round-trips back into the app.
  4. Full report wizard: photo upload → Analyse → map pin → submit.
  5. Report appears in My Reports and on the correct department dashboard;
     hotspot map clusters render.
- 🔴 **Verify security on the live backend** (deploy-guide §7): citizen
  isolation, department isolation, evidence URL fails logged-out, moderation +
  audit populate. The pitch rests on "enforced in Postgres" — prove it on real
  infra once per schema change.

## 1 · One-time console wiring (only you can do these)

- 🔴 **Notifications webhook** — the one gap between "infra ready" and
  "notifications fire": Supabase → Database → Webhooks → INSERT on
  `issue_updates` → POST `https://<domain>/api/notify` with the
  `x-notify-secret` header. Full steps: `notifications-setup.md`. Test by
  advancing an issue's status and receiving the push.
- 🔴 **Vercel env complete**: `NOTIFY_SECRET`, `CRON_SECRET`,
  `DIGEST_RECIPIENTS`, VAPID keys, `EMAIL_API_KEY`/`EMAIL_FROM` (if email),
  `ALLOWED_ORIGINS`, `GEOCODE_CONTACT` (optional). `VITE_ENABLE_TESTER` must be
  **unset**. Redeploy after any `VITE_` change.
- 🔴 **Schema currency**: if the Supabase project predates the Phase A security
  fixes, re-apply `supabase/schema.sql`.
- 🟠 **Rotate any secrets that ever sat in a local `.env`** (anon key is safe;
  service-role, Gemini, VAPID private, email keys are not).
- 🟠 **Crons live**: Vercel → Crons shows retention (daily) + digest (Mon);
  check the first run's logs.
- 🟠 **Keep-alive**: free Supabase pauses after ~7 days idle — schedule a ping
  (e.g. cron-job.org) so the demo is never asleep when an official clicks.

## 2 · The outreach package

- 🔴 **Recipients researched and verified** — names/addresses from official
  portals only, immediately before sending (see `outreach-email.md` for the
  target table; TN leadership especially — new government since May 2026).
- 🔴 **Decide "who is we"** — the first official question. Individual or
  registered entity; who signs the MoU; who is the DPDP Grievance Officer
  (`mou-template.md` §"If you don't have a registered entity yet").
- 🔴 **2–3 minute demo video** recorded on the live site (`demo-script.md`),
  uploaded unlisted (YouTube/Drive), link tested logged-out.
- 🔴 **Export attachments to PDF**: `one-pager.md` + `pilot-proposal.md`
  (≤ 5 MB total). Deck stays a link or is presented live.
- 🟠 **Per-state pass before each batch**: `VITE_BRAND` set to the recipient's
  state, demo data showing their city, contact email real, then smoke-test.
- 🟠 **Native-speaker glance at HI/TE/TA** — at minimum the landing page and
  wizard, in the target state's language. Machine-assisted strings are flagged
  for review; a wrong word in an official's language costs credibility.
- 🟢 **Custom domain** so the URL doesn't read as a hobby deploy.
- 🟢 **Uptime monitor + error tracking (Sentry free)** so a broken demo never
  greets an official.

## 3 · Positioning rules (bake into every artifact)

- Independent **pilot proposal**, never an official service; the app carries
  the disclosure and the "does not replace 112" line.
- **No "free/₹0" claims.** Say: no budget allocation, procurement, or hardware
  needed to evaluate; provider hosts the pilot; costed scale-up plan attached
  (`scaling-and-cost.md`). Capacity ceilings stated, not hidden.
- Data ownership is the citizens' and the authority's; provider is a processor
  (`mou-template.md` §4).
- One recipient per mail, by name and office; log every send; one follow-up
  after 7–10 working days.

## 4 · Known-and-accepted gaps (be ready to answer, don't fix now)

- Telegram bot channel — deferred by decision; Web Push + email cover the pilot.
- Per-instance rate limiting on serverless APIs — edge limiter is a scale-stage
  item (documented in `security-and-dpdp.md`).
- Dashboard virtualization / realtime deltas — pilot-scale fine; documented
  trade-off.
- Independent pen-test — not yet commissioned; offer the live isolation
  walkthrough (deploy-guide §7) during evaluation.
- iOS push requires installed PWA (platform constraint; Android/desktop fine).

---

## Send-day runbook (per state)

1. `VITE_BRAND` + seed check → redeploy → phone smoke-test (§0.1).
2. Verify recipient names/emails on the official portal (same day).
3. Send the state batch (secretary/agency desk, minister's office, municipal
   commissioner) — individually addressed, PDFs attached, links tested.
4. Log sends (date, office, address). Calendar the day-8 follow-up.
5. Be reachable: the phone number in the signature is answered, and the
   MoU/"who are we" answers from §2 are at hand.
