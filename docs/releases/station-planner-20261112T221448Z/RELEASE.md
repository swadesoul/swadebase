# Station Planner release — November 12, 2026
Owner explicitly requested “Continue and make this live,” then station-owned ad uploads, super-admin access, main-station paid placement review and an education walkthrough.

## Included
- Station Planner: Today, Plan my week, Things my DJ says, Ads & promotions, My DJ. Plain-language draft/preview/activate/pause controls on the same AzuraCast playlists; precise minutes, dates/overnight windows, shuffle/order/weights and native cadence/loop-once support. Existing advanced tools remain.
- Native engine owns scheduling, queues and daily loop-once state. No second cron or inferred-airing ledger. UI labels forecasts, windows and staged outcomes accurately. The old hourly grid refuses edits to date-limited/minute-precise/play-once schedules to prevent data loss.
- Exact written DJ messages use existing approval/rendering and chosen voice; prepare-only audio stays off playlists until activation, is archived using existing B2 store/readback, and is reused on repeat plays. Existing voice charges/permissions apply; no generation was invoked during release tests.
- Incoming ad folder uses the existing authenticated upload, FFmpeg, quota/credit and B2 pipeline. Inbox playlist is disabled. Ads activate separately; smart hourly slots choose among 10/25/40/55 with spacing checks against occupied hourly slots. This is not a guaranteed exact-second scheduler or an optimizer for all legacy/custom policies.
- Super-admin station selection covers other owners; new planner operations deny cross-owner access to regular administrators. Existing role checks remain elsewhere.
- Owners submit ad placement requests with advertiser permission. Super admin records HUMAN review of payment evidence/reference and stages a disabled main-station ad draft. No automatic Stripe verification, checkout price, commission, sales promise, invoice sending or charge. Campaign dates/activation remain separate.
- /education contains eight guided lessons: offer, package, prospect fit, sales conversation, upload/QC, scheduling, verified reporting/renewal, main-station upsell. Start/skip/replay; text guides do not call paid models.
- Restores supplied DJ portraits and speaking-DJ record display; clickable eight admin counters with protected read-only details; ReSingLab-first/bulk importer; pushed-song arrival/playback/review inbox; public SEO/crawlable pages.
- Keeps working nav groups, COS onboarding, song editor, gifts, DJ meter, library privacy and deployed backend fixes. Reconciles open source branches rather than shipping their stale trees.

## Validation
TypeScript/Vite production build, clean Deno check for dj-studio and music bridge; 141 Bun/22 Node bridge/27 importer/5 admin detail/9 planner-security checks passed. Combined additive migrations and inbox authorization/review tests passed in one rolled-back transaction.
Actual disabled/nonpublic disposable engine stations verified draft=no changes, activate/pause, 23:37–01:37 date-limited schedules, preserved weight/order/request flags, protected native audio downloads, one-file daily loop_once, smart hourly ad placement, and human-reviewed import to a disabled main-station draft. Fixtures were deleted. No production user records, paid calls, customer advertisement publication or actual payment was created.
Chromium mocked-identity UI fixtures at 1440/820/390 widths passed music plan save/activation, ad campaign selection/submission, all eight education lessons, and no overflow/page errors. Phone screenshot visually inspected. No actual owner authenticated positive-path or physical iPad Safari certification.
Publication/deployment receipts and current canonical Bibles supersede older source-staged notes; never label a failed rollout as shipped.

## Operations and recovery
Additive station_planner_items/station_ad_placements tables are service-only RLS. Existing music-bridge review tables and guarded radio selection/distribution submission functions are extended.
Installer must capture current symlink/files and the original radio_promo_next function under deploy lock, apply migrations, notify PostgREST schema cache, replace only scoped native/edge/renderer files, restart maestro-factory only, atomically switch static release, verify public assets/auth denial and station now-playing.
On failure restore previous static symlink/native/edge/renderer sources and restart only maestro-factory. Restore original radio-promo-next and remove the new distribution trigger if reverting that behavior; retain audit/review/media tables. Existing plans/audio/engine settings are not reset. No radio engine or shared edge runtime restart required.
MyDistribution's separate frontend source tab is prepared in its repository; its independently hosted frontend deployment is separate from this Maestro release. Shared destination records remain accessible through Maestro after deployment.
