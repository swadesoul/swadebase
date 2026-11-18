// SWADEBASE Motion render worker
// Runs on the Hostinger VPS (CPU only). Claims jobs from motion_render_jobs, composes the
// HyperFrames HTML with an LLM (or the deterministic template), lints + repairs, renders MP4,
// makes a poster and a source ZIP, uploads everything to Backblaze B2, marks the project ready.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME, B2_ENDPOINT, B2_REGION,
//      MOTION_B2_PREFIX, MOTION_COMPOSER_PROVIDER (anthropic|openai|ollama|template), MOTION_COMPOSER_MODEL,
//      ANTHROPIC_API_KEY | OPENAI_API_KEY | OLLAMA_URL, MOTION_WORKER_ID, MOTION_POLL_MS, MOTION_RENDER_WORKERS

import { createClient } from '@supabase/supabase-js'
import { AwsClient } from 'aws4fetch'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { join, extname } from 'node:path'
import os from 'node:os'
import { compileBrief, sampleRequest, ADAPTER_VERSION } from '../adapter/adapter.mjs'
import { templateComposition } from './template.mjs'
import LIB from '../styles/library.json' with { type: 'json' }

const env = (k, d = '') => process.env[k] ?? d
const WORKER_ID = env('MOTION_WORKER_ID', `${os.hostname()}-${process.pid}`)
const POLL_MS = Number(env('MOTION_POLL_MS', '4000'))
const PREFIX = env('MOTION_B2_PREFIX', 'swadesoul/motion-studio')
const RENDER_WORKERS = env('MOTION_RENDER_WORKERS', 'auto')
const JOB_ROOT = env('MOTION_JOB_DIR', '/tmp/motion-jobs')

const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
// Accept both B2_* and BACKBLAZE_* (existing SWADEBASE functions.env names).
const pickEnv = (...keys) => keys.map((k) => process.env[k]).find((v) => v) || ''
const B2 = {
  bucket: pickEnv('B2_BUCKET_NAME', 'BACKBLAZE_BUCKET_NAME'),
  endpoint: pickEnv('B2_ENDPOINT', 'BACKBLAZE_S3_ENDPOINT').replace(/\/$/, '').replace(/^(?!https?:\/\/)/, 'https://'),
}
const s3 = new AwsClient({
  accessKeyId: pickEnv('B2_KEY_ID', 'BACKBLAZE_KEY_ID'),
  secretAccessKey: pickEnv('B2_APP_KEY', 'BACKBLAZE_APPLICATION_KEY'),
  service: 's3',
  region: pickEnv('B2_REGION', 'BACKBLAZE_REGION') || 'us-east-005',
})
const b2url = (key) => `${B2.endpoint}/${B2.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`

const log = (...a) => console.log(new Date().toISOString(), `[${WORKER_ID}]`, ...a)

const MAX_UPLOAD_BYTES = Number(env('MOTION_MAX_UPLOAD_MB', '200')) * 1024 * 1024
async function b2Get(key, dest) {
  const head = await s3.fetch(b2url(key), { method: 'HEAD' })
  if (!head.ok) throw new Error(`Uploaded file not found (${head.status})`)
  if (Number(head.headers.get('content-length') || 0) > MAX_UPLOAD_BYTES) throw new Error('Uploaded file is over the size limit')
  const r = await s3.fetch(b2url(key))
  if (!r.ok) throw new Error(`B2 download failed ${r.status} for ${key}`)
  await writeFile(dest, Buffer.from(await r.arrayBuffer()))
}
async function b2Put(key, file, type) {
  const body = await readFile(file)
  const r = await s3.fetch(b2url(key), { method: 'PUT', body, headers: { 'content-type': type, 'content-length': String(body.length) } })
  if (!r.ok) throw new Error(`B2 upload failed ${r.status}: ${await r.text()}`)
  return key
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { ...opts, env: { ...process.env, ...(opts.env || {}) } })
    let out = '', err = ''
    p.stdout.on('data', (d) => { out += d; opts.onData?.(String(d)) })
    p.stderr.on('data', (d) => { err += d; opts.onData?.(String(d)) })
    p.on('close', (code) => resolve({ code, out, err }))
    if (opts.timeoutMs) setTimeout(() => p.kill('SIGKILL'), opts.timeoutMs)
  })
}

/* ───────────── composer ───────────── */
async function llm(system, user) {
  const provider = env('MOTION_COMPOSER_PROVIDER') || (env('ANTHROPIC_API_KEY') ? 'anthropic' : env('OPENAI_API_KEY') ? 'openai' : env('OLLAMA_URL') ? 'ollama' : 'template')
  if (provider === 'template') return null
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json', ...(env('ANTHROPIC_WORKSPACE_ID') && env('ANTHROPIC_USE_WORKSPACE_HEADER') === 'true' ? { 'anthropic-workspace-id': env('ANTHROPIC_WORKSPACE_ID') } : {}) },
      body: JSON.stringify({ model: env('MOTION_COMPOSER_MODEL', 'claude-sonnet-4-5'), max_tokens: 16000, system, messages: [{ role: 'user', content: user }] }),
    })
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = await r.json()
    return { html: j.content.map((c) => c.text || '').join(''), usage: { provider, model: j.model, input_tokens: j.usage?.input_tokens, output_tokens: j.usage?.output_tokens } }
  }
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('MOTION_COMPOSER_MODEL', 'gpt-4o'), max_tokens: 16000, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    })
    if (!r.ok) throw new Error(`openai ${r.status}`)
    const j = await r.json()
    return { html: j.choices[0].message.content, usage: { provider, model: j.model, ...j.usage } }
  }
  const r = await fetch(`${env('OLLAMA_URL').replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: env('MOTION_COMPOSER_MODEL', 'qwen2.5-coder:32b'), stream: false, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  })
  if (!r.ok) throw new Error(`ollama ${r.status}`)
  const j = await r.json()
  return { html: j.message.content, usage: { provider, model: j.model } }
}

const cleanHtml = (s) => {
  const t = String(s || '').replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim()
  const i = t.search(/<!doctype html|<html/i)
  return i >= 0 ? t.slice(i) : t
}

async function lint(dir) {
  // `hyperframes lint --json` prints one JSON document; errors are any finding objects with
  // severity "error" (warnings are fine). Walk the whole document so key names don't matter.
  const r = await run('npx', ['--no-install', 'hyperframes', 'lint', dir, '--json'], { timeoutMs: 120000 })
  const text = r.out.slice(r.out.indexOf('{'), r.out.lastIndexOf('}') + 1)
  const errors = []
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      if (v.severity === 'error') errors.push({ code: v.code, message: v.message, fixHint: v.fixHint })
      else Object.values(v).forEach(walk)
    }
  }
  try {
    walk(JSON.parse(text))
  } catch {
    if (r.code !== 0) errors.push({ message: (r.err || r.out).slice(0, 2000) })
  }
  return errors
}

async function compose(style, request, assets, dir, onStage) {
  const brief = compileBrief(style, request, assets)
  const usage = []
  let html = null
  try {
    onStage('composing', 15)
    const first = await llm(brief.system, brief.user)
    if (first) {
      usage.push(first.usage)
      html = cleanHtml(first.html)
      for (let round = 0; round < 2; round++) {
        await writeFile(join(dir, 'index.html'), html)
        const errs = await lint(dir)
        if (!errs.length) break
        log(`lint round ${round + 1}: ${errs.length} errors: ${[...new Set(errs.map((e) => e.code || 'unknown'))].join(', ')}`)
        onStage('composing', 25 + round * 10)
        const fix = await llm(brief.system, `${brief.user}\n\nYour previous index.html failed HyperFrames lint with these errors:\n${JSON.stringify(errs).slice(0, 6000)}\n\nPrevious file:\n${html}\n\nReturn the corrected complete index.html only.`)
        usage.push(fix.usage)
        html = cleanHtml(fix.html)
        if (round === 1) {
          await writeFile(join(dir, 'index.html'), html)
          if ((await lint(dir)).length) html = null // fall back below
        }
      }
    }
  } catch (e) {
    log('composer failed, using template:', e.message)
    html = null
  }
  const usedTemplate = !html
  if (!html) html = templateComposition(style, request.__project, assets)
  await writeFile(join(dir, 'index.html'), html)
  return { usage, usedTemplate, seed: brief.seed }
}

async function render(dir, out, { fps, quality }, onProgress) {
  const args = ['--no-install', 'hyperframes', 'render', dir, '--output', out, '--fps', String(fps), '--quality', quality, '--workers', RENDER_WORKERS]
  const r = await run('npx', args, {
    timeoutMs: 45 * 60 * 1000,
    onData: (d) => {
      const m = d.match(/(\d{1,3}(?:\.\d+)?)\s*%/)
      if (m) onProgress(Math.min(99, Number(m[1])))
    },
  })
  if (r.code !== 0) throw new Error(`render failed: ${(r.err || r.out).slice(-1500)}`)
  await stat(out)
}

async function poster(video, out, atSec) {
  await run('ffmpeg', ['-y', '-ss', String(atSec), '-i', video, '-frames:v', '1', '-q:v', '3', out], { timeoutMs: 60000 })
}

async function zipSource(dir, out) {
  const r = await run('zip', ['-r', '-q', out, 'index.html', 'assets', 'README.txt', 'style.json'], { cwd: dir, timeoutMs: 120000 })
  if (r.code !== 0) throw new Error('zip failed: ' + r.err)
}

/* ───────────── jobs ───────────── */
async function styleById(id) {
  const { data } = await db.from('motion_styles').select('spec').eq('id', id).maybeSingle()
  return data?.spec || LIB.styles.find((s) => s.id === id)
}

async function heartbeat(jobId, patch = {}) {
  await db.from('motion_render_jobs').update({ heartbeat_at: new Date().toISOString(), ...patch }).eq('id', jobId)
}

async function runProjectJob(job, dir) {
  const { data: p, error } = await db.from('motion_projects').select('*').eq('id', job.project_id).single()
  if (error) throw new Error(error.message)
  const setP = (patch) => db.from('motion_projects').update(patch).eq('id', p.id)
  const style = await styleById(p.style_id)
  if (!style) throw new Error(`style ${p.style_id} not found`)
  await mkdir(join(dir, 'assets'), { recursive: true })

  const assets = { files: {} }
  if (p.audio_b2_key) {
    const raw = join(dir, 'assets', 'audio-source' + (extname(p.audio_b2_key) || '.bin'))
    await b2Get(p.audio_b2_key, raw)
    const conv = await run('ffmpeg', ['-y', '-i', raw, '-vn', '-ac', '2', '-ar', '48000', '-b:a', '256k', join(dir, 'assets', 'audio.mp3')], { timeoutMs: 300000 })
    if (conv.code !== 0) throw new Error('Could not read the audio file: ' + conv.err.slice(-400))
    await rm(raw)
    assets.audioSrc = 'assets/audio.mp3'
    assets.files['assets/audio.mp3'] = 'soundtrack (id="soundtrack")'
  }
  if (p.start_image_b2_key) {
    const ext = extname(p.start_image_b2_key).toLowerCase() || '.png'
    await b2Get(p.start_image_b2_key, join(dir, 'assets', 'start' + ext))
    assets.startImageSrc = 'assets/start' + ext
    assets.files[assets.startImageSrc] = 'the uploaded start image (frame one)'
  }

  const request = {
    mode: p.mode, format: p.format, durationSec: Number(p.duration_sec), fps: p.fps, title: p.title, idea: p.idea, script: p.script,
    property: p.property, brand: p.brand, audio: p.audio_features, captions: p.captions,
    startImage: p.start_image_description ? { description: p.start_image_description } : null, __project: p,
  }
  const stage = async (status, progress) => { await setP({ status, progress }); await heartbeat(job.id) }
  const { usage, usedTemplate, seed } = await compose(style, request, assets, dir, stage)

  await writeFile(join(dir, 'style.json'), JSON.stringify(style, null, 2))
  await writeFile(join(dir, 'README.txt'), `${p.title}\nStyle: ${style.name} (${style.category})\nMade with SWADEBASE Motion Studio (adapter ${ADAPTER_VERSION}).\n\nEdit index.html, then:\n  npx hyperframes preview\n  npx hyperframes render --quality high\n`)

  await stage('rendering', 40)
  const out = join(dir, 'render.mp4')
  let last = 0
  await render(dir, out, { fps: p.fps, quality: p.quality }, (pct) => {
    const prog = Math.round(40 + pct * 0.55)
    if (prog - last >= 5) { last = prog; setP({ progress: prog }); heartbeat(job.id) }
  })
  await poster(out, join(dir, 'poster.jpg'), Math.min(Number(p.duration_sec) * 0.6, Number(p.duration_sec) - 0.5))
  await zipSource(dir, join(dir, 'source.zip'))

  const base = `${PREFIX}/${p.owner_user_id}/projects/${p.id}/${Date.now()}`
  const video = await b2Put(`${base}/video.mp4`, out, 'video/mp4')
  const zip = await b2Put(`${base}/source.zip`, join(dir, 'source.zip'), 'application/zip')
  const html = await b2Put(`${base}/index.html`, join(dir, 'index.html'), 'text/html')
  let posterKey = null
  try { posterKey = await b2Put(`${base}/poster.jpg`, join(dir, 'poster.jpg'), 'image/jpeg') } catch {}
  const bytes = (await stat(out)).size
  await setP({
    status: 'ready', progress: 100, video_b2_key: video, source_zip_b2_key: zip, composition_b2_key: html, poster_b2_key: posterKey, error_message: null,
    render_meta: { worker: WORKER_ID, adapter: ADAPTER_VERSION, used_template: usedTemplate, seed, bytes, rendered_at: new Date().toISOString() },
    cost: { composer: usage },
  })
}

async function runSampleJob(job, dir) {
  const style = await styleById(job.style_id)
  if (!style) throw new Error(`style ${job.style_id} not found`)
  await db.from('motion_styles').update({ sample_status: 'rendering' }).eq('id', style.id)
  await mkdir(join(dir, 'assets'), { recursive: true })
  const req = sampleRequest(style)
  const pseudo = { id: `sample-${style.id}`, title: style.name, idea: 'One spark. A rhythm. An idea takes shape.', format: '16:9', duration_sec: 8 }
  const { usedTemplate } = await compose(style, { ...req, __project: pseudo }, { files: {} }, dir, () => heartbeat(job.id))
  const out = join(dir, 'sample.mp4')
  await render(dir, out, { fps: 30, quality: 'draft' }, () => heartbeat(job.id))
  await poster(out, join(dir, 'poster.jpg'), 5)
  const base = `${PREFIX}/library/samples/${style.id}/${Date.now()}`
  const video = await b2Put(`${base}/sample.mp4`, out, 'video/mp4')
  const html = await b2Put(`${base}/index.html`, join(dir, 'index.html'), 'text/html')
  let posterKey = null
  try { posterKey = await b2Put(`${base}/poster.jpg`, join(dir, 'poster.jpg'), 'image/jpeg') } catch {}
  await db.from('motion_styles').update({
    sample_status: 'ready', sample_video_b2_key: video, sample_poster_b2_key: posterKey, sample_composition_b2_key: html, sample_updated_at: new Date().toISOString(),
  }).eq('id', style.id)
  if (usedTemplate) log(`sample ${style.id} used the template composer (no LLM configured or lint failed)`)
}

async function tick() {
  const { data: job, error } = await db.rpc('claim_motion_render_job', { p_worker_id: WORKER_ID })
  if (error) { log('claim error', error.message); return false }
  if (!job?.id) return false
  log(`job ${job.id} ${job.kind} ${job.project_id || job.style_id}`)
  const dir = join(JOB_ROOT, job.id)
  await mkdir(dir, { recursive: true })
  const beat = setInterval(() => heartbeat(job.id), 30000)
  try {
    if (job.kind === 'style_sample') await runSampleJob(job, dir)
    else await runProjectJob(job, dir)
    await db.from('motion_render_jobs').update({ status: 'done', completed_at: new Date().toISOString(), error_message: null }).eq('id', job.id)
    log(`job ${job.id} done`)
  } catch (e) {
    const msg = String(e.message || e).slice(0, 1500)
    log(`job ${job.id} failed: ${msg}`)
    const retry = job.attempts < job.max_attempts
    await db.from('motion_render_jobs').update({ status: retry ? 'queued' : 'failed', error_message: msg, completed_at: retry ? null : new Date().toISOString() }).eq('id', job.id)
    if (!retry) {
      if (job.kind === 'style_sample') await db.from('motion_styles').update({ sample_status: 'failed' }).eq('id', job.style_id)
      else await db.from('motion_projects').update({ status: 'failed', error_message: msg.split('\n')[0].slice(0, 300) }).eq('id', job.project_id)
    }
  } finally {
    clearInterval(beat)
    await rm(dir, { recursive: true, force: true })
  }
  return true
}

async function main() {
  log(`motion worker up, adapter ${ADAPTER_VERSION}, ${LIB.count} styles`)
  const doctor = await run('npx', ['--no-install', 'hyperframes', 'doctor'], { timeoutMs: 120000 })
  log('hyperframes doctor:', (doctor.out || doctor.err).trim().split('\n').slice(-6).join(' | '))
  for (;;) {
    let worked = false
    try { worked = await tick() } catch (e) { log('tick error', e.message) }
    if (!worked) await new Promise((r) => setTimeout(r, POLL_MS))
  }
}
if (process.argv.includes('--once')) tick().then((w) => { log(w ? 'processed one job' : 'queue empty'); process.exit(0) })
else main()
