import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { catalogMediaRouteExempt } from '../../docker/volumes/functions/main/gateway-auth.mjs'

const TOKEN = 'a'.repeat(80)

test('gateway JWT exemption is limited to signed catalog media routes', () => {
  assert.equal(catalogMediaRouteExempt('GET', '/catalog-video/hls/11111111-1111-4111-8111-111111111111/master.m3u8', TOKEN), true)
  assert.equal(catalogMediaRouteExempt('HEAD', '/functions/v1/catalog-video/hls/11111111-1111-4111-8111-111111111111/h720/seg000.ts', TOKEN), true)
  assert.equal(catalogMediaRouteExempt('PUT', '/catalog-video/uploads/parts', TOKEN), true)
  assert.equal(catalogMediaRouteExempt('GET', '/catalog-video/health', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('GET', '/catalog-video/assets/11111111-1111-4111-8111-111111111111', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('POST', '/catalog-video/assets', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('GET', '/catalog-video/hls/11111111-1111-4111-8111-111111111111/master.m3u8', 'short'), false)
  assert.equal(catalogMediaRouteExempt('GET', '/catalog-video/hls/11111111-1111-4111-8111-111111111111/master.m3u8', ''), false)
  assert.equal(catalogMediaRouteExempt('GET', '/hello', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('GET', '/motion-studio/health', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('GET', '/motion-studio/hls/x', TOKEN), false)
  assert.equal(catalogMediaRouteExempt('DELETE', '/catalog-video/hls/11111111-1111-4111-8111-111111111111/master.m3u8', TOKEN), false)
})

test('compose worker limits are enforced outside swarm deploy keys', async () => {
  const compose = await readFile(new URL('../../docker/docker-compose.catalog-video.yml', import.meta.url), 'utf8')
  assert.match(compose, /mem_limit: 1536m/)
  assert.match(compose, /cpus: "1\.0"/)
  assert.match(compose, /pids_limit: 128/)
  const worker = await readFile(new URL('../worker/encode.mjs', import.meta.url), 'utf8')
  assert.match(worker, /'-threads', '1'/)
  const gateway = await readFile(new URL('../../docker/volumes/functions/main/index.ts', import.meta.url), 'utf8')
  assert.match(gateway, /catalogMediaRouteExempt/)
  assert.match(gateway, /VERIFY_JWT && !isPublicGet && !catalogMediaExempt/)
  assert.match(gateway, /PUBLIC_FUNCTION_GET_PATHS/)
  assert.match(gateway, /\/motion-studio\/health/)
})
