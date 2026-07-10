# Notifications — one-time setup (zero-budget)

The code is done (`api/notify.ts`, `public/sw.js`, `src/lib/push.ts`, the "Enable
alerts" button in My Reports). To make notifications actually **fire** when an
issue's status changes, wire the Supabase Database Webhook below. All free.

## What happens
A department updates an issue → a row is inserted into `issue_updates` → a
Supabase webhook POSTs that row to `/api/notify` → the function resolves the
issue's reporter and sends them a **Web Push** notification (and an **email** if
you configure one). SMS is deliberately not used (not free in India).

## 1. Set the shared secret (Vercel)
Vercel → Settings → Environment Variables:
- `NOTIFY_SECRET` = any long random string (e.g. `openssl rand -hex 32`)
Redeploy. Until this is set, `/api/notify` returns 503 (fails closed — good).

Also confirm these are already set (from the push/email setup):
- `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`

## 2. Create the Supabase Database Webhook
Supabase Dashboard → **Database → Webhooks → Create a new hook**:
- **Name:** `notify-on-issue-update`
- **Table:** `public.issue_updates`
- **Events:** `INSERT`
- **Type:** HTTP Request → **POST**
- **URL:** `https://<your-app-domain>/api/notify`
- **HTTP Headers:** add one header
  - `x-notify-secret` : `<the same NOTIFY_SECRET value>`
- Save.

That's it — status changes now push to the reporter.

## 3. (Optional) Email — free tier
Web Push covers Android/desktop and installed iOS PWAs (16.4+). To also email the
reporter (belt-and-braces, and the realistic channel for officials):
- Sign up for **Resend** (3,000 emails/mo free) — or Brevo (300/day free).
- Verify a sending domain/address.
- Vercel env:
  - `EMAIL_API_KEY` = your Resend API key
  - `EMAIL_FROM` = a verified sender, e.g. `JanVyuha <updates@yourdomain.in>`
- Redeploy. `api/notify` will look up the reporter's email (Supabase admin API)
  and send. If `EMAIL_API_KEY` is unset, email is silently skipped.

> Note: the default `.env` had `EMAIL_FROM=Resend`, which is a placeholder — it
> must be a real, verified from-address for email to send.

## 4. Test
1. As a citizen, open **My Reports** → **Enable alerts** (grant permission).
2. As the department (Tester Mode or a stakeholder login), advance that issue's
   status.
3. The citizen device should receive a push within a few seconds.

Check delivery in Supabase → Database → Webhooks → your hook → **Logs** (shows the
POST + response), and Vercel → your project → **Logs** for the `/api/notify` run.

## Security
`/api/notify` requires the `x-notify-secret` header on every call and fails closed
if `NOTIFY_SECRET` is unset. The notification click-through URL is forced to a
same-origin path, so it can't be pointed at a phishing site.
