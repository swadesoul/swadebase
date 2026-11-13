// HyperFrames source for a SWADE Learn pack. The worker can render this with the
// same `hyperframes render` command Motion Studio already uses. Remotion is the
// default local renderer; this HTML is the editable source inside the ZIP.

const esc = (value) =>
  String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])

export function hyperframesHtml(pack, { audioSrc = 'assets/narration.wav', seed = 1 } = {}) {
  const width = 1920
  const height = 1080
  let cursor = 0
  const clips = pack.clips.map((clip, index) => {
    const start = cursor
    cursor += clip.duration_sec
    return { ...clip, start, index }
  })
  return `<!doctype html>
<html><head><meta charset="utf-8">
<script>(function(){let s=${seed >>> 0};window.rand=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<style>
html,body{margin:0;width:100%;height:100%;background:#10141c;overflow:hidden}
#root{position:relative;width:100%;height:100%;overflow:hidden;font-family:'Liberation Sans',sans-serif;color:#f4f0e6}
.line{position:absolute;left:6%;right:6%;top:34%;display:block;font-size:84px;font-weight:700;line-height:1.05}
.graphic{position:absolute;left:6%;right:6%;display:block;font-size:42px;font-weight:700}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${cursor}" data-width="${width}" data-height="${height}">
${clips
  .map(
    (clip) => `  <div class="clip" id="clip-${esc(clip.id)}" data-start="${clip.start}" data-duration="${clip.duration_sec}" data-track-index="1" style="position:absolute;inset:0"><div class="line" id="line-${esc(clip.id)}">${esc(clip.on_screen)}</div></div>`,
  )
  .join('\n')}
${pack.graphics
  .map(
    (graphic, index) => `  <div class="clip" id="gfx-${esc(graphic.id)}" data-start="${graphic.start_sec}" data-duration="${graphic.duration_sec}" data-track-index="${2 + index}" style="position:absolute;inset:0"><div class="graphic" id="gtext-${esc(graphic.id)}" style="bottom:${12 + index}%;">${esc(graphic.text)}</div></div>`,
  )
  .join('\n')}
  <audio id="soundtrack" src="${esc(audioSrc)}" class="clip" data-start="0" data-duration="${cursor}" data-track-index="9"></audio>
</div>
<script>
const tl = gsap.timeline({ paused: true });
${clips
  .map(
    (clip) => `tl.fromTo('#line-${esc(clip.id)}', { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, ${clip.start + 0.1});
tl.to('#line-${esc(clip.id)}', { opacity: 0, duration: 0.3 }, ${Math.max(clip.start, clip.start + clip.duration_sec - 0.4)});`,
  )
  .join('\n')}
${pack.graphics
  .map(
    (graphic) => `tl.fromTo('#gtext-${esc(graphic.id)}', { opacity: 0 }, { opacity: 1, duration: 0.3 }, ${graphic.start_sec});`,
  )
  .join('\n')}
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body></html>
`
}

export function hyperframesArgs(dir, outFile, { fps = 30, quality = 'draft', workers = '1' } = {}) {
  return ['--no-install', 'hyperframes', 'render', dir, '--output', outFile, '--fps', String(fps), '--quality', quality, '--workers', String(workers)]
}
