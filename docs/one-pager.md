# JanVyuha — One-Page Brief

**A multilingual civic-issue and emergency reporting platform that routes every
report to exactly the right government department(s) — and proves, in the
database, that only they can see it.**

---

### The problem
Citizens don't know *which* department to contact, complaints are lost across
siloed helplines, and officials have no unified, accountable view. Emergencies
(fire, accidents) lose critical minutes to wrong routing.

### The solution
One report — a photo/video + a map pin — is **auto-classified** and **routed by
category and jurisdiction** to the responsible department(s). Each department
sees only its issues, acts on an independent timeline, and the citizen tracks
progress to resolution and rates the outcome. Optional AI (Google Gemini)
suggests the category and severity from the photo and can translate a citizen's
report into the official's language.

### Why it's credible to a technical review
- **Security enforced in Postgres (Row-Level Security), not just the UI.** A
  citizen cannot see other citizens' reports; a department cannot see issues
  outside its routing or jurisdiction; evidence photos are private (signed
  URLs); administrative actions land in a tamper-evident audit log.
- **Officials get oversight**: an admin console (account provisioning,
  moderation, duplicate-merge, audit log) and analytics — SLA compliance,
  resolution times, department performance, citizen-satisfaction scores,
  district views and hotspot maps, with CSV/PDF export.
- **Privacy by design (DPDP Act 2023)**: consent, purpose limitation, data
  minimisation, automatic retention-based anonymisation, self-serve right to
  erasure, and a coarsened public transparency feed with open-data export.
- **Engineering quality**: typed codebase, automated test suite, and CI on
  every change.

### Built for citizens in the field
- **Multilingual end-to-end** — English, हिन्दी, తెలుగు, தமிழ் (extensible),
  including department names and the reporting flow.
- **Works on low-end Android** — installable PWA; reports can be drafted
  offline and are submitted automatically when coverage returns; voice input
  for low-literacy users.
- **Citizens stay informed** — status notifications by Web Push and email, and
  a public transparency dashboard.
- **White-label** — deploys under any authority's identity.

### The pilot proposition
A **single-district supervised pilot** (8–12 weeks) with a nominated nodal
officer, to validate routing accuracy, response times and citizen adoption.
The provider hosts and operates the pilot; the department needs **no budget
allocation, procurement, or hardware to evaluate it**. A transparent, costed
scale-up plan (see the scaling & cost analysis) accompanies the proposal, so
the evaluation creates no hidden commitment.

### Departments covered
Fire · Ambulance · Police · Municipal/PWD · Electricity · Water · Animal Welfare

### Status
Working product with a live demonstration. Presented as an **independent pilot
proposal** — not an official government service, and not a replacement for
emergency helplines such as 112. Seeking a collaboration to run a supervised
pilot.

*Contact: see /contact in the app. All figures in the demo are illustrative.*
