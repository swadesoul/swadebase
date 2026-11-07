import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createMemoryDb } from '../../docker/volumes/functions/catalog-video/_shared/memory.mjs'
import { applyStoredProbe, processNext } from '../worker/encode.mjs'
import { createLocalStore } from '../localstore.mjs'
import { startCatalogServer } from '../server.mjs'

const SIGNING = 'test-signing-key-at-least-32-characters'
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    child.stderr.on('data', (chunk) => { err += chunk })
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(err.slice(-500))))
  })
}

function testAuth() {
  const users = new Map([
    ['token-a', { id: USER_A, email: 'a@example.com' }],
    ['token-b', { id: USER_B, email: 'b@example.com' }],
  ])
  return {
    async userFromRequest(req) {
      const token = (req.headers.get('authorization') || '').match(/^Bearer\s+(\S+)/i)?.[1]
      return token ? users.get(token) || null : null
    },
  }
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return address.port
}

async function api(port, method, urlPath, { token, body, raw, headers } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}/functions/v1/catalog-video${urlPath}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  const text = await response.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: response.status, json, text, headers: response.headers }
}

test('original upload, duration gate, HLS playback, and YouTube embed', { timeout: 120_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'catalog-video-'))
  const fixture = path.join(root, 'fixture.mp4')
  await run('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=24:duration=2',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-t', '2', fixture,
  ])
  const bytes = await readFile(fixture)
  const db = createMemoryDb()
  const store = createLocalStore(root)
  const deps = {
    auth: testAuth(),
    db,
    store,
    enabled: true,
    signingKey: SIGNING,
    publicBase: '',
    maxMasterBytes: 8 * 1024 * 1024 * 1024,
    hlsTime: 1,
    transcodeTimeoutMs: 60_000,
    workerId: 'test-worker',
  }
  const server = startCatalogServer(deps)
  const port = await listen(server)
  deps.publicBase = `http://127.0.0.1:${port}/functions/v1/catalog-video`
  try {
    const health = await api(port, 'GET', '/health')
    assert.equal(health.status, 200)
    assert.equal(health.json.four_k, 'disabled')
    assert.equal(health.json.billing, 'unconfigured')
    assert.equal(health.json.motion_studio_queue, 'not_used')

    const anonymous = await api(port, 'POST', '/assets', { body: { tenant: 'abagale', title: 'No', source_type: 'original', rights: { web: true, roku: true } } })
    assert.equal(anonymous.status, 401)

    const created = await api(port, 'POST', '/assets', {
      token: 'token-a',
      headers: { 'idempotency-key': 'upload-1' },
      body: { tenant: 'abagale', title: 'Short', source_type: 'original', rights: { web: true, roku: true } },
    })
    assert.equal(created.status, 201)
    const assetId = created.json.asset.id
    const again = await api(port, 'POST', '/assets', {
      token: 'token-a',
      headers: { 'idempotency-key': 'upload-1' },
      body: { tenant: 'abagale', title: 'Short', source_type: 'original', rights: { web: true, roku: true } },
    })
    assert.equal(again.json.asset.id, assetId)
    assert.equal(await api(port, 'GET', `/assets/${assetId}`, { token: 'token-b' }).then((res) => res.status), 404)

    const upload = await api(port, 'POST', `/assets/${assetId}/uploads`, {
      token: 'token-a',
      body: { bytes: bytes.length, content_type: 'video/mp4' },
    })
    assert.equal(upload.status, 200)
    assert.equal(upload.json.part_count, 1)
    const put = await fetch(upload.json.parts[0].url, { method: 'PUT', body: bytes })
    const putBody = await put.json()
    assert.equal(put.status, 200, JSON.stringify(putBody))
    const finished = await api(port, 'POST', `/assets/${assetId}/uploads/complete`, {
      token: 'token-a',
      body: { upload_id: upload.json.upload_id, parts: [{ part_number: 1, etag: putBody.etag }] },
    })
    assert.equal(finished.status, 200, JSON.stringify(finished.json))
    const masterBefore = await store.stat(finished.json.asset.master_key)

    for (let i = 0; i < 4; i++) {
      const job = await processNext(deps)
      if (!job) break
      if (job.failed) throw job.error
    }
    const ready = await api(port, 'GET', `/assets/${assetId}`, { token: 'token-a' })
    assert.equal(ready.json.asset.status, 'ready', JSON.stringify(ready.json))
    assert.equal(ready.json.asset.duration_decision, 'accepted')
    assert.ok(ready.json.asset.duration_probe_sec <= 600)
    assert.equal(ready.json.four_k.entitled, false)
    assert.equal(ready.json.four_k.included_in_manifest, false)
    const masterAfter = await store.stat(finished.json.asset.master_key)
    assert.equal(masterAfter.bytes, masterBefore.bytes)
    const keys = []
    async function walk(dir) {
      const { readdir } = await import('node:fs/promises')
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) await walk(full)
        else keys.push(full)
      }
    }
    await walk(path.join(root, 'objects'))
    assert.equal(keys.some((key) => key.includes(`${path.sep}4k${path.sep}`)), false)

    const play = await api(port, 'GET', `/assets/${assetId}/playback?target=roku`, { token: 'token-a' })
    assert.equal(play.status, 200, JSON.stringify(play.json))
    assert.equal(play.json.mode, 'hls')
    assert.equal(play.json.hls.max_height, 240)
    assert.match(play.json.hls.codecs, /avc1/)
    assert.ok(play.json.roku.stream_url)
    const master = await fetch(play.json.hls.manifest_url)
    const masterText = await master.text()
    assert.equal(master.status, 200)
    assert.match(masterText, /#EXTM3U/)
    assert.match(masterText, /avc1\.640028/)
    assert.doesNotMatch(masterText, /2160/)
    const variantUrl = masterText.split('\n').map((line) => line.trim()).find((line) => line.startsWith('http'))
    const variant = await fetch(variantUrl)
    const variantText = await variant.text()
    assert.match(variantText, /#EXTINF/)
    const segmentUrl = variantText.split('\n').map((line) => line.trim()).find((line) => line.startsWith('http'))
    const segment = await fetch(segmentUrl)
    assert.equal(segment.headers.get('content-type'), 'video/mp2t')
    const segmentBytes = Buffer.from(await segment.arrayBuffer())
    const segmentFile = path.join(root, 'seg.ts')
    await writeFile(segmentFile, segmentBytes)
    const probed = await new Promise((resolve, reject) => {
      const child = spawn('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,height', '-of', 'json', segmentFile], { stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      child.stdout.on('data', (chunk) => { out += chunk })
      child.on('close', (code) => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(out)))
    })
    assert.equal(probed.streams[0].codec_name, 'h264')
    assert.ok(probed.streams[0].height <= 240)
    const ranged = await fetch(segmentUrl, { headers: { range: 'bytes=0-15' } })
    assert.equal(ranged.status, 206)
    await run('ffmpeg', ['-v', 'error', '-i', play.json.hls.manifest_url, '-f', 'null', '-'])

    const youtube = await api(port, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'blacktales', title: 'Embed', source_type: 'youtube_embed', youtube_id: 'dQw4w9Wgxcq', rights: { web: true, roku: false } },
    })
    assert.equal(youtube.status, 201)
    const embed = await api(port, 'GET', `/assets/${youtube.json.asset.id}/playback?target=roku`, { token: 'token-a' })
    assert.equal(embed.json.mode, 'youtube_embed')
    assert.equal(embed.json.hls, null)
    assert.equal(embed.json.roku, null)
    const rokuRight = await api(port, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'abagale', title: 'Bad', source_type: 'youtube_embed', youtube_id: 'dQw4w9Wgxcq', rights: { web: true, roku: true } },
    })
    assert.equal(rokuRight.status, 400)

    const series = await api(port, 'POST', '/series', { token: 'token-a', body: { tenant: 'abagale', title: 'Long story' } })
    const longId = (await api(port, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'abagale', title: 'Full cut', source_type: 'original', rights: { web: true, roku: false } },
    })).json.asset.id
    await store.putBytes(`catalog/abagale/${USER_A}/masters/${longId}/original`, Buffer.from('original-bytes'))
    await db.updateAsset(longId, {
      status: 'uploaded',
      master_key: `catalog/abagale/${USER_A}/masters/${longId}/original`,
      sha256: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
      bytes: 14,
    })
    const decision = await applyStoredProbe(await db.getAsset(longId), {
      durationSec: 600.001,
      width: 1920,
      height: 1080,
      rotation: 0,
      codedWidth: 1920,
      codedHeight: 1080,
      videoCodec: 'h264',
      pixFmt: 'yuv420p',
      audioCodec: 'aac',
    }, deps)
    assert.equal(decision.decision, 'needs_episode_submission')
    assert.equal((await store.stat(`catalog/abagale/${USER_A}/masters/${longId}/original`)).bytes, 14)
    assert.equal(db.jobs().some((job) => job.asset_id === longId && job.kind === 'package'), false)
    const blocked = await api(port, 'GET', `/assets/${longId}/playback`, { token: 'token-a' })
    assert.equal(blocked.json.mode, 'needs_episode_submission')
    assert.equal(blocked.json.hls, null)
    assert.equal(blocked.json.master_retained, true)
    const linked = await api(port, 'POST', `/series/${series.json.series.id}/source-master`, {
      token: 'token-a',
      body: { asset_id: longId },
    })
    assert.equal(linked.status, 200, JSON.stringify(linked.json))
    const episode = await api(port, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'abagale', title: 'Part 1', episode_title: 'Part 1', series_id: series.json.series.id, episode_order: 1, source_type: 'original', rights: { web: true, roku: true } },
    })
    assert.equal(episode.status, 201)
    const duplicate = await api(port, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'abagale', title: 'Also 1', episode_title: 'Also 1', series_id: series.json.series.id, episode_order: 1, source_type: 'original', rights: { web: true, roku: true } },
    })
    assert.equal(duplicate.status, 409)
    const show = await api(port, 'GET', `/series/${series.json.series.id}`, { token: 'token-a' })
    assert.equal(show.json.series.source_master_asset_id, longId)
    assert.equal(show.json.episodes.some((item) => item.id === longId), false)
    assert.equal(show.json.episodes[0].episode_order, 1)

    const quote = await db.getEntitlement('abagale', USER_A)
    assert.equal(quote.billing_status, 'unconfigured')
    assert.equal(quote.price_quote_cents, 10000)
    assert.equal(quote.quota_bytes, null)
    assert.equal(quote.four_k_playback_until, null)
  } finally {
    server.close()
    await rm(root, { recursive: true, force: true })
  }
})
