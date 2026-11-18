// Device voices (free) and the shareable promo poster.
import QRCode from 'qrcode'
import { VOICE, type CharId } from '../game/data'

let voices: SpeechSynthesisVoice[] = []
if (typeof speechSynthesis !== 'undefined') {
  const load = () => { voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en')) }
  load(); speechSynthesis.onvoiceschanged = load
}
export function speak(id: CharId, text: string) {
  if (typeof speechSynthesis === 'undefined' || !text) return
  const u = new SpeechSynthesisUtterance(text)
  const v = VOICE[id]
  u.pitch = v.pitch; u.rate = v.rate; u.volume = 0.9
  if (voices.length) u.voice = voices[['unc', 'angie', 'princess', 'slide', 'bright', 'vance', 'you'].indexOf(id) % voices.length]
  speechSynthesis.speak(u)
}
export const hush = () => { try { speechSynthesis.cancel() } catch { /* none */ } }

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image(); i.crossOrigin = 'anonymous'
    i.onload = () => res(i); i.onerror = () => res(null); i.src = src
  })
}

export async function makePoster(opts: { artist: string; art: string | null; url: string; city: string; si: boolean }): Promise<string> {
  const W = 1080, H = 1350
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')!
  await document.fonts?.load?.('80px "Bebas Neue"').catch(() => null)
  g.fillStyle = '#F6E7B8'; g.fillRect(0, 0, W, H)
  g.lineWidth = 12; g.strokeStyle = '#111'; g.strokeRect(6, 6, W - 12, H - 12)
  g.fillStyle = '#111'; g.font = '600 34px Inter, sans-serif'; g.fillText('MAESTRO RADIO PRESENTS', 70, 110)
  const art = opts.art ? await loadImg(opts.art) : null
  const box = { x: 70, y: 150, s: 640 }
  g.fillStyle = '#CDEBE7'; g.fillRect(box.x, box.y, box.s, box.s)
  if (art) {
    try { g.drawImage(art, box.x, box.y, box.s, box.s) } catch { /* tainted: keep plain tile */ }
  } else {
    g.fillStyle = '#111'; g.beginPath(); g.arc(box.x + box.s / 2, box.y + box.s / 2, 220, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#CDEBE7'; g.beginPath(); g.arc(box.x + box.s / 2, box.y + box.s / 2, 50, 0, Math.PI * 2); g.fill()
  }
  g.lineWidth = 10; g.strokeRect(box.x, box.y, box.s, box.s)
  g.fillStyle = '#111'; g.font = '150px "Bebas Neue", Impact, sans-serif'
  const name = opts.artist.toUpperCase()
  let size = 150
  while (g.measureText(name).width > W - 140 && size > 60) { size -= 6; g.font = `${size}px "Bebas Neue", Impact, sans-serif` }
  g.fillText(name, 70, 950)
  g.font = '600 38px Inter, sans-serif'
  g.fillText(`Live on Maestro Radio${opts.city ? ` · ${opts.city}` : ''}`, 70, 1010)
  g.font = '400 30px Inter, sans-serif'; g.fillStyle = '#333'
  g.fillText('Follow to get a ping when they hit the air.', 70, 1060)
  if (opts.si) { g.font = '600 26px Inter, sans-serif'; g.fillStyle = '#7A2E5A'; g.fillText('SI artist · AI-generated music', 70, 1110) }
  const qr = await QRCode.toDataURL(opts.url, { margin: 1, width: 300, color: { dark: '#111111', light: '#FFFFFF' } })
  const q = await loadImg(qr)
  if (q) { g.fillStyle = '#fff'; g.fillRect(740, 980, 300, 300); g.drawImage(q, 740, 980, 300, 300); g.lineWidth = 8; g.strokeRect(740, 980, 300, 300) }
  g.fillStyle = '#111'; g.font = '600 26px Inter, sans-serif'; g.fillText('themaestroradio.com', 70, 1270)
  try { return c.toDataURL('image/png') } catch {
    // artwork blocked by the browser: redraw without it
    return makePoster({ ...opts, art: null })
  }
}
