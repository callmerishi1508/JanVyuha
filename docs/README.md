# JanVyuha — Documentation

Official-facing and technical documentation for the JanVyuha civic-response
platform. Start with the one-pager, then the deck.

| Doc | For | Contents |
|---|---|---|
| [one-pager.md](one-pager.md) | Everyone | The whole pitch on one page. |
| [pitch-deck.md](pitch-deck.md) | Decision-makers | Slide-per-section narrative + 60-second demo script. |
| [pilot-proposal.md](pilot-proposal.md) | Sponsoring authority | Scope, asks, governance, success criteria, timeline. |
| [architecture.md](architecture.md) | Technical team | System diagram, data model, backend abstraction. |
| [security-and-dpdp.md](security-and-dpdp.md) | Security / legal | Enforced controls + DPDP Act 2023 mapping + GIGW. |
| [sla-kpi.md](sla-kpi.md) | Operations | SLA targets and the KPIs officials get. |
| [scaling-and-cost.md](scaling-and-cost.md) | Finance / IT | Honest free-tier ceilings + costed upgrade path. |
| [deploy-guide.md](deploy-guide.md) | You | Step-by-step: live demo on Supabase (India) + Vercel + Google login + security verification. |
| [pre-outreach-checklist.md](pre-outreach-checklist.md) | You | Everything to verify/fix/prepare before emailing. |
| [outreach-email.md](outreach-email.md) | You | Ready-to-adapt cover emails (state + NITI Aayog) + follow-up. |
| [demo-script.md](demo-script.md) | You | 60-second video script + full live-walkthrough + Q&A. |
| [mou-template.md](mou-template.md) | You + legal | Plain-language pilot MoU / data-sharing template (the "who are you / on what terms" answer). |

**Positioning:** JanVyuha is presented as an **independent, zero-cost pilot
proposal** — not yet an official government service. Branding is white-label
(`VITE_BRAND`) so it can be shown under Telangana, Andhra Pradesh, Tamil Nadu, or
a national (NITI Aayog) framing.

Developer setup and env keys: see the top-level [README](../README.md) and
[.env.example](../.env.example).
