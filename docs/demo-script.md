# Demo Script

Two scripts: a **60-second** version for the email video, and a **full
walkthrough** for a live meeting. Practice once so it flows. Record on the
**live production site** with pre-provisioned accounts (Tester panel is off in
production — that's correct; don't re-enable it for the video).

> Before recording/presenting: set `VITE_BRAND` and demo data to the
> recipient's state, confirm the build stamp in the footer is current, and use
> a clean browser profile so no dev artifacts appear.

---

## 60-second video script (voiceover + screen)

**[0:00–0:08] Hook.**
"When a fire breaks out, minutes matter. But citizens don't know which
department to call, and complaints get lost between helplines. JanVyuha fixes
the routing."

**[0:08–0:25] Citizen reports (screen: report flow).**
"A citizen snaps a photo, drops the location on the map, and picks a category —
say, a fire. Optional AI reads the photo and suggests the category and
severity. It works in English, Hindi, Telugu and Tamil — by voice too. One tap
to submit; it even works offline and sends when coverage returns."

**[0:25–0:40] The core guarantee (screen: two dashboards side by side).**
"That fire instantly appears on the **Fire** and **Ambulance** dashboards — and
**only** theirs. Not Police, not Electricity. This isolation is enforced in the
database, not just on the screen."

**[0:40–0:52] Oversight (screen: admin + analytics).**
"Officials get a full oversight console — SLA compliance, resolution times,
department performance, citizen satisfaction, hotspot maps — with a
tamper-evident audit trail, and citizens get status notifications and a public
transparency dashboard."

**[0:52–1:00] Close.**
"Multilingual, mobile-first, compliant with the DPDP Act, and ready for a
supervised district pilot — with no procurement needed to evaluate it."

---

## Full walkthrough (live meeting, ~8–10 min)

### 1. Frame the problem (1 min)
Siloed helplines, wrong routing, lost complaints, no unified official view — and
minutes lost in emergencies.

### 2. Citizen journey (2 min)
- Open **Report an issue**. Show the **language switcher** (flip to Telugu/Tamil/
  Hindi) — "built for every citizen." Mention **voice input** for low-literacy
  users.
- Pick **Fire Accident**, attach a photo (note it's downscaled and EXIF-stripped
  on the phone), **AI assist** suggests category + severity, set the location
  (GPS or map pin). Mention the **offline queue**: "no network? The report is
  saved and submits itself when coverage returns."
- Confirm the routed departments (the citizen confirms — no wrong department is
  ever alerted). Submit → a reference id.

### 3. The core guarantee (2 min) — *the money moment*
- Log in as **Fire** (pre-provisioned account): the report is there.
- Log in as **Police**: it is **not** — "different department, different data,
  enforced by Postgres Row-Level Security."
- Open the issue as Fire → advance status (Acknowledged → Responding → Done).
  Point out **per-department independent progress**, canned quick-notes, and
  the **Translate** button rendering the citizen's text in the official's
  language.
- The citizen's phone gets a **push notification** of the status change; after
  resolution they **rate** the outcome.

### 4. Officials' value (2 min)
- **Dashboard**: live counts, **SLA-overdue** flags, breach filter, bulk
  status actions, **hotspot cluster map**.
- **Analytics**: SLA compliance %, average resolution time, department
  performance table, **citizen satisfaction (CSAT)**, category + district
  views. **Export CSV / print PDF** for review meetings.

### 5. Governance & trust (1.5 min)
- **Admin console**: provision a department account (no self-registration —
  "officials are added by you, never open sign-up"), the **moderation queue**
  (spam/duplicates, one-click merge), the **audit log**, and the **Outreach**
  tab minting QR posters that deep-link straight into the wizard.
- **Public transparency dashboard**: anonymised, coarse location, open-data
  CSV/JSON download.
- One line on **DPDP**: consent, automatic retention-based anonymisation,
  self-serve account deletion, India data residency.

### 6. Cost & scale (1 min)
"For the pilot, I host and operate the platform — your department needs no
budget line, procurement, or hardware to evaluate it. Here is the transparent
scaling analysis: what the pilot configuration can handle, and exactly what a
multi-district or state rollout would cost." (Show `scaling-and-cost.md`.)

### 7. The ask (30 sec)
"A supervised pilot in one district, 8–12 weeks, with a nodal officer you
nominate. No cost to the department, no obligation beyond the pilot. I provide
the platform, training, and weekly metrics."

---

## Q&A — likely questions & crisp answers

- **"Is our data safe / who can see it?"** Enforced in the database — a department
  sees only its routed, in-jurisdiction reports; evidence is private; there's an
  audit trail. DPDP-aligned, India region. Happy to demonstrate the isolation
  live on real accounts.
- **"Who are you / can you sign an MoU?"** [Have your answer ready — this is the
  most common first question. A plain-language MoU draft is in the proposal
  pack.]
- **"What does it cost?"** Nothing for the department during the pilot — I host
  and operate it, and evaluating requires no procurement. The scale-up costs
  are published in the proposal, so there's no hidden commitment.
- **"Does it replace 112 / our existing portal?"** No — it complements them and
  says so in-app. Its contribution is correct first-time routing across
  departments and a unified, auditable view.
- **"Which languages?"** English, Hindi, Telugu, Tamil today — the full app,
  including department names; the translation layer accepts any Indian
  language.
- **"How do officials get accounts?"** You provision them from the admin console;
  citizens can never self-register as officials.
- **"Can it scale to the whole state?"** Routing is already jurisdiction-aware
  (state → district). The pilot configuration is one-district scale by design;
  the documented paid path covers multi-district and state.
- **"What about citizens without smartphones?"** The pilot targets smartphone
  users (installable web app, low-end Android friendly, voice input, four
  languages). Assisted reporting at ward offices and additional channels are on
  the scale-stage roadmap.
