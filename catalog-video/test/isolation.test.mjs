import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createMemoryDb } from '../../docker/volumes/functions/catalog-video/_shared/memory.mjs'
import { signToken } from '../../docker/volumes/functions/catalog-video/_shared/tokens.mjs'
import { handle } from '../../docker/volumes/functions/catalog-video/_shared/handler.mjs'
import { createLocalStore } from '../localstore.mjs'

const SIGNING = 'test-signing-key-at-least-32-characters'
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

function depsFor(root) {
  const users = new Map([
    ['token-a', { id: USER_A }],
    ['token-b', { id: USER_B }],
  ])
  return {
    enabled: true,
    signingKey: SIGNING,
    maxMasterBytes: 8 * 1024 * 1024 * 1024,
    publicBase: 'http://catalog.local/functions/v1/catalog-video',
    db: createMemoryDb(),
    store: createLocalStore(root),
    auth: {
      async userFromRequest(req) {
        const token = (req.headers.get('authorization') || '').match(/^Bearer\s+(\S+)/i)?.[1]
        return token ? users.get(token) || null : null
      },
    },
  }
}

async function call(deps, method, urlPath, { token, body } = {}) {
  const response = await handle(new Request(`http://catalog.local/functions/v1/catalog-video${urlPath}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }), deps)
  const json = await response.json()
  return { status: response.status, json }
}

test('catalog video stays off until explicitly enabled', async () => {
  const response = await handle(new Request('http://catalog.local/functions/v1/catalog-video/assets', { method: 'POST' }), {
    enabled: false,
    auth: { async userFromRequest() { return { id: USER_A } } },
  })
  assert.equal(response.status, 503)
  const health = await handle(new Request('http://catalog.local/functions/v1/catalog-video/health'), { enabled: false })
  assert.equal((await health.json()).enabled, false)
})

test('tenant, owner, and playback signature isolation', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'catalog-iso-'))
  const deps = depsFor(root)
  try {
    const foreign = await call(deps, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'maestro', title: 'Nope', source_type: 'original', rights: { web: true, roku: false } },
    })
    assert.equal(foreign.status, 400)

    const mine = await call(deps, 'POST', '/assets', {
      token: 'token-a',
      body: { tenant: 'abagale', title: 'Mine', source_type: 'original', rights: { web: true, roku: true } },
    })
    const other = await call(deps, 'POST', '/assets', {
      token: 'token-b',
      body: { tenant: 'blacktales', title: 'Theirs', source_type: 'original', rights: { web: true, roku: true } },
    })
    assert.equal(mine.status, 201)
    const denied = await call(deps, 'GET', `/assets/${mine.json.asset.id}`, { token: 'token-b' })
    assert.equal(denied.status, 404)
    const playbackDenied = await call(deps, 'GET', `/assets/${mine.json.asset.id}/playback?target=web`, { token: 'token-b' })
    assert.equal(playbackDenied.status, 404)

    const assetA = mine.json.asset.id
    const assetB = other.json.asset.id
    const prefix = `catalog/abagale/${USER_A}/1080/${assetA}`
    await deps.store.putBytes(`${prefix}/h240/index.m3u8`, Buffer.from('#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:1,\nseg000.ts\n#EXT-X-ENDLIST\n'))
    await deps.store.putBytes(`${prefix}/h240/seg000.ts`, Buffer.from('segment-bytes'))
    await deps.db.updateAsset(assetA, {
      status: 'ready',
      hls_prefix: prefix,
      width: 320,
      height: 240,
      has_audio: false,
      duration_decision: 'accepted',
      duration_probe_sec: 2,
      ladder: [{ id: 'h240', width: 320, height: 240, bandwidth: 800000 }],
    })
    const token = await signToken(SIGNING, {
      v: 1,
      scope: 'play',
      assetId: assetA,
      target: 'web',
      exp: Math.floor(Date.now() / 1000) + 60,
    })
    const ok = await handle(new Request(`http://catalog.local/functions/v1/catalog-video/hls/${assetA}/h240/seg000.ts?token=${token}`), deps)
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get('content-type'), 'video/mp2t')
    const ranged = await handle(new Request(`http://catalog.local/functions/v1/catalog-video/hls/${assetA}/h240/seg000.ts?token=${token}`, {
      headers: { range: 'bytes=0-3' },
    }), deps)
    assert.equal(ranged.status, 206)
    assert.equal(ranged.headers.get('content-range'), 'bytes 0-3/13')
    const crossed = await handle(new Request(`http://catalog.local/functions/v1/catalog-video/hls/${assetB}/h240/seg000.ts?token=${token}`), deps)
    assert.equal(crossed.status, 401)
    const tampered = await handle(new Request(`http://catalog.local/functions/v1/catalog-video/hls/${assetA}/h240/seg000.ts?token=${token}abcd`), deps)
    assert.equal(tampered.status, 401)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
