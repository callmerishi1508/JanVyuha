# JanVyuha — SLA & KPI Definitions

Pilot defaults — tune per state policy. Implemented in `src/lib/analytics.ts`.

## Service-level targets (by severity)

| Severity | Acknowledge within | Resolve within |
|---|---|---|
| Critical | 15 minutes | 4 hours |
| High | 1 hour | 24 hours |
| Moderate | 4 hours | 72 hours |
| Low | 24 hours | 7 days |

- **Acknowledge breach**: still `reported` past the acknowledge target → flagged
  "Awaiting ack".
- **Resolution breach**: still open past the resolve target → flagged "SLA
  overdue" on the department dashboard and counted in analytics.

## KPIs surfaced to officials

- **Volume**: total reports, open, critical-open, resolved.
- **Timeliness**: average resolution time; **SLA compliance %** (share within SLA).
- **Throughput**: resolution rate (resolved ÷ total).
- **Department performance**: per-department total / open / resolved / avg resolve
  / breaches (leaderboard).
- **Geography**: reports by district (heatmap) for resource planning.
- **Trend**: daily new reports (14-day).
- **Citizen satisfaction**: post-resolution 1–5★ rating (engagement KPI).
- **Integrity**: moderation queue size, duplicates merged, audit events.

Exports: **CSV** (all listed columns incl. resolution time) and **PDF/print** for
review meetings.

## Suggested pilot success criteria

- ≥ 90% of reports routed to the correct department without manual re-routing.
- Median acknowledge time within target for ≥ 80% of critical/high reports.
- ≥ 70% citizen satisfaction (4–5★) on resolved reports.
- Duplicate rate identified and merged; spam held before reaching field teams.
