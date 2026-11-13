// SWADE Learn render job. A Video Studio pack becomes a local MP4 plus a source ZIP.
// Kokoro (or a local PCM stand-in) narrates. ElevenLabs and Together run only when
// PREMIUM_VIDEO_ENABLED=true and both ai_can_spend and a recorded budget allow it.

import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hyperframesHtml } from './hyperframes.mjs'
import { createLedger, premiumDecision } from './ledger.mjs'
import { elevenLabsSpeech, mixNarration, refusePaidFetch, synthesizeKokoro, togetherVideo } from './narration.mjs'
import { validatePack } from './pack.mjs'
import { renderKey } from './store.mjs'
import { zipDirectory } from './zip.mjs'

const here = dirname(fileURLToPath(import.meta.url))

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(file)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function fail(code, result = {}) {
  const error = new Error(code)
  error.code = code
  error.result = { status: code, ...result }
  return error
}

function charactersOf(pack) {
  return pack.clips.reduce((sum, clip) => sum + clip.narration.length, 0)
}

async function guardPremium(ledger, asks) {
  const decisions = asks.map((ask) => ({ ask, decision: premiumDecision(ledger, ask) }))
  const blocked = decisions.filter((item) => !item.decision.allowed)
  if (!blocked.length) return decisions
  for (const item of blocked) {
    ledger.record({
      project: 'swade-learn',
      feature: item.ask.feature,
      provider: item.ask.provider,
      model: item.ask.model,
      status: 'blocked',
      request_id: item.ask.request_id,
      units: item.ask.units,
      meta: {
        reason: 'spend_blocked',
        ai_can_spend: item.decision.ai_can_spend,
        budget: item.decision.budget,
        priced: item.decision.priced,
      },
    })
  }
  throw fail('spend_blocked', {
    provider: blocked[0].ask.provider,
    ai_can_spend: blocked[0].decision.ai_can_spend,
    budget: blocked[0].decision.budget,
    priced: blocked[0].decision.priced,
    ai_usage_ledger: ledger.rows(),
  })
}

export async function runSwadeLearnPack({
  pack: rawPack,
  ledger = createLedger(),
  store,
  dir,
  renderId,
  premiumEnabled = false,
  renderer,
  fetchImpl = refusePaidFetch,
  apiKeys = {},
  skipRender = false,
  renderOptions = {},
  onProgress,
  synthesize = synthesizeKokoro,
}) {
  const validated = validatePack(rawPack)
  if (!validated.ok) throw fail('invalid_pack', { errors: validated.errors })
  const pack = validated.pack
  const id = renderId || pack.pack_id
  const voice = pack.voice.provider
  const visuals = pack.visuals.provider
  const asks = []
  if (voice === 'elevenlabs') {
    asks.push({
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      feature: 'narration',
      units: { character: charactersOf(pack) },
      request_id: `${id}:narration`,
    })
  }
  if (visuals === 'together') {
    asks.push({
      provider: 'together',
      model: 'Wan-AI/wan2.7-t2v',
      feature: 'video',
      units: { request: pack.clips.length },
      request_id: `${id}:video`,
    })
  }

  if (asks.length && !premiumEnabled) {
    for (const ask of asks) {
      ledger.record({
        project: 'swade-learn',
        feature: ask.feature,
        provider: ask.provider,
        model: ask.model,
        status: 'blocked',
        request_id: ask.request_id,
        units: ask.units,
        meta: { reason: 'premium_disabled' },
      })
    }
    throw fail('premium_disabled', { ai_usage_ledger: ledger.rows() })
  }
  if (asks.length) await guardPremium(ledger, asks)

  await mkdir(join(dir, 'audio'), { recursive: true })
  await mkdir(join(dir, 'public', 'narration'), { recursive: true })
  await mkdir(join(dir, 'source', 'assets'), { recursive: true })

  const narrations = []
  if (voice === 'elevenlabs') {
    const apiKey = apiKeys.elevenlabs || ''
    for (const clip of pack.clips) {
      const file = join(dir, 'audio', `${clip.id}.mp3`)
      const spoken = await elevenLabsSpeech({
        fetchImpl,
        apiKey,
        voiceId: pack.voice.voice_id,
        text: clip.narration,
        dest: file,
      })
      ledger.record({
        project: 'swade-learn',
        feature: 'narration',
        provider: 'elevenlabs',
        model: spoken.model,
        status: 'ok',
        request_id: `${id}:${clip.id}`,
        units: { character: spoken.characters },
        meta: { clip_id: clip.id },
      })
      narrations.push({ ...spoken, file, clip })
    }
  } else {
    for (const clip of pack.clips) {
      const file = join(dir, 'audio', `${clip.id}.wav`)
      const spoken = await synthesize(clip.narration, file, { voice: pack.voice.voice_id || 'af_heart' })
      ledger.record({
        project: 'swade-learn',
        feature: 'narration',
        provider: 'swade_voice',
        model: spoken.model,
        status: 'ok',
        request_id: `${id}:${clip.id}`,
        units: { character: spoken.characters, audio_second: spoken.audio_seconds },
        meta: { clip_id: clip.id, engine: spoken.engine, requested_provider: 'kokoro', ...(spoken.meta || {}) },
      })
      narrations.push({ ...spoken, file, clip })
    }
  }

  let togetherResult = null
  if (visuals === 'together') {
    const apiKey = apiKeys.together || ''
    togetherResult = await togetherVideo({
      fetchImpl,
      apiKey,
      prompt: pack.clips.map((clip) => clip.on_screen).join(' '),
      seconds: pack.clips[0].duration_sec,
    })
    ledger.record({
      project: 'swade-learn',
      feature: 'video',
      provider: 'together',
      model: togetherResult.model,
      status: 'ok',
      request_id: `${id}:video`,
      units: { request: 1 },
      meta: { remote_status: togetherResult.remote_status },
    })
  }

  if (skipRender || visuals === 'together') {
    return {
      status: visuals === 'together' ? 'submitted' : 'narrated',
      pack_id: pack.pack_id,
      render_id: id,
      narration: narrations.map(({ provider, model, engine, clip }) => ({ clip_id: clip.id, provider, model, engine })),
      together: togetherResult,
      ai_usage_ledger: ledger.rows(),
      paid_calls: narrations.filter((item) => item.provider !== 'swade_voice').length + (togetherResult ? 1 : 0),
    }
  }

  const engine = renderer || (visuals === 'hyperframes' ? 'hyperframes' : 'remotion')
  for (const item of narrations) {
    const ext = item.file.endsWith('.mp3') ? 'mp3' : 'wav'
    const publicName = `narration/${item.clip.id}.${ext}`
    await copyFile(item.file, join(dir, 'public', publicName))
    await copyFile(item.file, join(dir, 'source', 'assets', `${item.clip.id}.${ext}`))
    item.publicName = publicName
  }
  const mix = join(dir, 'source', 'assets', 'narration.wav')
  await mixNarration(
    narrations.map((item) => ({ file: item.file, durationSec: item.clip.duration_sec })),
    mix,
  )

  const html = hyperframesHtml(pack)
  await writeFile(join(dir, 'source', 'index.html'), html)
  await writeFile(join(dir, 'source', 'pack.json'), JSON.stringify(pack, null, 2))
  await copyFile(join(here, 'remotion/src/Lesson.jsx'), join(dir, 'source', 'Lesson.jsx'))
  await writeFile(
    join(dir, 'source', 'README.txt'),
    `${pack.title}\nSWADE Learn production pack ${pack.pack_id}\nRenderer: ${engine}\n\nEdit index.html, then from this folder:\n  npx hyperframes render --quality draft\nOr render Lesson.jsx with Remotion 4.0.543 on CPU.\nNarration defaults to local Kokoro. ElevenLabs and Together stay off unless PREMIUM_VIDEO_ENABLED=true and ai_can_spend allows the estimate.\n`,
  )

  const videoFile = join(dir, 'video.mp4')
  if (engine === 'hyperframes') {
    const { renderWithHyperframes } = await import('./render-hyperframes.mjs')
    await renderWithHyperframes(join(dir, 'source'), videoFile, { fps: renderOptions.fps || 8, quality: 'draft' })
  } else {
    const { renderWithRemotion } = await import('./render-remotion.mjs')
    await renderWithRemotion({
      publicDir: join(dir, 'public'),
      outFile: videoFile,
      onProgress,
      props: {
        title: pack.title,
        fps: renderOptions.fps || 8,
        width: renderOptions.width || 640,
        height: renderOptions.height || 360,
        concurrency: renderOptions.concurrency || 1,
        clips: narrations.map((item) => ({
          ...item.clip,
          audioFile: item.publicName,
        })),
        graphics: pack.graphics,
      },
    })
  }

  const zipFile = join(dir, 'source.zip')
  await zipDirectory(join(dir, 'source'), zipFile)
  const mp4Sha = await sha256(videoFile)
  const zipSha = await sha256(zipFile)
  const videoKey = renderKey(id, 'video.mp4')
  const zipKey = renderKey(id, 'source.zip')
  const manifestKey = renderKey(id, 'manifest.json')
  const manifest = {
    pack_id: pack.pack_id,
    render_id: id,
    video_b2_key: videoKey,
    source_zip_b2_key: zipKey,
    mp4_sha256: mp4Sha,
    source_zip_sha256: zipSha,
    renderer: engine,
    paid_calls: 0,
    narration_provider: 'swade_voice',
  }
  const manifestFile = join(dir, 'manifest.json')
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2))
  await store.put(videoKey, videoFile, 'video/mp4')
  await store.put(zipKey, zipFile, 'application/zip')
  await store.put(manifestKey, manifestFile, 'application/json')

  ledger.record({
    project: 'swade-learn',
    feature: 'render',
    provider: engine === 'hyperframes' ? 'hyperframes' : 'remotion',
    model: engine === 'hyperframes' ? '0.8.206' : '4.0.543',
    status: 'ok',
    request_id: `${id}:render`,
    units: { request: 1 },
    meta: { mp4_sha256: mp4Sha, source_zip_sha256: zipSha, video_b2_key: videoKey, source_zip_b2_key: zipKey, renderer: engine },
  })

  return {
    status: 'ready',
    pack_id: pack.pack_id,
    render_id: id,
    video_b2_key: videoKey,
    source_zip_b2_key: zipKey,
    manifest_b2_key: manifestKey,
    checksums: { mp4_sha256: mp4Sha, source_zip_sha256: zipSha },
    renderer: engine,
    narration: narrations.map(({ provider, model, engine: voiceEngine, clip }) => ({
      clip_id: clip.id,
      provider,
      model,
      engine: voiceEngine,
    })),
    paid_calls: 0,
    ai_usage_ledger: ledger.rows(),
  }
}

export async function readPackFile(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}
