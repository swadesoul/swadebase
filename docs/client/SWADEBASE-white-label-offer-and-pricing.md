# SWADEBASE white-label offer and pricing analysis

*Owner-only working document for Swade Soul. Prepared Oct 24, 2026 (CT). Not a public page and not a client handout. Prices were checked on Oct 24, 2026 unless a source says otherwise. Anything not taken from a source is marked **(estimate)**. Vendors change prices often, so re-check them before quoting a client.*

---

## 1. Executive summary

**The offer.** Each client gets their own copy of SWADEBASE, branded as theirs and running on two private servers in a separate Hostinger account. It includes the private database and logins (self-hosted Supabase), company mail (Mailcow), app hosting with auto-deploy (Coolify), the SSS Brain workspace (wiki, CRM, journal, vault, knowledge base), an adapter registry where every tool has its own on/off switch, self-monitoring, nightly offsite backups, a research lab (REA), and local AI (Ollama). On top of that core, an industry pack is switched on: general business, record label, video, commerce, or real estate.

**What it replaces.** For a typical 5-person business it fully or partly replaces a CRM starter plan, a newsletter tool, a team wiki, an automation tool, a password manager, uptime monitoring, app hosting, a backend/auth service, and part of a team AI chat plan. At monthly list prices that stack is about **$551/month** (section 4). The industry packs can partly replace another **$40–$625/month** of tools, depending on the industry.

**Why it's better.**
- The client owns the system: their data, servers and accounts are in their name.
- They get one bill instead of a dozen.
- Any piece can be switched off without taking the business down.
- A daily memory keeps knowledge from walking out the door.
- SWADEBASE runs the operations for them.

**Where it isn't better (being honest).**
- It doesn't replace live-chat help desks, e-signature, scheduling links, music distribution, sample libraries, text-based video editing, remote recording studios, or MLS/IDX lead-gen platforms (section 3).
- Some modules are only partly built (section 2).
- Copying the system for a new client is still being turned into a repeatable playbook, so the first few clients will be partly custom work.

**Recommended price** (details in section 7):

| Tier | One-time setup | Monthly (up to 5 users) | What's on |
|---|---|---|---|
| **Core** | **$2,500** | **$299/mo** | Full core, smaller server pair |
| **Industry Pack** | **$4,000** | **$499/mo** | Core + one industry pack, larger server pair |
| **Full** | **$6,000** | **$799/mo** | Core + all packs, higher support allowance |
| AI usage (all tiers) | — | Prepaid credits, billed at provider cost + 15% **(estimate)** | Topped up automatically |

- Extra users: **$25/user/mo (estimate)**.
- Estimated steady-state gross margin is **about 37–45% a month** after hosting at renewal prices, Stripe fees and support time. During the 24-month intro hosting term, which the setup fee prepays, the margin is higher.
- Client-facing line: **"You pay one bill; AI usage is prepaid and topped up automatically."**

**Separate paid layer.** The Grok Bot assistant layer ("Big Mamma": email triage, chat, browser automation, file work) is **not part of SWADEBASE**. It is a separate paid add-on and is not included in any tier or cost figure below.

---

## 2. Inventory: what exists today

Status key: **LIVE** means running and verified on Oct 24, 2026. **PARTIAL** means it exists but is limited or not fully verified. **PLANNED** means it is not built yet.

| Piece | Status | Notes (from SWADEBASE / Swadebase 2 / repo checks) |
|---|---|---|
| Self-hosted Supabase (Postgres, GoTrue auth, storage, realtime, Kong) | LIVE | On SWADEBASE (8 vCPU / 32 GB / 387 GB). No Supabase cloud, per standing rules. |
| Company mail (Mailcow) | LIVE | Self-hosted mailboxes. Bulk/transactional sending goes through Resend or SES. |
| Local AI (Ollama) | LIVE | Two small models, e.g. qwen3:4b, used for intent classification. Not frontier-grade chat. |
| App hosting with git autodeploy (Coolify 4.5.0) | LIVE | Swadebase 2 hosts SSS Brain prod (autodeploys `main`) and Rakazo. Swadebase 2 is memory-tight (2 vCPU / 8 GB, swap 91% used), which is why the client sizing below is larger. |
| Nightly offsite backups | LIVE | pg_dump plus storage copied to Backblaze B2, 14-day local retention. Oct 24 run succeeded (224 MB dump). |
| Adapter registry and kill switch (SWADE Adapter Contract v1) | LIVE | 12 adapters registered and enabled. Owner console with Ollama advisor. |
| Owner console and client-docs page | LIVE | Owner login only. |
| SSS Brain workspace: wiki, knowledge base, journal, vault, CRM, constellation, voice, downloads, REA panel, white-label guide | LIVE | Per-user row security. |
| REA research lab (study a feature on another site, show evidence, plan a build) | LIVE (review) / PARTIAL (build) | The review pipeline works. Build dispatch is disabled. |
| Voice / TTS (Kokoro + RunPod serverless) | LIVE | |
| Speech-to-text and captions (sssbrain-stt, VideoSayWhat) | LIVE | |
| Music: ReSing mix worker, music module | LIVE / PARTIAL | Mixing works. Mastering quality vs. LANDR is not benchmarked. |
| Narration pipeline (Black Tales) | LIVE | |
| Stripe payments code in SSS Brain | LIVE / PARTIAL | Checkout code exists. Not a full storefront (no inventory or shipping). |
| Daily memory log | LIVE | Daily file in `/opt/swadebase/docs/daily/`. |
| Autoheal (self-repair) | PARTIAL | Allowlist is only 2 services (imgproxy, meta). Autofix is off by default. Never touches payments, auth, DB or code. |
| Corporate Advisor (entities, deadlines, paperwork) | PARTIAL | Content and routes exist. How deep it goes is not verified. |
| Agent handoff log | PARTIAL | The `agent_handoffs` table is not created yet. |
| Repeatable "copy the whole system for a new client" Hostinger playbook | PLANNED | The first clients will be partly hand-built. |
| Real estate pack (listings, IDX, showing scheduling) | PLANNED | Only CRM, documents and AI follow-up exist today. |
| Grok Bot assistant layer ("Big Mamma") | Separate product | Separate paid layer. Not part of SWADEBASE. |

---

## 3. Mapping: SWADEBASE vs. tools businesses pay for

Prices are public list prices, per month, US$. "Monthly" means billed month-to-month and "annual" means the per-month rate on an annual plan. Match: **Full** = a real equivalent; **Partial** = covers the main job with clear gaps; **No** = not replaced.

### 3a. General business

| Tool people buy | List price | SWADEBASE equivalent | Match | Honest gap |
|---|---|---|---|---|
| HubSpot Starter Customer Platform | $20/seat monthly ($15 annual) [S1] | SSS Brain CRM | Partial | No email sequences, forecasting or marketing hub |
| Salesforce Starter Suite | $25/user [S2] | SSS Brain CRM | Partial | Same as above |
| Mailchimp Standard (500 contacts) | $20 [S3] | Mailcow + Resend/SES sending | Partial | No drag-and-drop campaign builder or list analytics UI |
| Loops Growth | $49 (5k contacts) [S3] | Same | Partial | Same |
| Notion Business | $24/member monthly ($20 annual) [S4] | SSS Brain wiki, knowledge base, journal | Full (wiki/docs) | No real-time co-editing like Notion |
| Confluence Standard | $720/yr for 1–10 users (≈$60/mo) [S4] | Same | Full (wiki) | Same |
| Zapier Team | $103.50 monthly ($69 annual) [S5] | Adapter registry + hosted services | Partial | No no-code automation builder; Swade builds the connections |
| 1Password Teams Starter Pack | $24.95/mo for up to 10 (annual) [S6] | SSS Brain vault + server secrets store | Partial | No browser autofill extension or mobile apps |
| Intercom Essential / Zendesk Suite Team | $39/seat monthly / $69/agent monthly [S7] | — | No | No live-chat widget or help-desk inbox |
| UptimeRobot Solo | $13 monthly [S8] | Self-monitoring console | Full (internal monitoring) | — |
| Atlassian Statuspage Hobby | $29 [S8] | — | No | No public status page or subscriber alerts |
| Datadog | (usage-based, not priced here) | Logs + console | No | No APM or tracing |
| Vercel Pro / Netlify Pro / Heroku Basic | $20/seat / $20 flat / $7 per dyno [S9] | Coolify on the client's VPS | Full | No global edge network; one region |
| Auth0 B2C Essentials / Supabase Pro | $35 (500 MAU) / $25 + usage [S10] | Self-hosted Supabase (GoTrue, Postgres, storage) | Full | The client depends on SWADEBASE for patching instead of a vendor SLA |
| ChatGPT Business / Claude Team | $25/seat monthly ($20 annual) [S11] | Ollama local models + metered API models | Partial | Small local models are not frontier chat; frontier use is metered |
| Calendly Teams | $20/seat monthly ($16 annual) [S12] | — | No | Keep Calendly |
| DocuSign Standard | $30/user (annual) [S12] | — | No | Keep DocuSign |
| Northwest / LegalZoom registered agent | $125/yr / $249/yr [S13] | Corporate Advisor (deadline tracking only) | No (the legal service) / Partial (the tracking) | A registered agent is a legal service; keep one |

### 3b. Record label / music

| Tool | List price | SWADEBASE equivalent | Match | Gap |
|---|---|---|---|---|
| Suno Premier / Pro | $30 / $10 monthly [S14] | Music generation through the AI usage bucket (e.g. MiniMax Music 1.5 at $0.03/song [S20]) | Partial | Different models and quality. No Suno Studio editor. |
| Udio Pro | $30 monthly [S14] | Same | Partial | Same |
| DistroKid Musician Plus | $44.99/yr (≈$3.75/mo) [S15] | — | No | Getting music onto Spotify and Apple needs a distributor |
| LANDR Studio | from ~$12.50/mo [S15] | ReSing mix worker | Partial | Mastering quality not benchmarked against LANDR |
| BandLab | Free core (paid tier not priced here) | — | No | No collaborative online DAW |
| Splice Sounds+ | $12.99/mo [S15] | — | No | No licensed sample library |

### 3c. Video

| Tool | List price | SWADEBASE equivalent | Match | Gap |
|---|---|---|---|---|
| Descript Business | $65/person monthly ($50 annual) [S16] | STT transcripts and captions | Partial | No text-based video editor or overdub |
| Frame.io Team | $25/member [S17] | Supabase storage + sharing | Partial | No frame-accurate review comments |
| Vimeo Standard | $25/mo annual (5 seats) [S17] | Storage + publishing | Partial | No adaptive-streaming player or video CDN verified |
| Otter Business | $30/user monthly ($19.99 annual) [S16] | sssbrain-stt / VideoSayWhat | Full (file transcription) / No (live meeting bot) | |
| Rev human transcription | $1.99/min [S17] | Machine STT | No (human accuracy) | |
| Riverside Pro | $35 monthly ($24 annual) [S16] | — | No | No remote recording studio |

### 3d. Making money / commerce

| Tool | List price | SWADEBASE equivalent | Match | Gap |
|---|---|---|---|---|
| Shopify Basic | $39 monthly ($29 annual) + payments 2.9% + 30¢ [S18] | Stripe Checkout in SSS Brain | Partial | No inventory, shipping, POS or theme store |
| Kajabi Basic | $179 monthly ($143 annual) [S18] | — (courses and memberships not verified) | No / Planned | |
| Stripe Billing | 0.7% of billing volume, pay-as-you-go [S19] | Uses Stripe | No | You still pay Stripe |
| Gumroad | 10% + 50¢ per direct sale [S18] | Stripe Checkout + downloads module | Partial | Avoids Gumroad's 10% (Stripe fees still apply). No Gumroad marketplace audience. |

### 3e. Real estate

| Tool | List price | SWADEBASE equivalent | Match | Gap |
|---|---|---|---|---|
| Follow Up Boss Grow / Pro | $69/user monthly / $499 for 10 users [S21] | SSS Brain CRM + AI follow-up | Partial | No built-in dialer, texting, or lead-source integrations |
| kvCORE (BoldTrail) | Quote only [S21] | — | No | Needs IDX/MLS licensing and lead-gen ads |
| BoomTown | Quote only; reported ~$1,000–1,500+/mo (third-party) [S21] | — | No | Same |
| ShowingTime | Reported $15/mo Appointment Center (third-party) [S21] | — | No | No showing scheduling |

---

## 4. Replacement argument by industry (5 users, monthly list prices)

Method:
- Only tools marked Full or Partial are counted as "replaced."
- Monthly-billing prices are used because SWADEBASE is month-to-month. Annual plans would cut the competitor totals by about 15–33%.
- Partial replacements count at full price, so the totals below are the **best case** for SWADEBASE.

### General business (the base for every client)

| Replaced tool | Calculation | $/mo | Match |
|---|---|---|---|
| HubSpot Starter | 5 × $20 | 100.00 | Partial |
| Mailchimp Standard | 500 contacts | 20.00 | Partial |
| Notion Business | 5 × $24 | 120.00 | Full |
| Zapier Team | | 103.50 | Partial |
| 1Password Teams Starter | | 24.95 | Partial |
| UptimeRobot Solo | | 13.00 | Full |
| Vercel Pro | 1 seat | 20.00 | Full |
| Supabase Pro | base | 25.00 | Full |
| ChatGPT Business | 5 × $25 | 125.00 | Partial |
| **Total replaced** | | **≈ $551** | Full-only subtotal ≈ $178 |
| **SWADEBASE Core** | | **$299 + AI usage** | Saves ≈ $252/mo at best |

**Not replaced, so the client keeps paying:**
- Intercom/Zendesk if they need live chat
- Statuspage
- Calendly (5 × $20 = $100)
- DocuSign (~$30 per sender)
- A registered agent (~$10/mo)

### Record label (General + music pack)

| | $/mo |
|---|---|
| General replaced | 551 |
| Suno Premier (partial) | 30 |
| LANDR Studio (partial) | 12.50 |
| **Total replaced** | **≈ $594** |
| **SWADEBASE Industry Pack** | **$499 + AI usage** |
| Still paid | DistroKid (~$3.75), Splice ($12.99), BandLab paid tier if used |

The software savings are small (about $95/mo). The real value is owned catalog and artist data, uploads, release planning and the mix worker in one place, not cheaper software.

### Video company (General + video pack)

| | $/mo |
|---|---|
| General replaced | 551 |
| Descript Business 5 × $65 (partial) | 325 |
| Frame.io Team 5 × $25 (partial) | 125 |
| Vimeo Standard (partial) | 25 |
| Otter Business 5 × $30 (full for files) | 150 |
| **Total replaced** | **≈ $1,176** |
| **SWADEBASE Industry Pack** | **$499 + AI usage** |
| Still paid | Riverside ($35), human transcription when needed, and probably 1–2 Descript seats for editors ($130) |

Even after keeping two Descript seats, this is the strongest replacement case.

### Commerce company (General + money pack)

| | $/mo |
|---|---|
| General replaced | 551 |
| Shopify Basic (partial; only if the store is simple digital goods) | 39 |
| Gumroad fees avoided | 10% − ~3.6% of sales (e.g. ~$320 saved on $5,000/mo of sales) |
| **Total replaced** | **≈ $590 + fee savings** |
| **SWADEBASE Industry Pack** | **$499 + AI usage** |
| Still paid | Stripe processing, and Shopify/Kajabi if they need physical inventory or courses |

### Real estate (General + real estate pack)

| | $/mo |
|---|---|
| General replaced | 551 |
| Follow Up Boss Grow 5 × $69 (partial) | 345 |
| **Total replaced** | **≈ $896** |
| **SWADEBASE Industry Pack** | **$499 + AI usage** |
| Still paid | IDX/MLS website and lead gen (kvCORE/BoomTown, quote-only), ShowingTime, dialer/texting |

The real estate pack is mostly **planned**. Don't sell it as a Follow Up Boss replacement until texting and lead-source intake exist.

---

## 5. What you still pay for

*Client-facing version: "You pay one bill. AI usage is prepaid and topped up automatically. A few outside services you'll keep, and we'll tell you exactly which."*

### 5a. AI usage (prepaid credits on the SWADEBASE bill)

**How the client sees it:** one line on the SWADEBASE invoice, "AI usage credits," prepaid and topped up automatically. They don't buy or manage a separate AI account.

**What runs behind it (invisible to the client):** SWADEBASE uses Replicate as backend AI infrastructure. Replicate bills per use (per second of video, per image, per token, per file), not a fixed subscription [S20]. It hosts LLMs and image, video, music and speech models.

**Verified examples on Oct 24, 2026** (each model's Replicate page [S20]):

| Model (on Replicate) | Price | Example |
|---|---|---|
| OpenAI GPT-5 mini | $0.25 / 1M input, $2 / 1M output tokens | Thousands of chat replies for a few dollars |
| OpenAI GPT-5 | $1.25 / 1M input, $0.01 / 1k output tokens | |
| Anthropic Claude 4.5 Sonnet | $3 / 1M input, $0.015 / 1k output tokens | |
| Black Forest Labs Flux 1.1 Pro | $0.04 / image | 100 images = $4 |
| Google Nano Banana | $0.039 / image | |
| Google Veo 3 Fast | $0.10/s video ($0.15/s with audio) | One 8-second clip with audio = $1.20 |
| OpenAI Sora 2 | $0.10/s | 10-second clip = $1.00 |
| Kling v2.5 Turbo Pro | $0.07/s | 5-second clip = $0.35 |
| Kling v3 | $0.168–$0.42/s depending on mode and resolution | |
| Wan 2.5 text-to-video | $0.05 (480p) / $0.10 (720p) / $0.15 (1080p) per second | |
| MiniMax Music 1.5 | $0.03 / song | |
| Chatterbox TTS | $0.025 / 1k characters | |

Local Ollama models on the client's own server cost nothing extra per use, so routine classification and summaries run there first. SWADEBASE's own planning puts routine bot runs at about $0.002–$0.008 each, roughly $7/mo for four role bots on the cheap tier (internal estimate, SWADE_MULTI_BOT_SYSTEM.md §6).

**Compared with Higgsfield.** Higgsfield sells monthly credit subscriptions:
- Starter: $19/mo for 270 credits
- Plus: $59 monthly ($47 annual) for 1,200 credits
- Ultra: $129 monthly ($99 annual) for 3,000 credits
- Credits reset each cycle and don't roll over [S22] (secondary sources; higgsfield.ai/pricing did not load).

A client making about 20 eight-second clips with audio on Veo 3 Fast a month pays about **$24 of usage** (about $27.60 billed at cost + 15%) instead of a $59–$129 subscription. A client making about 200 Flux images pays about $8. **So most clients won't need Higgsfield.**

**Higgsfield features SWADEBASE does not match:**
- Its one-click camera-motion and effect presets and templates
- Its character-consistency training ("Soul ID")
- Its own in-house models
- Its polished all-in-one creative studio interface and social/mobile apps
- Occasional "unlimited" promotions on some models

Heavy creative teams who rely on those presets should keep Higgsfield.

### 5b. Other pay-as-you-go items that are genuinely needed

| Item | Real cost | Who pays |
|---|---|---|
| Card processing on the client's own sales | Stripe 2.9% + 30¢ per US card [S19]; Stripe Billing adds 0.7% if used [S19] | The client's Stripe account |
| Email sending (newsletters, receipts) | Amazon SES $0.10 per 1,000 emails (à la carte) or Resend Pro $20/mo for 50,000 [S23] | Included up to a cap in the tier; heavy senders pay overage at cost |
| Domain names | .com about $19.99/yr renewal at Hostinger [S24] | Included for the first domain; extra domains at cost |
| Tools SWADEBASE doesn't replace | Calendly, DocuSign, DistroKid, Splice, Riverside, MLS/IDX, live chat, registered agent (sections 3–4) | The client keeps these |
| Grok Bot assistant layer ("Big Mamma") | Separate product, separate price | Optional add-on |

**SWADEBASE handles everything else in one place.**

---

## 6. Cost basis per client copy (separate Hostinger account)

### 6a. Servers

Each client gets two VPSs: a "core" server (Supabase, Mailcow, Ollama, backups) and an "apps" server (Coolify + client apps). The sizing reflects real usage: SWADEBASE uses 13 of its 32 GB, and Swadebase 2 at 8 GB is already swapping.

Hostinger KVM prices ([S25], third-party summary of hostinger.com/vps-hosting, Oct 2026). The intro price needs a **24-month prepay**. **The Hostinger MCP catalog lookup timed out twice today**, so confirm these in the account before quoting.

| Plan | Spec | Intro (24-mo prepay) | Renewal |
|---|---|---|---|
| KVM 2 | 2 vCPU / 8 GB | $8.99/mo | $14.99/mo |
| KVM 4 | 4 vCPU / 16 GB | $12.99/mo | $28.99/mo |
| KVM 8 | 8 vCPU / 32 GB | $25.99/mo | $49.99/mo |

| Tier | Server pair | Intro /mo | Renewal /mo | 24-mo intro prepay |
|---|---|---|---|---|
| Core | KVM 4 (core) + KVM 2 (apps) | $21.98 | $43.98 | $527.52 |
| Industry Pack / Full | KVM 8 (core) + KVM 4 (apps) | $38.98 | $78.98 | $935.52 |

### 6b. Monthly running cost per client (steady state, at renewal prices)

| Line | Core | Pack | Full | Basis |
|---|---|---|---|---|
| VPS pair | 43.98 | 78.98 | 78.98 | 6a |
| Coolify | 0 | 0 | 0 | Self-hosted Coolify is free. Coolify Cloud is optional at $5/mo for 2 servers [S26]. |
| Domain (1 × .com) | 1.67 | 1.67 | 1.67 | $19.99/yr [S24] |
| Offsite backups (B2, ~100–250 GB) | 2.00 | 2.00 | 2.00 | $6.95/TB-mo [S24] **(estimate of size)** |
| Email sending | 5.00 | 5.00 | 5.00 | SES $0.10/1k or Resend Pro $20/50k [S23] **(estimate)** |
| AI included in the base (background bots) | 10.00 | 10.00 | 25.00 | Ollama is free on-box; API at ~$7/mo for 4 bots (internal) **(estimate)** |
| Monitoring | 0 | 0 | 0 | Self-monitoring. UptimeRobot Solo $13 optional [S8]. |
| Storage/CDN | 0 | 0 | 0 | On-box storage. Add a CDN only if video-heavy **(estimate)**. |
| **Infrastructure subtotal** | **62.65** | **97.65** | **112.65** | |
| Stripe fees on the monthly fee (2.9% + 30¢ + 0.7% Billing) | 11.06 | 18.26 | 29.06 | [S19] |
| Support time (2 / 4 / 6 hrs at $50/hr internal cost) | 100 | 200 | 300 | **(estimate)** |
| **Total monthly cost** | **173.71** | **315.91** | **441.71** | |

### 6c. Behind-the-scenes AI billing setup (Replicate + Stripe Issuing)

**Recommended structure (the safest one found):**

1. **One Replicate account per client, opened in the client's business name.** Replicate's Terms forbid renting, reselling or sublicensing the services to others, or offering them "in connection with... any time-sharing, service bureau, software as a service" arrangement. They also forbid sharing login credentials beyond the authorized user [S27 §2.7(c)(ii)–(iii)]. One SWADEBASE-owned account resold to many clients would conflict with that. With an account per client, the client is the "Customer" and SWADEBASE manages it for them. **Have a lawyer or Replicate support confirm this before the first client.**
2. **One Stripe Issuing virtual card per client** set as the payment method on that Replicate account.
   - Issuing gives each card **spending limits per interval** plus merchant-category and country controls [S28].
   - **Real-time authorization** lets SWADEBASE approve only Replicate charges [S28].
   - Controls by exact merchant ID are still in private preview.
3. **Replicate prepaid credit with auto-reload** [S20 prepaid-credit doc]:
   - Minimum threshold is $5 and minimum reload is $15.
   - Purchased credit is valid for 1 year and is not refundable. Unused amounts are forfeited after 12 months.
   - Replicate isn't liable for disruption from a failed auto-reload [S27].
   - So keep reloads small and frequent, e.g. threshold $10, reload to $40.
4. **Spend caps in layers.** Replicate shows no explicit per-account dollar cap in its docs (not found), so the caps come from:
   - the Issuing card's monthly spending limit
   - the auto-reload size
   - deployment max-instance limits
   - SWADEBASE-side low-balance and high-burn alerts
5. **Funding flow.** The client pays SWADEBASE one invoice: monthly fee plus prepaid AI credits. SWADEBASE then tops up its Stripe Issuing balance, which is a separate pool of funds from payments [S28], and the virtual card pays Replicate's reloads.
   - Stripe documents push funding from a bank (ACH or wire) [S28]. Stripe's pricing page lists Treasury ACH funding as included and wires at $2.00 [S19].
   - **Not verified:** whether the payments balance can be moved straight into the Issuing balance. Confirm in the Dashboard.
6. **Pass-through price:** usage at **cost + 15% (estimate)**, which covers Stripe processing (~3.6% + 30¢), card and dispute risk, forfeiture risk and monitoring time.
   - Example: the client prepays $115 → Stripe takes about $4.44 → $100 funds Replicate → about $10.56 is left as buffer and margin.

**Stripe Issuing facts (verified Oct 24, 2026):**
- Commercial Issuing is available in the US, UK and EEA [S28].
- You need a Stripe account with Issuing enabled. This is an application or approval step, so **approval is not guaranteed**.
- Pricing page [S19]:
  - **$0.10 per virtual card**
  - $3.50 per physical card
  - $15 per dispute
  - cross-border transactions listed at 1% + 30¢ (Replicate is a US merchant, so domestic is expected; check the first statement)
- No setup fees [S28].
- **Option B, cards issued in the client's own name**, needs Stripe Connect with **Custom connected accounts**. The platform is then responsible for collecting requirements and for loss liability [S28 Issuing + Connect]. That is more compliance work than this business needs at first, so start with **platform-owned cards, one per client**, and revisit later.

**One-time AI billing setup cost per client:** $0.10 card + about 2 hours of labor (open the Replicate account with the client, set the card, auto-reload, limits and alerts) ≈ **$100 (estimate)**. This is included in the setup fee.

### 6d. Setup labor and setup-fee math

| | Core | Pack | Full |
|---|---|---|---|
| Labor (estimate) | 16 h | 28 h | 40 h |
| At $50/h internal | $800 | $1,400 | $2,000 |
| 24-mo intro VPS prepay | $527.52 | $935.52 | $935.52 |
| Stripe fee on the setup fee | $90.30 | $144.30 | $216.30 |
| **Total setup cost** | **$1,417.82** | **$2,479.82** | **$3,151.82** |
| **Setup fee** | **$2,500** | **$4,000** | **$6,000** |
| **Setup margin** | **$1,082 (43%)** | **$1,520 (38%)** | **$2,848 (47%)** |

Until the playbook is repeatable (PLANNED), real hours will run higher for the first 2–3 clients. Either quote those as "founding client" setups or keep these fees and absorb the extra time.

---

## 7. Recommended pricing

| | **Core** | **Industry Pack** | **Full** |
|---|---|---|---|
| One-time setup | $2,500 | $4,000 | $6,000 |
| Monthly (up to 5 users) | **$299** | **$499** | **$799** |
| Extra users | $25/user (estimate) | $25/user | $25/user |
| Servers | KVM 4 + KVM 2 | KVM 8 + KVM 4 | KVM 8 + KVM 4 |
| What's on | Supabase, mail, hosting, SSS Brain workspace, vault, adapter switches, monitoring, backups, local AI, daily memory | Core + one pack (music, video, commerce, real estate*) | Core + all packs, REA research runs, more AI included |
| Support included | 2 h/mo | 4 h/mo | 6 h/mo |
| AI usage | Prepaid credits at cost + 15%, auto top-up | Same | Same, plus $25/mo of background AI included |
| Steady-state monthly cost (6b) | $173.71 | $315.91 | $441.71 |
| **Monthly margin at renewal prices** | **$125 (42%)** | **$183 (37%)** | **$357 (45%)** |
| Monthly margin during the 24-mo intro term (VPS prepaid in setup) | ≈ $169 (57%) | ≈ $262 (53%) | ≈ $436 (55%) |
| Replaced stack it competes with (section 4) | ≈ $551/mo | ≈ $594–$1,176/mo | All of the above |

\*Sell real estate as "CRM + documents + AI follow-up" until the listings, texting and showing pieces are built.

**Why these numbers:**
- Core sits about 45% below the replaced general stack (~$551/mo at monthly list prices).
- The Pack is at or below the music and commerce stacks and far below the video stack.
- Margins stay at 37–45% even after Hostinger's renewal jump.
- The Industry Pack has the thinnest margin, so raise it to $549 if support runs past 4 h/mo.
- Offer 2 months free for annual prepay instead of discounting the monthly rate.

---

## 8. Risks and caveats

1. **Hosting price jump.** Hostinger renewals are about 2× the intro price (KVM 4: $12.99 → $28.99). Margins above use renewal prices. Confirm the prices in the account (the MCP lookup timed out today).
2. **Replicate terms.** The per-client-account structure is the safest reading of §2.7(c), but it's an interpretation. Get it confirmed. Prepaid credits are final, expire after 12 months and are non-refundable.
3. **Stripe Issuing approval.** Approval is not guaranteed. If it's declined, the fallback is a regular business card per client on the Replicate account, with SWADEBASE alerts doing the capping.
4. **Partial modules.** Autoheal covers 2 services and is off by default. REA build is disabled. The Corporate Advisor's depth is unverified. The real estate pack is mostly planned. Sell only what's LIVE.
5. **Repeatability.** Copying the system for a new client isn't a one-click playbook yet, so early setups will take longer than estimated.
6. **Support load and security.** The client depends on SWADEBASE for patching, backups and uptime, which are what a vendor SLA would normally cover. Write a simple service-level promise (response times, backup restore test) into the agreement.
7. **One region, no edge network.** Fine for small businesses. Not a fit for global high-traffic sites.
8. **Price drift.** Some competitor prices come from third-party summaries: Higgsfield, ShowingTime, BoomTown, Hostinger plan prices, Hostinger backup add-on. Re-check them before quoting.
9. **Separate layer.** Keep the Grok Bot assistant layer ("Big Mamma") priced and contracted separately so SWADEBASE margins don't hide its cost.

---

## 9. Sources (accessed Oct 24, 2026)

- [S1] HubSpot pricing and catalog: https://www.hubspot.com/pricing/crm ; https://legal.hubspot.com/hubspot-product-and-services-catalog
- [S2] Salesforce pricing: https://www.salesforce.com/sales/pricing/
- [S3] Mailchimp Standard: https://mailchimp.com/landers/pricing/standard/ ; Loops: https://loops.so/pricing
- [S4] Notion: https://www.notion.com/pricing ; Confluence bands: https://fitmysaas.com/blog/notion-vs-confluence-pricing (Oct 2026)
- [S5] Zapier: https://zapier.com/pricing ; https://www.saasswitcher.com/blog/zapier-pricing
- [S6] 1Password: https://1password.com/pricing/business
- [S7] Intercom: https://www.intercom.com/learning-center/intercom-pricing ; Zendesk: https://www.zendesk.com/pricing/
- [S8] UptimeRobot: https://uptimerobot.com/pricing/ ; Statuspage: https://www.atlassian.com/software/statuspage/pricing
- [S9] Vercel: https://vercel.com/docs/plans/pro-plan ; Netlify: https://www.netlify.com/pricing ; Heroku: https://www.heroku.com/pricing/
- [S10] Auth0: https://auth0.com/pricing ; Supabase: https://supabase.com/pricing
- [S11] ChatGPT Business: https://help.openai.com/en/articles/8792828-what-is-chatgpt-team/ ; Claude Team: https://support.claude.com/en/articles/9266767-what-is-the-team-plan
- [S12] Calendly: https://calendly.com/pricing ; DocuSign: https://ecom.docusign.com/checkout
- [S13] Northwest: https://www.northwestregisteredagent.com/registered-agent ; LegalZoom: https://www.legalzoom.com/business/business-operations/registered-agent-overview.html
- [S14] Suno: https://suno.com/pricing ; Udio summary: https://www.llms.blog/posts/ai-voice-and-music-pricing-compared-elevenlabs-suno-udio-and-more-as-of-october-2026
- [S15] DistroKid: https://distrokid.com/pricing/ ; LANDR: https://join.landr.com/landr-studio/ ; Splice: https://splice.com/plans
- [S16] Descript: https://www.descript.com/pricing ; Riverside: https://riverside.com/pricing ; Otter: https://otter.ai/pricing
- [S17] Frame.io: https://frame.io/pricing ; Vimeo: https://vimeo.com/upgrade-plan ; Rev: https://www.rev.com/pricing
- [S18] Shopify: https://www.shopify.com/pricing ; Kajabi: https://www.kajabi.com/pricing ; Gumroad: https://gumroad.com/pricing
- [S19] Stripe pricing (payments, Billing 0.7%, Issuing $0.10 virtual / $3.50 physical / $15 dispute, Treasury funding): https://stripe.com/pricing
- [S20] Replicate pricing and billing: https://replicate.com/pricing ; https://replicate.com/docs/topics/billing ; https://replicate.com/docs/topics/billing/prepaid-credit ; model pages: replicate.com/google/veo-3-fast, /openai/sora-2, /kwaivgi/kling-v2.5-turbo-pro, /kwaivgi/kling-v3-video, /wan-video/wan-2.5-t2v, /black-forest-labs/flux-1.1-pro, /google/nano-banana, /openai/gpt-5-mini, /openai/gpt-5, /anthropic/claude-4.5-sonnet, /minimax/music-1.5, /resemble-ai/chatterbox
- [S21] Follow Up Boss: https://www.followupboss.com/pricing ; kvCORE/BoldTrail, BoomTown, ShowingTime (third-party): https://brokerage.getverticalos.com/pricing/ ; https://www.realanalytica.com/compare/follow-up-boss-vs-boomtown
- [S22] Higgsfield (secondary; official page didn't load): https://jutsustudio.com/blog/higgsfield-credits-explained/ ; https://reelticker.com/tools/higgsfield
- [S23] Resend: https://resend.com/pricing ; Amazon SES: https://aws.amazon.com/ses/pricing/
- [S24] Hostinger .com renewal: https://hostdealspro.com/hostinger-com-price/ ; Backblaze B2: https://www.backblaze.com/cloud-storage/pricing
- [S25] Hostinger VPS: https://www.hostinger.com/vps-hosting ; https://www.toolbistro.com/radar/hostinger-vps-pricing (Oct 2026)
- [S26] Coolify Cloud: https://coolify.io/pricing
- [S27] Replicate Terms of Service: https://replicate.com/terms (§2.7(c) restrictions; prepaid credit, auto-reload and expiry clauses)
- [S28] Stripe Issuing docs (availability, Connect, Issuing balance funding, spending controls): https://docs.stripe.com/issuing ; https://docs.stripe.com/issuing/connect ; https://docs.stripe.com/issuing/funding/balance ; https://docs.stripe.com/issuing/controls/spending-controls
- Internal: SWADE_MULTI_BOT_SYSTEM.md §6 (server sizing, bot run costs); STANDING_RULES.md; nightly-backup.sh log (Oct 24); adapter registry README; autoheal.py.

*This document contains no secrets, EINs or bank details.*
