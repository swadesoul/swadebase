# SWADEBASE Talent & Casting — mobile acting challenges, 720p media policy and per-talent storage
Date: 2026-11-23 (America/Chicago)
State: APPROVED DESIGN REQUIREMENTS; NOT DEPLOYED OR VERIFIED.

## User-directed requirements
- Mobile audition challenges at exactly 5, 10, 15 or 30 seconds; phone/iPhone web upload and optional direct capture.
- Challenge prompt and script, retakes, preview and explicit opt-in to portfolio publication.
- All portfolio challenge exports capped at 720p in the appropriate orientation, adaptive compression that produces the smallest reasonable MB while preserving recognizable face, lip movement, audition timing and clear dialogue.
- Each performer has an isolated project folder and subfolders. Every project (Beauty Culture, KARMINE, Frequency Run etc.) has its own production area; link canonical talent media to credits/casting usages rather than duplicate binary files.
- Reuse SWADEBASE auth, shared FFmpeg/media processors, PostgreSQL metadata, and protected Backblaze B2. No duplicate hosting/storage service.

## Encoding contract
1. Accept iOS MOV/HEVC/H.264, Android MP4 and supported web video; validate MIME via file signatures, cap source duration and source bytes, reject malicious media.
2. Prefer original file upload using signed short-lived protected B2 multipart/resumable upload to avoid a massive mobile browser transcode. Resume interrupted mobile uploads, and handle iPad Safari. Server-side or already existing trusted media worker transcodes once.
3. Preserve orientation and pixel aspect. Target portrait 720x1280, landscape 1280x720; never upscale small source. Keep exact aspect with padding/cropping only if explicitly requested; default preserve whole framing.
4. Compare compatible outputs: H.265/HEVC MP4 where devices/player support it plus H.264/AAC MP4 for universal playback. Store a single compact primary and only create a second variant on demand where possible; optimize for overall bytes including storage/egress. Consider AV1 only if worker capability and recipient playback support it.
5. Suggested starting points: 24 fps or source fps capped at 30; CRF H.265 28-32, H.264 25-28; x265 medium preset or appropriate available efficient hardware preset; AAC mono 64 kbps for voice-only auditions, stereo 96 kbps only as needed; optimize streaming metadata faststart. Tune objectively with test clips; these are experimental defaults, not guaranteed quality.
6. Target approximate ranges: 5s 0.3-0.7 MB; 10s 0.5-1.2 MB; 15s 0.8-1.8 MB; 30s 1.5-3.5 MB. Not hard upload-size guarantees; high-motion scenes may exceed these to protect quality.
7. Quality gate: inspect rendered face/expression, skin/hair detail, text legibility if shown, voice intelligibility, lip-sync, audio peaks, no severe artifacts; if poor, raise bitrate/quality or flag for review. Record measured final file size, codec, frame dimensions/fps, duration, processing time.
8. Keep original temporarily and optionally preserve archival source only with performer consent and retention rules; do not automatically discard originals required for rights/evidence without policy. On expiry, delete temporary working files after verified B2 readback.
9. Avoid multiple rounds of lossy re-encoding. Use versioned immutable originals and outputs. Never store large media binaries in relational DB.

## B2 object taxonomy (private)
talent-casting/performers/{tenant_id}/{talent_id}/headshots/{asset_id}/...
talent-casting/performers/{tenant_id}/{talent_id}/biography/...
talent-casting/performers/{tenant_id}/{talent_id}/voice-samples/{asset_id}/...
talent-casting/performers/{tenant_id}/{talent_id}/acting-challenges/{duration_s}s/{challenge_id}/{submission_id}/source.mov
talent-casting/performers/{tenant_id}/{talent_id}/acting-challenges/{duration_s}s/{challenge_id}/{submission_id}/optimized-720p.mp4
talent-casting/performers/{tenant_id}/{talent_id}/audition-reels/{asset_id}/...
talent-casting/performers/{tenant_id}/{talent_id}/verified-credits/{credit_id}/...
talent-casting/performers/{tenant_id}/{talent_id}/private-agreements/{agreement_id}/...
talent-casting/productions/{project_id}/casting/{role_id}/{submission_id}.json
Use opaque identifiers for path components, not personal names, contact details, or guessable emails. Private agreements require separate access policy and should not appear in public portfolio APIs.

## Security and UX
- Application authorization checks tenant_id, ownership, talent consent, casting professional grant and media scope on every view/share/download action; avoid public B2 bucket and perpetual public URLs.
- Opt-in publication per asset. Model/voice cloning permissions distinct from recording and public profile permissions. Rescind future access/shares when withdrawn, subject to lawful retention.
- Casting directors may see only audition assets explicitly submitted to their casting call; talent can manage visibility, revoke submissions when legally permitted, and export portfolio data.
- iOS flow: script > permission/camera (when supported) or Photos upload > recording/preview > upload progress/retry > processing > optimized playback > add to portfolio.
- Keep external cost authorization at zero by default unless current owner spending rules explicitly approve paid services. Founder exemption means platform credit gates only, not unlimited vendor expenditure.

## Verification and evidence
[ ] Real iPhone/iPad Safari video from camera and Photos library
[ ] Android and desktop uploads
[ ] Portrait and landscape, HEVC MOV and H.264
[ ] All four challenge durations, invalid payloads, network interruption, resumable upload
[ ] Verify B2 HEAD/readback/checksum and stable signed playback
[ ] Face, voice and motion quality QA with actual measured MB
[ ] User A cannot view user B's private files and unauthorized casting director denied
[ ] Metadata, casting linkage, revocation, cleanup, compression retry/failure
[ ] Versioned Site Bible and What's New receipt, deploy lock and rollback before live release

Current state: specification only. Existing SWADEBASE media/FFmpeg and B2 components are reuse candidates, not end-to-end verification of this new challenge upload pipeline.
