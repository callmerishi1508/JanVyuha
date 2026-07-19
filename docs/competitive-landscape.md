# JanVyuha — Competitive Landscape & Differentiation

Researched July 2026. Purpose: know every system an official will compare us
to, answer "how is this different from X?" credibly, and position JanVyuha as
a **complement to official channels, not a rival claim**. Sources at the end.

---

## 1 · The landscape at a glance

| System | Operator | Scope | Multi-dept routing | Emergency depts | Languages | Public transparency | Weak spot (documented) |
|---|---|---|---|---|---|---|---|
| **CPGRAMS** (pgportal.gov.in) | DARPG, GoI | All ministries + states, grievance text | ✗ one office at a time; forwarding chains | ✗ | EN/HI + some | Disposal counts only | ~50% satisfaction; "disposal ≠ resolution"; no consequence architecture (IMPRI) |
| **Swachhata-MoHUA** | MoHUA (built by Janaagraha/ICMYC) | Sanitation categories only, ULB-level | ✗ ward sanitary inspector | ✗ | EN/HI + several | City dashboards (SBM) | Category-locked (garbage/toilets); no escalation matrix (user reviews) |
| **112 India / ERSS** | MHA / C-DAC | Emergency SOS (voice-first) | ✓ dispatch of police/fire/medical | ✓ | Many | ✗ | No civic issues; no photo-evidence workflow; no follow-up transparency |
| **DIGIT PGR / UPYOG** | eGov Foundation / NIUA | Municipal services stack (PGR one module), 19 states | ✗ within one ULB's departments | ✗ | Configurable | Dashboards for govt | Enterprise deployment (SI + program, months); municipal-only; AP case study: fragmented channels, Spandana more popular |
| **Prajavani** (Telangana) | GoTS | State grievances; walk-in Tue/Fri + portal | ✗ level-wise escalation, single office | ✗ | TE/EN | ✗ | Portal-era UX; 1 MB attachment cap; no map/photo-first flow |
| **My GHMC** (Hyderabad) | GHMC | Municipal complaints + services | ✗ GHMC only | ✗ | Mostly EN | ✗ | User-reported ~40% resolution; no cross-dept view |
| **Spandana / PGRS + Mana Mitra** (AP) | GoAP / RTGS | Grievances (1902) + 1,126 WhatsApp services; AI4PGRS coming | ✗ | ✗ | TE/EN | ✗ | Multiple parallel channels; WhatsApp = Meta dependency; AI grievance layer still rolling out |
| **Namma Chennai** (GCC) | Chennai Corp | Municipal complaints | ✗ GCC only | ✗ | TA/EN | ✗ | Documented privacy leak (complainant contact info exposed); staff discouraging complaints (TNM) |
| **FixMyStreet** (mySociety) | Open source, intl. | Street defects → correct council | Partial (picks ONE authority by location+type) | ✗ | Configurable | ✓ public reports | Email-to-council model; street scope; no dept dashboards or SLA analytics in core |
| **SeeClickFix / 311 CRM** | CivicPlus (US, paid SaaS) | City service requests | ✗ city workflow | ✗ | EN-first | ✓ public feed | US-market, per-seat SaaS pricing, no DPDP/India fit |
| **ICMYC / Reap Benefit** | NGOs | Complaint forwarding / youth civic action | ✗ | ✗ | Partial | ✓ community feed | Sits outside govt systems; "marked resolved without justification" reviews |

Two structural observations fall out of this table:

1. **Every citizen-facing system is single-authority.** A complaint goes to *the*
   ULB, *the* ward engineer, *the* ministry desk. When an incident genuinely
   concerns several departments (a fallen electric pole blocking a road; a fire
   needing ambulance cover; a contaminated water leak on a municipal street),
   today's systems either force the citizen to guess one channel or spawn
   forwarding chains — the exact failure CPGRAMS is criticised for.
2. **Civic and emergency are separate worlds.** 112/ERSS dispatches responders
   but takes no civic reports and produces no public accountability data;
   grievance portals take civic reports but exclude Fire/Ambulance/Police
   entirely. The photo-verified urgent incident that deserves both a fast
   response *and* a tracked, auditable record has no home.

---

## 2 · What JanVyuha does that nothing in the table does

**1. Parallel multi-department routing with independent per-department status.**
One report fans out to *every* department that must act (core + citizen-
confirmed conditional departments), and each gets its **own** status timeline
on the same issue (`issue_department_status`). Fire can be "done" while
Municipal is still "responding" — visible on one screen. No comparable system
routes one report to N departments simultaneously; CPGRAMS-style systems
serialise through forwarding.

**2. Civic + emergency-adjacent categories in one flow** — Fire, Ambulance,
Police alongside Municipal, Electricity, Water, Animal Welfare — with severity
SLAs (15-min acknowledge for critical) rather than a uniform 21-day grievance
clock. Positioned carefully: JanVyuha **complements 112**, it never claims to
replace it, and says so in-app.

**3. Access control that is *verifiable*, not asserted.** Department isolation,
jurisdiction scoping, column immutability and private evidence are enforced in
Postgres RLS — a reviewer's DBA can attempt cross-department reads in an hour
and fail. The market shows why this matters: Namma Chennai was reported to
expose complainants' contact information to the public. Our evidence photos are
private-bucket + signed URLs; the public feed is a PII-free, location-coarsened
view.

**4. A consequence architecture at the transparency layer.** The documented
CPGRAMS critique is that disposal numbers substitute for resolution and nothing
follows from poor handling. JanVyuha ships the counter-mechanism: post-
resolution **citizen ratings aggregated into CSAT**, a **public department
leaderboard**, anonymised **open-data CSV/JSON export**, and a tamper-evident
audit log. Departments are compared publicly on resolution rate and time —
transparency pressure as the enforcement no internal system provides.

**5. Full-stack Indian-language parity, including the data layer.** Not just UI
chrome: department names, routing reasons, confirmation questions, severities
and statuses are translated (EN/HI/TE/TA, 679+ keys × 4), with **voice input**
in all four and AI translation of citizen text for officials. Municipal apps in
the table are largely English-first with partial local-language coverage.

**6. Field-reality engineering.** Installable PWA (no Play Store gatekeeping),
offline draft + queued submit for dead zones, client-side image downscale +
EXIF/GPS strip, low-end-Android-first UI. Swachhata requires a native app
install; portal systems assume connectivity.

**7. AI-assisted triage that stays honest.** Photo → suggested category +
severity, with explicit low-confidence/not-a-civic-issue signalling, always
citizen-overridable, never on the critical submit path. AP's in-progress
AI4PGRS validates the direction; none of the deployed systems above do
photo-based triage today.

**8. Evaluation speed.** DIGIT/UPYOG is the credible incumbent platform for
full municipal stacks — and its deployments are programs: system integrator,
configuration, months. JanVyuha is a single managed-stack deployment a district
can evaluate in **weeks**, provider-hosted, no procurement. Different weight
class, different purpose.

### The one-sentence differentiator

> Existing channels answer *"how do I complain to this department?"* —
> JanVyuha answers *"I don't know whose problem this is"*: one report, routed
> in parallel to every department that must act, with database-enforced proof
> that only they can see it and a public scoreboard of how fast they resolved it.

---

## 3 · Where incumbents beat us (answer honestly when asked)

- **Mandate and users.** Swachhata has ~1.7 crore users and an official
  mandate; Prajavani/Spandana are staffed official channels. We have a working
  platform and zero users — which is precisely why the ask is a supervised
  pilot to generate evidence, not adoption on faith.
- **WhatsApp reach.** Mana Mitra's 58-lakh-user WhatsApp model outreaches any
  app or PWA. We deliberately use free channels (Web Push + email) for the
  pilot; WhatsApp Business API is a costed scale-stage item, and the deferred
  Telegram bot is our free analogue if a state wants chat-first.
- **Assisted / offline-population channels.** MeeSeva centres and Prajavani
  walk-ins serve citizens without smartphones. Our pilot is smartphone-first;
  assisted reporting at ward offices is on the scale roadmap (an operator can
  file on a citizen's behalf today, but there is no dedicated kiosk mode).
- **Call-centre integration.** States think in helplines (1902, 1913, 112). We
  have no telephony today; a helpline operator UI is a straightforward
  scale-stage addition but is not built.
- **Ecosystem/certification.** DIGIT is MIT-licensed, DPG-certified, with an
  SI ecosystem and 19-state UPYOG footprint. We are a single-provider platform;
  for a state-wide permanent system, we'd expect a formal procurement in which
  those attributes matter. The pilot's job is to prove the *routing and
  transparency model*, which can then inform whatever stack the state
  standardises on.
- **Reopen flow.** Swachhata lets a citizen reopen an unsatisfactory
  resolution; our equivalent is the rating loop (a poor rating flags the
  issue) — a one-click "reopen" is a small, planned addition.

None of these are reasons to delay a pilot; all are reasons the pilot is scoped
to one district with the scale path costed separately.

---

## 4 · Positioning per conversation

- **vs CPGRAMS / Prajavani / Spandana (grievance stacks):** "Complementary
  front door for *incident-type* civic reports — photo + location + parallel
  department routing + public accountability — feeding your existing review
  mechanisms. An export/API bridge into your PGRS is feasible in the pilot."
- **vs Swachhata:** "Same citizen gesture, wider surface: not only sanitation
  wards but seven departments including utilities and emergency-adjacent ones,
  with jurisdiction-aware routing and open data per department."
- **vs My GHMC / Namma Chennai / PuraSeva (municipal apps):** "Those are
  single-authority by design. JanVyuha is the cross-department layer — and our
  isolation model means adding departments *increases* privacy guarantees
  rather than widening access."
- **vs 112:** "We never touch life-safety dispatch. We catch the photo-verified
  urgent-but-not-SOS incident, route it to the right responders' queues, and
  leave an auditable public record — 112 stays the number you call."
- **vs DIGIT/UPYOG:** "Not a rival stack — a fast, self-contained pilot of a
  routing + transparency model. If the state later standardises on UPYOG, the
  pilot's category taxonomy, SLA definitions and open-data format carry over."
- **If asked "why not just use FixMyStreet?"** — FixMyStreet picks *one*
  authority per report and emails it; no per-department dashboards, SLA
  analytics, jurisdiction RLS, DPDP mapping, or Indian-language data layer.
  We're India-first where it's UK-first.

---

## 5 · Watchlist (re-check before each outreach round)

- **AP AI4PGRS / Mana Mitra grievance layer** — the fastest-moving comparable;
  if AP ships conversational grievance filing state-wide, sharpen our pitch
  there toward multi-department routing + transparency (their stack remains
  single-office routing).
- **Telangana Prajavani grassroots expansion** (Revenue Division → Mandal
  level, unified digital platform directive) — an opening: they are actively
  procuring/building exactly this category; our pilot evidence would land well.
- **UPYOG PGR adoption** in TG/AP/TN municipalities — if a target city adopts
  it, lead with the complement story, not replacement.
- **TN's new government** — likely to announce its own citizen-service
  initiative; watch for it and align naming/positioning.

---

## Sources

National: [CPGRAMS](https://pgportal.gov.in/) · [IMPRI CPGRAMS critique](https://www.impriindia.com/insights/policy-update/beyond-digital-box-ticking-a-critical-analysis-of-indias-cpgrams/) · [PIB Feb 2026 CPGRAMS PQ](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2226247&reg=3&lang=1) · [Swachhata-MoHUA (Play)](https://play.google.com/store/apps/details?id=com.ichangemycity.swachhbharat) · [PIB Swachhata](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1620847) · [112.gov.in](https://112.gov.in/) · [MHA ERSS](https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss)
Platforms: [DIGIT PGR brochure](https://docs.digit.org/local-governance/v2.8/products/modules/public-grievances-and-redressal/pgr-brochure) · [Digit-Core (GitHub)](https://github.com/egovernments/Digit-Core) · [eGov AP PGR case study](https://egov.org.in/whitepaper/public-grievance-redressal-for-urban-e-governance-in-andhra-pradesh/) · [eGov DOT 2025 / UPYOG 19 states](https://egov.org.in/newsletter/dot-yearend-2025/) · [FixMyStreet (GitHub)](https://github.com/mysociety/fixmystreet) · [Open311](https://www.open311.org/) · [SeeClickFix](https://seeclickfix.com/)
States: [Prajavani](https://prajavani.cgg.gov.in/) · [Prajavani grassroots expansion](https://www.thehansindia.com/telangana/prajavani-services-to-be-extended-at-grassroots-level-across-telangana-1069491) · [My GHMC coverage](https://munsifdaily.com/my-ghmc-app-simplifies-civic-services/) · [GHMC channels](https://x.com/GHMCOnline/status/1951509445386657876) · [MeeSeva](https://www.telangana.gov.in/services/meeseva-services/0/) · [Spandana](https://annamayya.ap.gov.in/service/spandana/) · [Mana Mitra scale](https://www.bizzbuzz.news/national/andhrapradesh/mana-mitra-to-offer-1126-govt-services-now-1396971) · [AP AI4PGRS](https://www.deccanchronicle.com/southern-states/andhra-pradesh/naidu-orders-simpler-public-services-expands-digital-grievance-redressal-1967032) · [Namma Chennai privacy report](https://www.thenewsminute.com/tamil-nadu/field-staff-discourage-us-filing-complaints-residents-flag-namma-chennai-app-135406)
NGO/private: [ICMYC](https://www.janaagraha.org/i-change-my-city/) · [Reap Benefit](https://hundred.org/en/innovations/reap-benefit)
