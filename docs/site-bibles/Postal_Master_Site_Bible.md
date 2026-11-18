# Postal — SWADEBASE 4
Recorded by ChatGPT at 20261114T182919Z. Internal installation; not ready to replace Resend.

## Installed and verified
Target owner-confirmed swadebase-4 179.66.130.28, hostname swadebase4. Existing authorized SSH from main now succeeds.
32GB RAM, 383GB free at inspection, no prior application containers.
Official postalserver/install commit 451926cc78a1056e9f16dad6ec5c62d4f76d2445.
Postal 3.3.7, MariaDB 10.11. Four running containers, restart unless-stopped.
Database initialization completed. HTTP login 200 with intended Host header; wrong Host 403.
Web 127.0.0.1:5000; database 127.0.0.1:3306; health 127.0.0.1:9090/9091.
SMTP port25 responds 220; outbound TCP25 to Gmail MX succeeded. No message sent and delivery not tested.
Config /opt/postal/config/postal.yml root:999 0640; signing key same. MariaDB env root-only. No secrets printed.
Database persisted /opt/postal/mariadb. Logs /opt/postal/{initialize,start,image-pull}.log.
First initialize failed due config permissions; corrected root:999 0640, rerun successful.

## Blockers
Public DNS resolver returned NXDOMAIN for swadebase4.cloud and postal.swadebase4.cloud.
Configured hostname postal.swadebase4.cloud is provisional; no public dashboard/HTTPS configured.
Need owner-approved public hostname with DNS, PTR/rDNS, SPF/DKIM/DMARC, sender verification and approved end-to-end recipient test.
Auto-review rejected creation of admin swadesoul@gmail.com and persistent bootstrap password due missing explicit account/credential authorization. Command did NOT execute; no Postal owner account created.
No Resend migration, domain MX changes, mailcow changes, external relay or paid service.

## Recovery
New standalone install only. Stop Postal using postal stop on server4 under deploy lock; retain /opt/postal/config and mariadb data. Do not delete volumes. No prior applications to restore. Source /opt/postal/install, helper /usr/local/bin/postal. Upgrade only after scoped backups and pinned-image review.

## Current state — 2026-11-17 15:55 CT (Claude; replaces the 11-14 "Blockers" above, which are out of date)
- What Postal is: SWADEBASE's self-hosted Resend replacement ("Mail Machine" sending engine). Mailcow (mail.swadesoul.com) = mailboxes; Postal = app/transactional sending. Sites call Postal's HTTP API (/api/v1/send/message, X-Server-API-Key) through a Resend-shaped drop-in, Mailcow SMTP as fallback (pattern: functions/vsw-_shared/mail.ts).
- Live on server4 (179.66.130.28): web/worker/smtp/mariadb + caddy, up. Web https://postal.swadebase.cloud (200). SMTP host mx.postal.swadesoul.com. Admin user swadesoul@gmail.com exists. SPF include spf.postal.swadesoul.com, return path rp.postal.swadesoul.com.
- Orgs/servers (Mail Machine — <site>): 1 blacktales.online (Development, domain verified, key held), 2 swagents.live (Development, domain not verified, key held), 3 videosaywhat.com (LIVE, key active; SPF on the root still shows Namecheap's only), 4 themaestroradio.com (Development, key held).
- 2026-11-17: themaestroradio.com domain VERIFIED in Postal (verify TXT, DKIM postal-bL8FGV, SPF, return path all OK; MX "Missing" is expected, inbound stays on Namecheap forwarding). DMARC p=none.
- Maestro cutover staged, NOT applied (needs founder OK, auto-review blocked it): set server 4 mode Live + release its API key, add MAESTRO_POSTAL_URL/API_KEY/FROM to /opt/swadebase/docker/functions.env, copy /opt/work/maestro-postal/index.ts over functions/morning-mix/index.ts (Postal first, Resend fallback, From mix@themaestroradio.com), docker compose up -d functions, one test send to swadesoul@gmail.com.
- 2026-11-17 16:01 CT: Maestro server 4 was set Live for ~1 minute, then REVERTED on Swade's instruction ("don't switch Maestro until after we build swail.live"). Back to Development + key held; 0 messages queued, nothing sent; functions.env and morning-mix unchanged. Maestro cutover now waits for swail.live (SWADE SOUL MAIL), the new mail site over Mailcow + Postal.
- 2026-11-17 16:15 CT: Postal is the sending engine for swail.live; cold outreach must use separate per-Room outreach lanes/subdomains, never the transactional servers (STANDING_RULES rule 25e). See Swail_Master_Site_Bible.md.
