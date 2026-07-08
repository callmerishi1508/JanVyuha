# JanVyuha — Pre-Launch Gaps, Fixes & Improvements

**Purpose:** everything worth closing before you send the outreach mail / record the demo, ranked so you can stop at any line and still be in a defensible place.
**Legend:** 🔴 Blocker (do before sending) · 🟡 Strongly recommended · 🟢 Polish / nice-to-have
**Status date:** 2026-07-08

---

## 0. Snapshot of what's already solid
So the list below reads as "finishing touches," not "it's broken":
- Full flow works end-to-end in mock mode + real Supabase; 7-department routing; AI triage (Gemini 2.5-flash) live and verified.
- Security pass done: RLS, privilege-escalation guards, invite-only officials, private evidence bucket + signed URLs, audit log, rate-limited AI proxy.
- i18n complete across all 9 pages in EN/HI/TE/TA (517+ keys, full parity).
- Build + 31 tests green; PWA/offline; a11y pass (skip-link, reduced-motion, ARIA).
- Pitch docs already written in `docs/` (one-pager, deck, pilot-proposal, architecture, security-and-dpdp, sla-kpi, scaling-and-cost).

---

## 1. 🔴 Blockers — do these before the mail goes out

| # | Gap | Where | Fix |
|---|-----|-------|-----|
| 1.1 | **Placeholder helpline shipped** — Municipal/PWD shows `1800-XXX` as its emergency number. A government reviewer will spot this instantly and it looks unfinished. | `src/data/categories.ts:71` | Put the real municipal grievance number for the target state (e.g. **1913** / **155304** for ULB) or drop the helpline line for that dept. |
| 1.2 | **Confirm the live deploy is green** — recent fixes (Supabase URL guard, Gemini model, AI origin/403, AI low-confidence UX) are pushed; verify the production URL actually shows them and Google login + Analyse both work on the real domain. | Vercel prod | Redeploy, then manually run: Google login → report an issue → Analyse (real photo) → submit → dept dashboard. |
| 1.3 | **Vercel env sanity** — `VITE_SUPABASE_URL` must be the bare project root (no `/rest/v1`), anon key present, `GEMINI_API_KEY` set (done). `ALLOWED_ORIGINS` now optional; if set, must match the real domain. | Vercel → Settings → Env | Re-check the three values; redeploy after any change (Vite bakes them at build). |
| 1.4 | **Supabase redirect allow-list** — Google OAuth returns to `/report`; the domain must be allow-listed or login silently fails in prod. | Supabase → Auth → URL Config | Add `https://<your-domain>/*`. |
| 1.5 | **Decide the demo backend** — if you demo on **mock**, the "Demo OTP 1234 / any password" copy is fine and honest; if you demo on **real Supabase**, make sure Tester Mode is OFF in the prod build (`VITE_ENABLE_TESTER` unset) so nobody can mint admin sessions. | `src/config/brand.ts`, `PublicLogin.tsx:377` | Pick one; verify the tester panel is hidden on the URL you'll share. |

---

## 2. 🟡 Strongly recommended — cheap, high-credibility wins

| # | Gap | Where | Fix |
|---|-----|-------|-----|
| 2.1 | **Data-layer strings still English** in HI/TE/TA — department names/short-names and the conditional-routing `reason:`/`question:` hints (~60 strings) render in English even when the UI is Telugu/Tamil. Citizens in the report wizard will see mixed language. | `src/data/categories.ts` | Add `deptNames`/`deptReasons` to the locale files and localize via `tDept()` like `tCategory()`. (This is the "separate pass" I flagged earlier.) |
| 2.2 | **No React error boundary** — one render error blanks the whole app with a white screen; bad look mid-demo. | `src/main.tsx` / `App.tsx` | Wrap `<App/>` in an ErrorBoundary with a friendly "something went wrong, reload" fallback. |
| 2.3 | **SEO/social preview thin** — no Open Graph / Twitter card, so a pasted link in email/WhatsApp shows no image or summary. First impression for officials. | `index.html` | Add `og:title`, `og:description`, `og:image` (use `docs/screenshots` hero), `twitter:card`. |
| 2.4 | **Bundle is one 832 kB chunk** — slow first paint on the low-end phones this is pitched for; also trips the build warning. | `vite.config.ts` | Add `manualChunks` (split vendor/leaflet/i18n) or route-level `React.lazy`. Targets the exact audience claim ("built for low-end Android"). |
| 2.5 | **No `robots.txt` / `sitemap.xml`** — minor, but a polished gov-facing site usually has them. | `public/` | Add both; disallow `/api` in robots. |
| 2.6 | **Empty-state screenshots for the deck** — the demo data is TG/AP/TN cities (good); make sure the recorded demo uses seeded data so dashboards aren't empty. | `src/data/seed.ts` | Confirm seed loads on the demo URL; capture fresh screenshots for `docs/screenshots`. |

---

## 3. 🟢 Polish — do if time permits

| # | Improvement | Why it helps the pitch |
|---|-------------|------------------------|
| 3.1 | Remove the stray `console.*` (1 left) and add a lightweight client error logger. | Clean console during a shared-screen demo. |
| 3.2 | Add a short **"How AI triage works + its limits"** note near AI assist (esp. after the low-confidence fix). | Pre-empts the "is the AI reliable?" question officials always ask. |
| 3.3 | **Analytics CSV/PDF export** already exists — surface it in the demo script; officials love "export for the file." | Turns a feature into a selling point. |
| 3.4 | Loading skeletons instead of bare spinners on dashboard/detail. | Feels faster and more finished on slow networks. |
| 3.5 | Add a visible **app version / build stamp** in the footer. | Makes "we ship and iterate" tangible; useful for pilot feedback loops. |
| 3.6 | Confirm all four languages render the **login + report + track** happy path without layout breakage (TE/TA are longer strings). | The multilingual claim is a headline feature — make sure it demos cleanly. |
| 3.7 | Basic **Lighthouse pass** (perf/a11y/SEO/PWA) and paste the score into the one-pager. | A 90+ score is a concrete, credible number for the mail. |

---

## 4. Suggested order of attack (½–1 day to "send-ready")
1. **§1 blockers** (1.1 helpline + 1.2–1.5 deploy/env verification) — ~1–2 hrs, mostly checking.
2. **2.2 error boundary** + **2.3 OG tags** — ~1 hr, big credibility-per-minute.
3. **2.1 data-layer i18n** — ~1–2 hrs; only if a TE/TA-speaking reviewer will see the demo.
4. **2.4 code-split** + **3.7 Lighthouse** — ~1 hr; gives you a number to quote.
5. Re-run `npm run build && npm test`, redeploy, record demo, send mail.

---

## 5. What to explicitly say in the mail (turns gaps into strengths)
- "Runs on free-tier infra; **₹0** to pilot" — already true, lead with it.
- "**DPDP-aligned** from day one: private evidence, RLS, audit trail, right-to-erasure" — `docs/security-and-dpdp.md`.
- "Available in **English, Hindi, Telugu, Tamil**" — headline; make sure §2.1/§3.6 are clean if you say it.
- "**Neutral/white-label** — presented as a *proposed pilot*, not an unauthorized GoI claim" — `official=false` is deliberate and honest; call it out.
- Attach: one-pager + 2–3 screenshots + the live demo link.
