# Brainiak usage and production controls — commercial draft

October 25, 2026. Supersedes any interpretation of flat plan pricing as unlimited production. Policy is a design proposal; no paid production engine, paid checkout, BYOK vault or durable cost reservation service is active in Brainiak yet.

## Separate what is being sold

1. Platform subscription: private workspace, memory, tasks, widget configuration, bounded storage, scheduled-job slots and platform support. Does not purchase unlimited creative production or all ecosystem products.
2. Managed AI allowance: model-weighted, bounded spend. Display remaining allowance and per-action estimate; request count alone is insufficient. Expensive model/tool/context use consumes more. Included provider cost allowances remain unset until measured.
3. Production: video, images, music, premium speech, transcription, long research and agent execution use separately quoted prepaid credits or verified customer-owned providers. Hosting, storage, rendering, queue orchestration, retries and other providers remain billable even when the main language-model key belongs to the customer.
4. Marketplace: a purchased workflow/module grants feature access under its license. Recurring compute is included only in an explicit allowance; ongoing production is not free because a module was bought once.

## Initial proposed operational ceilings

| Control | Personal | Business | Enterprise starting tier |
|---|---:|---:|---:|
| Seats, when permissions exist | 1 | 5 | 20 |
| Stored files including backups allowance | 1 GB | 10 GB | 50 GB |
| Active scheduled workflows | 3 | 15 | 50 |
| Concurrent production jobs | 1 | 2 | 4 |
| Videos in a single approved batch | 1 | 5 | 20 |
| Maximum automatic retries per stage | 1 | 1 | 1 |
| Maximum steps per agent run | 10 | 20 | 40 |
| Customer-owned provider keys | not initially | supported after verification | supported after verification |

These are ceilings, not included video quantities or guaranteed capacity/turnaround. Start below these caps if measured host capacity requires it. Add max wall time, input size, output tokens, context size, web searches, download bytes and per-provider requests in the technical release manifest. Every system has its own cost weight. BYOK gets appropriate model choice and higher approved throughput, never unlimited access or permission bypass.

## Admission flow

Validate identity, workspace permission, subscription and product entitlement. Count total work before fan-out, including nested subtasks and existing queued/running work. Check model/provider availability and workspace/provider rate and concurrency limits. Build a versioned quote for the exact inputs, output count, duration/resolution, model, expected retries, storage and delivery costs. Unknown costs block execution; quoting must not perform paid generations.

For company-funded work, atomically reserve an upper-bound cost in a durable SWADEBASE ledger before dispatch. Reservations must be aggregate across all concurrent requests, not per browser tab. Require prepaid funds or an explicit allowance; no implicit credit line, automatic top-up or overage subscription. For customer keys, show separately which costs go to the customer's provider and which use Brainiak credits. Reconcile provider token/tool/job cost afterward, release unused reservations, and record receipts. Reserve enough for accepted in-flight work; a post-run spend check cannot prevent overspending.

Each queue job is idempotent, scoped to a workspace and entitlement, with attempt count and checkpoints. Reserve retry budget in advance; repeated button presses/webhook events cannot create duplicate production. Pause remaining work at cost, time, step, concurrency or balance limit. Do not resubmit expensive failed generations automatically without funded retry permission. Cancellation stops new dispatch; already incurred provider costs may remain payable.

A 500-video prompt becomes a proposal, never an immediate generation request. Show full estimated total and a small paid pilot, such as 1–3 samples. After approval and funds reservation, process bounded batches with progress, quality checks and a global total-spend cap. Do not evade the total by splitting jobs or switching workspaces. Larger custom queues require an explicit capacity agreement.

## Margin guard

Target 80% gross margin; 60% minimum, 90% stretch on efficient/BYOK workloads. Compute an all-in delivery estimate per offer: provider usage plus tools, GPU/render, storage/egress, operations/support allocation, retry reserve, merchant/billing/metering fees and discount effects. Block quotes below the minimum rather than executing a losing job. Subscription budgets and job-wallet budgets must not double-count revenue or the same cost.

For a job with allocated cost C and incremental fixed fee f, percentage fee r and desired margin m: price >= (C + f) / (1 - r - m), only where denominator is positive. Tax is not platform revenue. For prepaid wallets, allocate the wallet-purchase fees once across the jobs; do not reapply a full card fee to each job. Existing customer contracts cannot be repriced silently.

## BYOK boundaries

OpenAI, Anthropic, Gemini and xAI must each be verified separately. A customer language-model key does not pay for video, speech or image providers that require other accounts. Use server-only encrypted secrets with per-workspace role checks; no keys in chat, ordinary memory, browser storage, logs or exported notes. Model fallback/cross-provider routing requires prior consent, particularly when it changes the payer or data destination. Key failure pauses the request; no silent spending on Swade's key. Provider budgets and rate limits are additional safeguards, not substitutes for Brainiak's job limits.

## Included update boundary

Security, repairs, compatibility and normal operation updates are included. New optional systems/products can be sold separately. Free automatic deployment must still pass compatibility, backup/recovery, health and rollback checks. New permissions and destructive changes are never silently bundled into a maintenance update.

## Release gates

Do not advertise these as enforced until durable atomic reservations, concurrency/usage tests, duplicate job tests, funded retry tests, provider timeout/reconciliation, cancellation, webhook payment and ownership tests pass. Before commercial launch, the public page must be independently accessible; brainiak.live currently redirects to an owner-private ChatGPT review. The SWADEBASE app remains separately available at /brainiak.
