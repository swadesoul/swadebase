# Maestro Radio — Live DJ Guest Backstage (founder approved direction)
Date: 2026-11-11. State: scoped architecture approved; NOT launched, no change to live broadcast path.

## Verified reuse
- Self-hosted LiveKit v1.9.1 container healthy; signaling reverse proxy at https://live.swadebase.cloud returns HTTP 200. TURN is configured on existing service. No LiveKit egress container found.
- Maestro / SWADEBASE has AzuraCast, Liquidsoap live fallback and DJ-streamer account allocation, but live_dj_accounts has zero rows as inspected on 2026-11-11. Current live-DJ admin is credential/schedule management, not a DJ console.
- Preserve resident AutoDJ, stream URLs, station isolation, radio bottom player and already published programming.

## User experience
1. Authorized DJ signs into Maestro (uses verified linked live_dj_accounts.user_id and assigned station, and requires scheduled slot).
2. DJ creates a backstage guest invitation, sets name, expiry <= 20 min, number of uses=1; guest link has unpredictable non-broadcast-scoped token, never exposes broadcaster credentials. Invitee can test audio without an account only after consent. Never place email address or phone number into room names or participant identities.
3. Guest joins a private LiveKit room and waits in green room. Chat and consent to broadcast/optional recording are explicit. Guest has no station control. Enable mic only in backstage; guest audio is NOT transmitted to listeners unless DJ promotes them.
4. DJ can privately speak to guest; has independent mic fader, music ducking, guest fader, mute/eject and a clearly separate on-air monitor with mix-minus. The public output is one mastered program feed managed by one DJ/producer.
5. DJ presses Request Go Live. Controller verifies allowed broadcast window, locks single station producer, checks radio-engine state, waits until end of current audio, then triggers a server-authoritative countdown. Plays chosen approved DJ intro or original theme at safe loudness, then opens program feed.
6. During show DJ clicks Add Guest On Air; controls adjust what enters the program mix (not LiveKit publish permission alone). Mic/guest mix includes echo cancellation and headphone monitoring; no guest feedback loop. Guest can rejoin through fresh short-lived credentials if connection is lost.
7. When DJ ends, guest leaves, or unexpected disconnect occurs, a configured bumper/AutoDJ fallback prevents silence. Confirm actual engine transition and waveform or RMS. Log event timing; never claim uninterrupted stream until measured tests succeed.

## Access policy
- Producer: verified DJ account + station assignment + live show slot.
- Guest: single invite and single room; max TTL of join token 5 min for self-hosted LiveKit; issued by server only after grant lookup; role=guest; roomJoin true, canPublish true, canPublishSources=['microphone'], canSubscribe true, roomAdmin false; cannot start egress/ingress, invite, control stream, upload tracks or obtain server keys.
- DJ: room scope only, no blanket administrative LiveKit privileges.
- A self-hosted LiveKit token may remain reusable until expiry even if a guest is removed: use short TTL, disable new token issuance, and remove participant; verify against actual LiveKit version. Invite URL and connection JWT distinct. No developer/service key in browser.
- Validate one-use, hashed invite token, no public enumeration of rooms, rate limits by DJ, invitee and station; expiration, revoke, abuse reporting, audit log, active sessions and bandwidth caps. Temporary guest display name only.
- If guest creates a persistent account later, optional account linking; guest is not a full Maestro member or station owner.
- Recordings OFF by default. Obtain explicit participant consent and a rights/retention policy before archiving.

## Media bridge decision (must pass test before public ON AIR)
LiveKit relays private microphone/audio tracks. AzuraCast receives a single authorized Icecast DJ source. Implement tested headless audio-mixer/broadcast-encoder connector (or separately deployed LiveKit Egress + carefully designed mixer); do not assume Egress combines DJ music/decks, guest and private return audio properly. Publish a single mastered signal, monitor latency, 48 kHz levels, feedback, failover and reconnect. Distinguish backstage from program bus server-side.
Track-sensitive Liquidsoap live fallback currently has check_live that can skip AutoDJ track. Do not modify live station switching until Request Go Live staging, confirmation and audio boundary tests pass with a dedicated test station.

## Milestones and launch gates
A: token/invite backend with validated auth, tenant isolation, one-use invites, revoked invites, request idempotency, audit, rate caps; test against self-hosted LiveKit without any live station route.
B: backstage responsive UI for guest (microphone, headphones, consent, connection quality); DJ panel (private call, mute/eject, producer controls, sound check).
C: isolated end-to-end studio mixer -> AzuraCast TEST station; song-boundary handoff, countdown, approved intro/Outro, silence fallback and schedule enforcement; test network drops, mobile Safari/iPad, double producer race.
D: production rollout to selected station with opt-in and rollback; only then add button to public DJ cockpit. Stage $0 provider spend; no LiveKit Cloud.
Acceptance: guest cannot stream independently, no accidental live broadcast, DJ mic/guest balance adjustable, acoustic echo controlled, station connection does not break while navigating SPA, fallback under 5s verified by test, no keys leaked.
Rollback: feature flag off leaves existing DJ/Icecast login path unchanged.

## Sources
LiveKit access token grants, self-hosted revocation limitations: https://docs.livekit.io/frontends/reference/tokens-grants/
LiveKit WebRTC reliability: https://docs.livekit.io/intro/basics/connect/
LiveKit Egress separately deployed when self-hosted: https://docs.livekit.io/transport/media/ingress-egress/egress/
