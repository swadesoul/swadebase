# SWADEBASE Motion Studio — Cinematic Standard v1 (default)

Owner: Swade Soul Enterprise LLC · Set by Harold "hDub" Whaley · Date: 2026-10-28 · Status: **standing default for every new Motion Studio job**

Harold comes from the entertainment industry. Every motion-graphics video SWADEBASE makes is expected to look like a title sequence, trailer or broadcast promo, not a slideshow. This document is the bar. It is written so a person, Kinetta, Auteur (see `CREATIVE_DIRECTOR_PIPELINE.md`) or a QA script can check each item yes/no.

## 0. How this standard applies

- **Default for all new jobs.** Every new `motion_projects` row, every render job, every HyperFrames composition (LLM-composed or template) and every Audivid / PET MUZIK / explainer render targets this standard unless Harold explicitly asks for a deliberately lo-fi look for that one job.
- **Kinetta prefers passing styles.** When Kinetta suggests 3 styles she ranks styles graded **meets** first, then **close**, and only offers a **needs upgrade** style when the brief names it or nothing else fits, saying so in one line ("this one is still being upgraded to our cinematic bar"). Grades live in `CINEMATIC_AUDIT_2026-10-28.md` (and later in the DB, see section 11).
- **Deliberately retro looks are allowed, never cheap.** 8-bit, Win95, whiteboard and similar keep their look, but are *framed and finished* cinematically (grade, depth, eased camera, premium titles, mastered audio). A style is not an excuse for low polish. Each style's elevation recipe is in `ELEVATION_LAYERS.md`.
- **Draft renders** (`quality=draft`) may skip motion blur and 4K, but nothing else.
- Nothing in this document changes existing templates, styles or the renderer. Upgrades are tracked in the audit and made later with Harold's approval.

## 1. Color (grade, contrast, palette)

| # | Check | Pass when |
|---|---|---|
| C1 | A deliberate grade is applied | A named LUT or grade recipe (e.g. `teal-orange-soft`, `warm-35mm`, `noir-bw-hi`, `ink-paper-warm`) is set per project and applied to every scene (CSS filter/overlay stack in HyperFrames, or an FFmpeg `lut3d`/`curves` pass). |
| C2 | No flat defaults | No pure `#000`/`#fff` full-frame fills without texture, gradient or vignette; no unstyled browser defaults; no default Arial/Times/Georgia. |
| C3 | Contrast | True blacks and clean highlights with a readable midtone ramp; key text at least 4.5:1 contrast against what is behind it (3:1 for titles 48px+ at 1080p). |
| C4 | Consistent palette | Only the style's 5-hex palette plus brand colors; at most one extra accent per act. Same grade across all scenes of an act. |
| C5 | Finishing | Subtle vignette (5–15%), film grain or texture (2–6% opacity, moving per frame), and halation/bloom only on highlights where the style supports it. |
| C6 | Photo safety | Photos (pets, people, products) keep natural tones under the grade; grade strength on hero photos is 60% or less. |

## 2. Depth (DOF, parallax, layers)

| # | Check | Pass when |
|---|---|---|
| D1 | Three planes | Every scene has a **foreground**, **midground (subject)** and **background** plane. Flat single-plane scenes are only allowed for inserts of 1.5 s or less. |
| D2 | Depth of field | Background or foreground is defocused (CSS `filter: blur()` 4–16px at 1080p, scaled to resolution) relative to the subject, or a rack focus moves attention between planes. |
| D3 | Parallax | When the camera moves, planes move at different rates (typical ratio fg 1.4 : mid 1.0 : bg 0.5). |
| D4 | Occlusion and light | At least one foreground occluder or light layer (particles, haze, light leak, bokeh, set piece) passes in front of the subject per act. Contact or drop shadows ground objects. |
| D5 | Atmosphere | Haze, fog, dust, volumetric light or texture overlay gives air between planes where the style allows it. |

## 3. Camera (eased moves, no linear tweens)

| # | Check | Pass when |
|---|---|---|
| K1 | Motivated camera | Every scene has a virtual camera move (push-in, pull-out, dolly, truck, crane, orbit, tilt) or an intentional locked-off hold. |
| K2 | No linear tweens | No `ease: 'none'`/`linear` on camera, title or hero moves. Use `power2/3.inOut`, `expo.inOut`, `sine.inOut` or a custom bezier. Linear is allowed only for constant-velocity loops (scrolling grids, conveyors, particle drift). |
| K3 | Push-ins | Hero moments and the final card use a slow push-in (3–8% scale over 3–6 s) or a dolly. |
| K4 | Motion blur | Fast moves (over ~40 px/frame at 1080p) carry motion blur: sub-frame sampling/frame blending, a directional blur during the move, or an FFmpeg `tmix` pass on high quality. |
| K5 | No jank | No camera shake unless motivated (impact) and 6 frames or less; no handheld wobble on titles; render at the delivery fps (no resampling). |

## 4. Typography (premium pairings, hierarchy, safe titles)

| # | Check | Pass when |
|---|---|---|
| T1 | Premium pairing | A display face + a text face from a curated pairing (e.g. Cinzel + Inter, Playfair Display + Source Sans 3, Bebas Neue + Montserrat, Fraunces + Inter, Inter Display + Inter). Fonts are loaded before render; no fallback fonts in frames. |
| T2 | Hierarchy | Max 3 levels per frame: Title, Subtitle/Lower-third, Caption/Legal. Each level has a fixed size, weight and tracking defined per project. |
| T3 | Kerning and tracking | Optical kerning on (`font-kerning: normal`, `text-rendering: geometricPrecision`); display caps tracked +2–12%, large lowercase tightened −1 to −3%. No widows in 2-line titles. |
| T4 | Title-safe | All text inside 90% title-safe (5% margin each side; 10% top and bottom on 9:16 for platform UI). Logos inside 93% action-safe. |
| T5 | Readable on screen | Body text at least 36 px at 1080p (3.3% of frame height); every line stays on screen at least 0.4 s per word + 1 s, minimum 2 s. |
| T6 | Cinematic treatment | Titles use a film-title treatment (light sweep, letter-by-letter reveal, mask wipe, extrusion/bevel, credit-block layout), not a default fade+slide. See the type-style library in `CREATIVE_DIRECTOR_PIPELINE.md` section 6. |

## 5. Pacing and edit

| # | Check | Pass when |
|---|---|---|
| P1 | Hook | Something visually strong happens in the first 2 s (title hit, reveal, camera move). |
| P2 | Music-synced cuts | Scene changes land on beats, bars or phrase boundaries (±1 frame) from the audio analysis; big reveals on drops/downbeats. |
| P3 | Shot length | Average shot 2–5 s for promos, 4–8 s for explainers; no shot longer than 10 s without a camera move or new element. |
| P4 | Designed transitions | Every scene change is a designed transition from the style (wipe, match cut, light leak, whip, iris, morph) or a hard cut on a beat. No default cross-fade between every scene. |
| P5 | Three-act shape | Open (hook) → build (story/facts) → payoff (CTA/end card held 2–3 s). |

## 6. Audio

| # | Check | Pass when |
|---|---|---|
| A1 | Mix levels | Narration peaks around −6 dBFS before master; music bed sits 12–18 dB under narration while narration plays. |
| A2 | Ducking | Music ducks under narration automatically (`sidechaincompress`, 150–300 ms attack/release) and recovers in gaps. |
| A3 | Loudness | Integrated loudness **−14 LUFS ±1** for web/social (`loudnorm I=-14:TP=-1:LRA=11`), true peak ≤ −1 dBTP. Broadcast deliverables: −24 LKFS (ATSC A/85) on request. |
| A4 | Clean edges | No clicks; music fades or ends on a phrase; 0.5–1 s audio tail after the final frame. |
| A5 | Sync | Picture accents land on audio events (±1 frame); lip-flap/EQ animation is driven by the actual track. |

## 7. Delivery

| # | Check | Pass when |
|---|---|---|
| V1 | Resolution | **1080p minimum** (1920×1080, 1080×1920, 1080×1080, 1080×1350). Compositions are resolution-independent so **4K** (3840×2160) renders by changing size only. No 960×540 or 1280×720 finals. |
| V2 | Frame rate | 24 fps (cinematic, default for story/trailer) or 30 fps (social, UI, data); 60 only for UI/gameplay demos on request. One fps per project. |
| V3 | Codec and bitrate | H.264 High profile, yuv420p, CRF 16–18 or at least 16 Mbps at 1080p / 45 Mbps at 4K; H.265/HEVC 10-bit optional for 4K archive. AAC 320 kbps 48 kHz stereo. `+faststart`. |
| V4 | Quality preset | Final renders use HyperFrames `--quality high`. `draft` is only for previews and animatics. |
| V5 | Package | MP4 + graded poster frame (designed, not frame 0) + source ZIP, per `MOTION_STUDIO.md` section 8. |
| V6 | No banding | Gradients carry dither/grain so 8-bit encoding does not band. |

## 8. Pre-render QA checklist (sign before `quality=high`)

Run on the style frame / animatic (draft) and again on the final. Every box is ticked or has a written, Harold-approved exception.

- [ ] C1 grade named and applied to all scenes · C2 no flat defaults · C3 contrast · C4 palette consistent · C5 grain/vignette
- [ ] D1 three planes per scene · D2 DOF or rack focus · D3 parallax on moves · D4 occluder/light layer per act
- [ ] K1 motivated camera per scene · K2 no linear tweens on camera/titles · K3 push-in on hero and end card · K4 motion blur on fast moves (final) · K5 no jank
- [ ] T1 pairing loaded, no fallback fonts · T2 3 levels max · T3 kerning/tracking · T4 title-safe · T5 readable and long enough · T6 film-title treatment
- [ ] P1 hook in 2 s · P2 cuts on beats · P3 shot lengths · P4 designed transitions · P5 held end card
- [ ] A1 levels · A2 ducking · A3 −14 LUFS ±1, TP ≤ −1 dBTP (`ffmpeg -af ebur128` report attached) · A4 clean edges · A5 sync
- [ ] V1 1080p+, 4K-capable · V2 24 or 30 fps · V3 H.264 High, CRF 18 or lower · V4 `--quality high` · V5 poster + ZIP · V6 no banding
- [ ] Elevation layer for the chosen style applied (see `ELEVATION_LAYERS.md`)
- [ ] Content lock: every required fact, CTA, URL and brand element present and correct, and every linked site passed the readiness check (see `CREATIVE_DIRECTOR_PIPELINE.md`)
- [ ] `ffprobe` output (size, fps, codec, bitrate, duration) and the loudness report saved to `motion_projects.render_meta.qa`

## 9. Grades used in the audit

- **meets** — the style definition already specifies cinematic grade/lighting, depth, eased camera and premium type; needs only the pipeline-wide finishing (grade pass, grain, motion blur, loudness, 1080p high).
- **close** — strong look missing one or two pillars (usually camera or depth); the minor upgrades are listed.
- **needs upgrade** — flat, UI-like or lo-fi definition, or a template that renders below the bar (resolution, fonts, linear tweens); what is missing is listed.

## 10. Pipeline-wide gaps (apply to every style until fixed)

From reading `motion/worker/worker.mjs` and `motion/worker/template.mjs` (no changes made): the zero-cost `template` composer uses one font (Bricolage Grotesque), flat color bands and a linear Ken Burns on start images; there is no grade/LUT pass, no grain, no motion-blur step and no loudness normalization in the render path; the sample batch renders at `draft`. These are the first upgrades to make (with approval) because they lift all 86 styles at once.

## 11. Where the grades will live (proposal, not applied)

Proposed for later (needs approval, not done): add `cinematic_grade` (`meets` / `close` / `needs_upgrade`) and `cinematic_notes` to `motion_styles`, filled from the audit, and give Kinetta's rule picker a score bonus for `meets` (+2) and `close` (+1). Until then Kinetta and Auteur read the audit markdown.
