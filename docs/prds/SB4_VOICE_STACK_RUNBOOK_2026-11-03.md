# SB4 voice/AI stack runbook — SWADEBASE-2 -> SWADEBASE 4
2026-11-03 ~6:35 PM CT · status: PREPARED, NOT EXECUTED (blocked: no SSH to SB4)
Retargets: prds/SERVER_STRUCTURE_2026-10-30.md step 5, prds/SSSBRAIN_MOVE_TO_SWADESOUL_2026-10-30.md (Correction), RK-004.
Target: SWADEBASE 4 srv2121798 179.66.130.28 (KVM8 8c/32GB/400GB, Ubuntu 26.10, no GPU — Hostinger KVM has none; Hyperframes GPU MP4 renders still need serverless GPU).
Rules: one Coolify (SB2) — SB4 gets NO Coolify; plain docker compose + systemd. SSS Brain app + sssbrain.live DNS stay put (separate Swade OK). Env files copied host-to-host (scp/rsync), never printed.

## Blocker (as of 6:35 PM CT)
- SB4 sshd (OpenSSH 10.5p1) refuses box coolify_localhost (SHA256:xNSAml1u…), swadebase_primary, SB1 /root/.ssh/id_ed25519 and SB2 swadebase_link default identities.
- Hostinger VPS MCP (vps_ssh-keys_add-virtual-machine / list) times out -32001 every call; Hostinger API host itself answers (401 unauth in 0.2s) → the MCP stdio server/token is the problem.
- Desktop Commander device "srv2121798" exists but Offline (last seen ~24h).
- Unlock options for Swade: (a) hPanel → VPS srv2121798 → Settings → SSH keys → add the public key "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOKrWHWdrbXo3y6mvOfpZaEFG035VZpKqD7l6BIJCHvJ coolify"; or (b) hPanel browser terminal: append that line to /root/.ssh/authorized_keys; or (c) restart Desktop Commander agent on SB4; or (d) reconnect Hostinger plugin so the API token works.

## Source inventory on SB2 (2.25.96.150, 2c/8GB; ~3.6GB avail, load ~3)
Docker:
- voicebox — compose /opt/voiceboxsoul/docker-compose.yml + docker-compose.server2.yml; 127.0.0.1:17600->17493; mem limit 5.5G (uses ~1.6G); volumes voiceboxsoul_voicebox-data:/app/data, /opt/voiceboxsoul/output:/app/data/generations, voiceboxsoul_huggingface-cache; net voiceboxsoul_voicebox-net.
- sssbrain-stt — compose /opt/sssbrain/infra/stt/docker-compose.server2.yml; 127.0.0.1:8011->8000; mem 3G; volume stt_whisper-cache; bind app.py; nets coolify + stt_default (coolify net = SSS Brain app reaches it).
- videosaywhat-studio-engine (VoiceStudio/OmniVoice, 3.5–4.3G loaded) — no compose labels (docker run); 127.0.0.1:3900; mem 5G; binds /opt/videosaywhat-studio/{swade_reference_asr.py,omnivoice.py,data}.
systemd (unit /etc/systemd/system/<name>.service; env file NAMES only):
- sssbrain-tts — /opt/sssbrain-tts/adapter.py (venv /opt/voiceboxsoul-relay/venv); env /etc/sssbrain-tts.env; listens 172.16.1.1:8796 (Coolify bridge).
- swade-render-worker — /opt/swade-render/worker.py; no env file.
- swade-qwen-video — /opt/swade-wan/qwen_video.py (venv /opt/voiceboxsoul-relay/venv); env /etc/swade-qwen-video.env.
- swade-diffusiongemma — /opt/swade-diffusiongemma/gateway.py; env /etc/swade-diffusiongemma.env.
- voicebox-relay — /opt/voiceboxsoul-relay/voicebox_relay.py; env /opt/voiceboxsoul-relay/relay.env (TLS, accepts SWADEBASE only).
- sssbrain-stt-relay — /opt/sssbrain-stt-relay/stt_relay.py; env relay.env (TLS, SWADEBASE only).
- videosaywhat-studio-relay — /opt/videosaywhat-studio/engine_relay.py; env engine.env.
- Relay listeners 2.25.96.150:3901/3902/3903 (public IP, TLS, allowlisted to SB1); 127.0.0.1:3905, 127.0.0.1:3912 (map exact owner in step 1).
- STAY on SB2 (serve SSS Brain app which stays): sssbrain-render-tunnel (172.16.0.1:8794 -> SB1), sssbrain-voice-studio-tunnel (8795 -> SB1), brainiak-pg-tunnel. After move, sssbrain-tts on SB2 is replaced by a forward (see step 5).

## Steps (once SSH works)
0. Harden SB4: ufw allow 22 + 3901-3903 from 2.25.74.73 and 2.25.96.150 only; install docker + compose plugin, python3-venv. Check `nvidia-smi` (expect none). Record `free -m`, `df -h`, `docker ps -a`, `systemctl list-units` = SB4 baseline.
1. Map each SB2 port to owner: `ss -ltnp` + relay env NAMES (which upstream each relay hits).
2. Copy (SB2 → SB4, root rsync -a over a temporary SB2 key added to SB4): /opt/voiceboxsoul, /opt/voiceboxsoul-relay, /opt/sssbrain/infra/stt, /opt/sssbrain-tts, /opt/sssbrain-stt-relay, /opt/videosaywhat-studio, /opt/swade-render, /opt/swade-wan, /opt/swade-diffusiongemma, /etc/{sssbrain-tts,swade-qwen-video,swade-diffusiongemma}.env, the unit files, and docker volumes (voiceboxsoul_voicebox-data; HF caches optional — re-download is fine). Save engine image: `docker save 588fe119082b | ssh sb4 docker load`; rebuild voicebox/stt images or save/load likewise. Recreate venvs on SB4 (py version may differ on 26.10).
3. Bring up on SB4 with same 127.0.0.1 ports; relays bind 179.66.130.28:3901-3903 with the same TLS certs/allowlists. Health: voicebox /health, stt /health, engine :3900 health, render worker, qwen/diffusion gateway local health; from SB1 hit each relay over TLS.
4. Repoint callers on SB1 (swade-voicebox-forward, sssbrain-stt forwarder, VideoSayWhat studio clients, Asset Machine STT relay client, ReSing render callers) from 2.25.96.150 → 179.66.130.28 (env change + container restart; keep .bak).
5. SSS Brain app (stays in Coolify on SB2): LOCAL_STT_TRANSCRIBE_URL / LOCAL_TTS_URL / VoiceBox URL → keep same in-container addresses by running small forwards on SB2 (socat/ssh -L to SB4) on 172.16.1.1:8796 and the STT/voicebox ports, so no Coolify env edits are needed. (Optional later: change Coolify env to SB4 directly.)
6. Watch 30 min clean, then on SB2: `docker stop` + `--restart=no` voicebox, sssbrain-stt, videosaywhat-studio-engine; `systemctl disable --now` sssbrain-tts swade-render-worker swade-qwen-video swade-diffusiongemma voicebox-relay sssbrain-stt-relay videosaywhat-studio-relay. Do NOT delete data/images for 14 days.
7. Update Site Bibles (SSS Brain, SWADEBASE, Watchtower monitors 3901-3903 target), daily log, this file.
Rollback: start SB2 units/containers again, revert SB1 forwarder env .bak, stop SB2 forwards.
