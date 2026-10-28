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
