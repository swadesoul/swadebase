// Local narration defaults to Kokoro on CPU. ElevenLabs and Together are built
// here and called only after the spend guard. This module never logs credentials.

import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const KOKORO_ID = 'hexgrad/Kokoro-82M'
let kokoroPromise = null

function redact(message, secret) {
  const text = String(message || '')
  if (!secret) return text.slice(0, 300)
  return text.split(secret).join('[redacted]').slice(0, 300)
}

function paidHost(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

export function refusePaidFetch(url, init) {
  const host = paidHost(url)
  if (host === 'api.elevenlabs.io' || host === 'api.together.ai' || host.endsWith('.elevenlabs.io')) {
    const error = new Error('paid_call_refused')
    error.code = 'paid_call_refused'
    throw error
  }
  return fetch(url, init)
}

function wavBytes(samples, sampleRate) {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(clamped * 32767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

// Used only when the Kokoro weights cannot be loaded. Still local, still $0.
export function writeLocalPcm(text, dest) {
  const sampleRate = 22050
  const seconds = Math.min(4, Math.max(0.6, String(text || '').length * 0.045))
  const count = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(count)
  const chars = String(text || ' ')
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate
    const char = chars[Math.floor(t * 12) % chars.length]
    const freq = 180 + (char.charCodeAt(0) % 40) * 8
    const envelope = Math.sin(Math.PI * Math.min(1, (t % 0.12) / 0.12))
    samples[i] = Math.sin(2 * Math.PI * freq * t) * 0.2 * envelope
  }
  return writeFile(dest, wavBytes(samples, sampleRate)).then(() => ({
    provider: 'swade_voice',
    model: 'local-pcm',
    engine: 'local-pcm',
    characters: chars.trim().length,
    audio_seconds: Math.round(seconds * 1000) / 1000,
  }))
}

async function loadKokoro() {
  process.env.HF_HOME ||= '/tmp/swade-learn-hf'
  process.env.HF_HUB_CACHE ||= '/tmp/swade-learn-hf'
  if (!kokoroPromise) {
    kokoroPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js')
      return KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: 'q8', device: 'cpu' })
    })().catch((error) => {
      kokoroPromise = null
      throw error
    })
  }
  return kokoroPromise
}

export async function synthesizeKokoro(text, dest, { voice = 'af_heart' } = {}) {
  const spoken = String(text || '').trim().slice(0, 500)
  if (process.env.SWADE_LEARN_KOKORO === 'pcm') return writeLocalPcm(spoken, dest)
  try {
    const tts = await loadKokoro()
    const audio = await tts.generate(spoken, { voice })
    await audio.save(dest)
    const seconds = Number(audio.audio?.length && audio.sampling_rate ? audio.audio.length / audio.sampling_rate : 0)
    return {
      provider: 'swade_voice',
      model: KOKORO_ID,
      engine: 'kokoro-js',
      characters: spoken.length,
      audio_seconds: Math.round((seconds || spoken.length * 0.06) * 1000) / 1000,
    }
  } catch (error) {
    if (process.env.SWADE_LEARN_KOKORO === 'required') throw error
    const fallback = await writeLocalPcm(spoken, dest)
    return { ...fallback, meta: { kokoro_error: redact(error.message || error) } }
  }
}

export function elevenLabsRequest({ apiKey, voiceId, text, model = 'eleven_multilingual_v2' }) {
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    init: {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: model }),
    },
  }
}

export async function elevenLabsSpeech({ fetchImpl, apiKey, voiceId, text, dest, model }) {
  if (!apiKey) {
    const error = new Error('premium_unconfigured')
    error.code = 'premium_unconfigured'
    throw error
  }
  const request = elevenLabsRequest({ apiKey, voiceId, text, model })
  let response
  try {
    response = await fetchImpl(request.url, request.init)
  } catch (error) {
    throw new Error(redact(error.message || error, apiKey))
  }
  if (!response.ok) throw new Error(`elevenlabs ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(dest, bytes)
  return { provider: 'elevenlabs', model: model || 'eleven_multilingual_v2', characters: String(text || '').length }
}

export function togetherVideoRequest({ apiKey, prompt, seconds, ratio = '16:9' }) {
  return {
    url: 'https://api.together.ai/v2/videos',
    init: {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Wan-AI/wan2.7-t2v',
        prompt,
        resolution: '720P',
        ratio,
        seconds: String(seconds),
      }),
    },
  }
}

// One create call. No polling loop, so a mistaken key cannot spin on the API.
export async function togetherVideo({ fetchImpl, apiKey, prompt, seconds }) {
  if (!apiKey) {
    const error = new Error('premium_unconfigured')
    error.code = 'premium_unconfigured'
    throw error
  }
  const request = togetherVideoRequest({ apiKey, prompt, seconds })
  let response
  try {
    response = await fetchImpl(request.url, request.init)
  } catch (error) {
    throw new Error(redact(error.message || error, apiKey))
  }
  if (!response.ok) throw new Error(`together ${response.status}`)
  const body = await response.json()
  return { provider: 'together', model: 'Wan-AI/wan2.7-t2v', remote_id: body.id || null, remote_status: body.status || null }
}

export function mixNarration(clips, outFile) {
  const args = ['-y']
  for (const clip of clips) args.push('-i', clip.file)
  const pads = clips
    .map((clip, index) => `[${index}]apad=whole_dur=${clip.durationSec},atrim=0:${clip.durationSec}[a${index}]`)
    .join(';')
  const concat = clips.map((_, index) => `[a${index}]`).join('') + `concat=n=${clips.length}:v=0:a=1[out]`
  args.push('-filter_complex', `${pads};${concat}`, '-map', '[out]', '-c:a', 'pcm_s16le', outFile)
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(outFile)
      else reject(new Error(`ffmpeg mix failed (${code}) ${err.slice(-400)}`))
    })
  })
}
