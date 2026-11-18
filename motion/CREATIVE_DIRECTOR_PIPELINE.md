# Motion Studio Creative Director Pipeline — "Auteur" (spec for Harold's approval)

Owner: Swade Soul Enterprise LLC · Requested by Harold "hDub" Whaley · Date: 2026-10-28 · Status: **PROPOSAL. Not built. No template, style, renderer, database or service change has been made.**

Related: `CINEMATIC_STANDARD.md` (the bar), `CINEMATIC_AUDIT_2026-10-28.md` (grades), `ELEVATION_LAYERS.md` (per-style elevation blocks), `MOTION_STUDIO.md` (the system).

## 0. Architecture principle: one engine, switched by grants

**There is one engine. Every Brainiak user runs on SSS Brain.** Personal, Business and Enterprise (SSS Brain Lite) are not separate scaffolds, codebases or agent copies. They are the same SSS Brain with features switched on or off through the SWADEBASE grant system, based on what the client pays.

So everything in this spec — the Auteur agent, the gated pipeline, the variance engine, the type-style library, the elevation layers, the content-lock QA and the Brainiak video request flow — is **built once** on SSS Brain / SWADEBASE Motion Studio and **gated by feature switches. It is never duplicated per tier.** A tier only changes which switches are on, which limits apply (length, renders per month, resolution) and whether a step is free, metered (credits) or a paid upsell.

Rules that follow from this, applied throughout the document:

1. One code path, one agent manifest, one set of prompts, one elevation file. No `auteur-lite`, no "Business templates".
2. Every gated capability has one entitlement key (section 11). The key is checked on the server at request time; the UI only hides what the server would refuse.
3. When a switch is off, the step degrades to the free path (for example Auteur's rule-based treatment instead of the LLM treatment), never to a different, worse copy of the feature. The cinematic standard and content-lock QA are **always on for every tier**, because quality and correctness are not upsells.
4. Upgrading a client is a grant row change, not a deploy.

## 1. Why

Harold's feedback on recent videos: they lack creativity, the templates are too straight-laced, and he wants variety, pop and real layers. The audit shows why: the zero-cost fallback composer renders every style with one font, flat color bands and fade+slide titles; nothing tracks what was done last time, so videos repeat; and nobody owns the creative decisions between "style picked" and "render". Auteur fills that gap.

## 2. The agent: Auteur (Motion Studio creative director)

**Name:** Auteur (alternatives: Marquee, Dailies). Works alongside Kinetta. **Kinetta picks the style; Auteur directs it.**

| | Kinetta (exists) | Auteur (proposed) |
|---|---|---|
| Job | Listens to the brief, suggests 3 styles, locks one | Turns the locked style + content into a directed film: treatment, storyboard, shot list, camera, type, layers, grade, edit, QA sign-off |
| Talks to | The user | Kinetta, the composer, the worker, QA; the user only at review gates |
| Brain | Rule picker + optional LLM | Rule director (free) + optional LLM (Ollama first) |
| Lives in | `motion/agent/motion-agent.mjs` | Proposed `motion/agent/auteur.mjs` + the same `agent.manifest.json` (one manifest, gated tools) |

### 2.1 Inputs
- The project row (`motion_projects`: mode, format, duration, fps, quality, style_id, title, idea, script, brand, property, audio_features, captions, start image).
- The style spec (`motion_styles.spec`) + its **elevation block** + audit grade.
- The **content-lock manifest** (section 3, G1).
- The **creative log** of recent videos (`motion_creative_log`, section 5) for variety rules.
- Assets: photos, logos, brand colors, audio file and its analysis, VO script.
- The caller's grant set (section 11), which decides which steps run on the LLM vs. the free rule path.

### 2.2 Outputs (all saved to the project, see section 9)
- `treatment` (logline, tone, 3-act shape, look, grade recipe, signature move, type style).
- `storyboard` / `shot_list` JSON (per shot: start, duration, plane layout, camera move + ease, type treatment, transition out, audio cue, which locked items appear).
- `creative_fingerprint` (seeded choices) and the seed.
- A composition brief for the composer (LLM or template) that includes the elevation block verbatim.
- Gate sign-offs against `CINEMATIC_STANDARD.md`, each with pass/fail per check id (C1…V6).

### 2.3 Auteur instructions (system prompt, proposed)

```
You are Auteur, the creative director of SWADEBASE Motion Studio. Kinetta has chosen the style; you direct it.
Your bar is CINEMATIC_STANDARD.md: every video must feel like a film title sequence, trailer or broadcast promo.
Always:
1. Read the content-lock manifest first. Every locked fact, CTA, URL, name, logo and brand color must appear exactly as written,
   readable, inside title-safe, and on screen long enough (0.4 s per word + 1 s, minimum 2 s). You may restyle, never reword.
2. Apply the style's elevation block: keep its palette, textures and motifs and raise the production level. Never swap the look.
3. Use the seeded variance menu. Pick one signature move, 2-4 supporting moves, one grade arc and one type style, and do not reuse
   a signature move used in the last N videos (see the creative log). Explain each choice in one line.
4. Fit the film to the content: scene count, pacing, type scale and transitions follow the manifest and script (section 4).
5. Build every scene with foreground, midground and background, an eased camera move, and a designed transition.
6. Titles use the mapped film-title type style (light sweep, letter-by-letter reveal, extrusion/bevel, credit blocks), never fade+slide.
7. At each gate, sign off check by check. If a check fails, fix it before moving on, or flag it for Harold with the reason.
8. Never link to, show or mention a Harold site or URL that has not passed the readiness check. If a locked URL is not ready, stop and flag.
9. Use the free stack first (rule director, Ollama, ComfyUI). Only call a paid model if the grant allows it.
Output strict JSON matching the treatment / shot_list schemas. No prose outside the fields.
```

## 3. The gated pipeline (script to render)

Each gate has an owner, an output and a sign-off by Auteur against the standard. A failed gate stops the job; nothing renders at `high` until G6 passes.

| Gate | Name | Owner | Output | Auteur signs off on |
|---|---|---|---|---|
| G0 | Brief and script | User / Kinetta | Brief, script or VO, style locked | Brief complete; style grade (prefer meets/close) |
| G1 | **Content-lock manifest** | Auteur (extractor) | `content_lock` JSON (below), confirmed by the requester | Every fact/CTA/URL/brand item captured; each URL passed readiness |
| G2 | Creative treatment | Auteur | Treatment + seeded fingerprint | Variety rules; grade recipe (C1–C5); type style (T1, T6); **elevation block applied** |
| G3 | Storyboard and shot list | Auteur | Shot list JSON, plane layout per shot | D1–D5, K1–K3, P1–P5, T2–T5; every locked item placed in a shot; **elevation block applied per shot** |
| G4 | Style frame / animatic review | Worker (draft) + Auteur + requester | 3 style frames (PNG) + a draft animatic | Full QA checklist on draft; requester approves the look; locked items verified on frames |
| G5 | Render | Worker | `quality=high` MP4, poster, ZIP | Render settings V1–V4 |
| G6 | QA | Auteur + QA script | QA report in `render_meta.qa` | Every check C1…V6, content-lock verification, accessibility, readiness, elevation verified |

### 3.1 Content-lock manifest (G1)

```json
{
  "facts":   [{"id":"f1","text":"Free to join the waitlist","min_on_screen_s":3,"must_be_spoken":false}],
  "ctas":    [{"id":"c1","text":"Join the waitlist","url":"https://swadespace.com","placement":"end_card","min_on_screen_s":3}],
  "urls":    [{"url":"https://swadespace.com","readiness":"verified","checked_at":"<ts>","evidence":"<link>"}],
  "names":   ["PET MUZIK"],
  "brand":   {"colors":["#..."],"logos":[{"asset":"b2://...","min_height_pct":6,"clear_space_pct":2}],"fonts":["..."],"do_not":["no price","no celebrity names"]},
  "legal":   ["..."],
  "forbidden": ["first ever","22 missions"]
}
```
Extracted from the script and brief by Auteur, then shown to the requester to confirm. Locked text is copied verbatim into the composition; the composer may style it but not reword it. Brand rules from the site (for example the PET MUZIK public-marketing rules) are loaded into `do_not` / `forbidden` automatically.

## 4. Content-adaptive templates

Auteur reads the content-lock manifest and script and fits the style to the content, instead of forcing content into a fixed template. Same engine for every tier; the inputs change the result.

| Signal (read at G2) | Adapts |
|---|---|
| Length (duration or VO length; words ÷ 2.5 per s) | Scene count = clamp(round(duration ÷ target shot length), 3, 40); target shot length 2–5 s promo, 4–8 s explainer |
| Number of facts and CTAs | One fact per shot (max 2); CTAs get their own shot plus the end card; if facts × min_on_screen_s exceed the duration, Auteur flags it at G1 and proposes a longer cut rather than cramming |
| Tone (playful / premium / urgent / warm / epic) | Ease family (back.out vs expo.inOut vs sine.inOut), cut rate, grade arc, type style choice within the style's mapped list |
| Audience and platform (social, web hero, TV, pitch) | Format (9:16 / 16:9 / 1:1 / 4:5), title-safe margins, caption on/off, fps (24 story, 30 social/UI) |
| Assets available | Photos → photo-led shots with DOF and Ken Burns (eased); logos → logo reveal shot and end card; audio → cuts on beats/sections; no assets → typographic/graphic treatment from the style |
| Text amount per shot | Type scale steps down one hierarchy level per extra line; never below 36 px at 1080p; long text splits across shots instead of shrinking |
| Music energy curve | Act boundaries on section changes; signature move on the biggest drop |

## 5. Creative variance engine

A seeded menu so videos stop looking alike. Seed = hash(project_id + style_id + revision); stored, so a re-render is identical.

**Camera moves:** push-in, pull-out, dolly, truck, crane up/down, orbit, whip pan (with motion blur), dolly zoom (vertigo), rack focus, crash zoom, tilt reveal, overhead top-down, parallax slide, match-move through an object.
**Layered compositing:** 2.5D parallax (3–5 planes), foreground occluders (set pieces, hands, leaves, glass, bokeh), light leaks, film grain, paper/fabric/metal textures, haze and volumetric light, masks and reveals (shape, text, wipe, iris, ink, light), reflections, particles.
**Bold graphic treatments:** split screens, duotone flips, halftone or posterized inserts, oversized cropped type behind the subject, frame-in-frame, color-block wipes, stamp/sticker accents.
**Grade per act:** an arc such as cool open → warm build → golden payoff, or desaturated hook → full color reveal; one grade per act, consistent within it.
**Kinetic typography:** letter-by-letter reveals, word slams, variable-axis morphs, credit-block builds, type on a 3D path, type as a mask over footage.

**Variety rules (enforced from the log):**
- No repeated **signature move** within the last N = 5 videos of the same site/property (and last 3 across the account).
- No identical (style, grade arc, type style) triple within the last 10 videos.
- At least 3 distinct camera moves and 2 compositing layers per video over 20 s.
- Transitions: at most 40% of cuts use the same transition.

**Proposed table `motion_creative_log`** (one row per rendered video):

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| project_id | uuid fk motion_projects | |
| render_job_id | uuid fk motion_render_jobs | |
| owner_user_id, site_id / property | uuid / text | Variety windows are per property and per account |
| style_id | text | |
| seed | bigint | Reproducible re-render |
| signature_move | text | e.g. `dolly_zoom` |
| camera_moves, layers, transitions | text[] | |
| grade_arc, type_style | text | e.g. `cool>warm>gold`, `TS-01` |
| fingerprint_hash | text | Hash of the sorted choices |
| created_at | timestamptz | |

## 6. The cinematic type layer (for ALL templates)

Every style and template gets a Hollywood-style title system on top of its own look: film-title type, light sweeps, extrusion or bevel, letter-by-letter reveals and credit-block layouts. Each type style defines four pieces: **Main title**, **Lower third**, **Credit block** (two-column "role / name" or "fact / value" layout, centered axis) and **End card** (logo + CTA + URL, held 2–3 s).

| ID | Type style | Faces (display + text) | Treatment |
|---|---|---|---|
| TS-01 | Trailer Serif | Cinzel / Cormorant SC + Inter | Wide-tracked caps, fade from black, slow light sweep, credit-block layout |
| TS-02 | Condensed Blockbuster | Bebas Neue / Anton + Montserrat | Extruded metallic bevel, slam with motion blur, light sweep |
| TS-03 | Prestige Drama Serif | Playfair Display / Cormorant Garamond + Source Sans 3 | Letter-by-letter blur-to-sharp, italic accents |
| TS-04 | Keynote Neo-Grotesk | Inter Display / Inter Tight + Inter | Tight tracking, mask-wipe reveals, specular glint |
| TS-05 | Emissive Neon | Monoton / Audiowide / neon script + Exo 2 | Bloom, letter-by-letter flicker-on |
| TS-06 | Hand-Craft Title | Medium-matched hand/brush face + clean serif | Textured write-on, clean serif subtitle |
| TS-07 | Comic Impact | Bangers + clean caps | 3D extrusion with halftone shadow, overshoot slam |
| TS-08 | Retro Chrome Bevel | Chrome italic + Inter | Bevel, lens-flare glint, chrome sweep |
| TS-09 | Technical Mono HUD | IBM Plex Mono / Share Tech Mono + Inter | Decode reveal, credit block as data readout |
| TS-10 | Storybook Rounded | Fraunces Soft / Baloo 2 + Inter | Soft emboss, letter bounce, page-printed |
| TS-11 | Deco / Engraved Gold | Poiret One / Limelight / Cinzel Decorative + Inter | Gold foil with moving specular, engraved bevel |
| TS-12 | Kinetic Variable | Anton / Inter Black / Roboto Flex | Letter-by-letter axis morph, scale slams |
| TS-13 | Pixel Prestige | Press Start 2P / VT323 + Cinzel | Glow and CRT bloom, then a cinematic credit block |

The style's own named font stays the display face where it has one; the TS treatment and text face are layered on. **Every one of the 86 styles and the 8 engine/Audivid templates is mapped to one or more TS styles in `ELEVATION_LAYERS.md`.** Default mapping by category: Hand-Drawn TS-06/03 · Painterly TS-03/01 · Print TS-02/07 · Paper & Craft TS-10/06 · Illustration TS-03/11 · Art & Design TS-04/11 · Retro Digital TS-13/08 · Retro UI & Neon TS-05/09 · Dimensional TS-04/10 · Light & Imaging TS-01/03 · Data TS-04/09 · Generative & Type TS-12 · Explainer TS-04/12 · Cosmic TS-11/01.

## 7. Elevation instruction layer

For each of the 86 styles plus the engine templates there is a short instruction block that **elevates its existing look (own palette, textures, motifs) to a higher production level without replacing it.** All blocks are in `/opt/swadebase/motion/ELEVATION_LAYERS.md` (one file now; later split into `motion/styles/elevation/<style-id>.md` and loaded into the DB). Each block has: Keep (palette + core look), Elevate (grade, depth, camera, light specific to the style), Type styles, Transitions.

**Applied automatically at every build:**
1. G2 (treatment): Auteur loads the universal layer + the category layer + the style block and writes them into the treatment.
2. G3 (storyboard): each shot records which elevation items it carries (planes, camera, grade, type) in `shot_list[].elevation`.
3. Composer: the elevation text is passed verbatim to the LLM composer, and the template composer reads its structured fields.
4. G6 (QA): QA verifies the elevation was applied: `elevation_version` matches the current block, every shot lists its items, and the frame checks (three planes, eased camera, TS title) pass. Missing elevation = QA fail.

Proposed table **`motion_style_elevations`**: `style_id text pk/fk motion_styles`, `version int`, `keep text`, `elevate text`, `type_styles text[]`, `grade_recipe text`, `planes jsonb`, `camera_defaults jsonb`, `updated_at`, `approved_by`. (Alternative: a `elevation jsonb` column on `motion_styles`; the table is preferred so versions are kept and the 86-style seed is not touched.)

## 8. Worked elevation examples

### 8.1 Spray-Paint Mural (`spray-mural`) — audit: needs upgrade
- **Keep:** brick/concrete wall, aerosol fades, overspray halos, drips, crisp stencil edges, bold outlines, sun-bleached posters at the edges, the style palette, roller-buff transition, spray bursts on snares / drips on kicks.
- **Elevate:**
  - Grade: late-afternoon street grade, warm key raking across the brick so mortar lines throw shadow, cool bounce in shadows, 8% vignette, fine grain; paint keeps full saturation (grade at 60% on paint).
  - Depth: background = far end of the alley softly defocused; midground = the wall and mural; foreground = a chain-link fence, spray can or tag-covered pole drifting past in blur, plus floating overspray mist in the light (D5).
  - Camera: replace handheld sway with stabilized slider/dolly moves along the wall (power2.inOut), a slow push-in as each piece completes, a crane-up reveal of the full mural for the payoff; one whip pan between walls with motion blur as the signature move.
  - Light: a sun flare sweeping across fresh wet paint, specular glint on drips.
- **Type:** TS-02 Condensed Blockbuster for titles (wildstyle face kept as the hero word, extruded with a paint bevel and light sweep); TS-07 stencil caps for lower thirds; credit block stenciled on a poster on the wall; end card painted on with the CTA in clean stencil + URL in Montserrat.
- **QA focus:** text over textured brick must hit 4.5:1 (add a soft paint panel behind small text).

### 8.2 Gouache Storybook (`gouache-storybook`) — audit: close
- **Keep:** opaque matte gouache, flat chalky color, dry-brush edges, rounded shapes, cozy interiors, warm light, picture-book composition, Fraunces Soft, page-turn / painted-iris transitions, characters bobbing on the beat.
- **Elevate:**
  - Grade: warm lamp-light grade with soft halation on windows and lamps, slightly lifted blacks, gentle 10% vignette, paper grain at 3%.
  - Depth: break each spread into 4 painted planes (back wall, room/props, character, foreground furniture or curtain edge); background at 6px blur, foreground at 10px; parallax 1.4 : 1.0 : 0.5.
  - Camera: slow push-in per page (4%), a gentle truck across the room following a character, a rack focus from a foreground teacup to the character on a key line; page turn rendered as a 3D page with a light change.
  - Motion: keep cut-out arcs, add secondary motion (ear/tail follow-through, cloth sway) and a 2-frame anticipation before each bob.
  - Light: dust motes in a window beam, candle/lamp flicker 2–3%.
- **Type:** TS-10 Storybook Rounded (Fraunces Soft, soft emboss, letter bounce) for titles and read-along; TS-03 Prestige Drama Serif for the opening "Once upon a…" card; credit block set like a book's title page; end card as the last page with CTA.

### 8.3 Audivid Spectrum Ring (`abagale.audivid_templates`, style_type `ring`) — audit: needs upgrade
- **Keep:** circular spectrum around the album/pet art, accent color support, centered text layout, the user's colorA/colorB gradient, the blurred-cover backdrop idea.
- **Elevate:**
  - Delivery: render at 1920×1080 / 1080×1920 / 1080×1080 (now 1280×720 / 720×1280 / 1000×1000), 4K-capable.
  - Depth: backdrop = the cover/pet photo, heavily blurred and graded from its own palette (not flat #050505); midground = the sharp art in a circular frame with a soft rim light; ring = emissive bars with bloom; foreground = slow bokeh particles in the ring colors; a second, fainter ring behind at 0.6× scale with 8px blur for depth.
  - Camera: slow 3% push-in over the track, a subtle 2° orbit drift, a crash-zoom pulse on the biggest drop only.
  - Light: ring bars cast light onto the art edge; a light sweep crosses the art on section changes; floor reflection for 16:9.
  - Audio: bar heights smoothed with attack/release so they read as musical, not jittery; the pet's eyes / art gets a beat-synced micro-scale (1–2%) to keep the eyes moving (PET MUZIK rule).
- **Type:** TS-01 Trailer Serif for song title (letter-by-letter with light sweep) and TS-05 Emissive Neon for the artist/pet name; lower third as a credit block ("Song / Artist / Label"); end card with CTA.

## 9. How it plugs in (tables and adapter contract)

**Existing tables, no change yet (proposed additions):**
- `motion_projects`: use existing `agent_notes` and `render_meta` now; propose new columns `content_lock jsonb`, `treatment jsonb`, `shot_list jsonb`, `creative_seed bigint`, `elevation_version int`, `gate_status jsonb` (`{"G1":"pass",...}`), `grant_snapshot jsonb` (what the grant check allowed at request time).
- `motion_render_jobs`: add `kind` values `style_frames` and `animatic` (draft) alongside the current render kinds; QA output saved to `render_meta.qa`.
- New: `motion_creative_log` (section 5), `motion_style_elevations` (section 7). Optional `motion_gate_signoffs` (project_id, gate, checks jsonb, signed_by, at) if gate history needs to be kept.

**Adapter contract (SWADE Adapter Contract v1):** Auteur is exposed through the existing `motion-studio` adapter (same edge function, same auth), not a new scaffold. Add actions `direct` (run G1–G3), `approve_gate`, `qa_report`; `status` advertises `capabilities.actions` and the gates; auth per contract section 2 (user JWT, site key, or service token from `/opt/swade-secrets/`); site and owner come from the credential, never the caller. New MCP tools: `motion_direct_project`, `motion_get_treatment`, `motion_approve_gate`. Keys stay on SWADEBASE.

## 10. Guardrails (checked at QA, G6)

1. **Content lock:** every fact and CTA in `content_lock` is present (OCR on rendered frames + text diff against the manifest), spelled exactly, readable (contrast 4.5:1, at least 36 px at 1080p), inside title-safe, and on screen at least `min_on_screen_s`. URLs match exactly. Brand colors match within ΔE < 3; logos are the supplied asset, unmodified, at minimum size with clear space. Forbidden words/claims do not appear in frames, captions or VO.
2. **Accessibility:** text contrast 4.5:1 (3:1 for large titles), no flashing above 3 per second over large areas (photosensitivity), captions available for narrated videos.
3. **Readiness hard rule:** no video links to, shows or mentions a Harold site that is not 100% ready for customer acquisition. Each URL in the manifest must carry a readiness check done before G1 sign-off (fresh within 7 days) and is re-checked at G6. Not ready = the job stops and is flagged; it is never rendered with the link.
4. **Brand rules per property** (for example PET MUZIK: no Harold name, no ambassador role, no press release, no Eva backstory, no celebrity names, no "22 missions", no price, no "first ever"; partners as plain badges) are loaded into `forbidden` / `do_not` automatically.
5. **Elevation verified** (section 7) and the full `CINEMATIC_STANDARD.md` checklist signed.
6. **No auto-publish:** finished videos go to the requester with watch + download links; nothing posts or sends without approval.

## 11. Feature switches: one engine, gated per tier

Built once on SSS Brain / SWADEBASE. Tiers only flip switches and limits. Entitlement keys follow the existing Brainiak pattern (`brainiak.product_grants`: workspace, entitlement, source free/paid/gifted/admin, active, expires) and the SWADEBASE site-module switch (`swadesoul.swade_site_modules.enabled`). Proposed keys and defaults (all proposals for Harold; Enterprise = SSS Brain Lite):

| Feature | Entitlement key | Personal | Business | Enterprise (SSS Brain Lite) | Cost class |
|---|---|---|---|---|---|
| Cinematic standard + content-lock QA + readiness rule | (always on, no key) | On | On | On | Free (never gated) |
| Kinetta style pick (rule brain) | `brainiak.motion.kinetta` | On | On | On | Free |
| Auteur rule director (treatment + shot list, free path) | `brainiak.motion.auteur` | On | On | On | Free |
| Auteur LLM director (Ollama first) | `brainiak.motion.auteur_llm` | Metered | Metered | Upsell (off until granted) | Metered credits |
| Elevation layers applied | `brainiak.motion.elevation` | On | On | On | Free |
| Creative variance engine + log | `brainiak.motion.variance` | On | On | On | Free |
| Full type-style library (13 TS styles) | `brainiak.motion.type_library` | 4 styles | All | Upsell | Free base / paid unlock |
| Content-adaptive layout | `brainiak.motion.adaptive` | On | On | On | Free |
| Style frames + animatic review (G4) | `brainiak.motion.animatic` | 1 round | 3 rounds | Upsell | Metered |
| Renders per month at 1080p | `brainiak.motion.render_1080` | 3 × 60 s | 20 × 3 min | Upsell bundle | Metered credits |
| 4K render | `brainiak.motion.render_4k` | Off | Upsell | Upsell | Paid |
| ComfyUI generated plates/textures | `brainiak.motion.comfyui` | Metered | Metered | Upsell | Metered credits |
| Paid model (Anthropic/OpenAI) for direction | `brainiak.motion.premium_llm` | Off | BYOK | BYOK / upsell | Paid or BYOK |
| Audivid cinematic templates | `brainiak.motion.audivid_pro` | Off | Upsell | Upsell | Paid |
| Brainiak video request flow (section 13) | `brainiak.motion.request` | On | On | On | Free to request; render metered |
| White-label end card (no SWADEBASE bug) | `brainiak.motion.whitelabel` | Off | Upsell | Upsell | Paid |

**Grant check at request time (server-side only):**
1. Request arrives at the `motion-studio` adapter (user JWT, site key or service token, per contract section 2). Site and workspace come from the credential.
2. Site gate: `swade_site_modules` row for the site and module `motion-studio` must be `enabled`.
3. For each step the job will use (for example `auteur_llm`, `animatic`, `render_4k`), look up `product_grants` for (workspace, entitlement) where `active` and (`expires` is null or in the future). Both the site gate and the grant must allow it.
4. Metered steps: check the credit balance against the step's cost before work starts and reserve credits; settle actual cost after the step; refund the reservation on failure.
5. If a switch is off, the step falls back to the free path of the same engine (rule director instead of LLM, draft animatic skipped, 1080p instead of 4K) and the reply says what an upgrade would add. Never a different feature copy.
6. The result of the check is saved to `motion_projects.grant_snapshot` so QA and billing can see what was allowed. UI labels, plan names and client flags are never trusted.

## 12. Cost tier (free stack first)

| Step | Free default | Metered | Paid (grant) |
|---|---|---|---|
| Style pick, treatment, shot list | Rule brains (Kinetta + Auteur) | Ollama on the Hostinger GPU when up | Anthropic/OpenAI via grant or BYOK |
| Textures, plates, light leaks | Built-in CSS/SVG/canvas generators, licensed free textures | ComfyUI (local) | Paid image/video models via grant |
| Composition | Template composer + elevation fields | Ollama composer + 2 repair rounds | Paid model |
| Render | VPS CPU (HyperFrames + FFmpeg) | Extra render minutes, 4K | Priority queue |
| Audio finishing | FFmpeg loudnorm + sidechain | — | — |

This follows the three-level model: free base, metered with credits, paid upsells through grants.

## 13. Brainiak video request flow (same engine for every tier)

1. Client asks their SSS Brain (any tier) for a video by voice or chat: "make a 30-second promo for my bakery opening".
2. SSS Brain calls `motion_create_project` + `motion_direct_project` on the one Motion Studio adapter with the workspace credential.
3. Grant check (section 11) decides which steps run on the free vs. metered vs. paid path.
4. Kinetta picks the style (prefers meets/close); Auteur builds the content lock and asks the client to confirm facts/CTAs/URLs (G1); readiness is checked on every URL.
5. Auteur produces the treatment and storyboard with elevation + variance (G2–G3); style frames/animatic if granted (G4).
6. Render (G5), QA (G6), then SSS Brain sends the client a watch link and a direct download link. Nothing is published automatically.

## 14. What needs Harold's approval before any build

- The name Auteur, the prompt, and the gate list.
- New tables `motion_creative_log`, `motion_style_elevations` (and optional `motion_gate_signoffs`), new `motion_projects` columns, new render-job kinds.
- Entitlement keys and tier defaults in section 11, and credit costs for metered steps.
- Upgrading the fallback composer and render path first (largest lift), then PET MUZIK templates and Audivid.
- Variety window N (proposed 5 per property, 3 account-wide).
