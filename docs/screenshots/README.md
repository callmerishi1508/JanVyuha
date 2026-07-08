# Screenshots — capture guide

These images are used in the pitch deck, one-pager, email attachments, and the
`og:image` social preview. **Recapture them after the 2026-07-08 changes** — the
existing set predates the full multilingual UI, the AI-triage "not a civic issue"
notice, and the localized department names, so they undersell the current app.

## What to capture (filename → shot)

| File | Page / state | Why it sells |
|------|--------------|--------------|
| `01-landing.png` | Landing (top hero + routing preview) | First impression; also feeds `public/og-image.png`. |
| `02-report.png` | Report wizard, **Departments step** | Shows the core idea: one report → the *right* departments, citizen-confirmed. |
| `03-dashboard.png` | Department dashboard with seeded issues + map | The official's daily view; SLA tiles + list + map. |
| `04-analytics.png` | Analytics (KPIs + charts + dept table) | "Export for the file" — SLA %, resolution time, heatmap. |
| `05-transparency.png` | Public transparency dashboard | Public accountability with no PII (coarsened location). |
| `06-admin.png` | Admin console (Accounts or Audit tab) | Governance: invite-only roles, moderation, audit trail. |
| `07-multilingual.png` | **NEW — same screen in Telugu or Tamil** | The headline differentiator; capture the report wizard or landing in a non-English language. |
| `08-ai-triage.png` | **NEW — AI assist suggestion on a real photo** | Photo → suggested category/severity; shows the AI feature working. |

## How to capture (clean, consistent)

1. **Use the live/seeded demo** so dashboards aren't empty. If local: `npm run dev`,
   open Tester Mode, pick a role, and make sure `seed.ts` data loaded.
2. **Browser at ~1440px wide**, 100% zoom, light mode. Hide bookmarks bar.
3. **Full-page or clean viewport** — no browser chrome if possible (DevTools device
   toolbar → "Capture full size screenshot", or a full-page capture extension).
4. For the **multilingual shot (07)**: switch the language via the header switcher to
   **తెలుగు** or **தமிழ்**, then capture the report wizard — the category names,
   severity, department names, and hints should all be in-language.
5. For the **AI shot (08)**: on the report wizard, upload a genuine civic photo
   (pothole, garbage, fallen tree), press **Analyse**, and capture the suggestion card
   *before* applying it.
6. Export as **PNG**, keep them ~1600–2880px wide. Overwrite the same filenames so the
   deck/one-pager links keep working.

## Notes
- `01-landing.png` is copied to `public/og-image.png` for the social link preview —
  after recapturing the landing shot, re-copy it:
  `cp docs/screenshots/01-landing.png public/og-image.png`
- Keep total attachment size reasonable for email — 2–3 best shots inline, the rest
  in the deck/one-pager.
- Don't show the Tester Mode panel in any shared screenshot (it's a dev tool).
