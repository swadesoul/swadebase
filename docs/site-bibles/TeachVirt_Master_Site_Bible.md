# TeachVirt Master Site Bible

TeachVirt (https://teachvirt.courses) is Swade's course platform: coaches build AI-assisted courses, sell them, embed them and teach live. Swade (swadesoul@gmail.com) is the super admin ("God mode", exempt from all payments) and the coach "The Professor".

## Where it runs
- Frontend: GitHub `swadesoul/teachvirt` (React, Vite, Tailwind, shadcn), published with Lovable `deploy_project` only (project `ee80aad6-511d-412e-94b7-705896667617`). Never use Lovable chat; it spends credits.
- Backend: SWADEBASE, schema `teachvirt`; edge functions at `https://swadebase.cloud/app/teachvirt/functions/v1/<name>`.
- Deploy functions: `/opt/teachvirt-deploy/deploy.sh <git-sha> --apply`. Secrets: `/opt/swadebase/docker/functions.env`.
- Repo migrations use `public.*`; the server copies are `teachvirt.*`.

## Payments (production-ready October 28, 2026)
- One shared live Stripe account serves many Swade sites. Every TeachVirt checkout carries `metadata.app = "teachvirt"`; the TeachVirt webhook ignores every other session.
- TeachVirt's own Stripe endpoints both point at `.../teachvirt-stripe-webhook`:
  - platform endpoint (checkout completed/expired, subscription updated/deleted, charge refunded), secret `TEACHVIRT_STRIPE_WEBHOOK_SECRET`;
  - Connect endpoint (account.updated), secret `TEACHVIRT_STRIPE_CONNECT_WEBHOOK_SECRET`.
  - Recreate with `/opt/teachvirt-deploy/create-stripe-webhooks.py` (stores the secrets, never prints them).
- Every checkout returns to `/purchase-success?session_id=...`, which calls `teachvirt-verify-purchase-session`. That finishes the grant even if the webhook is late, refreshes the plan cache and opens the purchase:
  - courses open `/learn/:id`;
  - plans open `/dashboard/subscription?upgraded=1`;
  - credit packs open `/dashboard/credits`.
- All grants live in `supabase/functions/_shared/fulfillment.ts`: plan activation, course paid status, credits and add-ons. They are retry-safe, and the webhook rethrows a failed grant so Stripe redelivers it.
- A full refund sets `course_purchases.status = refunded`, which removes access. A partial refund keeps access.
- Courses owned by a super admin (TeachVirt's own) charge straight to the platform account and need no Connect. Other coaches' courses need an active Stripe Connect account.
- End-to-end test with no charge: `python3 /opt/teachvirt-deploy/e2e-payments.py` sends signed events covering buy, repeat delivery, refund, upgrade, another site's event and a forged event. It passed 10/10 on October 28, 2026.
- Live checkout smoke test: `bash /opt/teachvirt-deploy/e2e-checkout.sh` opens a real Checkout for a throwaway user, checks what Stripe received, then expires the session.

## Prices (set October 28, 2026)
Swade's published courses are priced by size:
- $29 for under 25 lessons;
- $49 for 25–59 lessons;
- $79 for 60 lessons or more.

TeachVirt Mastery stays free. The previous prices are backed up in `teachvirt._bak_course_prices_20261028`.

## Images
- Every course and lesson image lives in SWADEBASE storage:
  - `course-covers` is a public bucket;
  - `forge-images` is private and served through 10-year signed URLs.
- Nothing points at the old Lovable cloud (`cjrdumbalppujuqqkiqw`) any more.
- New images come from Replicate `black-forest-labs/flux-schnell` (about $0.003 each; change it with `TEACHVIRT_IMAGE_MODEL`). Every image is logged to the cost ledger. SWADEBASE has no Lovable key, and this OpenAI project has no image models.
- Backfills: `/opt/teachvirt-deploy/backfill-covers.sh` and `/opt/teachvirt-deploy/backfill-lesson-images.sh`.
- To call a function as the founder from the server: `python3 /opt/teachvirt-deploy/call-as-founder.py <function> '<json>'`. It uses a 10-minute token and a temporary session.

## Live classes
Live classes open January 2027 (`site_settings.live_launch_at`). Until then visitors join `teachvirt.live_waitlist`, and `create-livekit-token` refuses everyone except super admins.

## Course player repair and published editing — October 29, 2026

- Founder explicitly approved push and deploy after reviewing the layout findings. GitHub PR31: https://github.com/swadesoul/teachvirt/pull/31. Source commit 4621c32c60023187dee535aa3eee418fe0a63d1f; main merge 66eabc4b97f35adf6adf2e53ff76b9d22b0966be; prior main e922a84aef572b466a61f56119e44e2c2b83606a.
- Three shared player files only: CoursePlayer, LessonDiscussion and embed/player/LessonNotes. Sticky rails are confined to the lesson row; tools are separate below it. Guides show their full content without the previous fixed-height fade. Titles and controls wrap; cards fit available width.
- Pre-deploy evidence: production Vite build passed; existing Vitest suite 21/21 passed; scoped lint passed excluding pre-existing no-explicit-any violations. Full TypeScript check reports existing errors in builder/Goals files outside this patch. Logs remain in /opt/teachvirt-layout-20261029/layout-*.log. No authentication, payment, course data or schema changes.
- Lovable publish requested at server time 2026-10-29T15:33:44.624848+00:00; deployment d91aa2f6-e277-456f-b90b-b79617e4b6aa. STATE: shipped and verified live at 2026-10-29T15:34:51.548879+00:00. Browser verification on https://teachvirt.courses/learn/00000000-0000-0000-0000-0000000000c0 found both new layout markers and no collapsed-guide button. At 1363x936, horizontal overflow was absent; both sticky rail bottoms were 608.25px and tools began at 624.25px. Mark lesson complete and Next Lesson were visible and hit-test uncovered after scrolling. Visual evidence captured. Exact paid course access and real iPad Safari remain untested; the same shared player component is used. Browser zoom did not change the viewport, so narrower-device verification is not certified.
- Coach editing already exists: /studio/courses lists courses filtered by creator_id, with Edit linking to /builder/:courseId for published and draft courses. PublishDialog recognizes alreadyPublished and offers Republish course. Live teachvirt policies allow the creator (or super admin) to manage courses, modules and lessons without a draft-only restriction. Manual lesson editors autosave directly to lesson records, retaining published status; the learner route reads those same records. Saved edits may therefore be visible before Republish. An authenticated coach save was not exercised, and no production lesson was modified to test it.
- Rollback: revert PR31's merge on main and republish the same Lovable project. No database rollback is needed. No migration or backend function deployment was used.


## SWADE Learn shared training hub — November 5, 2026

Deployed for owner-private review at https://swade-learn.swadeswade-s-8788.chatgpt.site, source ad17488a8b0ebeaf38cd025b39c912ce03886877, deployment appgdep_6aecd8dae1848191bc26a796212a304f, verified after 19:28:33 UTC. SWADE Learn adds instructor, subject, training, media, site-destination and production-draft management over the existing TeachVirt course engine and VirtTeach Community. It presents ten canonical courses and one original written Swarvis guide. New hub metadata lives in teachvirt.learning_hub_records with a separately scoped credential hash in learning_hub_tokens; existing course/auth/enrollment/payment records were preserved.

Seventeen scoped integration checks passed. Both approved Swarvis reference images passed B2 upload and byte-identical download. Hosted checks returned catalog/class/image 200, unauthenticated admin 401, and private unreferenced image 404. Native Sites owner identity gates administration; B2 credentials remain on SWADEBASE. Production packs save and export, while paid voice/video generation and actual rendering are not connected by this release. Public audience access, other-site embed installation, owner browser form flow, iPad end-to-end upload and paid entitlement verification remain separate steps.

Full architecture, exact contracts, release evidence and rollback: site-bibles/SWADE_Learn_Master_Site_Bible.md. Private What's New event: b31304a7-79ec-4fb4-89d2-56ffb14d3e7f; release_state internal. No shared service restart or Attobahn config/file change.
