# Deploy Guide — live demo on free tiers

Step-by-step to put JanVyuha online with a real Supabase backend (India region)
and Google sign-in, so you have a credible live demo to link in the tie-up email.
Target time: ~half a day. Everything here is **free** except phone/SMS (skip it).

**Order matters** — do Supabase first, then Google, then Vercel, then wire them
together, then verify security.

---

## 0 · Prerequisites

- The project pushed to a **GitHub** repo (Vercel deploys from it).
- Free accounts: **Supabase**, **Vercel**, **Google Cloud** (for OAuth).
- `npm run build && npm test` green locally (you've confirmed this ✅).

---

## 1 · Supabase (database, auth, storage) — India region

1. **supabase.com → New project.**
   - Region: **South Asia (Mumbai) / ap-south-1** ← important for data residency.
   - Set a strong database password (save it).
2. Wait for it to provision (~2 min).
3. **SQL Editor → New query** → paste all of [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
   - This creates tables, RLS, guard triggers, storage bucket, and the public feed.
4. (Optional demo data) New query → paste [`supabase/seed.sql`](../supabase/seed.sql) → **Run**.
5. **Settings → API** → copy for later:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; keep secret)
6. **Make yourself the first admin.** SQL Editor:
   ```sql
   insert into public.department_invites (email, role)
   values ('YOUR_EMAIL@gmail.com', 'admin');
   ```
   (You'll sign up with this email via Google in step 4 and be auto-provisioned as admin.)

---

## 2 · Google sign-in (free) — Google Cloud Console

1. **console.cloud.google.com** → create/select a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name, support
   email, developer email → Save. (Publishing status "Testing" is fine for a demo;
   add your test emails, or Publish for open access.)
3. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
   - Application type: **Web application**.
   - **Authorized redirect URI:** your Supabase callback —
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
     (find the exact value in Supabase → Authentication → Providers → Google.)
   - Create → copy the **Client ID** and **Client secret**.
4. In **Supabase → Authentication → Providers → Google** → enable → paste the
   Client ID + secret → **Save**.

> Phone OTP is optional and **not free** (needs an SMS provider). Leave it disabled
> for now and lead the demo with Google + email.

---

## 3 · Generate Web Push (VAPID) keys — free (optional but quick)

Locally:
```
npx web-push generate-vapid-keys
```
Copy the **Public Key** → `VITE_VAPID_PUBLIC_KEY`, **Private Key** →
`VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT=mailto:your@email`.

---

## 4 · Deploy on Vercel

1. **vercel.com → Add New → Project → Import** your GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output `dist` (from `vercel.json`).
3. **Environment Variables** — add these (Production):

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | from step 1.5 |
   | `VITE_SUPABASE_ANON_KEY` | from step 1.5 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1.5 (secret) |
   | `GEMINI_API_KEY` | your Gemini key (server-only) |
   | `VITE_BRAND` | `telangana` / `andhra` / `tamilnadu` / `national` |
   | `VITE_CONTACT_EMAIL` | a real inbox you monitor |
   | `VITE_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | from step 3 |
   | `ALLOWED_ORIGINS` | leave blank for now; set in step 5 |

   **Do NOT set `VITE_ENABLE_TESTER`** — leaving it unset keeps the Tester panel
   hard-off in production (that's the prod-lock).
4. **Deploy.** Note your URL, e.g. `https://janvyuha.vercel.app`.

---

## 5 · Wire them together (post-deploy)

1. **Supabase → Authentication → URL Configuration:**
   - **Site URL:** `https://janvyuha.vercel.app`
   - **Redirect URLs:** add `https://janvyuha.vercel.app/**`
     (so Google/magic-link redirects land back on your app.)
2. **Vercel → Settings → Environment Variables:** set
   `ALLOWED_ORIGINS=https://janvyuha.vercel.app` → **Redeploy** (so the AI endpoint
   only answers your site).

---

## 6 · Production hardening (final polish)

- ✅ `VITE_ENABLE_TESTER` unset → Tester panel off.
- ✅ `VITE_BRAND` set to the recipient's state.
- ✅ `VITE_CONTACT_EMAIL` set to a real inbox.
- Optional: add a **custom domain** in Vercel → Settings → Domains.

---

## 7 · Verify security on the LIVE site (do NOT skip — this is the pitch)

Open the deployed URL and confirm, on the **real** backend:

1. **Sign in with Google** → you land as **admin** (from step 1.6). Open
   `/admin` → provision a test **Fire** department account (add an email invite),
   and a **Police** account, each with a jurisdiction.
2. In a **separate browser/incognito**, sign up as those department users; sign in.
3. As a **citizen** (another account), file a **Fire** report.
4. **Confirm isolation:**
   - The Fire account **sees** it. ✅
   - The Police account **does NOT**. ✅
   - A different citizen **cannot** see it in "My Reports". ✅
5. **Evidence privacy:** copy an evidence image URL from a report and open it in a
   logged-out tab → it must **fail / require a signed URL**, not load publicly. ✅
6. **Admin:** the moderation queue and audit log populate. ✅

If all six pass, your "security enforced in the database" claim is now **proven on
real infrastructure** — that's the green light for outreach.

---

## 8 · Optional, later (free)

- **Web Push delivery:** create a **Supabase Database Webhook** on `issue_updates`
  INSERT that POSTs to `https://YOUR-SITE/api/notify` with the reporter's `userId`.
- **Email updates:** add `EMAIL_API_KEY` / `EMAIL_FROM` (Resend/Brevo free tier).
- **Phone OTP:** enable Supabase Phone provider + an SMS provider (paid).
- **Keep-alive:** free Supabase projects pause after ~7 days idle — schedule a
  simple cron ping (e.g. cron-job.org) so the demo is never asleep for a viewing.

---

## Troubleshooting

- **Google login loops / "redirect mismatch":** the redirect URI in Google Cloud
  must exactly match the Supabase callback, and your site URL must be in Supabase
  Redirect URLs.
- **"AI not configured" on Analyse:** `GEMINI_API_KEY` missing in Vercel, or you're
  hitting the mock (Tester Mode off in prod, so it uses the real proxy).
- **Blank dashboard for a department:** the account's `jurisdiction` doesn't match
  the issue's district — set it to the city/state or leave it blank ("all").
- **429 from /api/analyze:** the rate limit; expected under rapid repeated calls.
