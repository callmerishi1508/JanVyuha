# JanVyuha — Scaling & Cost (Transparent)

A single-district pilot runs on managed-cloud free tiers, hosted and operated
by the provider at **no cost to the sponsoring authority**. This document states
the real capacity ceilings of that configuration so nobody is misled, and gives
a costed upgrade path for scale. Present it alongside the proposal — the
credibility comes from publishing the limits, not hiding them.

## Pilot-configuration ceilings (as of 2026 — verify at signup)

| Service | Pilot tier (approx.) | What it limits |
|---|---|---|
| Supabase | ~500 MB Postgres, ~1 GB file storage, ~5 GB egress, ~50k MAU; **auto-pauses after ~7 days idle** | Total issues + evidence photos; concurrent realtime; project sleeps if unused before a demo (keep-alive ping mitigates). |
| Vercel | Hobby: 100 GB bandwidth, serverless limits, **non-commercial terms**; ≤ 2 daily crons | An official deployment needs the paid plan for ToS + scale; retention + digest crons already fit the limit. |
| Google Gemini | Low RPM/RPD on the free tier | AI triage/translation throughput under load (AI is optional and off the critical submit path). |
| OpenStreetMap / Nominatim | Fair-use, ~1 req/s | Geocoding rate — already proxied, throttled, and cached per policy. |

**Interpretation:** the pilot configuration is genuinely **one-district scale**.
~1 GB storage is a few thousand evidence photos — a busy district produces that
in months, not years. The pilot proves the outcome; the paid tiers below run a
state. Photos are downscaled client-side (~10–30× smaller) before upload, which
stretches these ceilings considerably.

## Mitigations already built in

- Client-side image downscaling before upload (storage + bandwidth).
- Evidence stored privately; can move to a cheaper object store later.
- AI endpoint rate-limited + size-capped; AI is assist-only, never required.
- Geocoding proxied with compliant headers, throttled, cached client-side.
- Public data served from a lightweight curated view (CDN-cacheable).
- App degrades gracefully — every flow works with no keys configured.

## Costed upgrade path (indicative, confirm current pricing)

| Stage | Supabase | Vercel | AI | Messaging | Indicative total |
|---|---|---|---|---|---|
| Pilot (1 district) | Free tier | Hobby | Free tier | Web Push + email (free tiers) | Provider-borne; no cost to the authority |
| Multi-district | Pro (~US$25/mo) | Pro (~US$20/mo/seat) | Pay-as-you-go (low) | Email volume tier; WhatsApp Business API conversation pricing | Roughly US$50–100/mo (~₹4–8k) + messaging volume |
| State | Team/Enterprise, read replicas, dedicated storage | Enterprise | Provisioned throughput | SMS gateway (DLT-registered) + WhatsApp | Sized to population; budget via a short joint capacity exercise |

> Messaging strategy: the pilot uses **Web Push + email**, which have no
> per-message cost. SMS in India requires a funded, DLT-registered gateway —
> deliberately deferred to the scale stage and priced there, never hidden.

## Architectural scaling (independent of hosting)

- **Jurisdiction routing** (state → district) is built in, so dashboards and RLS
  already scope by geography — the true prerequisite for scale.
- Backend is a single interface (`IssuesBackend`) — storage can be swapped or
  sharded without touching UI code.
- Realtime re-pull is simple now; at scale, move to row-level realtime deltas and
  pagination/virtualisation on dashboards (documented, known trade-off).

## Recommendation

Run the provider-hosted pilot to validate routing accuracy and response times,
then approve a modest paid tier sized to the rollout — with these numbers on
the table from day one, not a blank cheque.
