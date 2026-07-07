# JanVyuha — Pitch Deck

> Slide-per-section. Present as-is, or paste into slides. Neutral / white-label —
> swap in the sponsoring authority's name and emblem per deployment.

---

## 1 · Title
**JanVyuha** — Citizen reporting, routed to the right responders.
A zero-cost, multilingual civic-response platform.
*Pilot proposal for [Telangana / Andhra Pradesh / Tamil Nadu / NITI Aayog].*

---

## 2 · The problem
- Citizens don't know which department to call; complaints scatter across helplines.
- Emergencies lose minutes to wrong routing.
- Officials lack a unified, accountable, data-driven view.
- Existing portals are costly, English-only, and desktop-first.

---

## 3 · The solution
A citizen files **one** report (photo/video + location). JanVyuha:
1. **Classifies** it (AI + rules) — category, severity, clean title.
2. **Routes** it to the responsible department(s) by **category + jurisdiction**.
3. Shows it **only** to those departments — enforced in the database.
4. Lets each department act independently and the citizen track to resolution.

---

## 4 · Live demo (60 seconds)
Report a **Fire** → it appears for **Fire + Ambulance only**, never Police or
Electricity. Switch languages live. Open the **department dashboard** (SLA
overdue flags), the **admin console** (moderation, provisioning, audit), and the
**public transparency dashboard** (anonymised).

---

## 5 · Why it earns a technical team's trust
- **RLS-enforced isolation** — not UI theatre. Citizens can't read others'
  reports; departments are scoped by routing *and* jurisdiction.
- **Private evidence** (signed URLs), **audit trail**, **guarded columns**,
  **admin-only provisioning** (no self-registration as "Police").
- **Abuse/cost controls** on the AI endpoint.

---

## 6 · What officials get
- **Oversight console**: cross-department view, account provisioning, moderation
  queue (spam/duplicate), tamper-evident audit log.
- **Analytics**: SLA compliance, response/resolution times, department
  performance, category & district heatmaps, CSV/PDF export.
- **SLA escalation**: overdue reports flagged automatically.

---

## 7 · Citizen experience
- Multilingual (EN/HI/TE/TA), mobile-first, installable PWA, offline shell.
- Track status, get free **Web Push** + email updates, **rate** the resolution.
- Report anonymously; exercise **right to erasure** (DPDP).

---

## 8 · Compliance (DPDP Act 2023 + GIGW)
Consent · purpose limitation · data minimisation · retention · erasure ·
grievance route · anonymised public data · India-region data residency ·
accessibility (WCAG 2.1 AA / GIGW).

---

## 9 · Zero-budget architecture
React + Vite PWA · Supabase (Postgres/Auth/Storage/Realtime/RLS) · Google Gemini
(free tier) · OpenStreetMap · Vercel. **Every piece has a free tier.** Degrades
gracefully — runs with no keys at all (demo mode).

---

## 10 · Cost & scale (honest)
- **Pilot (one district)**: ₹0 on free tiers.
- **State rollout**: costed upgrade path (Supabase Pro, Vercel Pro, Gemini paid,
  SMS/WhatsApp) — see `scaling-and-cost.md`. Free tiers are framed as pilot-scale,
  not misrepresented as infinite.

---

## 11 · Roadmap
Pilot (8–12 wks, 1 district) → evaluate routing accuracy, response time, adoption
→ multi-district → state → national (NITI Aayog reference architecture).

---

## 12 · The ask
A supervised **single-district pilot** with a nodal officer and a handful of
department accounts. No procurement, no cost. We provide the platform, training,
and weekly metrics.

---

## 13 · Why now
Digital India + DPDP set the direction. JanVyuha is a working, compliant,
zero-cost way to demonstrate outcomes in weeks — then scale with confidence.
