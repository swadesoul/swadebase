# SWADEBASE Motion Studio cinematic quality gap audit — 2026-11-17

Status: read-only inspection and founder-approved design research; NOT DEPLOYED. No paid generation, code deployment, service restart, schema mutation or provider change.

## Live evidence
- /opt/swadebase-motion-src/motion/MOTION_STUDIO.md identifies a pre-existing 86-style HyperFrames/HTML/GSAP motion production adapter, Kinetta agent, Postgres queue, Backblaze B2, CPU worker.
- Current supabase-motion-worker-1 observed RUNNING, /functions/v1/motion-studio/health returned HTTP 200, 86 styles in database, B2 true.
- public.motion_projects: 1 row; motion_render_jobs: 2 rows both 'done'. Counts are not a quality evaluation.
- Current worker non-secret settings: MOTION_COMPOSER_PROVIDER=openai, MOTION_COMPOSER_MODEL=gpt-4o, MOTION_RENDER_WORKERS=2.
- motion/worker/template.mjs fallback composition relies on three animated large colored shapes, pulse circle, title/body fades, start-image zoom, end card. Aesthetics vary by palette/style but core visual grammar remains mostly flat.
- motion/adapter/adapter.mjs compileBrief asks for an HTML document and 3-6 scenes, foreground/background/type planes and 6 animated elements, with no typed camera, 3D scene, compositing, cinematic shot or audio-sound-design contract. Style records name motion grammar but no renderable cinematography packages.
- Prior /opt/swadebase/docs/BRAINIAK_HYPERFRAMES_PROBLEM_FIX.json documents HyperFrames 0.8.156 vs 0.8.186 skill-registry mismatch; do not blindly replace shared CLI.

## Architectural gap and proposed upgrades
1. Preserve existing Motion Studio frontend, project assets, styles, Kinetta, B2, job tables and the working HyperFrames worker.
2. Add shot-directed motion grammar and editable shot plan schema: camera rigs, focal planes, depth/parallax, textures/materials, light rigs, typography choreography, masks, transitions, motion curves, particle/physics accents, diegetic sound, shot quality rubric.
3. Add visual director review: reference/style boards, approved art direction, representative-frame previews, reject weak shots before full render, continuity locked across sequences, manual overrides.
4. Production tiers: 2D advanced (SVG/GSAP/Remotion as license permits), 2.5D (layer segmentation, camera moves, depth maps), true 3D procedural (Blender Geometry Nodes/EEVEE + compositing or Remotion Three.js), and selective AI moving shots (existing ComfyUI LTX/WAN GPU adapters). Export layered or editable source alongside master.
5. Implement compositing and finishing passes: occlusion, DOF, motion blur, atmospheric haze, color, texture, sound design and shot-to-shot editorial rhythm; no generic full-screen title-card transitions by default.
6. Reuse existing SWADEBASE job persistence and CPU FFmpeg/Backblaze; existing on-demand GPU only for real video inference or demanding 3D renders. Cloudflare Workers limited to secure edge operations and eligible caching/delivery, not GPU inference.
7. Avoid automatic fallback to primitive circles/text when cinematic mode is selected; fail into visible needs-review with precise quality diagnostics. Permit low-tier template as opt-in cheap mode.
8. Add quality-gate score and compare reference target per 3 cinematic benchmark sequences: music promo, explainer, character/story reveal. Evaluate static frames, smooth motion, camera, detail, audio, brand identity, production cost and render throughput.
9. Licensing checks: Remotion official licensing currently depends on org size and product use, including automated render commercial licensing; Blender GPL/free but assets/models individually checked. Do not assume all Remotion server automation is free.

## Known limits
No frame-by-frame analysis of the 2 actual completed stored jobs was done; style-quality diagnosis comes from verified composer/template source and user observation. No production feature has been implemented by this research. Changes affecting authentication, jobs, worker provider, security or deployment require scoped approval/lock/backup/test/receipt under STANDING_RULES. Do not advertise Higgsfield parity until comparative visual QA demonstrates it.

## Official public research references
https://www.remotion.dev/docs/three ; https://www.remotion.dev/docs/api ; https://www.blender.org/releases/5-2/ ; https://www.blender.org/features/vfx/ ; https://www.remotion.dev/docs/license/pricing
