import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import {
  CatalogError,
  PRESET_ID,
  assertPublishableKey,
  authoritativeDuration,
  buildLadder,
  decideDuration,
  displayedSize,
  hlsPrefix,
  isNative4k,
  posterKey,
} from '../../docker/volumes/functions/catalog-video/_shared/policy.mjs'

function run(command, args, { timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let settled = false
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn(value)
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish(reject, new CatalogError(504, `${command} exceeded ${timeoutMs}ms. The original is saved.`))
    }, timeoutMs)
    child.stdout.on('data', (chunk) => {
      out = (out + chunk).slice(-80_000)
    })
    child.stderr.on('data', (chunk) => {
      err = (err + chunk).slice(-120_000)
    })
    child.on('error', (error) => finish(reject, error))
    child.on('close', (code) => finish(resolve, { code, out, err }))
  })
}

function rotationOf(stream) {
  const tagged = Number(stream.tags?.rotate)
  if (Number.isFinite(tagged)) return tagged
  const side = (stream.side_data_list || []).find((item) => item.rotation != null)
  const value = Number(side?.rotation || 0)
  return Number.isFinite(value) ? value : 0
}

export async function probeFile(file, timeoutMs = 30_000) {
  const result = await run('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file,
  ], { timeoutMs })
  if (result.code !== 0) {
    throw new CatalogError(422, 'The server could not read this video. The original is saved.')
  }
  let data
  try {
    data = JSON.parse(result.out || '{}')
  } catch {
    throw new CatalogError(422, 'The server could not read this video. The original is saved.')
  }
  const video = (data.streams || []).find((stream) => stream.codec_type === 'video')
  if (!video) throw new CatalogError(422, 'The file has no video stream. The original is saved.')
  const audio = (data.streams || []).find((stream) => stream.codec_type === 'audio')
  const rotation = rotationOf(video)
  const shown = displayedSize(Number(video.width), Number(video.height), rotation)
  return {
    durationSec: authoritativeDuration(data.format?.duration, video.duration),
    width: shown.width,
    height: shown.height,
    rotation,
    codedWidth: Number(video.width),
    codedHeight: Number(video.height),
    videoCodec: video.codec_name || null,
    pixFmt: video.pix_fmt || null,
    audioCodec: audio?.codec_name || null,
  }
}

async function ffmpeg(args, timeoutMs) {
  const nice = await run('nice', ['-n', '15', 'ffmpeg', ...args], { timeoutMs })
  if (nice.code === 0) return nice
  if (nice.err?.includes('ENOENT') || nice.code == null) {
    return run('ffmpeg', args, { timeoutMs })
  }
  return nice
}

export async function packageHls({ input, outDir, ladder, hasAudio, timeoutMs, preset = 'veryfast', crf = 20, hlsTime = 6 }) {
  await mkdir(outDir, { recursive: true })
  for (const rung of ladder) {
    if (rung.height > 1080 || rung.width < 2) {
      throw new CatalogError(500, 'Refusing a rendition above 1080p.')
    }
    const dir = path.join(outDir, rung.id)
    await mkdir(dir, { recursive: true })
    const args = [
      '-y', '-nostdin', '-threads', '1', '-i', input,
      '-vf', `scale=${rung.width}:${rung.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
      '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
      '-preset', preset, '-crf', String(crf),
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      ...(hasAudio ? ['-c:a', 'aac', '-ac', '2', '-ar', '48000', '-b:a', '128k'] : ['-an']),
      '-f', 'hls', '-hls_time', String(hlsTime), '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(dir, 'seg%03d.ts'),
      path.join(dir, 'index.m3u8'),
    ]
    const result = await ffmpeg(args, timeoutMs)
    if (result.code !== 0) {
      throw new CatalogError(500, 'Transcode failed. The original is saved.')
    }
  }
  const poster = path.join(outDir, 'poster.jpg')
  const still = await ffmpeg([
    '-y', '-nostdin', '-ss', '0.2', '-i', input, '-frames:v', '1', '-q:v', '3', poster,
  ], Math.min(timeoutMs, 30_000))
  if (still.code !== 0) throw new CatalogError(500, 'Poster frame failed. The original is saved.')
  return { poster }
}

async function uploadDir(store, prefix, dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await uploadDir(store, `${prefix}/${entry.name}`, full)
      continue
    }
    if (entry.name === 'poster.jpg') continue
    const key = assertPublishableKey(`${prefix}/${entry.name}`)
    await store.putBytes(key, await readFile(full))
  }
}

async function hashFile(file) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

async function withMaster(asset, deps, fn) {
  if (!deps.store.download || deps.store.kind === 'local') {
    return fn(deps.store.localPath(asset.master_key))
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), 'catalog-master-'))
  const file = path.join(dir, 'original')
  try {
    await deps.store.download(asset.master_key, file)
    return await fn(file)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function applyStoredProbe(asset, probe, deps) {
  if (asset.source_type !== 'original' || !asset.master_key) {
    throw new CatalogError(409, 'Only an original master can be probed.')
  }
  const before = deps.store.stat ? await deps.store.stat(asset.master_key) : null
  const decision = decideDuration(probe.durationSec)
  const status = decision.decision === 'accepted'
    ? 'duration_accepted'
    : decision.decision === 'needs_episode_submission'
      ? 'needs_episode_submission'
      : 'failed'
  await deps.db.updateAsset(asset.id, {
    duration_probe_sec: probe.durationSec,
    duration_decision: decision.decision,
    width: probe.width,
    height: probe.height,
    rotation: probe.rotation,
    video_codec: probe.videoCodec,
    pix_fmt: probe.pixFmt,
    audio_codec: probe.audioCodec,
    has_audio: !!probe.audioCodec,
    native_4k: isNative4k(probe.codedWidth, probe.codedHeight, probe.rotation),
    status,
    error_message: decision.publishable ? null : decision.message,
  })
  if (before && deps.store.stat) {
    const after = await deps.store.stat(asset.master_key)
    if (!after || after.bytes !== before.bytes) {
      throw new CatalogError(500, 'Probe changed the original. Encoding stopped.')
    }
  }
  if (decision.decision === 'accepted' && (asset.rights_web || asset.rights_roku)) {
    await deps.db.enqueueJob({
      assetId: asset.id,
      creatorId: asset.creator_user_id,
      kind: 'package',
      preset: PRESET_ID,
      sha: asset.sha256,
    })
    await deps.db.updateAsset(asset.id, { status: 'queued' })
  }
  return decision
}

export async function runProbe(asset, deps) {
  return withMaster(asset, deps, async (file) => {
    if (!asset.sha256 || String(asset.sha256).startsWith('pending:')) {
      asset = await deps.db.updateAsset(asset.id, { sha256: await hashFile(file) })
    }
    const probe = await probeFile(file, deps.probeTimeoutMs || 30_000)
    return applyStoredProbe(asset, probe, deps)
  })
}

export async function runPackage(asset, deps) {
  if (asset.source_type !== 'original') {
    throw new CatalogError(409, 'YouTube videos are not transcoded.')
  }
  if (asset.duration_decision !== 'accepted' || !(Number(asset.duration_probe_sec) <= 600)) {
    throw new CatalogError(409, 'Packaging requires a probed duration of 10 minutes or less. The original was not cut.')
  }
  const prefix = hlsPrefix(asset.tenant, asset.creator_user_id, asset.id)
  const poster = posterKey(asset.tenant, asset.creator_user_id, asset.id)
  if (asset.status === 'ready' && asset.sha256 && asset.hls_prefix === prefix && await deps.store.exists(poster)) {
    return { skipped: true }
  }
  const ladder = buildLadder(asset.width, asset.height)
  for (const rung of ladder) {
    if (rung.height > asset.height || rung.height > 1080) {
      throw new CatalogError(500, 'Ladder tried to upscale the master.')
    }
  }
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'catalog-video-'))
  try {
    await deps.db.updateAsset(asset.id, { status: 'encoding' })
    return await withMaster(asset, deps, async (masterPath) => {
      if (path.resolve(masterPath).startsWith(path.resolve(tmp))) {
        throw new CatalogError(500, 'Work directory collided with the original.')
      }
      const packaged = await packageHls({
        input: masterPath,
        outDir: tmp,
        ladder,
        hasAudio: asset.has_audio,
        timeoutMs: deps.transcodeTimeoutMs || 20 * 60 * 1000,
        preset: deps.x264Preset || 'veryfast',
        crf: deps.x264Crf || 20,
        hlsTime: deps.hlsTime || 6,
      })
      await uploadDir(deps.store, prefix, tmp)
      await deps.store.putBytes(poster, await readFile(packaged.poster))
      await deps.db.updateAsset(asset.id, {
        status: 'ready',
        hls_prefix: prefix,
        poster_key: poster,
        ladder,
        error_message: null,
      })
      return { skipped: false, ladder }
    })
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

export async function processNext(deps) {
  const job = await deps.db.claim(deps.workerId || 'catalog-video-worker')
  if (!job) return null
  const beat = setInterval(() => {
    Promise.resolve(deps.db.heartbeat(job.id)).catch(() => {})
  }, 30_000)
  if (beat.unref) beat.unref()
  try {
    const asset = await deps.db.getAsset(job.asset_id)
    if (!asset) throw new CatalogError(404, 'Asset for this job no longer exists. Nothing was deleted from storage.')
    if (job.kind === 'probe') await runProbe(asset, deps)
    else if (job.kind === 'package') await runPackage(await deps.db.getAsset(job.asset_id), deps)
    else throw new CatalogError(500, 'Unknown catalog job.')
    await deps.db.completeJob(job.id)
    return job
  } catch (error) {
    await deps.db.failJob(job.id, error.message || 'Catalog job failed.')
    const asset = await deps.db.getAsset(job.asset_id)
    if (asset && asset.status !== 'needs_episode_submission' && asset.master_key) {
      await deps.db.updateAsset(asset.id, {
        status: asset.duration_decision === 'needs_episode_submission' ? asset.status : 'failed',
        error_message: error.message || 'Catalog job failed. The original is saved.',
      })
    }
    return { ...job, failed: true, error }
  } finally {
    clearInterval(beat)
  }
}
