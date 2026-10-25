# Brainiak Master Site Bible
Version 1.1 — October 25, 2026, America/Chicago. Initial operational baseline; feature-specific evidence below.

1. Identity: Brainiak, canonical brainiak.live, personal/business/enterprise second-brain product within SWADEBASE powered by SSS Brain. Founder: Swade Soul. Older BryKneeAct spelling is historical.
2. Purpose: help people organize knowledge and work; professional email is a connected service.
3. Features: private ChatGPT review and SWADEBASE deployment exist. This baseline verifies mail management/password setup/local writing only; other feature readiness remains governed by its current operational documents, not assumed from a running page.
4. Journeys: founder signs into SWADEBASE Mail Center, creates mailbox and shares private password setup link; user chooses a password, opens SOGo and optionally enhances selected draft.
5. Hosting/source: existing Hostinger primary VPS. Brainiak app /opt/brainiak/current; reachable source checkout /opt/brainiak/source-playback-repair. Mail features extend /opt/swadebase-adapters. Private review project appgprj_6ade411a508c81919b47d8e8c798f71c; its owner-private audience is unchanged. Main domain currently redirects to https://swadebase.cloud/brainiak; /mail leads to shared email home.
6. Data: application PostgreSQL schema brainiak; mail metadata swadebase_ops.mail_setup_links/mail_actions. Messages remain in existing Mailcow. Do not duplicate customer inboxes into memory.
7. Identity: app Google login uses SWADEBASE. Mail management uses an existing opaque verified SWADEBASE super-admin session and fresh role checks. Mailbox users choose separate passwords. Founder account swadesoul@gmail.com is not permission based on email text alone.
8. Dependencies: existing Mailcow/Dovecot/SOGo, SWADEBASE owner adapter, existing local Ollama. No new paid mail/AI provider.
9. Storage: Backblaze for product media; Mailcow's existing private mailbox storage/backups retain mail. Metadata holds no draft bodies or plaintext passwords.
10. Pricing: optional product updates fixed at $49.99 one-time; monthly tier proposals and checkout readiness remain as documented in BRAINIAK_PRICING_AND_MARKETPLACE.md. Mail entitlement pricing not newly established here. Creation bounded to 512 MiB and domain quota; writer bounded and local.
11. Jobs: existing Mailcow backup/health services unchanged. No new sending scheduler or automatic inbox processing.
12. Known issues: DNS caches may retain old Namecheap mail forwarding until expiry; external delivery, real browser founder sign-in and iPad Safari remain unverified. Enhance is a shared paste/review/copy page; not an embedded compose button.
13. Recovery: dated source/nginx/DNS snapshots under /opt/brainiak/mail-setup-20261025. Restore UI/config independently of mail data. Preserve messages.
14. Sources/history: v1.0 established from source/API/DNS/TLS integration checks on October 25. Full mail evidence and limits: BRAINIAK_PROFESSIONAL_EMAIL_AND_ENHANCE.md. Prior domain/video/auth/CMS/pricing reports remain current references; their unverified items are not upgraded by this baseline.

## Ecosystem routing update — October 25, 2026
The current server/brain-api release adds a server-only founder routing hook for recognized ecosystem requests. It forwards the signed-in user's original SWADEBASE token only to the local existing adapter planner, which verifies user identity and current super-admin role. Customer access is not widened. Existing notes/task handlers remain in place. The shared planner reads SWADEBASE knowledge first, reports missing project Bibles and never represents a plan as production. Its local model is optional with rules fallback and no paid fallback.

Source: /opt/brainiak/current/server.mjs and brain-api.mjs; /opt/swadebase/ops/mcp/brainiak-operator.mjs. Syntax checks and isolated bridge tests passed; Brainiak public health passed. Full authenticated browser/chat use is unverified. The shared MCP public-HTTPS official-client OAuth/knowledge/queue smoke passed; that is separate evidence from Brainiak chat. Preserve the adjacent pre-mcp file backups for rollback, review concurrent edits, and restart only the existing Brainiak service. No production spending or sending was enabled.
