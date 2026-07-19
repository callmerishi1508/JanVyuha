# JanVyuha — Pilot Proposal

**For:** Government of Telangana / Andhra Pradesh / Tamil Nadu · and DARPG /
NITI Aayog (as a national reference). White-label — presented under the
sponsoring authority's identity once authorised.

## Objective
Run a supervised pilot to validate that category + jurisdiction routing improves
civic and emergency response, and to measure routing accuracy, timeliness, and
citizen adoption — producing evidence for a scale decision.

## Scope (recommended)
- **One district / city** and a small set of departments (e.g. Fire, Police,
  Ambulance, Municipal, Electricity, Water, Animal Welfare).
- **Duration:** 8–12 weeks.
- **Users:** general public (open) + admin-provisioned department
  accounts, scoped to the pilot jurisdiction.

## What the provider supplies
- The full platform, hosted and operated by the provider for the pilot period
  at no cost to the authority, on managed cloud infrastructure in the India
  region. No procurement, budget allocation, or hardware is required from the
  authority to run the pilot.
- Admin console for the nodal officer to provision/suspend department accounts.
- Multilingual UI (EN/HI/TE/TA), installable on any Android phone, with offline
  report drafting and voice input.
- Citizen status notifications (Web Push + email) and a post-resolution
  satisfaction rating loop.
- Weekly KPI reports (SLA compliance, resolution times, department performance,
  citizen satisfaction), plus CSV/PDF export and a public transparency
  dashboard with open-data download.
- Onboarding + a short training session for department staff.
- Security & DPDP documentation for the review team.

## What we ask from the authority
- A **nodal officer** to coordinate and act as the first admin.
- **Department contacts** (emails) to be added to the invite allow-list.
- Permission to display the authority's identity (once authorised) and to run a
  bounded citizen awareness push in the pilot area.
- A designated **Grievance Officer** for DPDP, published on launch.

## Governance & compliance
- Data in India region; access enforced by database Row-Level Security; private
  evidence storage; tamper-evident audit log.
- DPDP-aligned consent, minimisation, automatic retention-based anonymisation,
  and self-serve erasure (see `security-and-dpdp.md`).
- No self-registration of officials — accounts are admin-provisioned only.
- The platform complements, and clearly states in-app that it does not replace,
  statutory emergency channels such as 112.

## Cost & commitment
The pilot is provided at no cost to the authority and creates no procurement or
financial commitment. Should the authority decide to scale after the pilot, a
transparent, costed plan (infrastructure tiers, messaging, capacity — see
`scaling-and-cost.md`) is part of this proposal, so the total cost of ownership
is visible before any commitment is made.

## Success criteria (agree upfront)
- ≥ 90% correct routing without manual re-routing.
- Acknowledge-within-target for ≥ 80% of critical/high reports.
- ≥ 70% citizen satisfaction (4–5★) on resolved reports.
- Demonstrated duplicate merging and spam moderation.

## After the pilot
- Joint review of KPIs → decision on multi-district / state rollout.
- Costed upgrade path (see `scaling-and-cost.md`) sized to the rollout.
- Optional national reference architecture (DARPG / NITI Aayog).

## Timeline (indicative)
| Week | Milestone |
|---|---|
| 0 | Provision project (India region), brand, admin + department accounts. |
| 1 | Department training; seed jurisdictions; go-live in pilot area. |
| 2–10 | Operate; weekly KPI reviews; tune SLAs/routing. |
| 11–12 | Final evaluation report + scale recommendation. |

*All demo figures are illustrative. This is a pilot proposal, not an offer of an
official government service.*
