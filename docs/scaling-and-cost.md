# JanVyuha — Scaling & Cost (Honest)

The demo and a single-district pilot run at **₹0** on free tiers. This document
states the real ceilings so nobody is misled, and gives a costed upgrade path.

## Free-tier ceilings (as of 2026 — verify at signup)

| Service | Free tier (approx.) | What it limits |
|---|---|---|
| Supabase | ~500 MB Postgres, ~1 GB file storage, ~5 GB egress, ~50k MAU; **auto-pauses after ~7 days idle** | Total issues + evidence photos; concurrent realtime; project sleeps if unused before a demo. |
| Vercel | Hobby: 100 GB bandwidth, serverless limits, **non-commercial terms** | A government deployment likely needs a paid plan for ToS + scale. |
| Google Gemini | Low RPM/RPD on the free tier | AI triage throughput under load. |
| OpenStreetMap / Nominatim | Fair-use, ~1 req/s | Geocoding rate — cache and debounce (already debounced). |

**Interpretation:** free tier = **one-district pilot scale**. ~1 GB storage is a
few thousand evidence photos — a busy district produces that quickly. Treat free
tier as "prove the outcome", not "run a state".

## Mitigations already in place

- Evidence stored privately; can move to a cheaper object store later.
- AI endpoint rate-limited + size-capped to protect quota/cost.
- Nominatim usage is debounced and India-biased.
- Public data served from a lightweight curated view.
- App degrades gracefully — no key, no cost (demo mode).

## Costed upgrade path (indicative, INR/month — confirm current pricing)

| Stage | Supabase | Vercel | AI | Messaging | Notes |
|---|---|---|---|---|---|
| Pilot (1 district) | Free | Free/Hobby | Free | Web Push + email (free) | ₹0 |
| Multi-district | Pro (~$25) | Pro (~$20) | Pay-as-you-go | WhatsApp free tier | Low hundreds of ₹k? No — low tens of $/mo. |
| State | Team/Enterprise + read replicas, dedicated storage | Enterprise | Provisioned | SMS gateway (paid) + WhatsApp | Sized to population; add DB scaling & CDN. |

> Keep SMS as a **later, funded** channel; lead with free Web Push + email +
> WhatsApp free tier so the pilot needs no messaging budget.

## Architectural scaling (independent of hosting)

- **Jurisdiction routing** (state → district) is built in, so dashboards and RLS
  already scope by geography — the true prerequisite for scale.
- Backend is a single interface (`IssuesBackend`) — storage can be swapped or
  sharded without touching UI code.
- Realtime re-pull is simple now; at scale, move to row-level realtime deltas and
  pagination/virtualisation on dashboards.

## Recommendation

Run the free pilot to validate routing accuracy and response times, then approve
a modest paid tier sized to the rollout — with these numbers on the table, not a
blank cheque.
