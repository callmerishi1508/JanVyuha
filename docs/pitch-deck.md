# JanVyuha — Pitch Deck

> Slide-per-section. Present as-is, or paste into slides. Neutral / white-label —
> swap in the sponsoring authority's name and emblem per deployment (once
> authorised).

---

## 1 · Title
**JanVyuha** — Citizen reporting, routed to the right responders.
A multilingual civic-response platform, ready for a supervised district pilot.
*Pilot proposal for [Telangana / Andhra Pradesh / Tamil Nadu / DARPG–NITI Aayog].*

---

## 2 · The problem
- Citizens don't know which department to call; complaints scatter across helplines.
- Emergencies lose minutes to wrong routing.
- Officials lack a unified, accountable, data-driven view.
- Existing portals are often single-department, English-first, and desktop-first.

---

## 3 · The solution
A citizen files **one** report (photo/video + location). JanVyuha:
1. **Classifies** it (AI + rules) — category, severity, clean title.
2. **Routes** it to the responsible department(s) by **category + jurisdiction**.
3. Shows it **only** to those departments — enforced in the database.
4. Lets each department act independently and the citizen track to resolution
   and rate the outcome.

---

## 4 · Live demo (60 seconds)
Report a **Fire** → it appears for **Fire + Ambulance only**, never Police or
Electricity. Switch languages live. Open the **department dashboard** (SLA
overdue flags, bulk actions), the **admin console** (moderation, provisioning,
audit), and the **public transparency dashboard** (anonymised, with open-data
download).

---

## 5 · Why it earns a technical team's trust
- **RLS-enforced isolation** — not UI theatre. Citizens can't read others'
  reports; departments are scoped by routing *and* jurisdiction.
- **Private evidence** (signed URLs), **audit trail**, **guarded columns**,
  **admin-only provisioning** (no self-registration as "Police").
- **Abuse and cost controls** on the AI endpoint; rate-limited serverless APIs.
- **Engineering hygiene**: typed codebase, automated tests, CI on every change.

---

## 6 · What officials get
- **Oversight console**: cross-department view, account provisioning, moderation
  queue (spam/duplicates, one-click merge), tamper-evident audit log.
- **Analytics**: SLA compliance, response/resolution times, department
  performance, citizen-satisfaction (CSAT), category & district views, hotspot
  clusters on the map, CSV/PDF export.
- **Productivity**: SLA-breach filter, bulk status updates, canned responses,
  one-click translation of citizen reports into the official's language.

---

## 7 · Citizen experience
- Multilingual (EN/HI/TE/TA) end-to-end, mobile-first, installable PWA.
- **Offline report drafting** — the report queues on the phone and submits when
  coverage returns; **voice input** for low-literacy users.
- Track status, receive **Web Push + email** updates, **rate** the resolution.
- Report anonymously; exercise **right to erasure** (DPDP) self-serve.

---

## 8 · Compliance (DPDP Act 2023 + GIGW)
Consent · purpose limitation · data minimisation · automatic retention-based
anonymisation · self-serve erasure · grievance route · anonymised public data ·
India-region data residency · accessibility (WCAG 2.1 AA / GIGW).

---

## 9 · Architecture
React + Vite PWA · Supabase (Postgres/Auth/Storage/Realtime/RLS) · Google
Gemini (server-proxied) · OpenStreetMap · Vercel serverless. Managed services
only — no servers for the authority to run. Degrades gracefully — every flow is
demonstrable even with no keys configured (demo mode).

---

## 10 · Cost & scale (transparent)
- **Pilot (one district)**: hosted and operated by the provider at no cost to
  the authority; no procurement or hardware required to evaluate.
- **Scale-up**: a published, costed path (database tier, hosting tier, AI
  volume, SMS/WhatsApp messaging) — see `scaling-and-cost.md`. Capacity limits
  of the pilot configuration are stated openly, not discovered later.

---

## 11 · Roadmap
Pilot (8–12 wks, 1 district) → evaluate routing accuracy, response time,
adoption, satisfaction → multi-district → state → national reference
architecture (DARPG / NITI Aayog).

---

## 12 · The ask
A supervised **single-district pilot** with a nodal officer and a handful of
department accounts. No cost to the authority, no procurement, no obligation
beyond the pilot term. We provide the platform, training, and weekly metrics.

---

## 13 · Why now
Digital India and the DPDP Act set the direction; citizens already expect
app-grade services. JanVyuha is a working, compliant way to demonstrate
measurable outcomes in weeks — with the full cost of scale on the table before
any commitment.
