# Cinematic Audit — Motion Studio styles and templates (2026-10-28)

Graded against `CINEMATIC_STANDARD.md`. **No style has a preview render yet (every `sample_status` is `none`), so every grade below comes from the written definition in `motion/styles/library.json` (look, type, motion, transitions, audio) or, for templates, from reading the template source.** Re-grade from real renders once samples exist. Nothing was changed while auditing: no templates, styles, renderer, `library.json` or DB rows.

Pipeline-wide gaps that affect every style regardless of grade are in `CINEMATIC_STANDARD.md` section 10 (single-font fallback composer, no grade/grain/motion-blur/loudness pass, draft-quality samples). Each style's elevation recipe is in `ELEVATION_LAYERS.md`.

## Summary

| Grade | 86 library styles | Engine and Audivid templates | Total |
|---|---|---|---|
| meets | 10 | 0 | 10 |
| close | 35 | 0 | 35 |
| needs upgrade | 41 | 8 | 49 |

Engine/Audivid templates audited: SSS Brain title starter (engine/index.html, with an identical copy on swadebase-2), pet-muzik-pop, pet-muzik-cartoon, the worker fallback composer, and the four Audivid templates. swadebase-2 holds no other motion templates: its only HyperFrames folder is the identical starter copy; Rakazo avatar-motion files are UI animation, not video templates.

## Top 10 that meet the standard (ranked)

1. **Product Launch Reveal** (`product-launch`) — Keynote lighting, rim light, specular, tight-tracked display. Minor: none beyond finishing.
2. **1940s Film Noir** (`film-noir-1940s`) — High contrast, grain, gate weave, slow dolly, smoke beams. Minor: none beyond finishing.
3. **Golden Hour 35mm** (`golden-hour-35mm`) — Halation, grain, handheld drift, push-ins, light leaks. Minor: keep drift subtle on titles.
4. **Oil Impasto** (`oil-impasto`) — Chiaroscuro, raking light, slow push-ins, EB Garamond gold. Minor: rack focus on knife ridges, dust motes in the light.
5. **Bioluminescent Deep Sea** (`bioluminescent-deep-sea`) — Parallax marine snow, additive light, slow drift. Minor: a slow push toward each organism.
6. **Layered Paper Diorama** (`paper-diorama`) — Deep parallax dolly, real shadows, soft top light. Minor: add shallow DOF on near layers and a light-leak/dust layer.
7. **Tech Glow Explainer** (`tech-glow`) — Bloom, perspective grid, camera parallax, gradient headlines. Minor: DOF on background nodes.
8. **Editorial Essay Collage** (`editorial-collage`) — Grainy paper, Ken Burns, soft shadows, Oswald + Merriweather. Minor: DOF on background clippings.
9. **Afrofuturist Illustration** (`afrofuturist-illustration`) — Gold/indigo grade, heroic push-ins, rising particles, futuristic display. Minor: pair Orbitron with a refined serif for body.
10. **Fresco Plaster** (`fresco-plaster`) — Camera dolly along a wall, gilded halos, Cinzel. Minor: add candle/torch flicker grade and dust in the air.

## Most important upgrades (in order)

- Fallback composer (`worker/template.mjs`): add grade, grain, vignette, three planes, eased camera and per-style title treatments. Lifts all 86 styles at once; it is the main reason renders look straight-laced.
- Render path: add a finishing pass (LUT/curves, grain, motion blur on high quality), `loudnorm` to −14 LUFS with ducking, H.264 High CRF 16–18, and render finals at `--quality high`.
- PET MUZIK templates: move from 960x540 to 1920x1080, replace Arial and emoji animals, remove linear `ease:none` tweens, add multiplane depth and a grade.
- Audivid renderer: move from 720p to 1080p (4K-capable), add camera, depth and grade; Minimal Pulse is sold as premium but renders at 720p.
- Typography: load a curated pairing per style (many styles name only a display font) and adopt the type-style library (TS-01 to TS-13).
- Camera: give every style without a defined camera an eased move; replace handheld sway (Spray Mural) and camera shakes (Anime Cel) with stabilised moves.
- Render the 86 style samples at standard quality once the above lands, then re-grade from real footage.

## Meets — 10

| # | Style | Category | Grade cue | Depth cue | Camera cue | Named type | Notes |
|---|---|---|---|---|---|---|---|
| 9 | Oil Impasto (`oil-impasto`) | Painterly | yes | - | yes | yes | Chiaroscuro, raking light, slow push-ins, EB Garamond gold. Minor: rack focus on knife ridges, dust motes in the light. |
| 12 | Fresco Plaster (`fresco-plaster`) | Painterly | - | - | yes | - | Camera dolly along a wall, gilded halos, Cinzel. Minor: add candle/torch flicker grade and dust in the air. |
| 21 | Layered Paper Diorama (`paper-diorama`) | Paper & Craft | yes | yes | yes | - | Deep parallax dolly, real shadows, soft top light. Minor: add shallow DOF on near layers and a light-leak/dust layer. |
| 32 | Afrofuturist Illustration (`afrofuturist-illustration`) | Illustration | yes | - | yes | - | Gold/indigo grade, heroic push-ins, rising particles, futuristic display. Minor: pair Orbitron with a refined serif for body. |
| 59 | 1940s Film Noir (`film-noir-1940s`) | Light & Imaging | yes | yes | yes | yes | High contrast, grain, gate weave, slow dolly, smoke beams. Minor: none beyond finishing. |
| 60 | Bioluminescent Deep Sea (`bioluminescent-deep-sea`) | Light & Imaging | yes | yes | yes | yes | Parallax marine snow, additive light, slow drift. Minor: a slow push toward each organism. |
| 61 | Golden Hour 35mm (`golden-hour-35mm`) | Light & Imaging | yes | - | yes | yes | Halation, grain, handheld drift, push-ins, light leaks. Minor: keep drift subtle on titles. |
| 79 | Tech Glow Explainer (`tech-glow`) | Popular Explainer Looks | yes | yes | yes | yes | Bloom, perspective grid, camera parallax, gradient headlines. Minor: DOF on background nodes. |
| 82 | Editorial Essay Collage (`editorial-collage`) | Popular Explainer Looks | yes | yes | yes | yes | Grainy paper, Ken Burns, soft shadows, Oswald + Merriweather. Minor: DOF on background clippings. |
| 83 | Product Launch Reveal (`product-launch`) | Popular Explainer Looks | yes | - | - | yes | Keynote lighting, rim light, specular, tight-tracked display. Minor: none beyond finishing. |

## Close (minor upgrades listed) — 35

| # | Style | Category | Grade cue | Depth cue | Camera cue | Named type | Notes |
|---|---|---|---|---|---|---|---|
| 4 | Charcoal Sketch (`charcoal-sketch`) | Hand-Drawn | yes | - | yes | yes | Has camera drift, toothy paper and gallery serif. Minor: add raking light grade on paper tooth, foreground smudge/dust occluder, slow push-ins on reveals. |
| 5 | Sumi Ink Brush (`sumi-ink-brush`) | Hand-Drawn | - | - | - | yes | Premium minimal look with elegant serif and stillness. Minor: add paper fibre grade and vignette, a slow overhead push-in, ink-bleed macro layer in foreground blur. |
| 8 | Watercolor Wash (`watercolor-wash`) | Painterly | yes | yes | - | yes | Has parallax paper layers and humanist serif. Minor: add a camera push-in per scene, light bloom on untouched paper whites, a foreground wash layer in blur. |
| 10 | Gouache Storybook (`gouache-storybook`) | Painterly | yes | yes | yes | yes | Has parallax background layers, warm light and Fraunces Soft. Missing: a deliberate grade/vignette, DOF between layers, camera moves beyond drift; cut-out motion is limited. Upgrades listed in the worked example. |
| 11 | Soft Pastel (`soft-pastel`) | Painterly | yes | - | yes | yes | Dreamy haze and slow drifts. Minor: add a camera push or float with parallax, a premium serif title pair (Quicksand alone is thin), highlight bloom. |
| 18 | Edo Woodblock (`edo-woodblock`) | Print | yes | yes | - | yes | Parallax waves and clouds, bokashi skies. Minor: eased camera pan with parallax, washi grain grade, refined serif title treatment. |
| 19 | Letterpress Type (`letterpress-type`) | Print | yes | yes | - | yes | Type is the hero with deboss shadow. Minor: raking light and macro DOF on the deboss, slider move across the sheet. |
| 20 | Shadow Puppet Theatre (`shadow-puppet`) | Paper & Craft | yes | - | - | yes | Amber-to-red falloff grade and depth via puppet distance (built-in DOF). Minor: add camera push-ins and a smoke/haze layer. |
| 22 | Claymation Stop-Motion (`claymation`) | Paper & Craft | yes | - | - | - | Warm practical lighting and tabletop set. Minor: add shallow DOF and eased camera moves (animation stays on twos), premium title pairing. |
| 24 | Origami Fold (`origami-fold`) | Paper & Craft | yes | yes | - | yes | 3D folds, faceted light, gradient sweep, Montserrat. Minor: add orbit camera and DOF, a stronger display face. |
| 27 | Illuminated Manuscript (`illuminated-manuscript`) | Illustration | yes | yes | - | yes | Moving specular on gold, candle-lit page turn. Minor: add camera push/tilt over the vellum and DOF on margins. |
| 30 | Anime Cel (`anime-cel`) | Illustration | yes | yes | yes | yes | Painted backgrounds, lens flares, held frames. Minor: replace camera shakes with eased multiplane moves, add DOF on backgrounds. |
| 31 | Ligne Claire Comic (`ligne-claire`) | Illustration | - | - | yes | - | Camera glides across panels. Minor: add a subtle paper grade and parallax inside panels, premium title pairing. |
| 33 | Botanical Plate (`botanical-plate`) | Illustration | - | - | yes | yes | Fine detail, classical pacing, italic labels. Minor: add a camera push and DOF across the plate, aged-paper grade. |
| 36 | Art Deco Gilded (`art-deco-gilded`) | Art & Design Movements | yes | - | - | - | Gold/black lacquer, symmetric reveals, deco display. Minor: add specular-sweep camera dolly and DOF on foreground frames. |
| 39 | Harlem Renaissance Silhouette (`harlem-renaissance`) | Art & Design Movements | yes | yes | - | yes | Tonal bands and concentric light rings, elegant serif. Minor: add camera push and atmosphere haze, credit-block layout. |
| 41 | 16-Bit RPG (`rpg-16bit`) | Retro Digital | yes | yes | - | yes | Parallax layers and typewriter dialog. Minor: add bloom/grade, eased camera pans, cinematic title card. |
| 47 | Synthwave Grid (`synthwave-grid`) | Retro UI & Neon | - | - | - | - | Neon grade, scrolling grid, glint titles. Minor: add haze, DOF on horizon and eased camera crane. |
| 48 | CRT Green Terminal (`crt-terminal`) | Retro UI & Neon | yes | - | - | - | Bloom, scanlines, barrel distortion. Minor: add room context and push-in, credit-block output. |
| 51 | Neon Sign Tubes (`neon-sign`) | Retro UI & Neon | yes | - | - | - | Glow halos on dark brick. Minor: add wet reflections/haze, camera dolly, DOF. |
| 52 | Cyberpunk HUD (`cyberpunk-hud`) | Retro UI & Neon | - | - | - | - | Rain-streaked city, glitches. Minor: add DOF behind HUD layers and eased camera, condensed title with light sweep. |
| 55 | Glass Layers (`glassmorphism`) | Dimensional | yes | yes | yes | yes | Backdrop blur, depth stacking. Minor: add eased camera through panels, light leak, premium display. |
| 57 | Exploded View Tech (`exploded-view`) | Dimensional | yes | - | - | yes | Specular metal on dark gradient. Minor: add orbit camera and DOF. |
| 58 | Tilt-Shift Miniature (`tilt-shift-miniature`) | Dimensional | - | yes | - | yes | Explicit DOF, saturated grade. Minor: add eased crane/tilt camera. |
| 64 | Long-Exposure Light Painting (`light-painting`) | Light & Imaging | yes | - | - | - | Luminous trails on dark landscapes. Minor: add eased camera and parallax landscape. |
| 67 | Editorial Data Graphics (`editorial-data`) | Data & Information | yes | - | - | yes | Premium serif + sans pairing, annotated charts. Minor: add paper grade, depth layers and camera glides. |
| 72 | Kinetic Typography (`kinetic-type`) | Generative & Type | - | yes | - | yes | Premium heavy type with extreme scale. Minor: add a grade/texture and 2.5D depth to words, motion blur on slams. |
| 73 | Particle Field (`particle-field`) | Generative & Type | yes | - | - | yes | Glowing particles on dark space. Minor: add DOF on near particles and eased camera. |
| 74 | Flow Field Lines (`flow-field`) | Generative & Type | yes | - | - | yes | Elegant palette and serif. Minor: add depth layers and eased camera. |
| 76 | Variable Font Morph (`variable-font-morph`) | Generative & Type | yes | - | - | - | Premium variable type with soft gradient light. Minor: add depth and camera. |
| 78 | Flat-Vector Science (`flat-vector-science`) | Popular Explainer Looks | yes | yes | yes | yes | Rich gradients, glows, zoom-through transitions. Minor: add DOF on foreground stars and eased camera. |
| 80 | Papercraft Models (`papercraft-models`) | Popular Explainer Looks | yes | - | - | - | Warm key light on a mat. Minor: add DOF and eased orbit. |
| 81 | Manim-Style Math (`manim-math`) | Popular Explainer Looks | yes | - | yes | yes | Crisp vectors, smooth zooms, CMU serif. Minor: add subtle grade/grain and depth. |
| 85 | Psychedelic Poster (`psychedelic-poster`) | Cosmic & Psychedelic | - | - | - | - | Vibrating colour pairs and melting type. Minor: add depth and eased camera. |
| 86 | Cosmic Nebula Mandala (`cosmic-mandala`) | Cosmic & Psychedelic | yes | - | yes | yes | Nebula drift, zoom through center. Minor: add DOF on star fields, eased camera. |

## Needs upgrade (what is missing) — 41

| # | Style | Category | Grade cue | Depth cue | Camera cue | Named type | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Whiteboard Marker (`whiteboard-marker`) | Hand-Drawn | yes | - | - | - | Flat single plane, no grade, no camera, marker-font only titles. Add: lit board as a physical set with sheen and vignette, defocused foreground marker/eraser occluder, slow push-ins on each finished diagram, a premium text face for captions. |
| 2 | Chalkboard Lecture (`chalkboard-lecture`) | Hand-Drawn | yes | yes | - | - | Flat board, no camera, no grade. Add: warm classroom grade, chalk dust in a light beam (D5), foreground ledge in focus pulling to the board, push-ins on key formulas, serif pairing for titles. |
| 3 | Notebook Doodle (`notebook-doodle`) | Hand-Drawn | yes | yes | - | - | Flat page, boil only, no grade or camera. Add: desk-top macro look with shallow DOF on page curl, warm lamp grade, pen as foreground occluder, slider move across the page. |
| 6 | Engineer's Notebook (`engineers-notebook`) | Hand-Drawn | - | - | yes | - | Flat pad, no camera or grade. Add: drafting-table set with lamp grade, ruler/pencil foreground occluders, dolly across the pad, mono+serif pairing with credit-block spec callouts. |
| 7 | Rotoscope Line Boil (`rotoscope-line`) | Hand-Drawn | yes | - | - | - | Flat field, stepped boil, no depth or grade. Add: two-tone paper grade, a parallax background plane, an eased camera between poses (boil stays stepped), bold title with letter boil + light sweep. |
| 13 | Spray-Paint Mural (`spray-mural`) | Painterly | - | - | yes | - | Strong look but: handheld sway (not smooth), no grade, no depth planes, chunky letters with no pairing. Upgrades listed in the worked example. |
| 14 | Halftone Pop Panel (`halftone-pop-panel`) | Print | yes | - | - | - | Flat comic panels, no camera or grade. Add: panels as a printed page in 2.5D, camera flying between panels, foreground panel occluders, extruded comic titles with halftone shadow. |
| 15 | Risograph Duotone (`risograph-duotone`) | Print | yes | yes | yes | yes | Flat print, no camera or depth. Add: print sheet lit on a table, layer separation in 2.5D, macro rack focus on grain, poster title lockup. |
| 16 | Linocut Relief (`linocut-relief`) | Print | yes | - | - | yes | Flat print. Add: carved block as a lit 3D surface with raking light, camera tilt across the block, ink sheen grade. |
| 17 | Screenprint Gig Poster (`screenprint-gig-poster`) | Print | yes | yes | - | - | Flat poster. Add: poster on a wall or press bed, 2.5D layer separation, push-in on headliner, credit-block lineup. |
| 23 | Felt & Fabric (`felt-fabric`) | Paper & Craft | - | - | - | - | Flat felt board, no camera or grade. Add: macro textile lighting, DOF on fibres, slider move, stitched title paired with a clean serif. |
| 25 | Cardboard Prototype (`cardboard-prototype`) | Paper & Craft | - | - | - | - | Workbench look but flat, no camera or grade. Add: workshop practical light, DOF on tools, dolly across the bench, title on tape with a clean sans pair. |
| 26 | Kente Patchwork (`kente-patchwork`) | Paper & Craft | yes | - | - | - | Pattern-led, flat, no camera. Add: macro fabric lighting with gold-thread specular, parallax bands, push-in, extruded display type. |
| 28 | Picture Book (`picture-book`) | Illustration | - | - | yes | yes | Warm look and pans but flat, no depth or grade. Add: layered 2.5D spreads, DOF, warm grade and vignette, page-turn with a light change. |
| 29 | Mid-Century Cartoon (`mid-century-cartoon`) | Illustration | - | - | - | yes | Flat limited animation. Add: textured backgrounds in parallax, film-print grade (soft grain, gate weave), eased camera between holds, title-card credit design. |
| 34 | Bauhaus Geometry (`bauhaus-geometry`) | Art & Design Movements | - | yes | - | yes | Flat shapes, mechanical easing, no grade or depth. Add: paper texture and print grade, shadows giving 2.5D depth, an eased camera, Jost paired with a heavy display. |
| 35 | Swiss International Grid (`swiss-grid`) | Art & Design Movements | - | - | - | yes | Strong type but deliberately flat, no camera or depth. Add: subtle paper/print grade, layered blocks with shadow depth, eased camera along grid lines. |
| 37 | Constructivist Poster (`constructivist-poster`) | Art & Design Movements | - | yes | yes | yes | Flat diagonals, slam-ins, camera tilts. Add: paper print grade, 2.5D photomontage layers, eased tilts, condensed titles with extrusion. |
| 38 | Memphis Pattern (`memphis-pattern`) | Art & Design Movements | - | yes | - | - | Flat, bouncy, no grade or depth. Add: soft studio shadows to make shapes physical, DOF, eased orbit, display + text pairing. |
| 40 | 8-Bit Pixel (`pixel-8bit`) | Retro Digital | - | - | - | - | Deliberately lo-fi; no grade, depth or camera. Add: frame inside a CRT/console set or with bloom, eased virtual camera, a cinematic serif for credits. |
| 42 | Vaporwave (`vaporwave`) | Retro Digital | yes | - | yes | yes | Pastel loops, VHS jitter. Add: deliberate grade, 2.5D depth on busts and windows, eased dolly, chrome title pairing. |
| 43 | Y2K Chrome (`y2k-chrome`) | Retro Digital | yes | - | - | - | Chrome blobs and glints, no camera or depth. Add: studio environment reflections, DOF, orbit camera, chrome bevel titles. |
| 44 | Early Web Homepage (`early-web`) | Retro Digital | - | - | - | - | Deliberately lo-fi UI. Add: screen in a dark room with glow spill, eased push into the monitor, cinematic grade. |
| 45 | Low-Poly PS1 (`lowpoly-ps1`) | Retro Digital | - | yes | yes | - | Lo-fi 3D with fog and orbit. Add: graded fog and colour, eased orbit, DOF, chunky bevel title with light sweep. |
| 46 | ASCII Art (`ascii-terminal`) | Retro Digital | - | - | - | - | Monospace only, flat. Add: phosphor bloom, depth layers of character planes, eased camera, mono + serif pairing. |
| 49 | Classic Desktop UI (`win95-ui`) | Retro UI & Neon | - | - | - | yes | Deliberately flat UI. Add: monitor-in-room framing, eased camera, grade, cinematic title. |
| 50 | Arcade Attract Mode (`arcade-attract`) | Retro UI & Neon | yes | - | - | - | Lo-fi blinking UI. Add: cabinet in a dark arcade with neon spill, eased push, bloom. |
| 53 | Isometric Pastel (`isometric-pastel`) | Dimensional | - | yes | yes | yes | Clean vector iso, flat shading. Add: soft GI shadows, tilt-shift DOF, eased orbit, display pairing. |
| 54 | Soft Clay 3D (`clay-3d-soft`) | Dimensional | yes | - | - | - | Soft 3D but no camera or DOF. Add: studio lighting grade, shallow DOF, orbit camera. |
| 56 | Voxel World (`voxel-world`) | Dimensional | - | yes | yes | - | Bright cubes, orbit. Add: graded lighting, DOF, eased orbit, display bevel title. |
| 62 | Thermal Infrared (`thermal-infrared`) | Light & Imaging | yes | - | - | - | Readout-led, flat. Add: depth via heat haze layers, eased camera, mono + condensed title. |
| 63 | X-Ray Lightbox (`xray-lightbox`) | Light & Imaging | yes | yes | - | - | Flat lightbox. Add: dark room with lightbox glow spill, DOF, slider move. |
| 65 | Cyanotype Darkroom (`cyanotype`) | Light & Imaging | - | - | - | - | Flat sheet. Add: darkroom grade, macro DOF, slider. |
| 66 | Market Terminal (`market-terminal`) | Data & Information | - | - | - | - | Dense flat UI. Add: dark trading-floor framing, DOF on non-focal panels, eased camera. |
| 68 | Transit Map Diagram (`transit-map`) | Data & Information | - | - | yes | yes | Flat schematic. Add: map as a lit print, 2.5D, eased camera following the train. |
| 69 | Icon Infographic (`icon-infographic`) | Data & Information | yes | - | - | yes | Flat icons and cards. Add: depth, soft shadows, grade, eased camera, display type. |
| 70 | Scientific Journal Figure (`journal-figure`) | Data & Information | - | - | - | yes | Restrained white academic. Add: subtle paper grade, DOF on panels, eased camera. |
| 71 | KPI Dashboard Motion (`kpi-dashboard`) | Data & Information | yes | - | yes | - | Dark dashboard, flat. Add: depth layers, glow grade, eased camera. |
| 75 | Generative Mosaic Grid (`mosaic-grid`) | Generative & Type | - | - | - | - | Flat grid. Add: tiles as lit 3D chips, DOF, eased camera. |
| 77 | Lyric Caption Karaoke (`lyric-karaoke`) | Generative & Type | yes | yes | - | yes | Functional lyric display. Add: graded footage/blurred background with depth, eased camera, premium type pairing. |
| 84 | Social Short Captions (`social-captions`) | Popular Explainer Looks | yes | - | yes | yes | Jump zooms and stickers; platform-native but not cinematic. Add: graded backgrounds, eased punch-ins with motion blur, premium caption pairing. |

Cue columns are keyword evidence found in the definition text; the grade is a judgment against the full standard.

## Engine and Audivid templates

| Template | Where | Grade | What is missing |
|---|---|---|---|
| engine/index.html (SSS Brain title starter) | /opt/swadebase/hyperframes-adapter/engine/index.html; identical copy (same md5) on swadebase-2 at /opt/sssbrain-brainiak-promo/ops/hyperframes/index.html | needs upgrade | 1920x1080 and eased GSAP (power3.out) are good, but: Georgia system font, flat #000 background, single plane, no grade, no camera move, plain fade+slide title. |
| pet-muzik-pop | /opt/swadebase/hyperframes-adapter/engine/pet-muzik-pop/index.html | needs upgrade | 960x540 (below 1080p), Arial for every level, emoji cow/chicken, linear ease:none on the animals, flat gradient sky, no DOF, no grade, no audio bed, 12 s at 24 fps. |
| pet-muzik-cartoon | /opt/swadebase/hyperframes-adapter/engine/pet-muzik-cartoon/index.html | needs upgrade | Same composition as pet-muzik-pop with a teal palette: 960x540, Arial, emoji animals, linear tweens, single-plane, no grade. |
| worker/template.mjs (zero-cost fallback composer) | /opt/swadebase/motion/worker/template.mjs | needs upgrade | Used whenever MOTION_COMPOSER_PROVIDER=template or the LLM fails: one font (Bricolage Grotesque), three blurred color bands, linear Ken Burns on start images (ease none), fade+slide titles, generic pulse ring. This is why many renders look straight-laced regardless of style. |
| Audivid: Equalizer Bars | abagale.audivid_templates (renderer audivid-eq.ts in SSS Brain) | needs upgrade | Canvas EQ at 1280x720/720x1280/1000x1000 (below 1080p), flat #050505 base, blurred cover backdrop, glow only, no camera or grade, single overlay font. |
| Audivid: Sine Wave | abagale.audivid_templates | needs upgrade | Same renderer limits; single line, no depth. |
| Audivid: Spectrum Ring | abagale.audivid_templates (style_type ring) | needs upgrade | See worked example: 720p, flat ring of strokes at radius 0.3, shadowBlur glow only, no camera, no grade, no depth beyond the blurred backdrop, plain text overlay. |
| Audivid: Minimal Pulse | abagale.audivid_templates (is_premium) | needs upgrade | Marked premium but renders through the same 720p canvas path with a microline waveform and glow; no grade or camera. |

## The three Harold asked about

- **Spray-Paint Mural**: needs upgrade. Strong look but: handheld sway (not smooth), no grade, no depth planes, chunky letters with no pairing. Upgrades listed in the worked example.
- **Gouache Storybook**: close. Has parallax background layers, warm light and Fraunces Soft. Missing: a deliberate grade/vignette, DOF between layers, camera moves beyond drift; cut-out motion is limited. Upgrades listed in the worked example.
- **Audivid Spectrum Ring**: needs upgrade. See worked example: 720p, flat ring of strokes at radius 0.3, shadowBlur glow only, no camera, no grade, no depth beyond the blurred backdrop, plain text overlay.
