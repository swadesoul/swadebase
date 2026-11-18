# Brainiak and shared Mail Center — October 25, 2026
Status: deployed; route/API/real mailbox authentication and local writing tests passed. Browser Google consent, iPad Safari and external inbox delivery remain unverified.

## Founder management
Open https://swadebase.cloud/adapters/mail-center and select Sign in with SWADEBASE using the authorized super-admin account. The management API checks the opaque SWADEBASE admin session and the current database super-admin role on every request. The legacy owner token alone cannot provision mailboxes or issue password links.
This provides mailbox management without a second Mailcow administrator password. It does not disable Mailcow authentication or 2FA and does not provide unrestricted inbox impersonation.

GET /adapters/api/mail-accounts lists configured domains and sanitized mailbox details plus an audit history. POST create provisions one 512 MiB mailbox on an existing Mailcow domain; domain quotas apply. POST setup-link issues a 30-minute link for an existing mailbox. Mutations require the existing CSRF mechanism and a current super-admin role.

## User page and passwords
https://brainiak.live/mail and /email lead to https://swadebase.cloud/adapters/mail-inbox.
The existing SOGo inbox remains https://mail.swadesoul.com/SOGo/.
An administrator creates a mailbox and receives a private setup link, shares it with the verified owner, and the owner chooses a password on /adapters/mail-setup. The token is a URL fragment, removed from the address bar by JavaScript, hashed in PostgreSQL, single use, and expires in 30 minutes. Creating another link revokes earlier unused links for that mailbox.
Passwords require 14–128 characters with upper/lowercase, number and symbol; passwords are not stored by the adapter. Mailcow stores its normal password hash. The full email address is the mailbox username. Website/Google login credentials are separate.
No invitation messages or other mail were automatically sent. Never publish setup links. If a password setup operation is uncertain, its link remains consumed; issue a new link. Mailcow settings offer ordinary signed-in password changes.

## Brainiak mail domain
Mailcow domain brainiak.live has 4,096 MiB aggregate quota, 20 mailbox limit, default 512 MiB, maximum 1,024 MiB per mailbox. Created info@brainiak.live, support@brainiak.live and swade@brainiak.live with 512 MiB each and unexposed generated initial credentials. Founder must choose passwords through setup links.
Namecheap now has MX 10 mail.swadesoul.com, SPF v=spf1 ip4:2.25.74.73 ~all, DKIM selector dkim, and initial monitoring-only DMARC p=none. Website apex A and www CNAME were preserved. Both authoritative nameservers returned the new MX; the recursive resolver retained the previous default Namecheap forwarding with approximately 25 minutes remaining TTL at verification.
Mailbox provisioning does not configure DNS for arbitrary new project domains automatically. Existing domains' routing and passwords were unchanged.

## Enhance email — every mailbox
All existing and future active Mailcow mailboxes with IMAP access can use https://swadebase.cloud/adapters/mail-enhance without a per-mailbox enable flag. Authenticate with that mailbox's own full address and password, verified through TLS IMAP LOGIN on the existing local Dovecot service. No messages are fetched.
The backend holds a random opaque writing session in memory for 30 minutes, keyed by its SHA-256 hash. Cookie is HttpOnly, Secure and SameSite=Strict. Passwords are discarded after authentication. CSRF, origin checks, login throttling and per-mailbox enhancement limits apply. A service restart ends these writing sessions.
Users paste a selected draft, choose professional/friendly/concise/confident, review the result and copy it back to SOGo. This is a separate shared writing page, not yet an embedded SOGo compose button. No inbox scanning, message sending or incoming-email agent execution exists in this feature.
Existing local Ollama llama3.2:3b performs editing with no paid provider call. Maximum 6,000 characters, ten enhancements per mailbox per 15 minutes, one concurrent operation, 900 generated-token limit and 90-second timeout. Draft text is not persisted by this adapter. AI output can change meaning; the UI requires review.

## Security and verification
Mailcow HTTPS API and IMAP use the trusted root CA set plus the existing Mailcow chain, explicit rejectUnauthorized:true, and mail.swadesoul.com SNI/hostname validation. The API key stays in /opt/swade-secrets/mailcow-adapter.env, root:swadeops 0640, loaded only server-side.
An initial chain-only CA list failed with UNABLE_TO_GET_ISSUER_CERT; adding the platform's trusted roots fixed the chain without disabling verification. Auto-review rejected an earlier proposed trust-setting edit as a downgrade; it was not executed.
Integration test /opt/brainiak/mail-setup-20261025/verify.mjs passed exit 0: anonymous/non-admin denial, CSRF, sanitized listing, temporary mailbox creation, prior-link revocation, password strength, concurrent one-use redemption (200/410), real successful/failed TLS IMAP auth, writer auth/CSRF and real local enhancement with sent:false. Temporary mailbox was deleted afterward. Admin identity was stubbed in the isolated handler test; real browser founder Google sign-in was not exercised.
Live pages/assets returned 200; signed-out admin management redirected to SWADEBASE login and unauthenticated API returned 401. nginx configuration validation passed. SOGo returned 200.

## Source and recovery
Runtime: /opt/swadebase-adapters/server.mjs; routes/mailaccounts.mjs, mailenhance.mjs; public/mail-accounts.js, mail-setup.*, mail-inbox.html, mail-enhance.*. Existing mail-center.* extended.
Metadata tables: swadebase_ops.mail_setup_links and mail_actions. No message bodies are stored there.
Pre-change source/config and DNS snapshots: /opt/brainiak/mail-setup-20261025. Restore saved files, remove the new optional modules/static routes, then restart only swadebase-adapters; restore Brainiak nginx config and validate/reload nginx if needed. DNS rollback must restore the saved host list and EmailType together. Do not delete mailboxes or messages to roll back the UI.
Mailboxes/data remain in the existing Mailcow stack and its existing backup process. Backblaze media policy does not authorize copying private mail into media storage. No new service, model, hosting plan or paid generation was purchased.
