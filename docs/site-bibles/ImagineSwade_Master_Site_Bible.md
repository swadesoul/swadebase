# ImagineSwade — Site Bible & Launch Checklist

Owner: Swade Soul · Superadmin: swadesoul@gmail.com  
Prepared November 9, 2026 · Version 1.0 · Separate owner download

**Current release: working media-editing beta. Full AI-generation and paid-service launch are incomplete.** The site can store owned media, edit scenes, render CPU speech and assemble uploaded footage into an MP4. It cannot yet generate new GPU footage, claim perfect likeness/voice matching, or collect prepaid funds. This Bible distinguishes installed behavior from requested work.

Studio: https://imagineswade.swadeswade-s-8788.chatgpt.site

## 1. Product purpose

ImagineSwade is a film, series and video workspace built through Sites, with SWADEBASE as its backend and Hostinger as its CPU control plane. The intended creator journey is one continuous project: idea → script → character/voice references → scenes → generated or uploaded clips → timeline → review → final master.

Creators should not have to learn a second application to move from a script to an edit. A scene owns its instructions, visual source, references, cast, dialogue, approved recordings, trim and transition. The scene timeline is the editing source of truth. The character sheet carries the approved identity and voice revision.

## 2. Feature map

| Area | Current behavior | Verification / remaining gap |
|---|---|---|
| Production brief | Create, title and describe productions; creative look and aspect ratio | Build and browser interaction checked |
| Project persistence | Private SWADEBASE save/load; optimistic revisions; browser draft recovery; JSON import/export | Database scope/revision tests passed; real owner sign-in roundtrip still unverified |
| Scene timeline | Embedded React timeline; add/remove scenes, reorder, trim and split; 24 fps timing | Published UI checked; default-cut timing discrepancy found during QA and corrected |
| Media uploads | Owned video, still image and audio uploads; references/start/end image slots | Actual two-video upload and B2 storage roundtrip passed through the backend |
| Instructions | Per-scene action, camera and script text | Saved in the project; GPU reference conditioning not installed |
| Character sheets | Named sheets, video/series/movie labels, wardrobe, reference images and revisions | Scoped within one production; shared cross-project series/movie library is pending |
| Script sync | Exact character-name dialogue extraction; unknown names block mapping | Deterministic mapping, not full natural-language screenplay interpretation |
| Off-screen dialogue | Off-screen/voiceover lines reference a character without forcing them into the visible cast | Continuity assertions passed |
| Voices | Live Voice Studio catalog; locked character voice choice; CPU Kokoro dialogue generation; uploaded audio approval | 65 stock CPU presets returned; one real CPU line rendered and saved to B2 |
| Clone voices | Founder can select existing saved clone identities | Generation remains blocked without a bounded GPU budget; customer identity/consent linking pending |
| Manual editing | Change order, source trims, durations, cast, dialogue and transitions | Basic scene editing; no full CapCut parity |
| Automatic stitching | Pack scene order and assemble MP4 using FFmpeg; cuts, dissolves, fades; dialogue mix | Real two-clip export completed, persisted, downloaded and probed |
| Generated footage | Future GPU output must attach to its existing scene asset slot | Provider dispatch and automatic generated-clip callback remain offline |
| Results | Export stage/status, error, cancellation and finished master preview/link | Durable jobs survive browser closure; signed-in browser export still unverified |
| Founder access | Server allowlist, superadmin and in-app payment exemption | Database role/exemption assertions passed; owner browser session not verified |
| User administration | Directory, project index, job/runtime/storage view | Installed; reports actual records, no invented traffic or cost |
| Support view | Audited read-only view of a creator's production records | Does not impersonate their login or authorize actions as them |
| Grants | Idempotent free-video grants and payment exemption changes | Grant bookkeeping tested; paid/GPU redemption is not active |
| Messaging | Private account messages and creator inbox | Installed; outbound email is not connected or sent |
| CMS | Project metadata and admin operational views | A full editorial/content/media CMS and delegated role editor remain incomplete |
| Billing | Shared live Swadez merchant verified | Checkout, payment requests, prepaid wallet and financial fulfillment remain pricing_required |
| Google/OnePass | Native Sites sign-in preserved | Direct SWADEBASE Google account linking is pending supported platform integration |

## 3. Creator workflow

1. Choose **Create production**, enter the story and save it while signed in.
2. Add a finished video clip or still image to each scene. Upload reference video/images with instructions; use start/end image slots when a later generation workflow needs those constraints.
3. Open **Cast & voices**. Name the characters, record wardrobe, attach approved image references and choose a Voice Studio identity.
4. Write dialogue in the scene script as `CHARACTER: dialogue`. The script-name tool resolves exact names. An off-screen marker such as `(O.S.)` keeps that speaker out of the automatic visible-cast mapping.
5. Review cast and delivery per line. Generate a CPU Voice Studio recording, or upload and approve an existing recording. The selected recording and character revision stay attached to that line.
6. Drag or reorder scenes; adjust trim-in/duration, split a scene at the playhead, and select cut, cross dissolve or fade through black.
7. Save, review continuity checks, then choose **Export MP4**. The server creates a durable job and an immutable snapshot before processing.
8. Review the finished master in the project. A new edit creates a new export; it does not silently rewrite an earlier master.

The selected-source preview plays the source clip. The completed master is the authoritative preview for transitions and mixed dialogue. A fully composited real-time timeline preview remains an improvement to make.

## 4. Ease-of-use reevaluation

The original planning shell made users enter ideas before discovering that uploads/rendering did not exist. This release puts scene editing and media attachment inside the same production.

The brief remains above the fold, with one primary create action. Settings are consolidated. The editor uses three clear steps: add media, check cast/voices, export. Buttons expose current availability; no fake render percentages or queued jobs are shown. Exports display actual server stages and errors.

Important next usability improvements: a compact “simple edit” layout for phones, a real-time mixed preview, undo/redo, multi-select/batch uploads, direct Voice Studio project import, stronger keyboard editing, and a shared approved-asset picker across productions. Native iPad Safari uploads and long recordings require actual-device acceptance before launch certification.

## 5. Character and voice continuity contract

Each character has a stable ID, name, scope label, scope name, approved references, wardrobe, voice identity and revision. Scenes use character IDs rather than guessed display names. Each dialogue line records speaker ID, text, on/off-screen/voiceover delivery, approved audio, timing offset and approved character revision.

Changes to a character or voice increment the revision. Text changes invalidate the UI's audio approval. Export checks reject missing visual sources, unknown cast members, on-screen dialogue without that speaker in the cast, missing voice identity, stale character revisions and missing owned audio.

Generated speech attaches only if the current text and character revision still match the request. If the user edits during speech generation, the result remains available as an audio asset for review instead of overwriting the changed line.

These are consistency controls. They do not prove that an uploaded recording contains the stated words, that a model perfectly preserves a face, or that wardrobe visually matches. Speech/text alignment, face/wardrobe validation and human approval remain separate quality gates. The system must not promise 100% visual or performance identity without those checks.

## 6. Scene and export contract

The project stores scene order, source asset IDs, reference/start/end IDs, instructions, cast, dialogue, source trim, scene duration, source-audio preference and incoming transition. A scene's source may be video or a still image. Reference video guides planning and later generation; it is not automatically placed into the cut.

| Export property | Current limit / behavior |
|---|---|
| Master formats | Landscape 1280×720, portrait 720×1280, square 720×720 |
| Encoding | H.264 video, AAC audio, MP4, 24 fps |
| Scene length | 0.25–30 seconds |
| Project size | Up to 60 scenes and 15 minutes per export |
| File size | 50 MB per source asset and master |
| Scene transitions | Cut, cross dissolve, fade through black |
| Audio | Silent bed or optional source audio; source ducks under approved dialogue |
| Dialogue | Recording must fit the scene at its selected offset; overlong dialogue fails visibly |
| Aspect conversion | Fit/pad normalization; automatic multi-format delivery is not connected |
| Rendering | CPU FFmpeg on existing Hostinger resources; no GPU required for assembly |

Cross dissolves and black fades overlap adjacent scenes. That overlap reduces total film duration. The UI and renderer must use the same timing rule. Final duration and audio-track presence are checked with FFprobe.

## 7. Job lifecycle, reliability and cleanup

Jobs are recorded before execution and carry an immutable project snapshot, SHA256 snapshot hash, request ID, stage, timestamps, status, result and error. Repeated submission with the same actor/request ID returns the same job. Project revisions prevent exporting a different edit than the one saved.

The worker claims one job at a time. Sources are downloaded only from signed owned B2 asset records, processed in a private temporary folder, and removed at completion/failure. Result media must be uploaded before the result asset/job is completed. Completion and shared usage bookkeeping are transactional.

Cancellation is checked between processing stages. A currently executing FFmpeg stage may finish before the cancel is observed. A worker interrupted for more than 20 minutes leaves a failed lease for explicit retry; it does not resubmit paid work automatically.

A shared Hostinger VPS stays on. “Shut down after a job” applies to an owned dedicated GPU lease or serverless worker lifecycle, not to the shared SWADEBASE host. This CPU editor does not launch GPU resources.

## 8. Resource routing and cost policy

The existing Director's requested routing policy remains small → Runpod, medium → Together.ai, large → verified Hostinger GPU. Script/planning/assembly and suitable speech use existing Hostinger CPU resources. Provider choice must also pass capability, model, quality and fresh total-cost checks; a size label alone does not establish that a provider is cheapest.

GPU dispatch is still disabled, and the external-spending cap remains $0. Existing Runpod credentials were authenticated in the prior setup, but the saved image/Wan endpoints were disabled and have not passed this site's real generation tests. A Hostinger GPU target is not yet verified. No provider paid job or new GPU rental was used for this release.

Before activation: define per-job and daily caps, model/license eligibility, exact reference-capable workflows, idempotent provider submission and reconciliation, durable output copying, owned-lease cleanup, idle-time verification and actual usage receipts. Do not stop unrelated voice workers or jobs.

## 9. Superadmin and creator accounts

`swadesoul@gmail.com` is the primary superadmin. The standing founder allowlist also retains `officialabagale@gmail.com`. Only server-supplied native Sites identity is used; a browser flag or posted email cannot grant admin rights.

Founder status bypasses in-app payment gates; it does not erase external vendor bills or technical resource safety controls. Admin mutations create audit records and use request IDs to prevent duplicate grants.

The admin area lists users, creation/last-active timestamps, saved productions, stored bytes and job state/runtime. Read-only support view is audited. The owner can record a free-video grant, toggle a payment exemption and send a private account message. Messages appear in the creator's inbox. No actual customer was granted, charged or messaged as a test.

Still needed: granular delegated admin roles, editorial CMS/media management, account-scoped service quotes/payment requests, paid-credit consumption/refunds, fuller per-project cost summaries, data retention controls and production acceptance using the owner's actual session.

## 10. Stripe and prepaid usage

The protected runtime Stripe key was queried read-only. It matched the established live **Swadez** merchant, account `acct_1SizGm43OPTHaIwn`, with charges and payouts enabled. The previously completed $1 SSS Brain charge remains shared-account evidence; it was not repeated.

ImagineSwade's billing manifest is **pricing_required**. No prices or prepaid exchange rate were invented. The following must be defined before checkout can be enabled:

- Usage/offer rates and currency, including how draft versus final video usage is billed.
- Minimum prepaid purchase, any expiry, refund policy and treatment of failed jobs.
- How gifted videos are redeemed, and the maximum eligible external cost.
- Site-specific Checkout/payment-request ownership, webhook signing, paid-only fulfillment and an atomic wallet ledger.
- Retries, refunds/disputes, out-of-order events, concurrent credit consumption, founder exemptions and app isolation.

The intended admin action is a specific service quote/payment request that the customer chooses to pay. Direct card charges require a valid mandate and explicit charge authorization. A Checkout URL or success redirect alone must never fund a wallet. Email sending remains an explicit owner action.

## 11. Identity and Google sign-in

The hosted Site uses Sites-owned authentication. It receives a stable per-site user ID and email through the platform; the server hashes the ID into its private workspace actor. The site preserves the native sign-in routes and browser drafts through navigation.

A standalone Google OAuth client/session stack was not added because the current Sites contract owns authentication and requires supported external identity linking. Google through a user's ChatGPT account is different from linking a SWADEBASE OnePass account. Direct SWADEBASE Google sign-in, cross-product private assets and shared customer profiles remain pending supported linking or an approved hosting/auth architecture change. No Google credentials are needed in browser code.

## 12. System map and repository outline

| Layer / file | Responsibility |
|---|---|
| Sites UI / `app/studio.tsx` | Brief, saved projects, draft recovery, private inbox, navigation |
| `app/scene-editor.tsx` | Embedded timeline, scene/cast/dialogue editing, media actions, exports |
| `app/production.ts` | Scene contract, overlap timing and continuity checks |
| `app/admin.tsx` | Founder operational dashboard and user support actions |
| `app/api/studio/route.ts` | Native identity, allowed actions, origin checks, scoped backend bridge |
| `app/api/media/route.ts` | Authenticated upload and owned-media delivery |
| SWADEBASE dedicated edge function | Scoped RPC, B2 signing/storage and Voice Studio bridge |
| `backend/003-production.sql` | Members, assets, durable jobs, messages, grants and admin auditing |
| `backend/004-voice.sql` | Owned speech preparation/completion and voice metadata |
| `backend/editor/worker.py` | CPU media normalization, dialogue mix, transitions, assembly, storage |
| `swade/billing.json` | Nonsecret billing readiness manifest |
| Existing Rakazo Director | Isolated policy/memory and deterministic continuity/resource tools |
| Existing Voice Studio | Actual saved voice registry and CPU/GPU voice engines |
| Backblaze B2 | Durable originals, approved recordings and masters |

The embedded timeline package is `@xzdarcy/react-timeline-editor` 1.0.0, MIT licensed: https://github.com/xzdarcy/react-timeline-editor. It supplies timeline interaction; ImagineSwade supplies scene semantics and FFmpeg export. OpenReel was researched as a broader alternative: https://github.com/Augani/openreel-video. OpenCut's classic repository is archived; the current repository is a rewrite. No whole external editor or alternate hosting/auth stack was deployed.

## 13. Security and operating limits

Provider, database, storage and speech credentials stay on SWADEBASE. Sites holds only its scoped backend secret. Direct table grants are revoked from browser API roles, RLS is enabled and RPCs verify scoped tokens. Asset IDs are resolved against the current actor before delivery; signed media URLs are short lived.

The dedicated CPU worker runs as `swadeops` with one active job, a CPU quota, a 2 GB memory ceiling, private temporary storage, a protected environment file, no new privileges and a read-only system filesystem. FFmpeg reads controlled local inputs; no arbitrary remote URLs or shell commands are accepted from project documents.

Media limits and job caps protect shared resources. Monetary cost is reported only when priced: CPU runtime and bytes are real, while actual infrastructure allocation and savings remain unknown. The existing shared ledger requires a numeric cost field; `0` with `priced=false` is a placeholder, not proof of zero cost.

## 14. Verification record

- TypeScript and production build passed.
- 9 browser-draft/parser assertions and 9 continuity/timeline assertions passed after the default-cut correction.
- 16 installed PostgreSQL assertions passed in a rolled-back fixture transaction: token denial, founder exemption, nonadmin denial, idempotent gifts, ownership, pending-media denial, duplicate-job identity, cancellation isolation and direct-table revocation.
- Real FFmpeg tests passed for two-clip cut, cross dissolve and fade-through-black assembly, with expected audio and durations.
- The actual scoped HTTP/B2/queue/CPU-worker path completed a two-scene master. It was downloaded from B2 and probed at 3.51 seconds for a 3.5-second dissolve edit, with an audio track.
- The live Voice Studio catalog returned 65 stock CPU voices to a nonfounder fixture; a real CPU dialogue line was generated and persisted as a B2 WAV.
- Shared live Stripe account identity matched the established merchant. No payment, refund, transfer or customer email was performed.
- The published editor was opened in Chromium; production creation, scene insertion and cast workspace rendered. Native Safari, actual owner login/admin operations, uploaded-file editing from an iPad and complete signed-in browser export are not certified.

## 15. Launch blockers and acceptance plan

| Required gate | Exit evidence |
|---|---|
| Supported Google/OnePass linking | Actual sign-in/callback/session/logout and cross-product ownership tests |
| GPU generation | Approved caps and eligible model; real reference-image/video job; durable result in correct scene |
| Automatic editing pipeline | Script → cast/voice → generated clips → timeline callback → reviewed master, including stale-result rejection |
| Shared character library | Stable series/movie identity across projects, approved revisions, explicit scene wardrobe and asset permissions |
| Voice Studio projects | Owned project/recording import and consent/clone permissions; real speech/text timing QA |
| Complete editor experience | Mixed real-time preview, undo/redo, batch media, captions/titles/music/effects, native touch acceptance |
| Billing | Approved offers/terms, scoped Stripe webhook, atomic prepaid ledger, failure/refund/dispute tests |
| Robust CMS/admin | Scoped roles, editorial media/content controls, per-project cost accounting and customer lifecycle acceptance |
| Continuity quality | Human approved likeness/wardrobe/voice checks and explicit handling of ambiguous script names |

**The site must remain labeled beta until these gates pass. It is not 100% launch-ready.**

## 16. Recovery and change history

Preserve all projects, media, messages, grants and audits during rollback. Restore the prior Sites version for the frontend, stop only the dedicated assembler, restore only ImagineSwade's edge function from its scoped backup, and revoke only its worker token if needed. Do not stop shared SWADEBASE/Voice Studio services or drop production tables.

November 8: planning release, Director registration and routing policy. November 9: scene editing beta, owned media upload, CPU assembly/export, shared Voice Studio catalog and speech, founder admin operations, private inbox and truthful billing readiness. The canonical operator Bible records exact source/deployment receipts and subsequent fixes.

### Published release receipt

Sites version 5, source `72a0ddbc531f04e1bc7493c687a682d59234c7fd`; saved version `appgprj_6af061bb91788191942c6d937425fd8d~appgver_15cd3f8ac9ac8191901e565a78ff0ff9`; deployment `appgdep_6af1d10e999c8191b9c016b793f9ddd2`, succeeded November 9, 2026 at 13:56:37 UTC. Existing public audience preserved.

Live Chromium verified the corrected 10-second timeline for two default-cut 5-second scenes, draft recovery after reload, and integrated character-sheet controls. Browser testing was signed out; it does not certify an owner session. Eight disposable B2 test objects, fixture rows and fixture-scoped tokens were removed after acceptance. No customer content was used.


### Director memory handoff — 2026-11-09T14:01:04.812496+00:00
Native Rakazo ImagineSwade Director CURRENT-STATE.md was updated through MemoryDocument/MemoryRevision and LocalAgentHomeStore; document revision2 verified. No model/instructions/permissions change and no inference run. The edit release and remaining gates are now in its persistent current-state record. The separate owner download remains the release Bible snapshot.
