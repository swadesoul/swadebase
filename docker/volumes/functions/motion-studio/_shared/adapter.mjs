// SWADEBASE Motion Adapter
// Pure ESM, zero dependencies — runs unchanged in Deno (edge functions), Node (render worker)
// and the browser (Motion Studio UI). It is the single contract between the style library,
// any agent program, and the HyperFrames renderer.
//
//   recommendStyles(library, brief)  -> ranked style picks with reasons (free, no LLM call)
//   compileBrief(style, request)      -> { system, user } prompt for the composing model
//   FORMATS / normalizeRequest        -> canvas presets and request validation

export const ADAPTER_VERSION = '1.0.0'

export const FORMATS = {
  '16:9': { width: 1920, height: 1080, label: 'Widescreen 16:9' },
  '9:16': { width: 1080, height: 1920, label: 'Vertical 9:16' },
  '1:1': { width: 1080, height: 1080, label: 'Square 1:1' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait 4:5' },
}

export const MODES = ['idea', 'audio', 'start_image']

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

export function normalizeRequest(input = {}) {
  const mode = MODES.includes(input.mode) ? input.mode : 'idea'
  const format = FORMATS[input.format] ? input.format : '16:9'
  const audioDur = Number(input.audio?.duration) || 0
  const requested = Number(input.durationSec) || 0
  // Audio mode: the video matches the audio unless a shorter cut is asked for.
  let durationSec = mode === 'audio' && audioDur ? (requested ? Math.min(requested, audioDur) : audioDur) : requested || 15
  durationSec = clamp(Math.round(durationSec * 10) / 10, 3, 600)
  const fps = [24, 30, 60].includes(Number(input.fps)) ? Number(input.fps) : 30
  return {
    mode,
    format,
    durationSec,
    fps,
    title: String(input.title || '').slice(0, 140),
    idea: String(input.idea || '').slice(0, 6000),
    property: input.property ? String(input.property) : null,
    brand: input.brand || null, // { name, colors[], logoUrl }
    audio: input.audio || null, // see AUDIO FEATURES below
    startImage: input.startImage || null, // { url, width, height, description }
    script: input.script ? String(input.script).slice(0, 12000) : null,
    captions: input.captions || null, // [{ text, start, end }] word or line timings
  }
}

/* ───────────── Recommender ─────────────
 * Scores every style against the brief. Cheap and deterministic so the agent can
 * suggest instantly; an LLM can still override with its own pick.
 */
const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9&+\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

// Words that describe a format rather than a look score lower than subject/mood words.
const GENERIC_WORDS = new Set(['intro', 'promo', 'ad', 'video', 'music', 'song', 'clip', 'brand', 'product', 'explainer', 'title', 'background', 'loop', 'social'])

const MOOD_HINTS = [
  { when: (a) => a && a.bpm >= 120 && a.energyMean >= 0.55, boost: ['hype', 'dance', 'party', 'energy', 'drop', 'action', 'trailer'] },
  { when: (a) => a && a.bpm && a.bpm < 90 && a.energyMean < 0.45, boost: ['calm', 'ambient', 'dreamy', 'gentle', 'chill', 'meditation', 'ballad'] },
  { when: (a) => a && a.hasVocals, boost: ['lyric', 'song', 'music video', 'sing along'] },
]

export function recommendStyles(library, brief = {}, limit = 5) {
  const words = new Set(tokenize([brief.idea, brief.title, brief.script?.slice(0, 600), brief.startImage?.description].join(' ')))
  const text = ' ' + [...words].join(' ') + ' '
  const moodBoost = MOOD_HINTS.filter((m) => m.when(brief.audio)).flatMap((m) => m.boost)
  const scored = library.map((s) => {
    let score = 0
    const reasons = []
    for (const k of s.bestFor) {
      const hit = k.includes(' ') ? text.includes(' ' + k + ' ') : words.has(k)
      if (hit) {
        score += GENERIC_WORDS.has(k) ? 1 : 3
        reasons.push(`matches "${k}"`)
      }
    }
    for (const k of s.bestFor) if (moodBoost.includes(k)) { score += 2; reasons.push(`audio feels ${k}`) }
    if (brief.property && s.fit.includes(brief.property)) { score += 4; reasons.push(`made for ${brief.property}`) }
    if (brief.mode === 'audio' && /beat|on the beat|kick|drop/.test(s.audio)) score += 0.5
    if (brief.format === '9:16' && s.id === 'social-captions') score += 2
    for (const w of words) if (s.name.toLowerCase().includes(w) && w.length > 3) { score += 5; reasons.push('named in your brief') }
    return { id: s.id, name: s.name, category: s.category, score, reasons: [...new Set(reasons)].slice(0, 3) }
  })
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  const top = scored.filter((s) => s.score > 0).slice(0, limit)
  if (top.length) return top
  // Nothing matched: safe, versatile defaults.
  const fallback = ['tech-glow', 'kinetic-type', 'editorial-collage', 'flat-vector-science', 'product-launch']
  return fallback.slice(0, limit).map((id) => {
    const s = library.find((x) => x.id === id)
    return { id, name: s?.name || id, category: s?.category || '', score: 0, reasons: ['versatile default'] }
  })
}

/* ───────────── HyperFrames contract ─────────────
 * Rules the composing model must follow so `npx hyperframes lint` passes first time.
 */
export const HYPERFRAMES_RULES = `HYPERFRAMES COMPOSITION RULES (must follow exactly)
1. Output ONE standalone index.html. The root composition <div> sits directly in <body> (no <template>).
2. Root: <div id="root" data-composition-id="main" data-start="0" data-duration="{DURATION}" data-width="{W}" data-height="{H}" style="position:relative;width:100%;height:100%;overflow:hidden">.
3. Every timed element is a child with class="clip" plus data-start, data-duration (seconds) and data-track-index (integer layer). Clip end must not exceed the root duration.
4. Animation uses GSAP 3 loaded from https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js. Build ONE timeline: const tl = gsap.timeline({ paused: true }); add every tween with absolute positions in seconds; then register it LAST: window.__timelines = window.__timelines || {}; window.__timelines["main"] = tl;
5. Never set a CSS transform AND tween the same property; put the start state inside gsap.fromTo.
6. Do not tween autoAlpha/visibility on a .clip element itself — animate a child.
7. Determinism: no Date.now(), no performance.now(), no Math.random() (use the provided seeded rand()), no network fetches at runtime, no requestAnimationFrame loops. Everything is driven by the GSAP timeline.
8. {AUDIO_RULE}
9. Images/video use the exact relative paths given in ASSETS. No crossorigin on media.
10. Fonts: Google Fonts <link> in <head> is allowed; keep to 2 families.
11. Text: no <br> in body copy; transformed elements are display:block with explicit size. Keep all text inside a 6% safe margin.
12. Size everything relative to the canvas ({W}x{H}); never assume 1920x1080 if the canvas differs.
13. Give every timed element and every animated element a unique id.
14. Craft: layered background, foreground and type planes; at least 6 distinct animated elements; clear typographic hierarchy; every scene has entrance, hold and exit motion. A rich composition is usually 250-500 lines.
15. Return only the HTML document — no markdown fences, no commentary.`

export const SEEDED_RAND = `<script>/* seeded PRNG for deterministic renders */(function(){let s={SEED}>>>0;window.rand=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();</script>`

/* AUDIO FEATURES (computed client-side in Motion Studio with Web Audio — zero server cost)
 * {
 *   duration: seconds, bpm: number|null, beats: [seconds...], downbeats: [seconds...],
 *   energy: [0..1 per 1/10 second], energyMean: 0..1,
 *   sections: [{ start, end, label: 'intro'|'verse'|'build'|'drop'|'outro', energy }],
 *   hasVocals: boolean|null
 * }
 */
export function summarizeAudio(a) {
  if (!a) return null
  const beats = (a.beats || []).slice(0, 2000).map((t) => +Number(t).toFixed(3))
  const downbeats = (a.downbeats || []).slice(0, 600).map((t) => +Number(t).toFixed(3))
  const energy = (a.energy || []).slice(0, 6000).map((v) => +Number(v).toFixed(2))
  return {
    duration: +Number(a.duration || 0).toFixed(2),
    bpm: a.bpm ? Math.round(a.bpm) : null,
    beats,
    downbeats,
    energy,
    energyStep: 0.1,
    energyMean: a.energyMean != null ? +Number(a.energyMean).toFixed(2) : null,
    sections: (a.sections || []).slice(0, 40),
    hasVocals: a.hasVocals ?? null,
  }
}

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

export function compileBrief(style, rawRequest, assets = {}) {
  const r = normalizeRequest(rawRequest)
  const f = FORMATS[r.format]
  const seed = hashSeed((r.title || '') + r.idea + style.id)
  const rules = HYPERFRAMES_RULES.replaceAll('{DURATION}', String(r.durationSec))
    .replaceAll('{W}', String(f.width))
    .replaceAll('{H}', String(f.height))
    .replaceAll(
      '{AUDIO_RULE}',
      assets.audioSrc
        ? `Audio: <audio id="soundtrack" src="${assets.audioSrc}" class="clip" data-start="0" data-duration="${r.durationSec}" data-track-index="9"></audio>. The id is required or the render is silent. No crossorigin attribute.`
        : 'There is NO audio file for this project. Do not add any <audio> or <video> element.'
    )

  const system = [
    'You are the SWADEBASE Motion Director, a senior motion designer who writes HyperFrames compositions (HTML + CSS + GSAP) that render to MP4.',
    'You design with intent: clear story beats, strong hierarchy, readable type, and motion that serves the message. Every frame must look like the chosen style, not a generic template.',
    rules,
    `Paste this seeded PRNG as the first script in <head> and use rand() for any randomness:\n${SEEDED_RAND.replace('{SEED}', String(seed))}`,
  ].join('\n\n')

  const styleBlock = [
    `STYLE: ${style.name} (${style.category})`,
    `Look: ${style.look}`,
    `Palette anchors: ${style.palette.join(', ')} (first is the base/background)`,
    `Typography: ${style.type}`,
    `Motion grammar: ${style.motion}`,
    `Transitions: ${style.transitions}`,
    `Audio behavior: ${style.audio}`,
  ].join('\n')

  const parts = [styleBlock, `CANVAS: ${f.width}x${f.height} (${r.format}), ${r.durationSec}s at ${r.fps}fps.`]
  if (r.title) parts.push(`TITLE: ${r.title}`)
  if (r.brand) parts.push(`BRAND: ${JSON.stringify(r.brand)} — brand colors may replace palette accents but keep the style's base and textures.`)

  if (r.mode === 'idea') {
    parts.push(`BRIEF (the idea to visualize):\n${r.idea || '(none given — create a compelling 3-act piece about the title)'}`)
    parts.push('Plan 3-6 scenes with a hook in the first 2 seconds, a clear middle, and a resolved ending card.')
  }
  if (r.script) parts.push(`SCRIPT / ON-SCREEN COPY (use verbatim where it appears on screen):\n${r.script}`)

  if (r.mode === 'audio') {
    const a = summarizeAudio(r.audio)
    parts.push('MODE: AUDIO → MOTION. The soundtrack is the backbone. Scene changes land on section boundaries; accents land on beats/downbeats; global intensity follows energy.')
    parts.push(
      `AUDIO FEATURES (embed as const AUDIO = {...} in a <script> and drive tweens from it; add tweens at each beat time with tl.to(..., t)):\n${JSON.stringify(a)}`,
    )
    if (r.captions?.length) parts.push(`TIMED LYRICS/CAPTIONS (show each item exactly between start and end):\n${JSON.stringify(r.captions.slice(0, 1500))}`)
    if (r.idea) parts.push(`CREATIVE DIRECTION FROM THE ARTIST:\n${r.idea}`)
  }

  if (r.mode === 'start_image') {
    parts.push(
      `MODE: START IMAGE → MOTION. The first frame IS the uploaded image (${assets.startImageSrc || 'assets/start.png'}), shown full-bleed (object-fit: cover). From second 0.5 onward, bring it to life in the chosen style: parallax, light, overlays, typography and transformations that grow out of the image's content and colors.`,
    )
    if (r.startImage?.description) parts.push(`WHAT IS IN THE IMAGE: ${r.startImage.description}`)
    if (r.idea) parts.push(`DIRECTION: ${r.idea}`)
  }

  const assetList = Object.entries(assets.files || {}).map(([k, v]) => `- ${k}: ${v}`)
  if (assetList.length) parts.push(`ASSETS (use these exact relative paths):\n${assetList.join('\n')}`)
  parts.push('Return the complete index.html now.')

  return { system, user: parts.join('\n\n'), seed, canvas: f, durationSec: r.durationSec, fps: r.fps }
}

export function styleCard(s) {
  return { id: s.id, name: s.name, category: s.category, summary: s.look.split('. ')[0] + '.', palette: s.palette, bestFor: s.bestFor, fit: s.fit, atlas: s.atlas }
}

// Every style tells this same short story so samples can be compared side by side.
export function sampleRequest(style) {
  return {
    mode: 'idea',
    format: '16:9',
    durationSec: 8,
    fps: 30,
    title: style.name,
    idea:
      'Sample reel, no audio. Story in four beats: (1) 0-2s a single spark or mark appears on an empty frame; ' +
      '(2) 2-4s it multiplies into a rhythm of shapes; (3) 4-6.5s the shapes assemble into a small scene: a figure looking up at a glowing idea; ' +
      `(4) 6.5-8s end card reading "${style.name}" with the small line "SWADEBASE Motion". ` +
      'Show off this style\'s signature textures, motion grammar and one transition. Keep text minimal.',
  }
}
