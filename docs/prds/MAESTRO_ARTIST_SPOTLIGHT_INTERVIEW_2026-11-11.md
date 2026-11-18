# Maestro Artist Spotlight Interview — $100 premium product
Date: 2026-11-11. State: founder requested strategy; NOT checkout-active, NOT publicly offered, NO new GPU spending. SWADEBASE and Maestro product roadmap; artist interviews may involve AI DJ and/or human guest.

## Customer promise (proposed)
- $100 single purchase: up to 20 minutes recorded artist interview, up to 10 minutes preproduction/sound check, original DJ introduction/outro, edited 15–20-minute audio program subject to approved quality/rights, one standard correction pass, 2 short social audio/video promo clips generated from approved interview with caption/transcript, artist profile link, owner-scheduled radio exposure only when station policy and rights permit. No guaranteed audience, plays, charting, streaming royalties, or editorial endorsement. Terms must distinguish purchased production from airtime and paid disclosure.
- Reservation/checkout holds an interview slot only after verified payment and capacity confirmed; allow one reschedule within policy. Do not launch if no operational GPU provider ready or delivery mechanism verified. Consent for public interview and clip reuse; recording consent laws and rights disclosure appropriate to participants' jurisdictions. No artist impersonation.
- Optional live call-in producer and multi-guest sessions require verified LiveKit mixer/broadcast bridge. Private recording can precede that upgrade.

## Provider preference and quality gates
1. RunPod: use existing authenticated account and worker manager, qualified 48GB GPU as first candidate for PersonaPlex v1; compare Kyutai Moshi. Test 24GB GPU only if real profiler proves load/headroom and stable streaming. Prefer scheduled warm Pod for booked 30–45-minute interview if serverless cold start disrupts UX. One session per GPU by default until measured concurrency. No unapproved service activation.
2. Together AI: use only if an actual compatible realtime speech-to-speech endpoint is verified for model/streaming, otherwise it can supply cheap LLM turn planning, not a drop-in PersonaPlex stream. Do not claim the model is hosted there.
3. Hostinger GPU: reserve for heavy or long sessions only if provisioned and all-inclusive effective cost is lower; current inspected SWADEBASE CPU node has no NVIDIA GPU exposed.
4. GPT Live 1: quality fallback for a paid, consented interview ONLY when API entitlements and tracked limits are verified. GPT Live session cost at $0.05/min, extra tool/backend usage separately; 20 min=$1.00, 30 min=$1.50, 60 min=$3.00 baseline. Route per-session from customer's confirmed order budget, NOT owner's unbounded wallet. For concurrent requests reserve estimated spend before call and stop/switch when cap reached; no surprise paid provider fallback.
5. Existing free SWADE Voice Studio: safe noninteractive spoken content / prerecorded reply fallback; do not label it full duplex if latency not proven.

## Suggested $100 internal cost allocation (policy, not accounting)
$15 reserved for GPU/voice compute, processing and retries; $10 processing, clips, storage and delivery contingency (includes actual Stripe processing, varying by payment region); $15 customer service, rework and refunds reserve; $60 gross contribution target before additional overhead/tax/labor. These are reserve targets NOT actual expenses nor profit forecasts. Per-order external provider hard limit $15 inclusive of GPU, GPT Live, inference, voice generation. Founder approves actual external spend separately under active payment/spend policy; existing RunPod prepaid balance is not carte blanche.
Refund and failed production policy required: never treat purchase proceeds as instantly available; Stripe fees/refunds/disputes/reserves. Track exact cost/order only after ledger record and verified provider invoice. $100 price must not auto-top-up OpenAI or start GPU as an uncontrolled side effect.

## Runtime orchestration
Payment confirmed -> store encrypted customer order entitlement -> rights/voice/publication consents -> choose DJ avatar/approved voice -> artist intake and title/name pronunciation -> generate bounded fact sheet (artist-supplied, no fabricated achievements) -> reserve recording slot -> choose RunPod qualified warm session -> LiveKit browser mic with guest/host separate tracks -> low-latency AI agent mixing/streaming and optional human producer -> capture both sides only after consent -> QA/edit original clip via existing SWADE CPU FFmpeg and B2 storage -> artist approvals -> schedule with commercial/paid disclosure -> deliver clips and tracking.
Do not route paid AI dialogue directly into station's public feed until separate DJ handoff and audio bridge gates passed. Build dedicated isolated test station.

## Latency test matrix and acceptance before sell
Evaluate PersonaPlex then Moshi on RunPod 48GB. 20+ consecutive 10min simulated interviews, at least 5 real mic tests from desktop/iPad, 3 interruptions per session, profanity/error recovery and consent, mixed network quality. Instrument browser capture->server first-output audio latency p50<500 ms, p95<1200 ms goal, dropout and accidental overlap rate, GPU boot time, real spending and GPU memory, maximum one interview/session per GPU until measured. These are TARGETS not measurements. A test may establish unsuitability. Benchmark GPT Live fallback with same prompts/devices. Test scheduled start availability and scale-to-zero after capture and cleanup. No telemetry of private conversation contents unless consented.

## Modes / safe pricing
$100 recorded interview product is launch candidate; live radio appearance optionally scheduled only after rights/editorial checks. No free unlimited trials of GPU audio, no model GPU kept warm 24/7 for sporadic sessions. Buffer/preshow music or backstage lobby during warmup; do not switch model mid-word without a clear transition. Disclosure that AI host is AI. Future higher price for live broadcast or added guests after measuring cost and capacity; not presumed.

## Reusable adapters
Re-use `voice.personaplex` disabled source candidate, existing SWADE Studio CPU voice, `dnafront.voice`, shared LiveKit, Maestro DJ, B2, shared Stripe merchant, existing RunPod manager and SWADE usage ledger. Single API: `interview.quote`, `interview.reserve`, `interview.status`, `interview.cancel`, `interview.deliver`, plus `voice.session` runtime. Tenant-specific identity, limits and founder exemption. Do not duplicate billing, queue, storage, CRM, auth, or radio engine.

## First go/no-go
A: verify RunPod pricing and GPU capability via a no-spend configuration audit, NVIDIA PersonaPlex weight license acceptance with owner's action, then owner-approved capped GPU benchmark.
B: only after benchmarks and test checkout/capture/delivery meet quality gate, implement $100 Stripe SKU and refund logic through existing verified merchant; no automatic emails without consent and owner-approved content.
C: start with few private interviews and published approvals; monitor show retention, completed deliveries, per-interview costs, refunds and fan engagement; expand only if economics/quality positive.

## Sources
RunPod official published November 9, 2026 GPU rates https://www.runpod.io/pricing ; OpenAI GPT Live price https://developers.openai.com/api/docs/pricing ; PersonaPlex code/model terms https://github.com/NVIDIA/personaplex ; Moshi https://github.com/kyutai-labs/moshi . No paid API test performed.
