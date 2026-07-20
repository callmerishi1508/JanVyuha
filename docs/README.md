# JanVyuha — Documentation

Official-facing and technical documentation for the JanVyuha civic-response
platform. Start with the one-pager, then the deck.

| Doc | For | Contents |
|---|---|---|
| [one-pager.md](one-pager.md) | Everyone | The whole pitch on one page. Export to PDF for outreach. |
| [pitch-deck.md](pitch-deck.md) | Decision-makers | Slide-per-section narrative. |
| [pilot-proposal.md](pilot-proposal.md) | Sponsoring authority | Scope, asks, governance, cost & commitment, success criteria, timeline. Export to PDF for outreach. |
| [architecture.md](architecture.md) | Technical team | System diagram, data model, serverless endpoints, quality gate. |
| [security-and-dpdp.md](security-and-dpdp.md) | Security / legal | Enforced controls + DPDP Act 2023 mapping + GIGW + honest limitations. |
| [sla-kpi.md](sla-kpi.md) | Operations | SLA targets and the KPIs officials get. |
| [scaling-and-cost.md](scaling-and-cost.md) | Finance / IT | Pilot-configuration ceilings + costed upgrade path. |
| [competitive-landscape.md](competitive-landscape.md) | You + meetings | Every comparable system (CPGRAMS, Swachhata, 112, DIGIT/UPYOG, state & city apps, intl.), our differentiation, honest gaps, per-conversation positioning. |
| [deploy-guide.md](deploy-guide.md) | You | Step-by-step: Supabase (India) + Vercel + Google login + full env table + live security verification. |
| [notifications-setup.md](notifications-setup.md) | You | One-time webhook wiring that makes push/email notifications fire. |
| [pre-outreach-checklist.md](pre-outreach-checklist.md) | You | Final gate: live-deploy verification, console wiring, outreach package, send-day runbook. |
| [outreach-email.md](outreach-email.md) | You | Final cover emails + researched recipient plan (who, in what order, where to find addresses). |
| [applications-tsic-thub.md](applications-tsic-thub.md) | You | Ready-to-paste TSIC + T-Hub application answers, cover emails, and sequencing (the warm-introduction channels). |
| [send-prep-worksheet.md](send-prep-worksheet.md) | You | Every letter/application placeholder resolved or assigned + send-day order. |
| [demo-script.md](demo-script.md) | You | 60-second video script + full live-walkthrough + Q&A. |
| [mou-template.md](mou-template.md) | You + legal | Plain-language pilot MoU / data-sharing template (the "who are you / on what terms" answer). |
| [pre-launch-gaps-and-improvements.md](pre-launch-gaps-and-improvements.md) | You | Historical launch checklist + the cloud-console actions only you can do. |
| [next-level-roadmap.md](next-level-roadmap.md) | You | The full improvement roadmap with per-phase completion records. |

**Positioning:** JanVyuha is presented as an **independent pilot proposal** —
not an official government service. The pilot is provider-hosted at no cost to
the authority (no procurement needed to evaluate), with a transparent costed
scale-up path; avoid "free/₹0" claims in official-facing material. Branding is
white-label (`VITE_BRAND`) so it can be shown under Telangana, Andhra Pradesh,
Tamil Nadu, or a national framing.

Developer setup and env keys: see the top-level [README](../README.md) and
[.env.example](../.env.example).
