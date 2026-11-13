# Watchtower completion and remaining work — October 30, 2026

## Completed and verified
- Watchtower 179.197.90.181 is accessible through Desktop Commander device 4789c55f-1f6c-4b80-8b86-22621f7d8956.
- Existing dedicated Core-to-Watchtower SSH connection works with strict host-key checking. Its private key remains on Core.
- Host UFW is active on boot: default deny incoming, allow outgoing, public TCP22 for recovery and inbound access from Core2.25.74.73 / Control2.25.96.150. Kuma listens only on127.0.0.1:3001. The Hostinger provider firewall could not be inspected with this session's connector tools; no provider-layer completion claim is made.
- Encrypted Control-server backups run from Watchtower nightly. Source access is a dedicated key restricted to one fixed exporter and Watchtower's source IP. The exporter dumps Coolify and Rakazo PostgreSQL, creates consistent OmniRoute SQLite snapshots, includes protected recovery configuration, and encrypts before transfer.
- The first B2 upload was read back and its ciphertext checksum matched. Decryption and archive membership passed. A full isolated restore rehearsal then restored Coolify PostgreSQL15 (86 public tables), Rakazo PostgreSQL16 (70 public tables), and passed both OmniRoute SQLite integrity checks. Receipt: /var/lib/watchtower/restore-last-success.json.
- Monthly restore rehearsal timer is enabled. Automatic backup deletion is disabled; no existing backup was deleted.
- A later encrypted backup also includes Watchtower's own monitoring DB and protected recovery configuration.
- Uptime Kuma2.5.8 is running healthy with memory512MiB / CPU0.5 limits and58 monitors:55 known registered URLs,2 server SSH ports andSSSBrain /api/live. Target source is the dated ecosystem audit with SSSBrain's canonical domain corrected; retired aliases need review.
- The observed report at22:00UTC had39 passing and19 failing checks. These are endpoint checks, not signed-in application certificates.
- Watchtower refreshes a machine-readable health report every2minutes. Core imports dated observations into the existing approved knowledge index every5minutes. SSSBrain can retrieve the report. This is not a claim that phone push or an in-app alert was delivered.

## Remaining and blocked
1. Phone alert delivery is not paired. Do not invent a phone destination or claim notifications were sent.
2. The OmniRoute standby remains on Control. It has not been moved or cut over.
3. SSSBrain, VoiceBox and Whisper remain on Control. No workload or DNS cutover was attempted.
4. The Core8005:8796 firewall range has not been narrowed; dependencies must be checked before changing it.
5. Provider firewall state remains unverified.

## Credential incident and exact next approval
A diagnostic accidentally printed the twelve internal OmniRoute app keys present in the private Caddy map. Treat those keys as exposed. No upstream provider secret is claimed exposed by that map; no key values are recorded in this document.

Automatic approval review rejected printing credential-related scripts and later rejected inspection of raw key values / broad secret-directory reference scanning. Safer schema and non-secret name/ID/use metadata were obtained. The six app identities on both instances are app-oathloom, app-sssbrain, app-swadesoul-world, app-maestro, app-teachvirt-rakazo and app-workers. Existing spending caps remain unchanged.

Approval requested: rotate exactly those12internal app keys through the existing management mechanism; inspect only the protected client configuration necessary to update their consumers within the owned servers, keeping all secret values inside server-side scripts and out of chat/logs. Preserve scopes, model restrictions and spending limits, including already consumed budget; stage updates and verify authentication with non-generating checks before revoking old keys. Do not rotate upstream OpenAI/Anthropic/etc. provider credentials as part of this request. Do not blindly revoke keys before verifying their clients.

After rotation and client verification: stage the standby on Watchtower from the verified SQLite snapshot, preserve its protected instance configuration, validate health/auth without paid generation, then cut over the private gateway under deployment locks and test rollback. Only then proceed with the separately staged SSSBrain/VoiceBox/STT migration and the verified DNS plan. Preserve the user's current VoiceStudio placement.

## Runtime source and recovery
Watchtower scripts: /opt/watchtower/backup-control.sh, restore-test-control.sh, report-health.py, setup-monitors.cjs; units watchtower-control-backup, watchtower-control-restore-test, watchtower-health-report.
Control fixed exporter: /usr/local/sbin/watchtower-control-backup-export.
Core collector: /opt/swadebase/ops/backup/collect-watchtower-health.py; unit swadebase-watchtower-health.
Firewall baseline: /opt/watchtower/backups/firewall-20261030T214305Z. Use existing remote/SSH access before changing firewall recovery settings. Disable only the named new timers/services if reverting this setup; preserve off-site archives and existing production containers. Remove only the new restricted backup-key entry if revoking source export access. No secret is committed with these scripts.
