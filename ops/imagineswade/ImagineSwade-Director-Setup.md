# ImagineSwade Director — agent setup and compute decision

November 8, 2026 · Swade Soul

ImagineSwade Director is registered in the existing Rakazo agent area on SWADEBASE-2, alongside Chief of Staff and the other existing agents. Its title is **Film Director & Character Continuity Supervisor**.

This is an installed role with persistent instructions and versioned memory, not neural-model fine-tuning. It is ready to be addressed in the agent workspace using the existing owner model connection. No paid chat, training, render, autonomous routine or GPU launch was queued during setup.

## Installed responsibilities

- Analyze scripts, pacing, dialogue, storyboard sequence, scene transitions and production constraints; preserve originals and explain recommendations.
- Improve image and motion prompts while preserving approved character identity, wardrobe and reference anchors.
- Maintain named character sheets for one video, a series, or a movie, using stable character IDs and production scope.
- Resolve explicit dialogue speakers and approved aliases into a scene cast manifest. Preserve silent visible characters, off-screen speakers and voiceover.
- Check wardrobe, voice and reference assignments. Stop ambiguous or unapproved scenes rather than guessing.
- Retain owner-approved decisions, corrections and proven fixes with source, approval, scope, timestamps and memory revisions.
- Recommend compute by task and record unresolved workflow/upgrade gaps. Follow shared ownership, deployment and spending controls.

## Persistent memory and character contract

Six native bot memory documents were installed: MEMORY.md, DIRECTOR-POLICY.md, CURRENT-STATE.md, CHARACTER-CONTRACT.json, PROVIDER-RESEARCH.md and LEARNING-AND-QA.md. Native memory revision records and agent-home copies were verified. Bot memory is isolated; shared-memory overwrite is disabled. This is bounded retrieval with revision history, not a promise that every fact is always present in the model context.

Each sheet has a stable ID, display name, aliases, video/series/movie scope, identity revision, draft/approved state, appearance locks, reference asset IDs/checksums, wardrobe variants with approvals, voice ID, dialogue style and consent/provenance. Episode and scene manifests reference the specific approved revision and costume. Unreviewed suggestions cannot silently become canon.

Example: a series character named Ada may have the alias Captain. The line `CAPTAIN (OFF SCREEN): We leave at dawn.` maps to Ada's voice while keeping her out of the frame. A silent Ada can still appear if listed in the visible cast. A costume change within the same continuity group requires a scripted reason or explicit approval.

The checker validates metadata and assignments. It does not inspect face pixels, certify lip-sync or guarantee visual perfection. Actual images, poses, faces, costume detail, speech timing and rendered takes require appropriate model/vision support and human review.

## Verification

- Native bot, thread, dedicated-computer record, isolated memory and six document revisions read back successfully.
- Installation uses Rakazo's existing bot repository and native agent-home store. Existing agents and shared model settings were not changed.
- 23 deterministic checks passed locally and from the final installed agent home; runtime source hashes match the installation package.
- Tests cover aliases, collisions, scope isolation, reference propagation, unapproved identity/outfits, wardrobe changes, voice conflicts, visible/off-screen behavior, and cost-routing recommendations.
- A separate CPU-only Qwen 3 4B test on SWADEBASE correctly returned character Ada, visible=false and wardrobe blue for the off-screen example. This is a local-model smoke test, not the native Rakazo bot chat execution.
- Native bot inference runs and routines remain zero. Its existing OpenRouter T1 model connection has not been inference-tested for this new bot. No new credential was copied to it.

## Provider evidence and minimum GPU

Runpod authentication was verified through a read-only endpoint listing. The saved ComfyUI, Wan and SDXL endpoints have min workers 0, max workers 0, idle timeout 5 seconds. They are configured but disabled for job execution. An existing LTX endpoint permits max 1 with min 0; its workflow/input contract was not qualified for ImagineSwade and was not changed. Unrelated voice settings were preserved.

Together is enabled/prepaid/backend-use-allowed in the existing SWADEBASE provider registry. The named Together key was absent in the checked edge runtime. This is incomplete connection discovery, not proof it is missing globally. No Together authentication or inference success is claimed.

| Work | Recommended compute | Qualification limit |
|---|---|---|
| Script, prompt and storyboard analysis; continuity metadata | Existing SWADEBASE CPU/local text service | Native Director chat still uses the existing owner T1 connection |
| Lower-cost text/image-to-video drafts | Runpod Serverless, 24 GB; start by qualifying Wan2.2 TI2V-5B | Official offload recipe, not full original Studio feature parity |
| Heavier reference/character workflows | Qualify 48 GB or a compatible Together serverless model | Actual model, quality, runtime and reference support decide |
| Original Imagination Studio H3 stack | RTX PRO 6000 Blackwell 96 GB profile | Preserve original memory/build guards; not provisioned |
| Final clip assembly, captions, audio mix | Existing CPU FFmpeg services | Requires real durable source assets |

**Practical starting recommendation: 24 GB, not 96 GB for every job.** The official Wan2.2 TI2V-5B recipe supports text- and image-to-video on a 24 GB card using CPU offload, dtype conversion and CPU T5. This replaces the heavy runtime for that workflow; it does not make the original H3/Ref2VA engine fit on 24 GB. Larger or complex character workflows need separate qualification. A 16 GB image/preview lane may be possible, but is not the recommended universal video minimum.

Published Runpod Serverless reference prices checked November 8: economy 24 GB pool $0.75/hour; 24 GB RTX 4090 $1.34/hour; A40/A6000 48 GB $1.22/hour; RTX PRO 6000 96 GB $3.49/hour. These are published rates, not a locked account quote or availability promise. Compare cost per accepted scene, including cold starts and failed takes: a faster, more expensive GPU may finish more cheaply. No benchmark was performed here.

## Automatic on/off policy

Use Runpod Serverless flex workers with minimum workers 0, proposed maximum 1, and a short idle timeout such as 5 seconds. A worker starts for queued work and scales down after its last job and idle interval. Startup, execution and waiting time are billable; persistent storage can still cost money while GPU compute is off. Store outputs durably before accepting completion. An independently enforced per-job deadline and budget cap must stop runaway work.

This policy is prepared, not applied to the disabled image/video endpoints. Existing guard values are not a new spending grant. No GPU/storage budget was approved in this task.

Together serverless avoids owning or renting a dedicated GPU: it bills for API usage. Its image APIs support reference-capable edits on selected models; its video APIs support references/keyframes on selected models and asynchronous job IDs. Choose the exact capable model before a job. Dedicated hardware is a different product and must not be assumed to stop billing automatically.

## Splitting work across providers

Partition by independent shots, assets or stages: CPU script/cast plan; reference stills; individual video clips; voice/music; CPU final assembly. A simple shot may run on a small Runpod worker while a difficult reference/keyframe shot uses Together. Preserve the same approved character revision, wardrobe and reference IDs across both. Do not split one model's tensors across Runpod and Together or add their VRAM together.

Reconcile an uncertain provider job using its stored ID before retrying or falling back. Do not launch the same paid scene on both providers after a timeout. Track requested/actual provider, model, settings, source references, cost reservation, attempts, actual spend, output checksum and durable storage key.

## Still required for the site

The existing ImagineSwade website remains a planning shell. Registering this agent does not implement the missing upload or render controls. Still needed: authenticated reference/start/end-frame uploads; persistent character-sheet UI and private B2 ownership; site-to-agent scoped access; mode-specific jobs; durable queue and provider bridge; visual/voice continuity QA; output playback/download; signed-in and iPad Safari verification; actual budgeted image/video tests. The dedicated agent computer has a database record but is not provisioned. No global deployment, spending or shared-system administration authority was granted to the new agent.

## Evidence and recovery

Bot ID: cmw7tibj30000nhs2uueco4kb. Thread ID: cmw7tibjh0001nhs2g0ri8q5d.

Operational package: /opt/rakazo-imagineswade on SWADEBASE-2. Agent home uses native persistent storage. Canonical Site Bible records the install and remaining work.

To pause: do not dispatch tasks or create routines. To withdraw: archive only this bot through the normal agent controls; preserve native memory/revisions and any future character assets. Do not change existing agents, delete memories or alter shared model/provider configuration as rollback.

## Official sources reviewed

- Wan2.2 minimum memory and inference recipe: https://github.com/Wan-Video/Wan2.2
- Runpod worker billing: https://docs.runpod.io/serverless/pricing
- Runpod endpoint settings: https://docs.runpod.io/serverless/endpoints/endpoint-configurations
- Runpod current price reference: https://www.runpod.io/pricing
- Together serverless behavior: https://docs.together.ai/docs/serverless/overview
- Together image references: https://docs.together.ai/docs/inference/images/reference-images
- Together video references/keyframes: https://docs.together.ai/docs/inference/videos/reference-and-keyframes
- Together model catalog: https://docs.together.ai/docs/serverless/models

## Owner routing configuration v1.1 and creator critique — November 8, 2026

Installed owner provider preference: **small → Runpod; medium → Together; large → Hostinger**. Pick the least estimated total-cost offer that is currently quoted and capability-qualified within the assigned provider. A requested tier cannot undersize the task. Default thresholds are configurable: small ≤720p, 5s, one character/reference and 24GB; medium ≤1080p, 10s, three characters/four references and 48GB; larger requests go to large. These are planning limits, not proof of a model's supported controls.

Script/prompt/storyboard/continuity and FFmpeg CPU work stays on existing Hostinger resources without renting GPUs. Neither inspected VPS has a GPU device. Large **GPU** jobs are blocked until an actual capable Hostinger GPU service target is verified. No silent CPU substitution or unapproved provider switch.

Eight native memory documents are now installed. ROUTING-POLICY.json and RESOURCE-OPERATIONS.md supersede the earlier recommendation-only provider ladder. The native installed resource manager plus continuity tools pass **45 tests**; installed runtime hashes match the package.

Resource cleanup contracts require durable output before release, reconcile uncertain provider state first, refuse foreign/in-use resources, verify Runpod Serverless scale-down, close Together usage-job leases, and release Hostinger job capacity without stopping the shared VPS. A dedicated resource may be stopped only if its recorded lease proves it was created for that job. These are installed policy/lifecycle decisions; provider execution and cleanup callbacks are not yet connected or live-tested.

Usage receipt tooling records provider/model/job size, startup/processing/idle time, estimated versus actual charges, output IDs and shutdown confirmation. Actual unknown costs stay null. Savings need an explicit comparable baseline and remain estimates; cost increases appear as negative savings. Native receipts can persist in the agent home; shared financial-ledger mirroring is still an integration task. There are no real-job savings to report yet.

Dispatch remains disabled and spend caps remain $0 until a capable worker target, integration contracts and bounded owner budget are established. Existing cloud endpoint worker settings were not changed. Configuration permission was not treated as unlimited vendor spending authority.

Creator critique changes: brief above the fold; removed competing hero and Enter Studio action; one create action in the composer with sidebar shortcut; unique inspiration labels; hardware hidden from the primary creator view; one Settings destination; one profile block; larger touch targets; master16:9 label and stored delivery targets; mode saved in project metadata; validated browser draft recovery; accurate unsaved indicator; confirmation before replacing an unsaved open project; stronger import validation. Browser verified text restoration after reload and storyboard creation. Nine draft validation/recovery assertions, TypeScript and production build passed.

No fake render queue was added. The app states that references and rendering are not connected. Character/location asset pickers, actual auto-derived formats and durable provider jobs remain pending. Native Sites sign-in remains in place; Google/OnePass account linking has not been added. Browser reload recovery is verified; the full sign-in roundtrip and native iPad Safari are not verified.

Published creator revision: Sites version3, commitaba919e098e9e952e79b86922f5ac60fbd4687fc, successful deploymentappgdep_6af070de56d0819192c9db25ed7feb45. Creator UX memory adds a ninth document. Resource and continuity code has45 passing installed tests. No rendering activation is claimed.
