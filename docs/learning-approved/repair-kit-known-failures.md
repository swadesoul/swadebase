# Repair Kit: known failures from our own sites (RK catalog)

Created 2026-10-29 ~20:25 CT by Claude at Harold's request, from real incidents in our docs, Site Bibles, Incident Guardian records and tonight's inspection. Used by the SWOSTing Support Desk, SwadePower, Incident Guardian and the Chief of Staff to LOOK FOR and FIX these problems.
Fix levels match the Support Desk: T1 = fix immediately (owner-approved runbook, own site only, snapshot first, verify after). T2 = fix, test on a copy, deploy under rule 19a, email receipt. T3 = escalate to Harold/CoS with evidence; never forced.
Every fix: take the deploy lock (rule 20), update the affected Site Bible (rule 17), record a receipt. This catalog is reference knowledge, not authorization for unrelated changes.

## RK-001 Mid-session deploy strands open tabs
Evidence: 2026-10-29 20:10 CT, ChatGPT deployed SSS Brain (PR98) while Harold was signed in; tapping Sign in showed "This page didn't load. Something went wrong on our end." (SSS Brain Bible incident note).
Cause: the open tab ran the old build; its lazy-loaded /auth chunk was deleted by the new deploy (old hashed assets return 404 text/html).
Detect: 404 responses for /assets/*.js right after a deploy; error-boundary reports; deploy timestamp (Last-Modified on index JS) minutes before user reports.
Fix: T1 tell the user to close and reopen the tab (iPad: clear site data). T2 add a vite:preloadError one-time reload, serve index.html with Cache-Control: no-cache, keep previous build assets 24-48 h.
Prevention: deploy lock (rule 20); announce user-facing deploys.

## RK-002 Another agent's rollback removes a working connection
Evidence: VideoSayWhat 2026-10-16, a Replicate-only rollback of youtube-extractors.ts removed the self-hosted extractor; paste-link transcription broke (Incident Guardian videosaywhat-transcription-recovery-2026-10-16-2dbd665).
Cause: production and GitHub drifted; an older file was redeployed over a working one.
Detect: compare live function files to the known-good commit (md5 prefix / git diff); a working feature fails right after another agent's change.
Fix: T2 restore the known-good file to BOTH live and repo (byte-identical), rerun the acceptance test (videosaywhat youtube-acceptance.py).
Prevention: GitHub must never hold an older file than production; immutable baselines; deploy lock.

## RK-003 Upload fails with HTTP 413 through the proxy
Evidence: Brainiak voice upload 2026-10-26 (handoff 87): /brainiak inherited a 32k body limit.
Detect: 413 lines in nginx access logs for a host; uploads that work against the internal service but not the public URL.
Fix: T2 raise client_max_body_size and read timeout on that ONE upload location only; nginx -t; reload; test a realistic upload through the public URL.
Prevention: test real-size uploads through the proxy, including iPad Safari (rule 6). Keep nginx backup files outside included config folders.

## RK-004 Stuck builds freeze a server
Evidence: 2026-10-29 swadebase-2 (2 vCPU, 8 GB, swap 91% on 10-24): typecheck/build processes stalled, Desktop Commander stopped responding for hours; ChatGPT stopped the stuck processes at ~20:10 CT. Moxie routine run hung ~24 h on 2026-10-18.
Detect: build/typecheck/node processes older than 60 min; swap above 80%; Desktop Commander timeouts while Hostinger reports "running"; handoffs in_progress past due_at.
Fix: T1 stop the verified stuck build process (never a production service), record it. T3 if the server stays unresponsive (Hostinger restart decision is Harold's).
Prevention: timeouts on every build and routine; move heavy services (voicebox 1.1 GB, sssbrain-stt) off small servers; memory alerts.

## RK-005 Migration leaves data behind
Evidence: moving off hosted Supabase/Lovable lost data: ReSing Lab Suno commands and previous songs did not transfer; missing media/models and auth problems (SWADEBASE migration lesson; locked-in rule "data must come with it").
Detect: record counts differ between old and new database; storage references (URLs) pointing at the old host; users unable to sign in after a move.
Fix: T3 always (data). Inventory every table and bucket, export, migrate, compare counts, test auth/admin/payments/storage, keep rollback.
Prevention: never declare a migration done because env vars were swapped.

## RK-006 Google sign-in fails on a site's return address
Evidence: SWADEBASE login rule: every site's own domain AND its *.lovable.app address must be an allowed Google sign-in return address; some sites connected and some did not.
Detect: /auth/v1/authorize returns an error or redirects to the wrong site; users bounce back to login; GoTrue logs "redirect_to not allowed".
Fix: T2 add the exact return URL to the SWADEBASE auth allow list, test sign-in end to end.
Prevention: add return addresses when a site is created or moved (SWOSTing site template).

## RK-007 Lovable badge or builder branding on owned production sites
Evidence: 2026-10-29 scan found injected Lovable badge markup on midnightcircuit.live, swideo.com, publiswade.site, dnafront.com (all resolving to 185.158.133.1, outside our origins). Rule 16.
Detect: fetch each site's HTML and look for the builder badge injector, default favicon or "Edit with" markup.
Fix: T2 rebuild from owned source and serve from our origin; T3 for DNS cutover.
Prevention: migration branding rule in the site template.

## RK-008 Fixing one project by changing a shared adapter
Evidence: Brainiak Hyperframes 2026-10-25: skill routing and registry versions differed; the safe fix was a separate project pinned to 0.8.186, not upgrading the shared adapter.
Detect: a shared adapter version change requested for one site; other sites' renders failing after an adapter change.
Fix: T2 isolate the project (pin its own version); T3 for any shared adapter upgrade.
Prevention: side-by-side adapter rule (rule 8).

## RK-009 No off-server database backup
Evidence: 2026-10-29 inspection of swadesoul: no scheduled SWADEBASE database dump, no Restic/Borg, rclone not configured; only mailcow and dpkg backups exist, stored on the same disk.
Detect: newest off-site backup older than 26 h; no restore test in 31 days.
Fix: T1 run the nightly backup job now; T3 if it fails twice.
Prevention: nightly encrypted dump to Backblaze plus monthly test restore (being set up 2026-10-29).

## RK-010 Visitors hidden behind Cloudflare
Evidence: 2026-10-29: some domains proxy through Cloudflare (e.g. 162.158.x in logs); nginx saw Cloudflare instead of visitors, so attack blocking could not see attackers. Fixed with real-IP config (conf.d/swosting-cloudflare-realip.conf).
Detect: access logs dominated by Cloudflare ranges for a host; CrowdSec decisions against CDN ranges.
Fix: T2 keep the real-IP list current from cloudflare.com/ips-v4 and ips-v6; never block Cloudflare ranges.
Prevention: refresh the list monthly.

## RK-011 App down shows a bare error instead of the outage page
Evidence: until 2026-10-29 no error_page existed; visitors saw nginx "502 Bad Gateway". Fixed for 30 sites; leslie-original-domain still missing the include.
Detect: a server block without "include /etc/nginx/snippets/swosting-outage.conf"; 502/503/504 responses whose body is not the outage page.
Fix: T2 add the include, nginx -t, reload, test with a dead upstream.
Prevention: the include is part of every new site's nginx template.

## RK-012 Exposed internal service port
Evidence: VideoSayWhat extractor port 8797 listens publicly (token-protected), open item in the VideoSayWhat repair skill.
Detect: listening ports bound to 0.0.0.0 that are not 22/25/80/443/mail ports; compare against an allow list.
Fix: T3 (firewall changes are Harold's): bind to 127.0.0.1 or add a firewall drop rule.
Prevention: services bind to 127.0.0.1 by default; CrowdSec plus ufw review.

## Risks not yet incidents (watch)
- RK-W1 Mail reputation: customer sites on the mail server's IP could get it blacklisted. Customer sites must send only through a rate-limited relay.
- RK-W2 Single server: swadesoul holds the DB, auth, mail and 30 sites; the outage page also lives there. Keep an off-server status page.
- RK-W3 Agent blast radius: several AIs have root. Scoped keys per agent and the deploy lock.
- RK-W4 Customer terms: SWOSTing needs terms of service, an acceptable-use policy and a takedown process before paying customers.

## RK-013 Audio engine silently paused / songs stuck "queued"
Evidence: 2026-10-30, Maestro Radio. A provider credit check got HTTP 403, the factory set generation off, and songs sat "queued" for days with no message; Swade saw nothing happening. Root cause: the music provider (api.sunoapi.org, behind Cloudflare) blocks the Python-urllib User-Agent (Cloudflare error 1010). requests/Deno/Node/curl pass. A second flaw: the queue only tried the oldest job, so a song waiting for an artist voice would block every song behind it.
Detect: Audio Engine Guard (/opt/swade-audio-ops/monitor.py, swade-audio-guard.timer every 15 min, report docs/learning-approved/audio-engine-guard-latest.md): provider credit check, maestro_label_settings paused flags, jobs in waiting states past their limit in every audio table (Maestro, ReSing Lab, Sonikyn, voice/music training), 3+ failures/hour, worker timers.
Fix: T1 automatic — the guard lifts a SYSTEM-set pause when the provider answers (never a founder switch-off) and nudges the Maestro queue. Factory re-checks the provider every tick (verify_provider). T2 any Python calling a provider must send a real User-Agent.
Prevention: every audio UI must show progress and the reason a job is waiting (Artist Studio tray + progress bars); queues must skip blocked jobs instead of stalling; never pause on one failed check without re-checking.
