# Server structure — 3 Hostinger VPS (Boston, data center 24)
2026-10-30 ~16:05Z · analysis for Swade · status: RECOMMENDATION (nothing moved yet)

## What exists (measured live 15:55Z)
| Server | Plan | Use now | Role today |
|---|---|---|---|
| **swadesoul** 2.25.74.73 | KVM 8: 8 CPU / 32 GB / 400 GB | ~10 GB used, ~21 GB available, load ~1.5, 201 GB disk free | SWADEBASE (supabase, 3.1 GB), mail (mailcow, 1.1 GB), AzuraCast (0.8 GB), voice service (Kokoro CPU + VoiceStudio serverless GPU, 1.5 GB), WARP (0.7 GB), sites (Black Tales, Oathloom front ends, Maestro…), Ollama, render worker, nginx |
| **swadebase-2** 2.25.96.150 | KVM 2: 2 CPU / 8 GB / 100 GB | ~4.3 GB used, ~3.6 GB available, **3.2 GB in swap**, 29 GB disk free | Coolify, OmniRoute ×2, Rakazo agents, SSS Brain app, VoiceBox (1.5 GB), Whisper STT, VoiceStudio engine (idle 33 MB; 3.5–4.3 GB while in use), relays/tunnels |
| **NEW** srv2112045 179.197.90.181 | KVM 1: 1 CPU / 4 GB / 50 GB | empty, fresh Ubuntu 26.10 | **no firewall yet**; no Desktop Commander agent |

## Problems the structure should fix
1. **swadebase-2 has no off-site backups.** Coolify's DB (every app's deploy config and env secrets), OmniRoute data (keys, providers, chains) and Rakazo's Postgres live only on that disk. SWADEBASE on swadesoul is fine (daily rclone to B2, 15-day retention, monthly copies, restore test).
2. **OmniRoute "failover" lives on one machine.** Primary and standby both run on swadebase-2, so a server outage takes both down.
3. **No outside watcher.** Nothing monitors the servers from outside them; if swadesoul goes down, so does whatever would alert you.
4. **swadebase-2 is memory-tight** (RK-004) while swadesoul has ~21 GB free.
5. **Cross-server tunnels** (voice engine, render, STT/VoiceBox relays) exist because SSS Brain sits on the other server from its dependencies.
6. swadesoul firewall rule "8005:8796 from anywhere" exposes the voice engine (8795, token-protected) publicly; narrow it.

## Recommended structure (no new cost)
**swadesoul = the Core** (data, media, customer-facing): SWADEBASE, mail, AzuraCast, all sites, voice service, Ollama, render, **plus** SSS Brain app, VoiceBox and Whisper STT (move from swadebase-2; tunnels/relays disappear). CPU-cap voice containers so AzuraCast is never starved. VoiceStudio engine: leave on swadebase-2 for now (idle 33 MB, heavy jobs already go to serverless GPU); revisit if RK-004 recurs.

**swadebase-2 = Control & AI**: Coolify (deploys), OmniRoute primary, Rakazo agents + Safe Mode, builds. Gains ~1.5 GB+ once VoiceBox/STT leave, giving builds headroom.

**NEW KVM 1 = Watchtower** (small, boring, no public apps):
1. **Off-site backups for swadebase-2**: nightly Coolify DB + OmniRoute data + Rakazo Postgres -> B2 (same rclone pattern and b2.env as swadebase-backup.sh), with a monthly restore test.
2. **OmniRoute standby moved here**: real cross-server failover (~300 MB). The gateway on swadebase-2 points its fallback at this box over a private TLS/SSH link; if swadebase-2 dies, swadesoul apps fail over to the Watchtower's OmniRoute directly.
3. **Outside monitoring**: Uptime Kuma (~100 MB) checking every site, both servers, Coolify, OmniRoute and SWADEBASE from outside, alerting SSS Brain (Money Bar / daily brief) and email/push. Doubles as the external vantage point for firewall tests.
4. **Recovery door**: a second admin path (SSH + Desktop Commander) independent of the other two servers.
Not for KVM 1: mail (mailcow wants ≥6 GB), databases, voice models, builds.

## Order of work (each step: Inspect -> Execute -> Verify -> Document; reversible)
1. **Lock down KVM 1 now:** Hostinger firewall group (SSH + swadesoul + swadebase-2 only), SSH key, Docker, Desktop Commander agent. *Needs Swade:* approve adding an SSH key, and link Desktop Commander on the new box.
2. Off-site backups for swadebase-2 -> B2 (biggest risk, cheapest fix).
3. Uptime Kuma + alerts.
4. Move OmniRoute standby to KVM 1; re-test failover with primary stopped.
5. Move SSS Brain app + VoiceBox + Whisper STT to swadesoul (own runbook; DNS A-record change for sssbrain.live at Namecheap by Swade).
6. Narrow the swadesoul firewall 8005:8796 range after checking what needs it.

## Watchtower setup checkpoint — October30,2026
ChatGPT verified dedicated SSH and Desktop Commander, enabled the approved host firewall, deployed encrypted nightly Control-server backups to Backblaze and completed a real restore rehearsal (PostgreSQL15:86tables, PostgreSQL16:70tables, both OmniRoute SQLite integrity checks passed). Watchtower now runs58external endpoint monitors; Core refreshes dated observations into existing SSSBrain knowledge. Phone pairing, Hostinger provider-firewall verification, OmniRoute standby relocation, SSSBrain/voice migration and the later Core firewall-range change remain incomplete. No app/DNS cutover occurred. Internal OmniRoute keys printed during a diagnostic require scoped rotation and verified client updates; automatic approval review blocked credential inspection. See prds/WATCHTOWER_COMPLETION_2026-10-30.md for exact scope, verification and recovery.
