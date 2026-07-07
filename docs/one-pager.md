# JanVyuha — One-Page Brief

**A zero-cost, multilingual civic-issue & emergency reporting platform that routes every report to exactly the right government department(s) — and proves, in the database, that only they can see it.**

---

### The problem
Citizens don't know *which* department to contact, complaints are lost across
siloed helplines, and officials have no unified, accountable view. Emergencies
(fire, accidents, missing persons) lose critical minutes.

### The solution
One report — a photo/video + a map pin — is **auto-classified** and **routed by
category and jurisdiction** to the responsible department(s). Each department
sees only its issues, acts on an independent timeline, and the citizen tracks
progress to resolution. Optional AI (Google Gemini) suggests the category,
severity and a clean title from the photo.

### Why it's credible to a technical review
- **Security enforced in Postgres (Row-Level Security), not just the UI.** A
  citizen cannot see other citizens' reports; a department cannot see issues
  outside its routing or jurisdiction; evidence photos are private (signed URLs).
- **Officials get oversight**: an admin console (account provisioning, moderation,
  audit log) and analytics (SLA compliance, resolution times, department
  performance, district heatmaps, CSV/PDF export).
- **Privacy by design (DPDP Act 2023)**: consent, purpose limitation, data
  minimisation, right to erasure, coarsened public data.

### Why it's a fit for government today
- **₹0 to pilot** — runs entirely on free tiers (Supabase, Vercel, Gemini free
  tier, OpenStreetMap). No procurement needed to demonstrate value.
- **Multilingual** — English, हिन्दी, తెలుగు, தமிழ் (extensible).
- **Works on low-end Android** — installable PWA, offline shell, mobile-first.
- **White-label** — deploys under any authority's identity.

### What we're asking for
A **single-district pilot** (one city/department cluster) with a nominated nodal
officer, for 8–12 weeks, to validate routing accuracy, response times and citizen
adoption — then a costed path to state-wide rollout.

### Departments covered
Fire · Ambulance · Police · Municipal/PWD · Electricity · Water · Animal Welfare

### Status
Working product with a live demo. Presented as an **independent pilot proposal**
— not yet an official government service. Seeking a collaboration to run a
supervised pilot.

*Contact: see /contact in the app. All figures in the demo are illustrative.*
