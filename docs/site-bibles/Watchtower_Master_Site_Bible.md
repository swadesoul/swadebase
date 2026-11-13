# Watchtower Master Site Bible

Version1.1 — October30,2026, America/Chicago. Current verified role: security/access, encrypted off-site Control backups and external monitoring. This checkpoint supersedes the initial inspection-only state below.

Host firewall, strict SSH access and Desktop Commander work. Nightly encrypted Backblaze backups and monthly isolated restore tests are enabled. PostgreSQL15 restored86public tables, PostgreSQL16 restored70public tables, and both OmniRoute SQLite integrity checks passed in the first rehearsal; live databases were untouched.58external endpoint checks are configured in a private Uptime Kuma2.5.8 instance. Dated observations refresh into existing SSSBrain knowledge every5minutes. Phone alerts are not paired. OmniRoute standby and SSSBrain/VoiceBox/STT remain on Control; no application or DNS cutover was attempted. The Hostinger provider firewall was not inspectable through this session.

A diagnostic printed internal OmniRoute app keys. Treat them as exposed; rotation is pending safe client updates. Automatic approval review blocked credential inspection. Exact bounded rotation scope and actual receipts are documented in ../prds/WATCHTOWER_COMPLETION_2026-10-30.md. No broader key search or silent revocation is authorized by this checkpoint.

## Original inspection (historical)

# Watchtower Master Site Bible

Version 1.0 — October 30, 2026, America/Chicago.
Inspection only. No application deployment, migration, configuration change or new execution grant was performed.

## Identity and authorized access
- Hostname / connected device: watchtower.
- Remote Desktop Commander device ID: 4789c55f-1f6c-4b80-8b86-22621f7d8956.
- Observed IPv4: 179.197.90.181.
- Observed global IPv6: 2a02:4780:95:9136::1.
- Existing remote connection verified online and usable.
- Inspected at 2026-10-30T21:38:57Z. This is a point-in-time inventory, not a complete security or application health certification.

## Verified resources
| Item | Observed value |
| --- | --- |
| Operating system | Ubuntu 26.10, as reported by /etc/os-release |
| Kernel | 7.3.0-9-generic |
| Architecture / virtualization | x86_64 / KVM |
| Allocated CPU | 1 vCPU; AMD EPYC 9354P host processor |
| RAM | 3,908 MiB total; about 3,186 MiB available during inspection |
| Swap | 2,047 MiB; zero used during inspection |
| Root filesystem | 48 GB; 5.9 GB used; about 42 GB available |
| Docker engine | 29.7.2; service running |
| Application containers | None running or stopped at inspection |
| Failed systemd services | None reported |

The host CPU model contains a 32-core product name; the VM allocation is only one logical CPU. Do not treat it as a 32-vCPU server. No GPU was established by this inspection.

## Current software and workload
Docker, containerd, SSH, Desktop Commander Remote, Fail2Ban, chrony and unattended-upgrades services were running. The visible scheduled timers were system maintenance/statistics timers. No ecosystem application containers or monitoring stack were observed. /opt contained containerd; /srv and /var/www were empty. Listening TCP ports included public SSH 22 and local resolver/internal listeners. Firewall policy, backup restoration and external application reachability were not assessed.

## Role and reuse
Owner supplied this server as newly added to SWADEBASE. No existing Watchtower role document or mention was found in the checked canonical Bibles, top-level docs, approved-learning docs and daily notes.

Suitable proposed use, based on the observed capacity: lightweight uptime/API checks, scheduled health reports, deployment status checks and small coordination jobs. This is a recommendation, not an installed monitoring system. Prefer existing SWADEBASE adapters, logs and knowledge index. Keep primary databases, heavy builds, local model inference and media rendering on appropriately provisioned existing hosts.

No production workload was moved. Do not infer authority to restart other servers, install agents, open ports, configure automatic repairs or broaden repository access from this inventory.

## Knowledge and recovery
Canonical record: /opt/swadebase/docs/site-bibles/Watchtower_Master_Site_Bible.md on the primary SWADEBASE host; refresh the existing knowledge index after changes. Update this Bible as the server receives an approved role or applications. Remote access uses the existing connected device; no credentials are recorded here. This inspection has no application rollback because no runtime changes were made.

## Fix run — October 30, 2026, ~10:00–10:05 PM CT (Grok Bot / Big Mamma executor; approved by Harold 22:00 CT; deploy lock held)
- Watchtower alerts: Kuma notification "Email Harold (swadesoul@gmail.com)" (SMTP mail.swadesoul.com:587 as existing noreply@auth.swadesoul.com) attached to all 57 monitors and default for new ones. Test sent 22:02 CT, Gmail 250 OK. Paused (not deleted) 13 monitors for unowned/lapsed domains: swadez.com, rwafactory.cash, xrplfactory.cash, recapcoin.cash, grwnup.digital, cmvault.email, grwnx.io, sterline.digital, shamoneswade.com, digidollz.xyz, aimaestro.consulting, holistichive.health, aba.gold (letting lapse). Backup: watchtower /opt/watchtower/backups/fix-run-20261031T030030Z.
- Core: disabled stale sssbrain-delivery-worker.timer (hit stopped sssbrain-stage :8793; real job sssbrain-job@delivery on swadebase-2 healthy). Fixed logrotate.d/maestro-artist-signal and maestro-dj-render (logrotate succeeds again). Disabled nginx sites post.swadebase.cloud (Postiz removed) and sssbrain-test (dead :8793); swadebase-test kept (live). Backups and undo: /opt/swadebase/backups/fix-run-20261031T030030Z/README.md on swadesoul.
