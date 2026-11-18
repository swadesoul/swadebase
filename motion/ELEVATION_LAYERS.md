# Elevation Layers — per-style instruction blocks (proposal, 2026-10-28)

Status: **spec for Harold's approval, not wired in.** Auteur applies the block for the chosen style at the treatment and storyboard gates of every build, and QA checks it was applied (see `CREATIVE_DIRECTOR_PIPELINE.md`). Each block **elevates the style's existing look (its own palette, textures and motifs) to a higher production level; it never replaces the look.** Built once on SSS Brain / SWADEBASE and gated by the grant system, not copied per tier.

Proposed storage: this one file now; later one file per style at `motion/styles/elevation/<style-id>.md` and a table `motion_style_elevations` (see the pipeline doc section 9). Type styles (TS-xx) are defined in the pipeline doc section 6.

## Universal layer (applies to every block)

- Grade: named LUT/recipe per project, 5–15% vignette, moving grain 2–6%, highlight halation only where the style glows.
- Depth: foreground / midground / background in every scene; DOF blur 4–16px at 1080p; parallax 1.4 : 1.0 : 0.5.
- Camera: eased move per scene (no `ease:none` on camera or titles); push-in on hero and end card; motion blur on fast moves at high quality.
- Type: the mapped TS style for titles, lower thirds, credit block and end card; title-safe 90%.
- Finish: −14 LUFS, music-synced cuts, 1080p minimum, 24 or 30 fps, `--quality high`.

## Hand-Drawn

Category layer: Grade the surface warm and slightly lifted with a 10% vignette and moving paper grain; treat the board/paper as a lit physical set (background), the drawing as midground, and the drawing tool or hand as a defocused foreground occluder.

### 1. Whiteboard Marker (`whiteboard-marker`) — audit: needs upgrade

- Keep: palette #F6F7F5 #1B1D22 #1F4FD1 #D3302F #2E8B57; Glossy white dry-erase board with a faint cool ceiling-light sheen and the ghost of an erased lesson.
- Elevate: Shoot the board like a set: soft key from top-left, specular sheen that slides as the camera trucks, a blurred marker in the foreground, and a rack focus from the marker tip to the finished diagram.
- Type styles: TS-06 Hand-Craft Title, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Hand-lettered marker caps (Permanent Marker or Caveat Brush), slightly uneven baseline).
- Transitions: keep 'Eraser wipe: a soft white smear sweeps across, leaving a faint ghost of the previous diagram', add motion blur and a 2-frame light accent on the cut.

### 2. Chalkboard Lecture (`chalkboard-lecture`) — audit: needs upgrade

- Keep: palette #2F4A3A #F2F0E6 #F6E27A #F2A7B8 #9FD3F0; Slate-green chalkboard with layered dust smudges, half-erased formulas and a wooden ledge at the bottom.
- Elevate: Turn the board into a lit classroom: a shaft of window light with drifting chalk dust, the ledge as foreground, slow crane-down onto each diagram, chalk title written letter by letter with a dust puff.
- Type styles: TS-06 Hand-Craft Title, TS-03 Prestige Drama Serif (style font kept as the display face: Chalky rounded script for headings (Gochi Hand), small caps chalk print for labels).
- Transitions: keep 'Felt-eraser swipe in wide arcs that leaves cloudy residue', add motion blur and a 2-frame light accent on the cut.

### 3. Notebook Doodle (`notebook-doodle`) — audit: needs upgrade

- Keep: palette #FBFAF4 #1D3B8F #C8322F #9DB4D6 #E8C98A; Spiral notebook page on blue-ruled or graph paper with a red margin line, coffee ring stain and slight page curl shadow.
- Elevate: Treat the page as a macro tabletop: shallow focus band, warm desk-lamp grade, the pen sweeping through the foreground, page-curl shadow animated as the camera slides.
- Type styles: TS-06 Hand-Craft Title, TS-10 Storybook Rounded (style font kept as the display face: Neat student handwriting (Patrick Hand) with highlighter swipes behind key words).
- Transitions: keep 'Page flip with spiral-binding shadow, or tear-out reveal', add motion blur and a 2-frame light accent on the cut.

### 4. Charcoal Sketch (`charcoal-sketch`) — audit: close

- Keep: palette #EDE6D8 #111111 #4A4643 #8C857C #B9A88E; Heavy toothy cream paper, vine and compressed charcoal with smudged blending, finger-drag tonal areas and erased highlights.
- Elevate: Raking gallery light across the paper tooth, charcoal dust floating in the beam, slow push-in as each figure resolves; titles as sparse gallery labels with a soft light sweep.
- Type styles: TS-03 Prestige Drama Serif, TS-01 Trailer Serif (style font kept as the display face: Condensed serif in charcoal black (Playfair Display SC), set sparse like gallery labels).
- Transitions: keep 'Charcoal smear dissolve, or paper turns to the next sheet in the sketchbook', add motion blur and a 2-frame light accent on the cut.

### 5. Sumi Ink Brush (`sumi-ink-brush`) — audit: close

- Keep: palette #F3EEE2 #0E0E0E #5B5B5B #C1272D #D9CFBF; Rice paper with visible fibers; single confident black ink brush strokes with dry-brush splitting, wet bleeding edges and generous negative space.
- Elevate: Overhead macro camera that slowly pushes as each stroke lands, ink bleed shot as a shallow-focus foreground layer, vermilion seal stamped with a 2-frame impact and light flare.
- Type styles: TS-03 Prestige Drama Serif, TS-01 Trailer Serif (style font kept as the display face: Elegant high-contrast serif or brush script, very small, placed asymmetrically).
- Transitions: keep 'Ink drop spreads to fill the frame black, then recedes to reveal the next scene', add motion blur and a 2-frame light accent on the cut.

### 6. Engineer's Notebook (`engineers-notebook`) — audit: needs upgrade

- Keep: palette #F4F1E4 #2D2D2D #7FA88A #C0392B #5B6C8F; Cream engineering pad with faint green grid, mechanical pencil construction lines, dimension arrows, callout leaders and small annotations.
- Elevate: Drafting table at night: warm lamp pool, ruler and pencil as foreground occluders, dolly across the pad between sketches, dimension values in a precise mono with hairline credit-block callouts.
- Type styles: TS-09 Technical Mono HUD, TS-06 Hand-Craft Title (style font kept as the display face: Technical lettering in all caps (Architects Daughter or IBM Plex Mono for numbers)).
- Transitions: keep 'Pan across the pad to the next sketch; pencil eraser clears a region', add motion blur and a 2-frame light accent on the cut.

### 7. Rotoscope Line Boil (`rotoscope-line`) — audit: needs upgrade

- Keep: palette #F7F3EA #151515 #E4572E #29335C #F3A712; Flat off-white field with live, slightly trembling hand-inked contour lines around figures and objects (line boil).
- Elevate: Keep the boil stepped but move the camera smoothly: eased truck between poses, a soft paper background plane in parallax, spot-colour grade with grain.
- Type styles: TS-06 Hand-Craft Title, TS-12 Kinetic Variable (style font kept as the display face: Bold hand-drawn grotesque lettering that boils with the lines).
- Transitions: keep 'Lines unravel into a single scribble that redraws as the next scene', add motion blur and a 2-frame light accent on the cut.

## Painterly

Category layer: Film-emulation grade that protects the pigment palette, gentle halation on highlights, canvas/paper texture plane behind, painted midground, and blurred painted elements in the foreground; three-layer parallax.

### 8. Watercolor Wash (`watercolor-wash`) — audit: close

- Keep: palette #FAF7F0 #2B5D8A #E07A5F #81B29A #F2CC8F; Cold-press paper texture with transparent glazes built in many soft layers: darker dried edges, wet-in-wet bleeds, granulating pigment and blooms.
- Elevate: Paper lit like a fine-art print, slow push-in as each wash spreads, a blurred foreground wash drifting across, title in Cormorant with an ink-bleed letter reveal.
- Type styles: TS-03 Prestige Drama Serif, TS-01 Trailer Serif (style font kept as the display face: Light humanist serif (Cormorant Garamond) or delicate script, ink-colored).
- Transitions: keep 'A wet wash floods across and dries into the next composition', add motion blur and a 2-frame light accent on the cut.

### 9. Oil Impasto (`oil-impasto`) — audit: meets

- Keep: palette #2A1E17 #C8892B #7A2E1F #E9D7B4 #355C4A; Thick buttery oil paint with raking light catching ridges, palette-knife slabs and visible bristle tracks; rich chiaroscuro and warm varnish glow.
- Elevate: Museum-grade lighting: raking key with moving specular on ridges, dust motes in the beam, rack focus onto palette-knife texture, gold-leaf title with a slow light sweep.
- Type styles: TS-01 Trailer Serif, TS-11 Deco / Engraved Gold (style font kept as the display face: Classic old-style serif (EB Garamond) in gold leaf tone).
- Transitions: keep 'Knife-scrape wipe, or dissolve through wet paint smear', add motion blur and a 2-frame light accent on the cut.

### 10. Gouache Storybook (`gouache-storybook`) — audit: close

- Keep: palette #F3E9D2 #1E3D59 #F5B700 #E85D4A #5E9C76; Opaque matte gouache with flat chalky color, dry-brush texture at edges and simple rounded shapes; picture-book composition with cozy interiors and warm light.
- Elevate: See the worked example in CREATIVE_DIRECTOR_PIPELINE.md section 8.2.
- Type styles: TS-10 Storybook Rounded, TS-03 Prestige Drama Serif (style font kept as the display face: Friendly rounded serif (Fraunces Soft) set like a picture-book page).
- Transitions: keep 'Page turn or iris through a painted shape', add motion blur and a 2-frame light accent on the cut.

### 11. Soft Pastel (`soft-pastel`) — audit: close

- Keep: palette #E9E1F0 #7E6BAE #F4A6B7 #9AD0C2 #FFE3A3; Velvety chalk pastel on toned paper, blended gradients with visible paper tooth, dreamy haze and powder edges.
- Elevate: Floating camera through powdery haze planes, highlights blooming softly, title in a light serif paired with Quicksand captions, letters assembling from pastel powder.
- Type styles: TS-03 Prestige Drama Serif, TS-10 Storybook Rounded (style font kept as the display face: Airy thin sans (Quicksand Light) with generous tracking).
- Transitions: keep 'Powder cloud cross-dissolve', add motion blur and a 2-frame light accent on the cut.

### 12. Fresco Plaster (`fresco-plaster`) — audit: meets

- Keep: palette #E6D5B8 #A0522D #5C7457 #3B5B7A #C9A24B; Pigment soaked into cracked lime plaster with faded earth tones, chipped edges revealing brick beneath, and gilded halos.
- Elevate: Cathedral lighting with gentle torch flicker, dust in the air, dolly along the wall with a rack focus as each panel is uncovered; Cinzel carved titles catching a moving light.
- Type styles: TS-01 Trailer Serif, TS-11 Deco / Engraved Gold (style font kept as the display face: Roman inscriptional capitals (Cinzel) carved into the plaster).
- Transitions: keep 'Plaster flakes away to reveal the next panel', add motion blur and a 2-frame light accent on the cut.

### 13. Spray-Paint Mural (`spray-mural`) — audit: needs upgrade

- Keep: palette #3A3A3A #FF3D7F #00C2FF #FFE600 #7CFF4F; Brick or concrete wall with aerosol fades, overspray halos, drips, crisp stencil edges and bold outlines; sun-bleached posters peeking at edges.
- Elevate: See the worked example in CREATIVE_DIRECTOR_PIPELINE.md section 8.1.
- Type styles: TS-02 Condensed Blockbuster, TS-07 Comic Impact (style font kept as the display face: Wildstyle-inspired chunky letters for titles, stencil caps for labels).
- Transitions: keep 'Roller buff paints over the wall in a fresh color', add motion blur and a 2-frame light accent on the cut.

## Print

Category layer: Shoot the print as an object: soft key with a paper-curl shadow, ink-accurate grade (paper white is never #fff), layers lifting into 2.5D, and macro rack focus onto ink texture.

### 14. Halftone Pop Panel (`halftone-pop-panel`) — audit: needs upgrade

- Keep: palette #FFFFFF #111111 #E3262B #1D5BBF #FFD400; Blown-up comic panel: thick tapered black ink outlines, mechanical dot screens in primary red and blue, flat yellow fills, speech balloons and burst captions, slight misregistration.
- Elevate: Fly the camera through a 2.5D comic page: panels at different depths, gutter as foreground occluder, BAM titles extruded with halftone shadow and a light sweep.
- Type styles: TS-07 Comic Impact, TS-02 Condensed Blockbuster (style font kept as the display face: Comic lettering (Bangers) in balloons; caption boxes in yellow).
- Transitions: keep 'Panel-to-panel gutter slide or a big BAM burst wipe', add motion blur and a 2-frame light accent on the cut.

### 15. Risograph Duotone (`risograph-duotone`) — audit: needs upgrade

- Keep: palette #F5F1E8 #FF48B0 #0078BF #FFE800 #00A95C; Soy-ink riso print in two or three spot colors with grainy coverage, overprint blending, registration drift and paper speckle.
- Elevate: Shoot the riso sheet as an object: soft key, paper curl shadow, ink plates lifting into 2.5D layers, macro rack focus on grain.
- Type styles: TS-02 Condensed Blockbuster, TS-07 Comic Impact (style font kept as the display face: Chunky grotesk (Archivo Black) overprinted in a spot color).
- Transitions: keep 'Color plates separate and re-register into the next layout', add motion blur and a 2-frame light accent on the cut.

### 16. Linocut Relief (`linocut-relief`) — audit: needs upgrade

- Keep: palette #F2ECDD #121212 #B23A2E #D9C9A3 #3F5E5A; Bold carved relief print: white gouge marks, chunky black shapes, uneven ink coverage and paper texture showing through; one accent color pass.
- Elevate: Raking light across the carved block so gouges throw shadows, slow tilt across the surface, brayer roll as a foreground wipe, slab-serif titles stamped with extrusion.
- Type styles: TS-02 Condensed Blockbuster, TS-11 Deco / Engraved Gold (style font kept as the display face: Carved-looking slab serif with irregular edges).
- Transitions: keep 'Brayer roll inks the next block across the frame', add motion blur and a 2-frame light accent on the cut.

### 17. Screenprint Gig Poster (`screenprint-gig-poster`) — audit: needs upgrade

- Keep: palette #F1E9D2 #1A1A2E #FF6B35 #00A6A6 #F7C548; Hand-pulled screenprint with flat bold layers, slight ink texture, halftone gradients and a limited flashy palette on cream stock.
- Elevate: Poster on a print bed under a hanging lamp, ink layers separated in 2.5D, push-in to the headliner, lineup set as a film credit block.
- Type styles: TS-02 Condensed Blockbuster, TS-01 Trailer Serif (style font kept as the display face: Display condensed poster type (Bebas Neue) with stacked lineup hierarchy).
- Transitions: keep 'Squeegee pull reveals the next print', add motion blur and a 2-frame light accent on the cut.

### 18. Edo Woodblock (`edo-woodblock`) — audit: close

- Keep: palette #EFE6D2 #1F3A5F #D9534F #6E8B74 #E8B04B; Traditional woodblock print: keyline outlines, flat color blocks with wood-grain texture, bokashi gradient skies, stylized waves and clouds, washi paper.
- Elevate: Slow eased pan across the scroll with deep wave/cloud parallax, washi grain and soft vignette, titles as vertical cartouches with a brush-ink reveal.
- Type styles: TS-03 Prestige Drama Serif, TS-06 Hand-Craft Title (style font kept as the display face: Vertical cartouche labels; refined serif for English).
- Transitions: keep 'Scroll unrolls horizontally to the next scene', add motion blur and a 2-frame light accent on the cut.

### 19. Letterpress Type (`letterpress-type`) — audit: close

- Keep: palette #F4EFE6 #1C1C1C #B8352F #2F4E6E #CDBA96; Deep debossed metal and wood type on thick cotton paper, ink squeeze at edges, slight unevenness; ornaments and rules.
- Elevate: Macro slider across debossed type with a shallow focus band and raking light, ink sheen grade; titles pressed in with a micro-bounce and specular edge.
- Type styles: TS-03 Prestige Drama Serif, TS-11 Deco / Engraved Gold (style font kept as the display face: Wood-type display faces mixed with classic serif; type is the hero).
- Transitions: keep 'Platen press closes and opens on the next sheet', add motion blur and a 2-frame light accent on the cut.

## Paper & Craft

Category layer: Practical tabletop lighting (warm key, cool fill, contact shadows), shallow DOF on the set, and a motion-control slider/dolly feel even when the animation is stepped.

### 20. Shadow Puppet Theatre (`shadow-puppet`) — audit: close

- Keep: palette #2A0E06 #F2A33A #8E2C14 #000000 #3FA7A0; Black cut-out silhouettes with ornate punched cut-work, pin joints and thin control rods, pressed against a backlit cloth screen glowing amber at center and falling to deep red-brown at the edges; colored gel panels fill some openings.
- Elevate: Slow push-in on the screen, haze drifting in front of the lamp, puppets moving through focus as they approach the cloth; cut-out serif titles backlit with a lamp flicker.
- Type styles: TS-11 Deco / Engraved Gold, TS-01 Trailer Serif (style font kept as the display face: Ornamental serif in silhouette, cut out of the scenery).
- Transitions: keep 'Lamp flickers down and up, or a curtain silhouette sweeps across', add motion blur and a 2-frame light accent on the cut.

### 21. Layered Paper Diorama (`paper-diorama`) — audit: meets

- Keep: palette #FDF6EC #264653 #2A9D8F #E9C46A #E76F51; Stacked colored cardstock layers cut into landscapes and cities, real drop shadows between layers, soft top light and tiny paper details.
- Elevate: Miniature photography: dolly through cardstock layers with tilt-shift DOF, soft top light and contact shadows, paper-cut title with real thickness and a light sweep.
- Type styles: TS-10 Storybook Rounded, TS-02 Condensed Blockbuster (style font kept as the display face: Paper-cut letters with thickness and shadow (Rubik)).
- Transitions: keep 'Layers fold flat and unfold into the next scene', add motion blur and a 2-frame light accent on the cut.

### 22. Claymation Stop-Motion (`claymation`) — audit: close

- Keep: palette #EADFCB #D1495B #EDAE49 #00798C #30638E; Handmade plasticine characters with fingerprints, soft subsurface sheen and slightly imperfect shapes on a tabletop set; warm practical lighting.
- Elevate: Stop-motion set with shallow DOF and warm practicals; camera moves smoothly on a motion-control feel while characters stay on twos; clay title with fingerprint texture and studio key light.
- Type styles: TS-10 Storybook Rounded, TS-02 Condensed Blockbuster (style font kept as the display face: Clay-rolled chunky letters).
- Transitions: keep 'Clay squish morph from one shape into the next', add motion blur and a 2-frame light accent on the cut.

### 23. Felt & Fabric (`felt-fabric`) — audit: needs upgrade

- Keep: palette #E9E4D8 #C44536 #197278 #EDDDD4 #283D3B; Felt shapes with fuzzy edges, visible blanket stitching, buttons, yarn lines and denim or corduroy backgrounds.
- Elevate: Macro textile shoot: soft side light making fuzz glow, shallow focus on fibres, slider move across the board, embroidered titles stitched on with a clean serif subtitle.
- Type styles: TS-10 Storybook Rounded, TS-06 Hand-Craft Title (style font kept as the display face: Stitched or embroidered lettering).
- Transitions: keep 'Fabric curtain pull or zipper reveal', add motion blur and a 2-frame light accent on the cut.

### 24. Origami Fold (`origami-fold`) — audit: close

- Keep: palette #F7F7F2 #E63946 #457B9D #1D3557 #F1C453; Crisp folded paper forms with sharp creases, faceted light and shadow, subtle paper fiber, on a clean gradient sweep.
- Elevate: Studio product lighting on paper: orbit camera around each fold, shallow DOF, soft gradient sweep with grain; titles fold up letter by letter.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-10 Storybook Rounded (style font kept as the display face: Geometric sans (Montserrat) with folded-corner accents).
- Transitions: keep 'The frame folds into a paper crane that flies off, revealing the next scene', add motion blur and a 2-frame light accent on the cut.

### 25. Cardboard Prototype (`cardboard-prototype`) — audit: needs upgrade

- Keep: palette #C9A57A #3B2F2F #F4E9D8 #2E86AB #F18F01; Corrugated cardboard cut-outs, masking tape, marker labels, hot-glue blobs and box-cutter edges on a workbench.
- Elevate: Workshop at golden hour: practical light, tools as foreground occluders, dolly along the bench, titles on tape strips with a clean grotesk credit block.
- Type styles: TS-06 Hand-Craft Title, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Thick marker labels on tape strips).
- Transitions: keep 'Box flaps open into the next scene', add motion blur and a 2-frame light accent on the cut.

### 26. Kente Patchwork (`kente-patchwork`) — audit: needs upgrade

- Keep: palette #1B1B1B #F2B705 #D93D04 #0F7B3E #2448A8; Woven strip textiles with bold geometric blocks, gold thread sheen, wax-print patterns and quilt seams; fabric weave visible up close.
- Elevate: Macro weave with gold-thread specular glints, woven bands in parallax depth, slow push-in, Syne titles extruded like woven bands with a gold light sweep.
- Type styles: TS-02 Condensed Blockbuster, TS-11 Deco / Engraved Gold (style font kept as the display face: Strong geometric display type (Syne ExtraBold) on woven bands).
- Transitions: keep 'A woven band sweeps across and unravels into the next scene', add motion blur and a 2-frame light accent on the cut.

## Illustration

Category layer: Multiplane illustration: background plate softly defocused, character layer sharp, foreground props or particles in blur; print or film grain and a style-matched grade.

### 27. Illuminated Manuscript (`illuminated-manuscript`) — audit: close

- Keep: palette #EADCC0 #2B1B12 #B3261E #1F3C88 #C9A227; Book-of-hours page on mottled vellum with ruling lines, blackletter text in iron-gall ink with red headings, a large decorated initial on raised burnished gold, lapis and malachite pigments with white filigree, vine borders and whimsical margin creatures.
- Elevate: Candle-lit scriptorium: flickering warm key, slow tilt down the page, rack focus from margin creature to initial, burnished gold title with a moving specular.
- Type styles: TS-11 Deco / Engraved Gold, TS-01 Trailer Serif (style font kept as the display face: Blackletter (UnifrakturMaguntia) for headings; humanist serif for readable body).
- Transitions: keep 'Turn of the vellum page with a candle-lit shadow', add motion blur and a 2-frame light accent on the cut.

### 28. Picture Book (`picture-book`) — audit: needs upgrade

- Keep: palette #FFF4E0 #3D405B #E07A5F #81B29A #F2CC8F; Warm children's book illustration with soft colored pencil over flat color, expressive round characters, cozy rooms and gentle textures.
- Elevate: Spreads separated into 2.5D layers with soft DOF, warm lamp grade, camera gliding into the scene, read-along words highlighted in a rounded serif with soft emboss.
- Type styles: TS-10 Storybook Rounded, TS-03 Prestige Drama Serif (style font kept as the display face: Round friendly serif (Baloo 2), big and readable).
- Transitions: keep 'Turn the page', add motion blur and a 2-frame light accent on the cut.

### 29. Mid-Century Cartoon (`mid-century-cartoon`) — audit: needs upgrade

- Keep: palette #F2E8CF #386641 #BC4749 #F2A541 #1B263B; 1950s limited animation: angular stylized characters, flat offset color blocks that miss the lines, atomic starbursts, boomerang shapes and textured backgrounds.
- Elevate: 1950s theatrical cartoon finish: film-print grain and slight gate weave, multiplane background parallax, opening title card in jaunty script with a credit block.
- Type styles: TS-06 Hand-Craft Title, TS-01 Trailer Serif (style font kept as the display face: Jaunty mid-century script and condensed sans (Lobster + Oswald)).
- Transitions: keep 'Starburst iris or color-field wipe', add motion blur and a 2-frame light accent on the cut.

### 30. Anime Cel (`anime-cel`) — audit: close

- Keep: palette #DCEBFF #1E2A78 #FF4E50 #FCE38A #2EC4B6; Clean cel-shaded characters with two-tone shadows, sharp highlights, detailed painted backgrounds, speed lines and lens flares.
- Elevate: Multiplane camera with painted background in soft focus, eased pans and push-ins, impact frames kept short; bold italic title with light sweep and outline glow.
- Type styles: TS-12 Kinetic Variable, TS-02 Condensed Blockbuster (style font kept as the display face: Bold italic sans with outline stroke for impact titles).
- Transitions: keep 'White flash or diagonal slash wipe', add motion blur and a 2-frame light accent on the cut.

### 31. Ligne Claire Comic (`ligne-claire`) — audit: close

- Keep: palette #FFFFFF #101820 #F2AA4C #4B88A2 #D7263D; Clear-line European comic style: uniform thin black outlines, flat bright colors, no hatching, precise backgrounds and readable panels.
- Elevate: Camera glides across the album page with subtle paper grade and grain, characters on a parallax layer inside each panel, clean caps title with a credit block.
- Type styles: TS-06 Hand-Craft Title, TS-03 Prestige Drama Serif (style font kept as the display face: Clean hand-lettered comic caps).
- Transitions: keep 'Camera glides across the gutter into the next panel', add motion blur and a 2-frame light accent on the cut.

### 32. Afrofuturist Illustration (`afrofuturist-illustration`) — audit: meets

- Keep: palette #0B0C2A #C89B3C #5B2A86 #00B3A4 #F25F5C; Regal Black characters in luminous future attire, adinkra and geometric motifs as technology, gold and indigo gradients, cosmic skies and sleek architecture.
- Elevate: Heroic low-angle push-ins, gold particles in foreground blur, volumetric light through the portal, gold-gradient titles with letter-by-letter light-up.
- Type styles: TS-11 Deco / Engraved Gold, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Futuristic geometric display (Orbitron or Syncopate) with gold gradients).
- Transitions: keep 'Geometric portal opens with gold light', add motion blur and a 2-frame light accent on the cut.

### 33. Botanical Plate (`botanical-plate`) — audit: close

- Keep: palette #F3EBDD #2F3A2F #7A9E7E #B5838D #C8A96A; Victorian scientific illustration: fine engraved line, delicate watercolor tint, specimen labels, Latin captions and numbered parts on aged paper.
- Elevate: Specimen plate shot macro: aged paper grade, slow push with shallow focus moving across numbered parts, labels in italic serif with an engraved reveal.
- Type styles: TS-03 Prestige Drama Serif, TS-01 Trailer Serif (style font kept as the display face: Small italic serif labels; numbered callouts).
- Transitions: keep 'Pan to the next plate in the folio', add motion blur and a 2-frame light accent on the cut.

## Art & Design Movements

Category layer: Make the graphic language physical: paper/print grain, soft shadows that lift shapes into 2.5D, and eased camera moves that respect the movement's geometry.

### 34. Bauhaus Geometry (`bauhaus-geometry`) — audit: needs upgrade

- Keep: palette #F2EFE6 #111111 #E1251B #0057B8 #FFC20E; Primary-color circles, squares and triangles on off-white, strong diagonals, thick black bars and functional asymmetric balance.
- Elevate: Shapes as physical paper cut-outs with soft shadows, print grain, eased camera rotations in 90-degree steps, Jost titles with mask wipes.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-12 Kinetic Variable (style font kept as the display face: Geometric sans (Futura-like: Jost) lowercase, rotated 90° in places).
- Transitions: keep 'Shapes recompose into the next layout', add motion blur and a 2-frame light accent on the cut.

### 35. Swiss International Grid (`swiss-grid`) — audit: needs upgrade

- Keep: palette #FFFFFF #000000 #E30613 #D9D9D9 #7F7F7F; Strict modular grid, huge flush-left sans type, generous white space, a single red accent and objective photography crops.
- Elevate: Keep the grid strict but give it air: print grain, blocks lifting into 2.5D with soft shadows, eased camera sliding along grid lines, extreme-scale type with mask reveals.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-12 Kinetic Variable (style font kept as the display face: Neo-grotesk (Inter Tight or Helvetica-like) at extreme scale contrast).
- Transitions: keep 'Grid columns wipe across', add motion blur and a 2-frame light accent on the cut.

### 36. Art Deco Gilded (`art-deco-gilded`) — audit: close

- Keep: palette #0D0D0D #D4AF37 #F5E6C4 #1F4E5F #8C1C13; Black lacquer and champagne gold, sunbursts, stepped ziggurat frames, fan motifs, marble and chrome; 1920s glamour.
- Elevate: Lacquer-and-gold title sequence: dolly through stepped frames as foreground occluders, moving specular on gold, Limelight titles with engraved bevel and light sweep.
- Type styles: TS-11 Deco / Engraved Gold, TS-01 Trailer Serif (style font kept as the display face: Deco display (Poiret One or Limelight) with wide tracking).
- Transitions: keep 'Fan opens or deco doors part', add motion blur and a 2-frame light accent on the cut.

### 37. Constructivist Poster (`constructivist-poster`) — audit: needs upgrade

- Keep: palette #EFE6D0 #C1121F #000000 #7D7D7D #F4D35E; Bold diagonals, red and black on cream, photomontage cutouts, megaphone graphics, arrows and blocky type.
- Elevate: Photomontage in 2.5D with print grain, eased diagonal camera tilts, type blocks punching forward with motion blur and extrusion.
- Type styles: TS-02 Condensed Blockbuster, TS-07 Comic Impact (style font kept as the display face: Heavy condensed sans in diagonal stacks).
- Transitions: keep 'Diagonal block slices', add motion blur and a 2-frame light accent on the cut.

### 38. Memphis Pattern (`memphis-pattern`) — audit: needs upgrade

- Keep: palette #FFF5E1 #FF6F91 #00C9A7 #FFC75F #845EC2; 1980s Memphis design: squiggles, confetti dots, terrazzo, zigzags and pastel plus neon shapes with thick black outlines.
- Elevate: Make Memphis tangible: shapes as glossy objects with soft shadows and DOF, eased orbit camera, confetti as foreground blur, titles with drop-shadow extrusion.
- Type styles: TS-07 Comic Impact, TS-12 Kinetic Variable (style font kept as the display face: Playful geometric display with drop shadows).
- Transitions: keep 'Confetti burst or squiggle wipe', add motion blur and a 2-frame light accent on the cut.

### 39. Harlem Renaissance Silhouette (`harlem-renaissance`) — audit: close

- Keep: palette #2E1F3E #C49A6C #7D5BA6 #E3C27A #5A3E36; Layered silhouetted figures in concentric light rings, cubist geometry, muted violet, sienna and gold tonal bands; jazz, labor and uplift themes.
- Elevate: Concentric light rings with haze, silhouettes in layered depth, slow push-in, deco serif titles set as an opening credit block.
- Type styles: TS-11 Deco / Engraved Gold, TS-03 Prestige Drama Serif (style font kept as the display face: Elegant deco-influenced serif).
- Transitions: keep 'Rings expand to fill the frame with the next tone', add motion blur and a 2-frame light accent on the cut.

## Retro Digital

Category layer: Frame the retro screen cinematically (a monitor in a dark room with glow spill, or full-screen with tasteful bloom); pixels stay crisp, the virtual camera moves with eased pushes and parallax.

### 40. 8-Bit Pixel (`pixel-8bit`) — audit: needs upgrade

- Keep: palette #0F0F1B #E43B44 #F7D51D #3E8948 #5FCDE4; Low-res pixel art on a limited NES-like palette, chunky sprites, tile maps, scanline-free crisp pixels (image-rendering: pixelated).
- Elevate: Frame the pixels cinematically: subtle CRT bloom and vignette, eased camera over the tile map, parallax layers, pixel title with glow plus a cinematic credit block.
- Type styles: TS-13 Pixel Prestige, TS-01 Trailer Serif (style font kept as the display face: Pixel font (Press Start 2P)).
- Transitions: keep 'Pixel dissolve or screen-wipe like a level change', add motion blur and a 2-frame light accent on the cut.

### 41. 16-Bit RPG (`rpg-16bit`) — audit: close

- Keep: palette #101935 #2F5D9F #F5E6A8 #6AAA64 #C94F4F; Lush 16-bit pixel landscapes with parallax layers, dialog boxes with blue gradients, menu cursors and stat bars.
- Elevate: Parallax world with warm bloom grade and eased pans, dialog in pixel serif, an opening title card in prestige style.
- Type styles: TS-13 Pixel Prestige, TS-01 Trailer Serif (style font kept as the display face: Pixel serif dialog font; typewriter text reveal).
- Transitions: keep 'Battle-swirl or mosaic transition', add motion blur and a 2-frame light accent on the cut.

### 42. Vaporwave (`vaporwave`) — audit: needs upgrade

- Keep: palette #FFB3DE #7AF7FF #B967FF #05FFA1 #FFFB96; Pastel pink and teal gradients, marble busts, palm trees, checkerboard floors, old OS windows, Japanese katakana accents and VHS tracking.
- Elevate: Dreamlike dolly through floating windows and busts with soft DOF, pastel grade with tape grain, chrome titles with glow sweep.
- Type styles: TS-08 Retro Chrome Bevel, TS-05 Emissive Neon (style font kept as the display face: Wide serif or chrome italic with glow).
- Transitions: keep 'VHS rewind glitch', add motion blur and a 2-frame light accent on the cut.

### 43. Y2K Chrome (`y2k-chrome`) — audit: needs upgrade

- Keep: palette #0A0A12 #C0C0C8 #7DF9FF #FF4FD8 #B8FF3D; Liquid chrome blobs, iridescent bubbles, futuristic gloss, stars and tribal swooshes, lens flares, translucent plastic.
- Elevate: Chrome product-shoot finish: environment reflections, orbit camera with DOF, glint sweeps timed to hats, bevelled chrome titles.
- Type styles: TS-08 Retro Chrome Bevel, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Chrome-beveled futuristic type with sparkle glints).
- Transitions: keep 'Chrome splash wipe', add motion blur and a 2-frame light accent on the cut.

### 44. Early Web Homepage (`early-web`) — audit: needs upgrade

- Keep: palette #000080 #FFFF00 #00FF00 #FF00FF #C0C0C0; 1990s personal homepage: tiled starfield backgrounds, under-construction gifs, hit counters, beveled buttons, marquee text and web-safe colors.
- Elevate: Shoot the homepage on a monitor in a dark bedroom: screen-glow spill, push-in through the bezel, scanline-free crisp UI, then cinematic credit card.
- Type styles: TS-13 Pixel Prestige, TS-01 Trailer Serif (style font kept as the display face: Times and Comic-style system fonts, blinking text).
- Transitions: keep 'Page loads line by line like a slow modem', add motion blur and a 2-frame light accent on the cut.

### 45. Low-Poly PS1 (`lowpoly-ps1`) — audit: needs upgrade

- Keep: palette #1C1C24 #6D597A #B56576 #E56B6F #EAAC8B; Late-90s console 3D: low polygon models, wobbly affine textures, vertex jitter, fog and dithering.
- Elevate: Moody graded fog, eased orbit, subtle DOF, chunky bevelled title with a light sweep.
- Type styles: TS-08 Retro Chrome Bevel, TS-13 Pixel Prestige (style font kept as the display face: Chunky beveled title text).
- Transitions: keep 'Loading-screen fade with spinning icon', add motion blur and a 2-frame light accent on the cut.

### 46. ASCII Art (`ascii-terminal`) — audit: needs upgrade

- Keep: palette #000000 #E5E5E5 #00FF66 #FF5F56 #27C93F; Images built from monospaced characters on black; density ramps form shading; occasional color ANSI accents.
- Elevate: Layer character planes at depth with soft focus, phosphor bloom, eased camera through the planes, decode reveal of titles.
- Type styles: TS-09 Technical Mono HUD, TS-13 Pixel Prestige (style font kept as the display face: Monospace (JetBrains Mono)).
- Transitions: keep 'Character rain clears the screen', add motion blur and a 2-frame light accent on the cut.

## Retro UI & Neon

Category layer: Bloom on emissive elements, haze, wet reflections and a dark graded environment; HUD and UI layers sit at different depths with the far ones defocused.

### 47. Synthwave Grid (`synthwave-grid`) — audit: close

- Keep: palette #12002B #FF2A6D #05D9E8 #D1F7FF #7700A6; Magenta-to-purple sunset with a striped sun, neon wireframe grid floor racing toward the horizon, chrome text and star fields.
- Elevate: Crane over the neon grid with haze and horizon DOF, chrome titles with neon outline and light sweep.
- Type styles: TS-08 Retro Chrome Bevel, TS-05 Emissive Neon (style font kept as the display face: Chrome italic display with neon outline (Monoton or Audiowide)).
- Transitions: keep 'Neon flash and grid warp', add motion blur and a 2-frame light accent on the cut.

### 48. CRT Green Terminal (`crt-terminal`) — audit: close

- Keep: palette #031A09 #33FF66 #0B3D1C #A6FFB8 #FFB000; Curved phosphor screen with green text, scanlines, bloom, slight barrel distortion and flicker.
- Elevate: Push into the glowing CRT in a dark room, reflections on the glass, typed output as a credit block.
- Type styles: TS-09 Technical Mono HUD, TS-13 Pixel Prestige (style font kept as the display face: VT323 monospace).
- Transitions: keep 'CRT power-off collapse to a line, then on', add motion blur and a 2-frame light accent on the cut.

### 49. Classic Desktop UI (`win95-ui`) — audit: needs upgrade

- Keep: palette #008080 #C0C0C0 #000080 #FFFFFF #000000; Mid-90s desktop: teal background, gray beveled windows, title bars, error dialogs, hourglass cursor and pixel icons.
- Elevate: Monitor-in-room framing with glow spill, eased push to the dialog, crisp UI, then a cinematic end card.
- Type styles: TS-13 Pixel Prestige, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Pixel system sans).
- Transitions: keep 'Window minimize to taskbar', add motion blur and a 2-frame light accent on the cut.

### 50. Arcade Attract Mode (`arcade-attract`) — audit: needs upgrade

- Keep: palette #000000 #FF0055 #00E5FF #FFE600 #7CFF00; Arcade cabinet bezel art, blinking INSERT COIN, high-score tables, vector-glow graphics and starbursts.
- Elevate: Dark arcade with neon spill, slow push into the cabinet screen, vector glow bloom, high-score credit block.
- Type styles: TS-13 Pixel Prestige, TS-05 Emissive Neon (style font kept as the display face: Arcade pixel and vector fonts).
- Transitions: keep 'Coin drop flash', add motion blur and a 2-frame light accent on the cut.

### 51. Neon Sign Tubes (`neon-sign`) — audit: close

- Keep: palette #0E0B10 #FF3CAC #2B86C5 #F9F871 #7FFF00; Bent glass neon tubes on a dark brick wall, glow halos, mounting clips, wiring and a buzzing flicker.
- Elevate: Rainy alley: wet brick reflections, haze, dolly past the sign with foreground bokeh, neon script titles igniting letter by letter.
- Type styles: TS-05 Emissive Neon, TS-02 Condensed Blockbuster (style font kept as the display face: Neon script and monoline type).
- Transitions: keep 'Lights out, next sign flickers on', add motion blur and a 2-frame light accent on the cut.

### 52. Cyberpunk HUD (`cyberpunk-hud`) — audit: close

- Keep: palette #05070F #00F0FF #FF2E88 #F4F4F4 #FFB800; Holographic heads-up display: scanning reticles, data readouts, corner brackets, glitch artifacts, cyan and magenta on dark rain-streaked city.
- Elevate: HUD layers at depth over a defocused rain city, eased push, glitch kept short, condensed title with light sweep.
- Type styles: TS-09 Technical Mono HUD, TS-02 Condensed Blockbuster (style font kept as the display face: Technical condensed mono (Rajdhani / Share Tech Mono)).
- Transitions: keep 'Digital glitch tear', add motion blur and a 2-frame light accent on the cut.

## Dimensional

Category layer: Studio 3D finish: soft global light with ambient occlusion and rim light, shallow DOF, and eased orbit or crane moves.

### 53. Isometric Pastel (`isometric-pastel`) — audit: needs upgrade

- Keep: palette #F4F1FB #A8B5E0 #B8E0D2 #FFD6A5 #FF7A6B; Clean vector isometric scene in true 30° projection: three-tone flat face shading, soft pastel palette with one coral accent, tiny people for scale and long soft shadows on a floating tile.
- Elevate: Treat the tile like a miniature: tilt-shift DOF, soft long shadows, eased orbit camera, titles on iso planes with bevel.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-10 Storybook Rounded (style font kept as the display face: Rounded geometric sans (Nunito), labels on isometric planes).
- Transitions: keep 'Camera rotates around the tile or tiles connect into a bigger world', add motion blur and a 2-frame light accent on the cut.

### 54. Soft Clay 3D (`clay-3d-soft`) — audit: needs upgrade

- Keep: palette #F2F0FF #7C83FD #96BAFF #FFB6B9 #FAE3D9; Matte soft-plastic 3D renders with rounded edges, pastel ambient occlusion, gentle studio lighting and toy-like proportions.
- Elevate: Studio toy-shoot: soft key and rim, shallow DOF, eased orbit, puffy titles with soft bevel and light sweep.
- Type styles: TS-10 Storybook Rounded, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Puffy rounded display type).
- Transitions: keep 'Objects squish into each other', add motion blur and a 2-frame light accent on the cut.

### 55. Glass Layers (`glassmorphism`) — audit: close

- Keep: palette #0F1226 #6A5CFF #FF6AD5 #38F9D7 #FFFFFF; Frosted glass panels with backdrop blur floating over vivid gradient blobs, thin white borders, soft shadows and depth stacking.
- Elevate: Camera floats between glass panels at depth, light leaks through the frost, Manrope paired with a display face with mask reveals.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-12 Kinetic Variable (style font kept as the display face: Modern sans (Manrope), white with subtle shadow).
- Transitions: keep 'Panels stack and slide off', add motion blur and a 2-frame light accent on the cut.

### 56. Voxel World (`voxel-world`) — audit: needs upgrade

- Keep: palette #87CEEB #5DAE4F #8B5A2B #F4D35E #EE6C4D; Cube-built 3D worlds with bright colors, chunky shadows and tiny voxel characters.
- Elevate: Graded golden-hour light on voxels, DOF, eased orbit, blocky title with bevel and light sweep.
- Type styles: TS-08 Retro Chrome Bevel, TS-10 Storybook Rounded (style font kept as the display face: Blocky pixel 3D lettering).
- Transitions: keep 'World crumbles into cubes and rebuilds', add motion blur and a 2-frame light accent on the cut.

### 57. Exploded View Tech (`exploded-view`) — audit: close

- Keep: palette #0B0D12 #C9D1D9 #3FB8FF #FFFFFF #FF6B00; Precise 3D exploded product diagram on dark gradient: components separated along an axis with thin callout lines, specular metal and glass.
- Elevate: Orbit the exploded product with shallow DOF, specular sweeps, hairline callouts as credit blocks.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-09 Technical Mono HUD (style font kept as the display face: Technical sans with hairline callouts).
- Transitions: keep 'Parts fly to form the next object', add motion blur and a 2-frame light accent on the cut.

### 58. Tilt-Shift Miniature (`tilt-shift-miniature`) — audit: close

- Keep: palette #DDE8F0 #2E7D32 #F9A825 #C62828 #1565C0; Real-world scenes rendered like tiny models: strong depth-of-field blur bands, saturated colors, high viewpoint.
- Elevate: Eased crane over the miniature with moving focus band, saturated grade, pin-marker titles.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-10 Storybook Rounded (style font kept as the display face: Clean bold sans labels with pin markers).
- Transitions: keep 'Focus pull to the next location', add motion blur and a 2-frame light accent on the cut.

## Light & Imaging

Category layer: Already photographic; protect the look, add atmosphere and motivated camera, and keep the grade consistent per act.

### 59. 1940s Film Noir (`film-noir-1940s`) — audit: meets

- Keep: palette #050505 #F2F2F2 #7A7A7A #2B2B2B #BDBDBD; High-contrast black-and-white: venetian-blind light slats, a fedora silhouette, a single practical light source, smoke hanging in beams, heavy film grain, gate weave, dust and scratches.
- Elevate: Keep everything; add a credit-block title sequence with slow light sweep through smoke.
- Type styles: TS-01 Trailer Serif, TS-03 Prestige Drama Serif (style font kept as the display face: Bold condensed serif title cards with drop shadow).
- Transitions: keep 'Iris out or hard cut with a flash of light', add motion blur and a 2-frame light accent on the cut.

### 60. Bioluminescent Deep Sea (`bioluminescent-deep-sea`) — audit: meets

- Keep: palette #01040A #00E5FF #14FFC8 #3D5AFE #FF3D9A; Near-black ocean with drifting marine snow in parallax; the only light is living light: glowing jellyfish nerve nets, siphonophore chains, rainbow comb rows, an angler lure.
- Elevate: Slow push toward each organism through foreground marine snow, rack focus between creatures, glowing titles pulsing with the light.
- Type styles: TS-05 Emissive Neon, TS-01 Trailer Serif (style font kept as the display face: Thin glowing sans that pulses like the creatures (Exo 2 Light)).
- Transitions: keep 'Darkness swallows, then a new organism lights up', add motion blur and a 2-frame light accent on the cut.

### 61. Golden Hour 35mm (`golden-hour-35mm`) — audit: meets

- Keep: palette #2B1D14 #F4A259 #F7E1B5 #8C5E3C #5B8E7D; Warm 35mm film look: halation around highlights, soft grain, lifted blacks, lens flare and sun-drenched backlight.
- Elevate: Keep the look; stabilise the camera during titles, light-leak burns on chorus, italic serif lower thirds.
- Type styles: TS-03 Prestige Drama Serif, TS-01 Trailer Serif (style font kept as the display face: Light serif lower thirds (Libre Baskerville Italic)).
- Transitions: keep 'Light leak burn', add motion blur and a 2-frame light accent on the cut.

### 62. Thermal Infrared (`thermal-infrared`) — audit: needs upgrade

- Keep: palette #0A0014 #5A0A7A #E0472B #FFB000 #FFFFFF; False-color thermal imaging: iron palette from black-purple through orange to white-hot, temperature readouts and crosshair overlays.
- Elevate: Heat-haze depth layers, eased push, crosshair as foreground occluder, decode titles.
- Type styles: TS-09 Technical Mono HUD, TS-02 Condensed Blockbuster (style font kept as the display face: Mono readout text with temperature units).
- Transitions: keep 'Palette shift sweep', add motion blur and a 2-frame light accent on the cut.

### 63. X-Ray Lightbox (`xray-lightbox`) — audit: needs upgrade

- Keep: palette #04121C #BFE9FF #5FA8D3 #FFFFFF #FF4D4D; Glowing blue-white radiograph films clipped to a lightbox, translucent internal structures, labels and grease-pencil marks.
- Elevate: Dark exam room, lightbox spill, slider move across films with shallow DOF, clinical credit block.
- Type styles: TS-09 Technical Mono HUD, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Clinical mono labels).
- Transitions: keep 'Lightbox flicker to the next film', add motion blur and a 2-frame light accent on the cut.

### 64. Long-Exposure Light Painting (`light-painting`) — audit: close

- Keep: palette #03030A #FFDD00 #00D4FF #FF2E63 #FFFFFF; Night scene with luminous light trails drawn through the air, sparks, star trails and glowing ribbons over dark landscapes.
- Elevate: Eased camera over a parallax night landscape, trails blooming, title written as a light trail.
- Type styles: TS-05 Emissive Neon, TS-01 Trailer Serif (style font kept as the display face: Light-trail script that writes itself).
- Transitions: keep 'Trail sweeps the frame to reveal the next', add motion blur and a 2-frame light accent on the cut.

### 65. Cyanotype Darkroom (`cyanotype`) — audit: needs upgrade

- Keep: palette #0B3C74 #F2F5F7 #1D5FA8 #8FB8DE #E8E1D0; Prussian-blue sun prints with white botanical and object silhouettes, brush-edge coating and paper texture.
- Elevate: Darkroom macro: wet sheet with sheen, shallow focus, slider move as prints develop, typewriter labels.
- Type styles: TS-03 Prestige Drama Serif, TS-09 Technical Mono HUD (style font kept as the display face: Typewriter labels on white tape).
- Transitions: keep 'Rinse wash across the sheet', add motion blur and a 2-frame light accent on the cut.

## Data & Information

Category layer: Data on a cinematic stage: dark or paper-graded background with grain, charts and tiles at depth, non-focal panels defocused, camera glides along the data.

### 66. Market Terminal (`market-terminal`) — audit: needs upgrade

- Keep: palette #000000 #FFB000 #00D26A #FF3B30 #4DA3FF; Dense financial terminal: black background, amber and green numbers, tickers, candlestick charts, panels with function keys.
- Elevate: Panels at depth with non-focal panels defocused, amber glow grade, eased push, mono credit block.
- Type styles: TS-09 Technical Mono HUD, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Condensed mono for numbers (IBM Plex Mono)).
- Transitions: keep 'Panel swaps like function-key screens', add motion blur and a 2-frame light accent on the cut.

### 67. Editorial Data Graphics (`editorial-data`) — audit: close

- Keep: palette #FFFFFF #121212 #D1495B #8D99AE #EDF2F4; Newspaper-grade charts: clean axes, annotated lines, muted palette with one highlight color, serif headlines and source notes.
- Elevate: Newspaper-grade paper grade, charts lifted into 2.5D, camera glides along the time axis, Source Serif headlines with mask reveals.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-03 Prestige Drama Serif (style font kept as the display face: Serif headline (Source Serif) + sans labels (Source Sans)).
- Transitions: keep 'Chart morphs into the next chart form', add motion blur and a 2-frame light accent on the cut.

### 68. Transit Map Diagram (`transit-map`) — audit: needs upgrade

- Keep: palette #FFFFFF #E32017 #0098D4 #00782A #FFD300; Subway-map schematic: 45° lines in bold colors, station dots, interchanges and a clean legend.
- Elevate: Map lit as a print with grain, camera follows the train on an eased path with DOF on distant lines.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-09 Technical Mono HUD (style font kept as the display face: Transport sans (Overpass) station labels).
- Transitions: keep 'Zoom along a line to the next map', add motion blur and a 2-frame light accent on the cut.

### 69. Icon Infographic (`icon-infographic`) — audit: needs upgrade

- Keep: palette #F7F9FC #1A2B4C #3A86FF #FFBE0B #FB5607; Flat icon system with pictograms, big numbers, rounded cards and soft brand colors on light background.
- Elevate: Cards at depth with soft shadows and DOF, eased camera, oversized numerals with count-up glow.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-12 Kinetic Variable (style font kept as the display face: Geometric sans with oversized numerals (Poppins)).
- Transitions: keep 'Card slide carousel', add motion blur and a 2-frame light accent on the cut.

### 70. Scientific Journal Figure (`journal-figure`) — audit: needs upgrade

- Keep: palette #FFFFFF #222222 #1F77B4 #FF7F0E #2CA02C; Academic figure panels labeled A-D, error bars, scatter plots, minimal gridlines and small caption text on white.
- Elevate: Subtle paper grade, panels at depth with DOF, eased camera between panels, clean credit-block captions.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-09 Technical Mono HUD (style font kept as the display face: Small sans (Helvetica-like) captions and panel letters).
- Transitions: keep 'Next figure slides in', add motion blur and a 2-frame light accent on the cut.

### 71. KPI Dashboard Motion (`kpi-dashboard`) — audit: needs upgrade

- Keep: palette #0D1117 #58A6FF #3FB950 #F85149 #D29922; Dark modern dashboard: KPI tiles, sparklines, donut gauges, status chips and subtle glow on key numbers.
- Elevate: Dashboard tiles at depth with DOF, glow grade, eased push to the hero metric, tabular numerals with light sweep.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-09 Technical Mono HUD (style font kept as the display face: Inter for labels, tabular numerals for metrics).
- Transitions: keep 'Dashboard pans to the next panel', add motion blur and a 2-frame light accent on the cut.

## Generative & Type

Category layer: Give the generative field depth (two or more planes with DOF), motion blur on fast elements, and a textured grade.

### 72. Kinetic Typography (`kinetic-type`) — audit: close

- Keep: palette #0A0A0A #FFFFFF #FF3B3B #FFE14D #3BFFB2; Type-only frames on solid or duotone backgrounds; words scale, stack, rotate and fill the frame with bold contrast.
- Elevate: Words in 2.5D depth with motion blur on slams, textured grade, letter-by-letter variable reveals.
- Type styles: TS-12 Kinetic Variable, TS-02 Condensed Blockbuster (style font kept as the display face: Heavy variable grotesk (Anton / Inter Black) with extreme scale shifts).
- Transitions: keep 'A word grows to fill the frame and becomes the next background', add motion blur and a 2-frame light accent on the cut.

### 73. Particle Field (`particle-field`) — audit: close

- Keep: palette #05050C #7DF9FF #B388FF #FFFFFF #FFD166; Thousands of glowing particles on dark space forming logos, faces and words, then dispersing into flowing clouds.
- Elevate: Camera drifts through particle depth with near particles bokeh-blurred, titles assembling from particles.
- Type styles: TS-05 Emissive Neon, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Thin modern sans assembled from particles).
- Transitions: keep 'Disperse and reform as the next shape', add motion blur and a 2-frame light accent on the cut.

### 74. Flow Field Lines (`flow-field`) — audit: close

- Keep: palette #0E0E10 #E8E6E3 #F25C54 #43AA8B #F7B267; Thousands of fine curved lines following a noise flow field, like wind or magnetism, in a limited elegant palette.
- Elevate: Flow lines on two depth layers with DOF, eased camera drift, light serif titles with light sweep.
- Type styles: TS-03 Prestige Drama Serif, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Elegant light serif overlay).
- Transitions: keep 'Field direction flips, revealing the next composition', add motion blur and a 2-frame light accent on the cut.

### 75. Generative Mosaic Grid (`mosaic-grid`) — audit: needs upgrade

- Keep: palette #111111 #F4F1DE #E07A5F #3D405B #81B29A; A tile grid where each cell holds a shape, glyph or color that flips and recombines; Truchet tiles and pattern logic.
- Elevate: Tiles as lit 3D chips with DOF, eased camera, glyph titles resolving letter by letter.
- Type styles: TS-12 Kinetic Variable, TS-09 Technical Mono HUD (style font kept as the display face: Monospace or geometric glyphs inside cells).
- Transitions: keep 'Cell cascade reveal', add motion blur and a 2-frame light accent on the cut.

### 76. Variable Font Morph (`variable-font-morph`) — audit: close

- Keep: palette #F5F5F0 #141414 #5B5BFF #FF5BA7 #FFD45B; Large letterforms whose weight, width and slant morph fluidly; minimal backgrounds with soft gradient light.
- Elevate: Letterforms in 2.5D with soft light and DOF, eased push, axis morph reveals.
- Type styles: TS-12 Kinetic Variable, TS-04 Keynote Neo-Grotesk (style font kept as the display face: A variable font (Roboto Flex or Fraunces) animated across axes).
- Transitions: keep 'Word squeezes to a line and expands into the next', add motion blur and a 2-frame light accent on the cut.

### 77. Lyric Caption Karaoke (`lyric-karaoke`) — audit: needs upgrade

- Keep: palette #0B0B12 #FFFFFF #FF4D8D #6C63FF #FFC857; Full-screen lyric display over a blurred or gradient background; current line bright, next line dim; word-by-word fill highlight.
- Elevate: Lyrics over a graded, defocused background with parallax, eased push on chorus, word fills with light sweep.
- Type styles: TS-12 Kinetic Variable, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Bold rounded sans (Poppins ExtraBold) centered).
- Transitions: keep 'Line roll to the next verse; chorus gets a color change', add motion blur and a 2-frame light accent on the cut.

## Popular Explainer Looks

Category layer: Broadcast-explainer finish: depth layers with DOF, eased camera through the diagram, and premium title treatments on every section card.

### 78. Flat-Vector Science (`flat-vector-science`) — audit: close

- Keep: palette #0D1B4C #5B2A86 #F9C80E #43BCCD #EA3546; Science-explainer vector art: deep navy-to-violet space gradients, chunky outline-free shapes with rich multi-stop gradients, crescent shadows and rim highlights, soft radial glows, sparkling stars, banded ringed planets and cute round characters with big eyes.
- Elevate: Foreground stars in bokeh, eased camera through space, rounded titles with soft bevel glow.
- Type styles: TS-10 Storybook Rounded, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Bold rounded sans (Nunito Black) with soft shadow).
- Transitions: keep 'Zoom through a planet or star into the next scene', add motion blur and a 2-frame light accent on the cut.

### 79. Tech Glow Explainer (`tech-glow`) — audit: meets

- Keep: palette #070B1F #4F7CFF #A35BFF #22D3EE #F5F7FF; Polished AI/tech YouTube look: deep navy-indigo space with drifting electric glows and a perspective grid, gradient-stroked icon tiles wired into node diagrams with light pulses racing along connectors, dark cards with thin neon borders, gradient headline type and bloom on bright elements.
- Elevate: Background nodes defocused, eased push along pulse paths, gradient titles with light sweep.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-05 Emissive Neon (style font kept as the display face: Inter / Space Grotesk headings with gradient fill).
- Transitions: keep 'Zoom into a node to reveal its inner diagram', add motion blur and a 2-frame light accent on the cut.

### 80. Papercraft Models (`papercraft-models`) — audit: close

- Keep: palette #2F6B4F #F4EBDD #E85D3F #3B82C4 #F2C14E; Printed cardstock kit models — boxy low-poly robots, animals and charts — with printed faces, dotted fold lines, glue tabs and hairline seams, lit by a warm key light on a green cutting mat with craft tools at the edges.
- Elevate: Warm key, shallow DOF, eased orbit around each model, printed tag titles.
- Type styles: TS-10 Storybook Rounded, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Printed label type on paper tags (Space Mono)).
- Transitions: keep 'Model unfolds flat; next sheet folds up', add motion blur and a 2-frame light accent on the cut.

### 81. Manim-Style Math (`manim-math`) — audit: close

- Keep: palette #000000 #58C4DD #83C167 #FFFF00 #FC6255; Pure black background, crisp anti-aliased vector lines, restrained blue, teal, yellow, red and green palette, italic serif math, axes with ticks, curves, arrows, braces and highlight rectangles (the open-source Manim look).
- Elevate: Keep the Manim clarity; add a subtle grain and vignette, depth layers for focus, smooth camera zooms.
- Type styles: TS-03 Prestige Drama Serif, TS-09 Technical Mono HUD (style font kept as the display face: Computer Modern-style serif (CMU Serif / KaTeX fonts) for math; italics for variables).
- Transitions: keep 'Equation transforms into the next concept', add motion blur and a 2-frame light accent on the cut.

### 82. Editorial Essay Collage (`editorial-collage`) — audit: meets

- Keep: palette #EFE7DA #151515 #F2C14E #D1495B #2E86AB; Animated video-essay collage: warm grainy paper, archival halftone photos with torn white borders and soft shadows, newspaper clippings with yellow highlighter sweeps, masking tape, flat color blocks and big cut-out condensed headlines.
- Elevate: Clippings at depth with background defocus, eased Ken Burns, condensed headlines with mask wipes.
- Type styles: TS-02 Condensed Blockbuster, TS-03 Prestige Drama Serif (style font kept as the display face: Condensed cut-out headlines (Oswald) + serif clipping text (Merriweather)).
- Transitions: keep 'Paper tear or new clipping slaps on top', add motion blur and a 2-frame light accent on the cut.

### 83. Product Launch Reveal (`product-launch`) — audit: meets

- Keep: palette #000000 #F5F5F7 #86868B #2997FF #BF5AF2; Keynote product film: one glossy hero object on a near-black stage with soft key, rim light, sweeping specular highlight and floor reflection; huge tight-tracked headlines, gradient key numbers with soft glow and hairline spec callouts.
- Elevate: Keep; add slow orbit with DOF and a credit-block spec reveal.
- Type styles: TS-04 Keynote Neo-Grotesk, TS-01 Trailer Serif (style font kept as the display face: Tight-tracked neo-grotesk (Inter Display) at massive scale).
- Transitions: keep 'Fade to black then reveal; light sweep wipe', add motion blur and a 2-frame light accent on the cut.

### 84. Social Short Captions (`social-captions`) — audit: needs upgrade

- Keep: palette #000000 #FFFFFF #FFE600 #FF2D55 #00E676; Vertical-first short-form: bold auto-captions with word highlight, emoji pops, punchy zooms, progress bar and sticker callouts over footage or brand backgrounds.
- Elevate: Graded background with depth, eased punch-ins with motion blur, captions in a premium heavy sans with light sweep on key words.
- Type styles: TS-12 Kinetic Variable, TS-04 Keynote Neo-Grotesk (style font kept as the display face: Heavy sans captions (Montserrat Black) with thick stroke).
- Transitions: keep 'Whip pan or zoom punch', add motion blur and a 2-frame light accent on the cut.

## Cosmic & Psychedelic

Category layer: Volumetric depth through layers of color and light, star/particle bokeh in the foreground, and slow eased pushes toward the center.

### 85. Psychedelic Poster (`psychedelic-poster`) — audit: close

- Keep: palette #FF6B00 #00B3FF #FF00A8 #B8FF00 #4B0082; 1960s concert-poster psychedelia: full-strength inks in vibrating complementary pairs, liquid churning ring bands, sunbursts, a mirror-symmetric eye-flower and bulbous melting lettering on worn poster stock.
- Elevate: Ring bands at depth with DOF, eased push into the eye-flower, melting titles with bevel.
- Type styles: TS-07 Comic Impact, TS-05 Emissive Neon (style font kept as the display face: Melting bulbous display (Shrikhand), warped along curves).
- Transitions: keep 'Color cycle melt', add motion blur and a 2-frame light accent on the cut.

### 86. Cosmic Nebula Mandala (`cosmic-mandala`) — audit: close

- Keep: palette #050014 #7B2FF7 #F107A3 #00F5D4 #FEE440; Deep-space nebula clouds with a sacred-geometry mandala of light at the center, star fields, frequency rings and glowing sigils.
- Elevate: Eased push through nebula layers with star bokeh, Cinzel Decorative titles with light sweep.
- Type styles: TS-11 Deco / Engraved Gold, TS-01 Trailer Serif (style font kept as the display face: Spaced ethereal caps (Cinzel Decorative or Josefin Sans Thin)).
- Transitions: keep 'Zoom through the mandala center', add motion blur and a 2-frame light accent on the cut.

## Engine and Audivid templates

### engine/index.html (SSS Brain title starter) — audit: needs upgrade

- Elevate: Lacquer-black set with a soft gold rim light and grain, title in TS-01 Trailer Serif with a slow light sweep, rule line drawn with a specular, slow 4% push-in over the 5 s.
- Type styles: TS-01, TS-11

### pet-muzik-pop — audit: needs upgrade

- Elevate: Keep the sunset palette, the husky and the farm: rebuild at 1920x1080, a warm golden-hour grade with halation on the sun, sky/fence/ground in three-plane parallax with the fence as a defocused foreground occluder, illustrated (not emoji) farm animals, eased push-in on the hero husky, BAM title in TS-07 Comic Impact with extrusion, slam card in TS-02, music-synced cuts.
- Type styles: TS-07, TS-02

### pet-muzik-cartoon — audit: needs upgrade

- Elevate: Keep the mint-and-peach palette: 1920x1080, soft pastel grade with grain, multiplane farm with DOF, storybook-rounded title (TS-10) with soft emboss and letter bounce, eased camera glide, end card held 2-3 s.
- Type styles: TS-10, TS-03

### worker/template.mjs (zero-cost fallback composer) — audit: needs upgrade

- Elevate: Read the chosen style's elevation block and type style; add grade, grain, vignette, three planes, eased camera and the TS title treatment by default.
- Type styles: per style

### Audivid: Equalizer Bars — audit: needs upgrade

- Elevate: Bars as emissive light objects reflecting on a dark glossy floor, cover art with soft DOF behind, slow push-in, grade from the art palette, title in TS-04.
- Type styles: TS-04, TS-05

### Audivid: Sine Wave — audit: needs upgrade

- Elevate: Wave as a luminous ribbon at two depths with DOF, light trails, eased camera drift, art-matched grade.
- Type styles: TS-05, TS-03

### Audivid: Spectrum Ring — audit: needs upgrade

- Elevate: See the worked example in CREATIVE_DIRECTOR_PIPELINE.md section 8.3.
- Type styles: TS-01, TS-05

### Audivid: Minimal Pulse — audit: needs upgrade

- Elevate: Soft pulsing glow as volumetric light behind the art, microline etched in light, slow push, TS-03 serif title. Must reach 1080p before it is sold as premium.
- Type styles: TS-03, TS-04

