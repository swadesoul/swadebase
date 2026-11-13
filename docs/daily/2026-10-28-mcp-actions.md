# MCP execution and Studio release — October 28, 2026

MCP 1.1.0 deployed to the existing SWADEBASE adapter service. Owner action review and Studio live at /adapters/mcp/actions and /adapters/mcp/studio. Payments default disabled; enable only with owner rules and separate exact approval per transfer. Rules include source/mode/currency, named payees, per-transfer/daily caps and expiry; reservations/reference deduplication and uncertain-outcome blocks enforce them server-side.

Validation: 69 source tests passed, one database suite skipped in that run; separate PostgreSQL suite passed 11 scenarios plus parent. Public signed SDK test discovered 26 tools, rejected unapproved execution and bearer self-approval, read own receipt/Studio and verified anonymous-page protection. Temporary tokens revoked, synthetic proposals rejected. No real provider write, email, payment, release, customer deployment or customer draft archival.

GitHub/Coolify server credentials absent; code repair/merge/publish/deploy remain setup_required. Resend/Stripe presence is configuration evidence only. Provider-completion and authenticated browser/iPad verification pending. Full cross-app API coverage remains incomplete. Native SSS Brain chat is not automatically upgraded into an execution client.

Private source: swadesoul/swade-ecosystem-hub PR24, services/swadebase-mcp. Runtime source commit 869a40d965609bbc4862347de11fa31d82307152; scoped backup /opt/swadebase/backups/mcp-actions-20261028T140139Z. Existing divergent runtime checkout preserved. Public swadebase fork identified; current export blocked automatically and safely redirected to verified private source. Earlier public review branch requires separate visibility/cleanup review.
