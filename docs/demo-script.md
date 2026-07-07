# Demo Script

Two scripts: a **60-second** version for the email video, and a **full
walkthrough** for a live meeting. Practice once so it flows. Use the Tester panel
(dev mode) to switch roles instantly, OR pre-provision real accounts on the
deployed demo.

> Before recording/presenting: reseed demo data for the recipient's city, set
> `VITE_BRAND`, and (for the recorded video) hide the Tester panel or use pre-made
> accounts so it looks production-clean.

---

## 60-second video script (voiceover + screen)

**[0:00–0:08] Hook.**
"When a fire breaks out, minutes matter. But citizens don't know which department
to call, and complaints get lost. JanVyuha fixes the routing."

**[0:08–0:25] Citizen reports (screen: report flow).**
"A citizen snaps a photo, drops the location on the map, and picks a category —
say, a fire. Optional AI reads the photo and suggests the category and severity.
One tap to submit."

**[0:25–0:40] The core guarantee (screen: two dashboards side by side).**
"That fire instantly appears on the **Fire** and **Ambulance** dashboards — and
**only** theirs. Not Police, not Electricity. This isolation is enforced in the
database, not just the screen."

**[0:40–0:52] Oversight (screen: admin + analytics).**
"Officials get a full oversight console — SLA compliance, resolution times,
department performance, district heatmaps — and a tamper-evident audit trail."

**[0:52–1:00] Close.**
"Multilingual, mobile-first, and it runs at zero cost on free infrastructure.
Ready for a district pilot today."

---

## Full walkthrough (live meeting, ~8–10 min)

### 1. Frame the problem (1 min)
Siloed helplines, wrong routing, lost complaints, no unified official view — and
minutes lost in emergencies.

### 2. Citizen journey (2 min)
- Open **Report an issue**. Show the **language switcher** (flip to Telugu/Tamil/
  Hindi) — "built for every citizen."
- Pick **Fire Accident**, attach a photo, **AI assist** suggests category +
  severity, set the location (GPS or map pin).
- Confirm the routed departments (note the citizen confirms — no wrong department
  is ever alerted). Submit → a reference id.

### 3. The core guarantee (2 min) — *the money moment*
- Log in as **Fire** (Tester → As Fire): the report is there.
- Log in as **Police**: it is **not** — "different department, different data,
  enforced by Postgres Row-Level Security."
- Open the issue as Fire → advance status (Acknowledged → Responding → Done).
  Point out **per-department independent progress**.

### 4. Officials' value (2 min)
- **Dashboard**: live counts + **SLA-overdue** flags on breaching reports.
- **Analytics**: SLA compliance %, average resolution time, department performance
  table, category + district heatmaps. **Export CSV / print PDF** for review
  meetings.

### 5. Governance & trust (1.5 min)
- **Admin console**: provision a department account (no self-registration —
  "officials are added by you, never open sign-up"), the **moderation queue**
  (spam/duplicates), and the **audit log**.
- **Public transparency dashboard**: anonymised, no personal data, coarse location.
- One line on **DPDP compliance** + **India data residency**.

### 6. Cost & scale (1 min)
"Everything you saw runs on free tiers — a district pilot costs nothing. Here's the
honest scaling analysis and a costed path to a state rollout." (Show
`scaling-and-cost.md`.)

### 7. The ask (30 sec)
"A supervised pilot in one district, 8–12 weeks, with a nodal officer. No cost, no
obligation. We provide the platform, training, and weekly metrics."

---

## Q&A — likely questions & crisp answers

- **"Is our data safe / who can see it?"** Enforced in the database — a department
  sees only its routed, in-jurisdiction reports; evidence is private; there's an
  audit trail. DPDP-aligned, India region.
- **"Who are you / can you sign an MoU?"** [Have your answer ready — this is the
  most common first question.]
- **"What does it cost?"** Zero to pilot. Costed upgrade path for state scale.
- **"Does it replace 112?"** No — it complements emergency numbers; that's stated
  in-app.
- **"Which languages?"** English, Hindi, Telugu, Tamil today; easily extended.
- **"How do officials get accounts?"** You provision them from the admin console;
  citizens can never self-register as officials.
- **"Can it scale to the whole state?"** Routing is already jurisdiction-aware
  (state → district). Free tier = district pilot; documented paid path for scale.
