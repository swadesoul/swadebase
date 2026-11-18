# Brainiak founder CMS and account updates

Founder: verified SWADEBASE account f6e059a4-ea87-46ac-9b8e-cda2b047b979 (swadesoul@gmail.com). app-local super_admin role; no email-only trust or role from client input.

CMS: https://swadebase.cloud/brainiak/admin. Founder sees a link after SWADEBASE Google sign-in. API denies unsigned and ordinary accounts. Dashboard includes workspace/owner search, recent Brainiak sign-ins, active gifts, product releases, update activity, credit balances and audit history. Gifts require a reason; plan gifts last 1–3650 days. Credit gifts are bounded whole promotional units, have no cash value and cannot yet fund production. Monthly plan prices and unbuilt team/production features stay draft.

User mimic is a bounded read-only support snapshot with a required reason and audit entry. It exposes no API credential fields, changes no session identity and has no send/spend controls. Plan mimic is a simulation and changes no entitlements. No real founder browser sign-in was performed by the agent; role lookup and database tests passed.

Admin actions and credit grants share transactional idempotency keys. Same ID/payload retry adds nothing; conflicting payloads fail. Gift records do not charge or cancel Stripe subscriptions. Existing paid entitlements are not overwritten by gifts. Real PostgreSQL tests in a disposable isolated schema passed: non-admin denial, concurrent credit retry deduplication, input validation, plan gift, support inspection, simulation and audit integrity.

Account updates: update_products, product_grants, product_releases, workspace_product_versions and product_update_events in brainiak schema. Only compatible verified released versions with deployment evidence are eligible. Product ownership and all required release entitlements must be active and unexpired. Free/paid/gifted grants qualify equally; a paid upgrade still requires its verified purchase grant. Workspaces, content and secrets are not overwritten. Each activated version produces one in-account receipt, with no downgrade or duplicate action on retries.

brainiak-updates.timer reconciles every minute; authenticated /api/updates checks the signed-in owner's account. This activates account access to already-deployed software; it does not autonomously execute arbitrary downloaded installers. New releases are a controlled operator deployment/publication step. Destructive migrations and new permissions retain their review gate. Billing checkout/webhook fulfillment remains disabled/unimplemented; future signed purchase processing must insert product grants transactionally. No automatic charges.

Known limit: shared ChatGPT review has a separate identity/database and does not own the SWADEBASE CMS. Access the CMS on SWADEBASE. Full UI behavior with the actual founder Google session remains unverified.
