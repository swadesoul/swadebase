# SWADEBASE Cinematic Motion Studio + SwarvisTeach Episode 001 v2
Date: 2026-11-17 UTC | Actor: ChatGPT | Status: STAGED SOURCE; NOT DEPLOYED; VIDEO NOT RENDERED

## Verified source / existing system
- Existing Motion Studio production worker `supabase-motion-worker-1` observed running; health GET returned HTTP 200 with 86 styles and B2 ready.
- Original episode 001 retained untouched: `/opt/brainiak/media/swarvis-episode-001-80b0614b281c226305e451dc3bfa163f.mp4`. SHA256 `d2c819f686932a6fd130b31a10e30d07ba26c04a518fbff853ca74372e29a926`. ffprobe 240.0 seconds / 1920x1080 / h264 video / AAC audio.
- Current motion worker configured OpenAI GPT-4o HTML composition plus template fallback (one project/two done jobs). Original's full spoken content/transcript was not recovered during this bounded audit. Do not replace speech or assume new script content. Existing 45s character /195s graphics timing was used as a proposed segment map, not as verified visual scene boundaries in old media.
- Blender 4.5.15 LTS IS already present under `/opt/swade-character-factory/blender-4.5.15-linux-x64/blender`, though not on the global PATH; it ran in background mode. Existing Remotion/HyperFrames dependencies are available in other directories. Do not upgrade global dependencies without isolated verification.
- Generated original procedural 3D test scene at `/opt/swadebase/ops/motion-cinematic-stage/swarvis001-proof.blend` from `render_proof.py`: camera orbit, animated torus rings, metal/plasma materials, lights, audio-themed 3D elements and dimensional type. Blender file was successfully written, but its bounded Eevee CPU render did not finish within approximately 100 seconds for even one full-quality frame, so execution was terminated; no MP4 or image result was produced. Use an approved GPU worker for the next benchmark, rather than running long renders on shared CPU.

## Implemented (staging only)
- `/opt/swadebase-motion-src/motion/cinematic/director.mjs`: pure shot spec, 2D/3D/GPU engine selection, timing, basic cinematic-depth/lighting/transition/sound requirements, spend guard, no silent primitive fallback, final human quality gate.
- `/opt/swadebase-motion-src/motion/cinematic/swarvis-001-v2.plan.mjs`: 9 sections at 30fps totaling 7200 frames, original checksum, Swarvis continuity lock and conservative creator-friendly engine routing.
- `/opt/swadebase-motion-src/motion/cinematic/test.mjs`: 15 passing assertions and syntax checks; checks 240s exact frame math, routing, overlap rejection, fallback refusal, owner approval.
- Exported JSON plan `/opt/swadebase/docs/releases/motion-cinematic-20261117/swarvis-episode-001-cinematic-v2.plan.json`.

## Not done / release blockers
- No real 3D graphics have been rendered and no four-minute v2 MP4 created. Existing video remains unchanged. This is a real design/code/validation milestone, not a completed film.
- No approved character voice reference, original complete script/transcript, original scene-by-scene media breakdown, or visual review of frames was confirmed in this run. Recover them before final story edit.
- New cinematic engine needs isolated renderer integration and actual film benchmark: advanced compositing/3D depth, typography interacting with scene, Blender/Three test, safe audio preservation, 16:9 and 9:16 and B2 copy.
- No editing of running `motion-worker`, no restart, no SWADEBASE DB/schema change, no Cloudflare Worker change, no paid generation, no public upload.
- Require actual original shot visual inspection, source rights, GPU pricing/licensing confirmation, quality score from reviewed frames, voice synchronization, end-to-end authenticated user acceptance and a bounded production rollout under deploy lock before claiming 100% operational.

## Rollback
The new `motion/cinematic` source directory and release JSON can be removed without affecting existing worker. Canonical Bible backup is `/opt/swadebase/backups/motion-cinematic-20261117/SWADEBASE_Master_Site_Bible.before.md`. Do not remove the original 4-minute episode. Zero customer data changed.

## Actual isolated proxy render verification (2026-11-17 14:07 UTC)
- Generated one Blender Workbench still image using existing Blender 4.5; visual inspection found perspective/type collision and lack of premium cinematic finish. Corrected text position in `render_proof.py` and rebuilt the editable .blend scene.
- Rendered 36 low-resolution 3D proxy frames (12 fps), then assembled a 3.000-second H.264/AAC draft using the original Episode 001 soundtrack. ffprobe verified 432x244 H.264 + AAC and exact 3.000s duration. Output: `/opt/swadebase/ops/motion-cinematic-stage/swarvis001-cinematic-proof-draft.mp4` (private development artifact, not distributed/published).
- First FFmpeg encode failed because 432x243 height was odd; reran with explicit even-dimension padding and passed. This compatibility fix belongs in all future render paths.
- **Visual QA rejected this proxy** as not cinematic-quality; geometry overlaps/crops text, Workbench lacks material/lighting finish, and it does not show approved Swarvis presenter. Exact rejection receipt: `QUALITY_REVIEW.json`. Do not use low-res proxy as the Episode 001 remake or call complete.
- This verifies one narrow `Blender scene -> frame images -> FFmpeg H264/AAC` path at no new external AI/GPU spend. A high-quality 3D render plus four-minute episode remake remains open, along with actual SWADEBASE worker integration, visual and owner acceptance.
- Existing source original checksum checked again and unchanged.
