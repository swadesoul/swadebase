
## AI provider accounts, balances and usage terms — recorded October 28, 2026

Source of truth: `swadebase_ops.ai_provider_accounts`, `ai_credit_topups`, `ai_rate_cards` and `ai_usage_ledger` (live balance = recorded credit minus ledger spend; read with MCP `swade_cost_report` / `swade_rate_cards`). Opening balances below were founder-reported on 2026-10-27/28.

| Provider (ledger id) | Billing | Opening balance / quota | Backend use | Notes |
|---|---|---|---|---|
| Anthropic (`anthropic`) | prepaid | $40.00 | allowed | Claude Haiku 5.5 ($0.10/$0.50 per 1M tokens). New workspace-scoped key (no workspace ID needed). |
| OpenAI (`openai`) | prepaid | $47.99 | allowed | gpt-4o-mini ($0.15/$0.60) last-resort text; optional images; GPT Live realtime voice founder-only (swadesoul@gmail.com). |
| Replicate (`replicate`) | prepaid | $245.86 credit remaining ($2.62 used this month) | allowed | flux-schnell images (~$0.003 each, unverified). |
| RunPod (`runpod`) | prepaid | $97.68 | allowed | Voice Studio cloned/designed voices (serverless, ~$0.69/GPU-hour). Account spend limit $80/hr; voice policy minimum balance $49. |
| KIE.ai (`kie_ai`) | prepaid (credits) | 9,334 credits ≈ $46.67 at ~$0.005/credit (unverified third-party rate) | allowed | One credit balance across image (Seedream, Flux-2, GPT Image), video (Kling, Wan, Veo 3.1), music/voice (Suno, ElevenLabs, Gemini TTS) and chat (GPT, Claude, Gemini, Grok) models. Limit: 20 new generation requests per 10 s per account (100+ concurrent tasks); excess returns HTTP 429 and is not queued; per-key hourly/daily/total caps available. No balance API: ledger is the running balance, reconcile with kie.ai/logs. Keys server-side only. Docs: https://docs.kie.ai |
| Alibaba Model Studio pay-as-you-go (`qwencloud`) | prepaid | balance not yet reported | allowed | Key `QWENCLOUD_API_KEY` on dashscope-intl compatible-mode; qwen-flash verified working ($0.05/$0.40 per 1M tokens). Intended first choice for app backends once its balance is recorded. |
| QwenCloud Token Plan (`qwencloud_token_plan`) | subscription $18/mo | 45,000 credits/month; 89.1% remaining at 2026-10-28; resets 2026-11-15 10:00 | **NOT allowed** | QwenCloud terms: interactive AI programming tools and OpenClaw-type agents only; not for automated scripts or application backends (suspension/key-ban risk); no pay-as-you-go fallback when credits run out. Base URL https://token-plan.maas.qwencloudapi.com/compatible-mode/v1. The ledger hard stop blocks backend use. |
| SWADE Voice Studio, Ollama, self-hosted LiveKit | self_hosted | n/a | allowed | $0 per call; hosting prepaid. Voice for all products comes from Voice Studio. |
| ElevenLabs, LiveKit Cloud | subscription / postpaid | n/a | fallback only | Legacy/backup paths. |

Founder rules recorded with these accounts: cheapest model tier that does the job; Anthropic and OpenAI credits are used last; every call is logged with project, feature, provider, model and cost; prepaid providers without a recorded balance and unknown providers are blocked; balances must be recoverable by conversation through SSS Brain (MCP cost tools).
