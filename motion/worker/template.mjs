// Deterministic fallback composition: used when no LLM is configured, or when the
// composed HTML still fails lint after repair attempts. It always renders, follows the
// chosen style's palette/type/motion notes, and reacts to audio beats and energy.
import { FORMATS } from '../adapter/adapter.mjs'

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function templateComposition(style, project, assets) {
  const f = FORMATS[project.format] || FORMATS['16:9']
  const D = Number(project.duration_sec) || 15
  const [bg, ink, a1, a2, a3] = style.palette
  const vertical = f.height > f.width
  const lines = String(project.idea || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
  const title = project.title || 'Untitled motion'
  const audio = project.audio_features || null
  const beats = (audio?.beats || []).filter((t) => t < D).slice(0, 1200)
  const energy = (audio?.energy || []).slice(0, Math.ceil(D * 10))
  const sceneCount = Math.max(1, lines.length)
  const titleEnd = Math.min(4, D * 0.3)
  const per = (D - titleEnd - 2) / sceneCount
  const scenes = lines.map((t, i) => ({ t, start: +(titleEnd + i * per).toFixed(2), dur: +per.toFixed(2) }))
  const fontTitle = vertical ? 0.075 : 0.085
  const startImg = assets.startImageSrc
    ? `<div class="clip" data-start="0" data-duration="${D}" data-track-index="0" style="position:absolute;inset:0"><img id="startimg" src="${assets.startImageSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block"></div>`
    : ''
  const audioEl = assets.audioSrc
    ? `<audio id="soundtrack" src="${assets.audioSrc}" class="clip" data-start="0" data-duration="${D}" data-track-index="9"></audio>`
    : ''
  return `<!doctype html>
<html><head><meta charset="utf-8">
<script>(function(){let s=${(project.id || 'x').split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)}>>>0;window.rand=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();</script>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<style>
html,body{margin:0;width:100%;height:100%;background:${bg};overflow:hidden}
#root{position:relative;width:100%;height:100%;overflow:hidden;font-family:'Bricolage Grotesque',sans-serif;color:${ink}}
.band{position:absolute;display:block;border-radius:${style.category === 'Art & Design Movements' ? '0' : '50%'};opacity:.9}
.title{position:absolute;left:6%;right:6%;top:38%;display:block;font-weight:800;font-size:${Math.round(f.width * fontTitle)}px;line-height:1;letter-spacing:-.03em}
.line{position:absolute;left:6%;right:6%;bottom:14%;display:block;font-size:${Math.round(f.width * (vertical ? 0.06 : 0.042))}px;line-height:1.15;font-weight:400}
.pulse{position:absolute;left:50%;top:50%;width:${Math.round(Math.min(f.width, f.height) * 0.7)}px;height:${Math.round(Math.min(f.width, f.height) * 0.7)}px;margin:-${Math.round(Math.min(f.width, f.height) * 0.35)}px;border-radius:50%;border:${Math.round(f.width * 0.006)}px solid ${a1};display:block}
.endcard{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.round(f.width * 0.05)}px}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${f.width}" data-height="${f.height}">
  ${startImg}
  <div class="clip" data-start="0" data-duration="${D}" data-track-index="1" style="position:absolute;inset:0">
    <div class="band" id="b1" style="width:${Math.round(f.width * 0.9)}px;height:${Math.round(f.width * 0.9)}px;left:-20%;top:-30%;background:${a1}"></div>
    <div class="band" id="b2" style="width:${Math.round(f.width * 0.6)}px;height:${Math.round(f.width * 0.6)}px;right:-15%;bottom:-20%;background:${a2}"></div>
    <div class="band" id="b3" style="width:${Math.round(f.width * 0.3)}px;height:${Math.round(f.width * 0.3)}px;right:20%;top:10%;background:${a3}"></div>
    <div class="pulse" id="pulse"></div>
  </div>
  <div class="clip" data-start="0" data-duration="${titleEnd.toFixed(2)}" data-track-index="2" style="position:absolute;inset:0"><div class="title" id="title">${esc(title)}</div></div>
  ${scenes.map((s, i) => `<div class="clip" data-start="${s.start}" data-duration="${s.dur}" data-track-index="3" style="position:absolute;inset:0"><div class="line" id="l${i}">${esc(s.t)}</div></div>`).join('\n  ')}
  <div class="clip" data-start="${(D - 2).toFixed(2)}" data-duration="2" data-track-index="4" style="position:absolute;inset:0"><div class="endcard" id="end">${esc(title)}</div></div>
  ${audioEl}
</div>
<script>
const AUDIO = ${JSON.stringify({ beats, energy, step: 0.1 })};
const D = ${D};
const tl = gsap.timeline({ paused: true });
tl.fromTo('#b1', { x: 0, y: 0, scale: 1 }, { x: ${Math.round(f.width * 0.12)}, y: ${Math.round(f.height * 0.08)}, scale: 1.15, duration: D, ease: 'sine.inOut' }, 0);
tl.fromTo('#b2', { x: 0, y: 0, rotation: 0 }, { x: -${Math.round(f.width * 0.1)}, y: -${Math.round(f.height * 0.06)}, rotation: 25, duration: D, ease: 'sine.inOut' }, 0);
tl.fromTo('#b3', { scale: 0.6 }, { scale: 1.2, duration: D, ease: 'sine.inOut' }, 0);
${assets.startImageSrc ? `tl.fromTo('#startimg', { scale: 1 }, { scale: 1.12, duration: D, ease: 'none' }, 0);` : ''}
tl.fromTo('#title', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2);
tl.to('#title', { opacity: 0, y: -40, duration: 0.5, ease: 'power2.in' }, ${Math.max(0.5, titleEnd - 0.6).toFixed(2)});
${scenes.map((s, i) => `tl.fromTo('#l${i}', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, ${s.start + 0.05});
tl.to('#l${i}', { opacity: 0, duration: 0.4 }, ${(s.start + s.dur - 0.45).toFixed(2)});`).join('\n')}
tl.fromTo('#end', { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' }, ${(D - 1.9).toFixed(2)});
tl.fromTo('#pulse', { scale: 0.85, opacity: 0.0 }, { scale: 0.85, opacity: 0.0, duration: 0.01 }, 0);
if (AUDIO.beats.length) {
  for (const t of AUDIO.beats) {
    const i = Math.min(AUDIO.energy.length - 1, Math.round(t / AUDIO.step));
    const e = AUDIO.energy.length ? AUDIO.energy[Math.max(0, i)] : 0.6;
    tl.fromTo('#pulse', { scale: 0.85, opacity: 0.25 + e * 0.6 }, { scale: 1 + e * 0.25, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);
  }
} else {
  for (let t = 0.5; t < D - 0.5; t += 1.2) tl.fromTo('#pulse', { scale: 0.85, opacity: 0.35 }, { scale: 1.1, opacity: 0, duration: 1, ease: 'sine.out', immediateRender: false }, t);
}
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body></html>
`
}
