# JanVyuha — Pre-Launch Gaps, Fixes & Improvements

**Purpose:** everything worth closing before you send the outreach mail / record the demo, ranked so you can stop at any line and still be in a defensible place.
**Legend:** 🔴 Blocker (do before sending) · 🟡 Strongly recommended · 🟢 Polish / nice-to-have · ✅ Done
**Status date:** 2026-07-08

> **Update (2026-07-08):** Everything code-side on this list is now DONE and committed —
> helpline (1.1), error boundary (2.2), OG/social tags (2.3), code-split + lazy routes (2.4),
> robots/sitemap (2.5), data-layer i18n (2.1), console cleanup (3.1), build stamp (3.5).
> What remains is **cloud-console / account work only you can do** — see the checklist at the bottom
> (§6) and the 🔴 items 1.2–1.5, which are verification steps on Vercel / Supabase / Google.

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
- "**No budget allocation, procurement, or hardware needed to evaluate** — the provider hosts the pilot; a costed scale-up plan is attached." (Superseded guidance: do **not** lead with "free/₹0" — see `outreach-email.md` positioning rules.)
- "**DPDP-aligned** from day one: private evidence, RLS, audit trail, right-to-erasure" — `docs/security-and-dpdp.md`.
- "Available in **English, Hindi, Telugu, Tamil**" — headline; make sure §2.1/§3.6 are clean if you say it.
- "**Neutral/white-label** — presented as a *proposed pilot*, not an unauthorized GoI claim" — `official=false` is deliberate and honest; call it out.
- Attach: one-pager + 2–3 screenshots + the live demo link.

---

## 6. 🔧 Cloud-console / account changes — ONLY YOU can do these (code can't)
Everything above is committed. These are the external settings to check/change. Nothing here needs a code edit.

### A. Vercel — Environment Variables (Settings → Environment Variables)
| Variable | Correct value | Notes |
|----------|---------------|-------|
| `VITE_SUPABASE_URL` | `https://vfbotszzyvefiparesbf.supabase.co` | **Bare project root** — no `/rest/v1`, no trailing slash. (Code now self-heals a mispaste, but fix the source too.) |
| `VITE_SUPABASE_ANON_KEY` | your anon key | No leading/trailing spaces. |
| `GEMINI_API_KEY` | your key | Already set (confirmed). Server-only — must NOT start with `VITE_`. |
| `ALLOWED_ORIGINS` | *(optional)* `https://jan-vyuha.vercel.app` | Now optional — same-origin is always allowed. Leave blank, or set to your final custom domain if/when you add one. |
| `VITE_ENABLE_TESTER` | **leave unset / delete** | If set to `true`, the Tester panel (instant admin/role switch) shows in production. Keep it OFF on the URL you share. |
| `VITE_BRAND` | *(optional)* e.g. `telangana` | Only if you want the Telangana-branded preset instead of neutral. Leave unset for neutral white-label. |

**After ANY env change:** you must **Redeploy** (Deployments → ⋯ → Redeploy). Vite bakes `VITE_*` values at build time; an env change does NOT affect the currently-live build until you rebuild.

### B. Vercel — trigger a fresh deploy now
The latest commits (all today's fixes) need to be live. Either push auto-deploys, or Deployments → Redeploy the latest. Then hard-refresh the site.

### C. Supabase — Auth → URL Configuration
- **Site URL:** `https://jan-vyuha.vercel.app` (or your custom domain).
- **Redirect URLs (allow-list):** add `https://jan-vyuha.vercel.app/**`
  Without this, Google login silently fails to return to the app after sign-in.
- If you add a custom domain later, add its `/**` here too.

### D. Google Cloud Console — OAuth (only if using real Google login)
In **APIs & Services → Credentials → your OAuth 2.0 Client** (the one whose ID Supabase uses for the Google provider):
- **Authorized JavaScript origins:** `https://jan-vyuha.vercel.app`
- **Authorized redirect URIs:** `https://vfbotszzyvefiparesbf.supabase.co/auth/v1/callback`
  (Supabase is the OAuth callback target, not your app.)
- Make sure the OAuth consent screen is Published (or your test Google account is added as a test user), else login is blocked.

### E. Supabase — schema & seed (if not already applied to this project)
- Run `supabase/schema.sql` then `supabase/seed.sql` in the SQL editor so the demo has data and RLS/policies exist. If your dashboards look empty on the live site, this is why.
- Confirm the private **`evidence`** storage bucket exists (schema creates it) so photo upload + signed URLs work.

### F. Google AI Studio — Gemini key sanity
- Key is set and verified working (we tested `/api/analyze` returns 200 with a real classification).
- Free tier is rate-limited; fine for a demo. If you expect heavy demo traffic, note the quota.

### G. (Optional) Custom domain
If you point a custom domain (e.g. `janvyuha.in`) at Vercel:
1. Add it in Vercel → Domains.
2. Update Supabase Site URL + Redirect URLs (C) and Google origins (D) to the new domain.
3. Update `og:url`/canonical if you add one.

### Final go-live smoke test (2 minutes, on the real URL)
1. Landing loads, switch language EN→TE→TA→HI — UI + department names + report wizard all translate.
2. Login (Google or phone/demo) → succeeds and returns to the app.
3. Report an issue → upload a real photo → **Analyse** → sensible category (or the "not a civic issue" notice for a non-photo).
4. Submit → appears in **My Reports** and on the relevant **department dashboard**.
5. Footer shows a `build <sha>` stamp (confirms the new deploy is live, not a stale cache).
