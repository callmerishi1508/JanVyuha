# Send-Prep Worksheet — every placeholder, resolved

Companion to `outreach-email.md` and `applications-tsic-thub.md`. Work top to
bottom; when every ☐ is ☑ the Telangana batch can go out same-day.

---

## A · Placeholders that are already decided (fill once, reuse everywhere)

| Placeholder | Value | Used in |
|---|---|---|
| `[demo URL]` / `[prod URL]` | `https://jan-vyuha.vercel.app` (or custom domain if added) | all letters, both applications |
| `[sandbox URL]` | pending — second Vercel project (deferred; letters work without it — drop the sandbox line until it exists) | letters, applications |
| `[State]` (first batch) | Telangana | letter A |
| `[Telugu / Tamil]` (first batch) | Telugu | letter A |
| Pilot ask | one district, 8–12 weeks, nodal officer (fixed copy — no decision) | everywhere |

## B · Placeholders only you can fill (decide once)

| Placeholder | Decision needed | Notes |
|---|---|---|
| `[Your full name]` | — | Same spelling everywhere, incl. TSIC registration. |
| `[city]` | your city | "based in [city]" appears in both applications. |
| `[Phone]` | a number you answer | Officials call before they write. |
| `[Email]` | professional address | Same one for TSIC/T-Hub/letters — replies must land in one inbox. |
| **"Who is we"** | individual now / entity name | If individual: use the ready line — "Individual developer; entity registration in progress, planned before any MoU." Decide the entity type (sole prop / LLP / Section 8) before any meeting; see `mou-template.md`. |
| Grievance Officer (DPDP) | you, by name, until an entity exists | Needed in the privacy policy + first meeting. |
| `[video URL]` | record → upload unlisted (YouTube/Drive) | Blocks the letters; script in `demo-script.md`. Letters can technically go without it, but the video roughly doubles engagement — record first. |
| `[Name, Designation]` per recipient | verify on official portals **on send day** | Table in `outreach-email.md`; TG: it.telangana.gov.in + telangana.gov.in directory. |
| `[registration id/date]` | from TSIC innovator registration | Goes in the cinno@ email + T-Hub form. |

## C · Attachments to produce (once)

- ☐ `one-pager.pdf` — export `docs/one-pager.md` (print-to-PDF from any
  markdown preview is fine; A4, margins ~2cm).
- ☐ `pilot-proposal.pdf` — export `docs/pilot-proposal.md`.
- ☐ Keep both under 5 MB combined. Everything else stays a link.

## D · Same-day verifications (per batch)

- ☐ Phone smoke-test of the prod URL (build stamp → languages → login →
  wizard → reopen button visible on a resolved report).
- ☐ Recipient names/emails re-verified on the official portal (same day).
- ☐ `VITE_BRAND=telangana` live; Hyderabad data on the map.
- ☐ Supabase not asleep (open the site; set up keep-alive if not yet).
- ☐ Video link works logged-out / incognito.

## E · Send-day order (Telangana batch)

1. TSIC innovator registration → cinno@ email (with registration id).
2. T-Hub government contact form.
3. Letter → Special Chief Secretary ITE&C desk (verified name).
4. Letter → Minister's office (note that the department desk was also written).
5. Letter → GHMC Commissioner.
6. Log all five (date, office, address) → calendar day-8 follow-ups.

Then AP (RTGS CEO, ITE&C Secretary, Minister's office, GVMC) after re-brand +
reseed check; TN last, after verifying the new government's IT leadership.
