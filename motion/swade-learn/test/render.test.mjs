import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createLedger } from '../ledger.mjs'
import { refusePaidFetch } from '../narration.mjs'
import { runSwadeLearnPack } from '../pipeline.mjs'
import { localStore } from '../store.mjs'
import { samplePack } from './fixture.mjs'

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function ffprobe(file) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-show_streams', '-of', 'json', file])
    let out = ''
    child.stdout.on('data', (chunk) => {
      out += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`ffprobe ${code}`))
      else resolve(JSON.parse(out))
    })
  })
}

test('one pack renders locally with no paid calls', { timeout: 600_000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'swade-learn-render-'))
  const root = join(dir, 'store')
  const ledger = createLedger()
  let paid = 0
  try {
    const result = await runSwadeLearnPack({
      pack: samplePack(),
      ledger,
      store: localStore(root),
      dir: join(dir, 'job'),
      renderId: 'localrender01',
      premiumEnabled: false,
      renderer: 'remotion',
      fetchImpl: (url, init) => {
        const host = new URL(url).hostname
        if (host === 'api.elevenlabs.io' || host === 'api.together.ai') paid += 1
        return refusePaidFetch(url, init)
      },
      renderOptions: { fps: 8, width: 640, height: 360, concurrency: 1 },
    })
    assert.equal(result.status, 'ready')
    assert.equal(result.paid_calls, 0)
    assert.equal(result.narration_provider, 'swade_voice')
    assert.equal(paid, 0)
    assert.equal(result.video_b2_key, 'teachvirt/swade-learn/renders/localrender01/video.mp4')
    assert.equal(result.source_zip_b2_key, 'teachvirt/swade-learn/renders/localrender01/source.zip')
    const video = await readFile(join(root, result.video_b2_key))
    const zip = await readFile(join(root, result.source_zip_b2_key))
    const manifest = JSON.parse(await readFile(join(root, result.manifest_b2_key), 'utf8'))
    assert.equal(sha256(video), result.checksums.mp4_sha256)
    assert.equal(sha256(zip), result.checksums.source_zip_sha256)
    assert.equal(manifest.paid_calls, 0)
    assert.equal(manifest.narration_provider, 'swade_voice')
    assert.equal(manifest.mp4_sha256, result.checksums.mp4_sha256)
    assert.equal(manifest.source_zip_sha256, result.checksums.source_zip_sha256)
    const probe = await ffprobe(join(root, result.video_b2_key))
    const duration = Number(probe.format.duration)
    assert.ok(duration > 44 && duration < 47, `duration ${duration}`)
    assert.ok(probe.streams.some((stream) => stream.codec_type === 'video'))
    assert.ok(probe.streams.some((stream) => stream.codec_type === 'audio'))
    const narration = result.ai_usage_ledger.filter((row) => row.feature === 'narration')
    assert.equal(narration.length, 5)
    assert.ok(narration.every((row) => row.provider === 'swade_voice' && row.model === 'hexgrad/Kokoro-82M' && row.meta.engine === 'kokoro-js' && row.status === 'ok' && row.cost_usd === 0))
    const render = result.ai_usage_ledger.find((row) => row.feature === 'render')
    assert.equal(render.meta.mp4_sha256, result.checksums.mp4_sha256)
    assert.equal(render.meta.source_zip_sha256, result.checksums.source_zip_sha256)
    assert.equal(result.ai_usage_ledger.some((row) => row.provider === 'elevenlabs' || row.provider === 'together'), false)
    assert.match(zip.toString('utf8', 0, 2), /^PK/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
