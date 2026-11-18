# Owner-approved MCP actions

This extends the existing SWADEBASE MCP and `sssbrain.ops_actions`. It is a founder-owned execution bridge, not unrestricted terminal access or a customer-wide permission grant.

## Tools and authority

Existing clients retain their existing scopes. Reconnect and explicitly authorize `actions:prepare` / `actions:execute` for requests that the owner will review. `payments:execute` is an additional grant and cannot authorize a payment on its own. The connection screen offers explicit action/payment consent options. Existing tokens are not upgraded.

The bot prepares a typed action, receives its ID, content digest and owner review URL, and waits. Only the separately authenticated SWADEBASE founder session can approve/reject an exact request, save payment rules or disable payments. There is no MCP approval or policy-editing tool. The verified founder identity and current super-admin role are checked through the existing database identity source; a different operator cannot use the founder's shared provider accounts.

Owner review: `https://swadebase.cloud/adapters/mcp/actions`. Studio: `https://swadebase.cloud/adapters/mcp/studio`.

Approval expires after ten minutes or the proposal's thirty-minute expiry, whichever comes first. Content/target changes require a fresh proposal. Owners can revoke unclaimed approvals. The registry kill switch still blocks tool admissions. An already claimed/dispatched provider action cannot be recalled by changing the rules.

## Supported operations

| Operation | Actual execution | Important boundary |
|---|---|---|
| repair_code | Exact single-file GitHub patch, new branch, draft PR | Requires an exact base commit and blob SHA. No tests or successful live repair are claimed merely from creating a PR. |
| merge_pull_request | Merge exact approved PR head | All recorded checks must pass; empty/incomplete check evidence blocks merge. |
| deploy_website | Pin registered Coolify app to exact commit, then queue deployment | Pin remains. Provider acceptance is separate from finished deployment and customer workflow verification. |
| send_email | Existing configured Resend sender, one exact recipient/body | Five accepted/uncertain MCP attempts per hour per actor; provider acceptance is not inbox delivery. |
| publish_release | Exact GitHub tag/commit and approved release content | Existing conflicting tags are rejected. This is repository release publication, not arbitrary social publishing. |
| delete_draft | Archive an owned wiki draft at its current digest | Reversible archival; no permanent erasure, shared Bible deletion, database deletion or VPS destruction. |
| payment_transfer | Stripe balance transfer to an allowed connected account | No card purchases, general invoices, bank payouts or arbitrary payment endpoints. |

Internal source is preserved in the verified private swadesoul/swade-ecosystem-hub repository under services/swadebase-mcp. Initially configured targets are the verified SSS Brain, public SWADEBASE fork and private ecosystem-hub repositories and the known SSS Brain Coolify app UUID. Other apps require verified entries in the existing server-owned target configuration. Read `swade_action_capabilities` to obtain actual target keys and connection readiness. A configured credential is not end-to-end certification.

## Payment rules

No payment is permitted by default. The owner must explicitly enable a policy with source Stripe account, live/test mode, currency, named connected-account payees, per-payment cap, daily transfer-amount cap and expiry within thirty days. The provider verifies the source/mode and connected-account transfer capability before enabling rules and before dispatch.

Every payment still requires a separate exact approval: payee, amount in integer minor units, currency, purpose, business reference and current rule digest. The owner types the displayed payment confirmation. A unique payee/reference guard prevents a fresh request key from bypassing an existing pending, uncertain or completed payment. Per-actor database locks serialize budget reservations and claims. Daily caps use America/Chicago and count approved reservations, running, uncertain and completed transfers. Caps cover transfer amounts; provider fees follow the existing Stripe account terms.

Unknown results remain reserved and blocked from automatic retry. Reconcile the provider outcome before any new attempt. Successful transfer receipts are distinguished from bank settlement. No payment is executed as a deployment test.

## Credentials and targets

Reuse the existing server-side provider credentials; never put keys in MCP arguments, Bibles or model context. The MCP access token is never forwarded upstream. GitHub/Coolify credentials are optional: missing authentication returns explicit setup-required status. Existing Resend and Stripe configuration is preserved. Fixed server-owned repository/application mappings prevent model-supplied hosts or arbitrary endpoints.

Example mappings: `actions-config.example.json`. Runtime override: `/opt/swadebase-adapters/config/mcp-actions.json`. Optional environment references: `GITHUB_TOKEN`/`GH_TOKEN`, `COOLIFY_API_URL`, `COOLIFY_API_TOKEN`. Keep existing `RESEND_API_KEY`, sender settings and `STRIPE_SECRET_KEY`; do not overwrite the shared environment or rotate credentials to install this feature.

## Tests and release

`npm test` runs policy/provider/protocol/route regressions. `actions-db.test.mjs` deliberately skips without `MCP_ACTIONS_TEST_DB`. For the PostgreSQL suite, create a disposable database named `swade_mcp_actions_fixture_<digits>`, apply `actions-fixture.sql` then `actions-schema.sql`, and run the test as the existing adapter role. Never apply `actions-fixture.sql` in the application database.

Apply only `actions-schema.sql` to production after checking the existing table RLS state and backing up ACLs. It introduces a narrow founder-check function, actor-bound policies, scoped existing-table grants and idempotency/reference indexes. No duplicate operation database or new scheduler is introduced.

Back up touched modules, compare their current hashes before replacement, syntax-check, restart only the existing adapter service, then verify public health, anonymous denial, owner-only routes, MCP discovery, unapproved execution rejection and receipt access. Use a scoped short-lived test connection; revoke it afterward. Do not send real email, publish, deploy customer sites, move money or archive real user content to test deployment.

Rollback restores only the backed-up MCP files and removes only newly installed modules. Restore the captured prior ACLs and remove only this feature's named policies/indexes/function if schema rollback is required. Preserve historical action/approval/receipt records, existing knowledge, native chat, merchandise scopes, mail and other adapters. Update the Site Bibles, private What's New and knowledge index with actual verification and remaining gaps.

Public targets: visibility is part of the approved context and is checked against GitHub when credentials are connected. Public repository writes require the separate owner confirmation PUBLISH TO PUBLIC REPOSITORY; a visibility change invalidates the action.
