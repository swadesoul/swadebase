# ABAGALE merchandise agent connection activation

Approved and activated October 26, 2026 America/Chicago (server UTC October 27).

State: LIVE CATALOG READ AND QA REPORT CONNECTION; PRODUCT CREATION NOT ENABLED.

The existing SWADEBASE MCP now supports swade_merch_catalog and swade_merch_report_qa. Dedicated merch:read and merch:report scopes preserve existing platform scopes. Read is fixed to Printify shop 27971409 and SWADEBASE store 57e6a7d2-7392-4a34-ae3b-606d1e5dd775, using Guardian catalog metadata snapshots. Reports accept only store product IDs and go to the existing cos handoff queue, with actor-specific idempotency and explicit queued-not-acknowledged state. No publishing, purchasing, paid generation, product mutation, arbitrary URL or order tools were added.

Native ABAGALE Merch Steward connection is enabled with allowAllTools=false and exactly those two tools. Its dedicated revocable credential is encrypted in the native runtime vault, has only merch:read and merch:report scopes, uses the existing MCP audience, and expires January 25, 2027 UTC. No founder API key or Printify credential is given to the bot. Raw provisioning material is protected in the central secret locker; never print it or place it in prompts.

Verification: 21 offline tests passed. Live existing adapter service restarted successfully; health ok and unauthorized MCP request returned 401. Native McpSession transport and encrypted-secret roundtrip passed; catalog returned 10 products. General ecosystem read and general task creation were denied. Foreign-store product references were denied. The real cinematic correction report was submitted as handoff receipt 91 and replay returned the same receipt. Paid model/provider generation calls: zero.

Chief of Staff report 91 is OPEN/QUEUED, not acknowledged or read. It records clipped public tee slogans, repetitive art direction below requested cinematic quality and a flat production-panel sweatshirt preview. Printify readback supplied only one sweatshirt image, so no verified finished-garment image could be substituted. No invented scores or design approvals.

Existing Guardian scheduled hook execution exited 0 on October 27 00:07:46 UTC. Observer self-throttles and reports catalog parity separately from visual QA. Native paid-model routines remain paused. Weekly product creation still needs a draft-production capability, approved durable logo asset access, bounded generation budget and full dark/light/panel visual validation. This activation does not close those gaps.

Backup before activation: /opt/swadebase/backups/merch-activation-20261027T000810Z. To roll back, disable only SWADEBASE Merchandise Review, revoke its dedicated MCP client credential, restore core.mjs/route.mjs/service.mjs/protocol.mjs from that backup and restart swadebase-adapters.service. Existing Guardian is independent. No root SSH was used; both known connected device interfaces were used. No temporary super-admin credential was created.
