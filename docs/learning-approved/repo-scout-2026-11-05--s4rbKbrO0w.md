# Repo Scout brief — 2026-11-05 — The Next New Thing

Video: "New AI creates YouTube videos, AI makes calls, & all the best releases" (https://www.youtube.com/watch?v=-s4rbKbrO0w), uploaded 2026-11-05. Status: PROPOSALS awaiting Harold. Written by Claude (scheduled Repo Scout, 2026-11-06 ~21:20 CT). Redundancy check: Site Bible names + grep of docs/, site-bibles/, /opt/sssbrain/docs and /opt listing on swadesoul (not a deep code audit). GitHub links verified via api.github.com on 2026-11-06.

| # | Item | Verdict | Where it fits / what we already have | Cost | First test |
|---|---|---|---|---|---|
| 1 | Headless/faceless AI documentary maker ($27/mo) | EXISTS + EXTEND | Swideo already has a Faceless route; sssbrain-remotion and HyperFrames render. Gap: a "documentary" template (narration + real images + sound design) for Black Tales / ABAGALE TV explainer channels. Paid product stays WATCH. | $0 on our stack | One 2-minute Frequency Run lore documentary in Swideo |
| 2 | Karpathy's curated personal YouTube ("HackerTube") | EXTEND | ABAGALE TV channels and Maestro Radio already curate. Gap: a "my clean feed" channel type (family/kids-safe, only approved creators) as an ABAGALE TV channel package. Repo karpathy/hackertube returned 404: link not found. | $0 | Spec one kids-safe ABAGALE channel from an allowlist |
| 3 | Subvocal AirPods dictation | — | Duplicate of brief 2026-11-06 #2 (WATCH). | — | — |
| 4 | Omnisend: Instagram "comment a word → get it by email + join newsletter", agentic newsletter | EXTEND | SwadeMail (mailcow) + SSS Brain social are ours. Gap: comment-keyword → email capture funnel (RhoWatt-style: conversation → capture → categorized follow-up). Omnisend/ManyChat are paid: WATCH. Instagram API access unverified; any sending stays approval-gated. | $0 if built; vendors paid | Design the keyword → landing → SwadeMail list flow for one Black Tales post |
| 5 | AI Designer (design library via MCP, ~$10/mo) | WATCH | Covered by free design skills (Impeccable, queue #2). | Paid | None |
| 6 | Logit (shared expense splitting) | SKIP | Not an ecosystem fit. | — | — |
| 7 | Grok calls companies for you (negotiates with hard limits, conferences you in) | EXTEND | DNA Front (Twilio + LiveKit + realtime voice) is the right home. Gap: an outbound "call on my behalf" mode with founder-set hard limits, transcript, and warm transfer to Harold. Outbound calls to third parties need explicit per-call approval. | $0 build; telephony minutes are spend (rule 13) | Dry-run script against an internal test number only |
| 8 | Grok shopping / price comparison | SKIP | Not a gap worth building now. | — | — |
| 9 | "De-slop your vibe-coded site" service ($3,750, 3 days, credit toward later work) | NEW (play) | SWOSTing service menu / consulting (fits the "get paid for strategic value" rule). Productize: Site polish = Impeccable pass + Site Standard v1 + Lovable de-branding (rule 16). Pricing is Harold's call; publishing stays gated. | $0 | Draft one SWOSTing service card for approval |
| 10 | Feed Off (hide social feeds on phone) | SKIP | — | — | — |
| 11 | Beacon (turns debugging sessions into reusable skills) | EXTEND | We have repair-kit-known-failures.md (RK catalog) and rule 11 "proven fixes". Gap: automatic capture — after any fix, write the incident + fix as an RK entry/skill instead of relying on the AI to remember. Link not found (open source per video). | $0 | Find repo; hand-convert last week's top fix to the RK format it produces |
| 12 | Fluid Voice (free local dictation) — https://github.com/altic-dev/FluidVoice (GPL-3.0) | WATCH | Desktop/Mac app; Harold is iPad-first. GPL-3 limits reuse inside closed products. | $0 | None |
| 13 | Remotion recap of a long document | EXISTS (queued) | Queue 2026-10-29 #12 "Doc-to-video recap button". Not re-queued. | — | — |

Top 3 recommended: #11 Beacon-style auto fix capture (makes SwadePower/RK smarter every fix), #9 "Site polish" service for SWOSTing (revenue), #7 DNA Front call-on-my-behalf mode (strong demo of DNA Front).
