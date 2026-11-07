import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  DURATION_LIMIT_SEC,
  buildLadder,
  decideDuration,
  evaluateFourK,
  planMultipart,
  assertPublishableKey,
} from '../../docker/volumes/functions/catalog-video/_shared/policy.mjs'
import { signToken, verifyToken } from '../../docker/volumes/functions/catalog-video/_shared/tokens.mjs'
import { createMemoryDb } from '../../docker/volumes/functions/catalog-video/_shared/memory.mjs'

const SIGNING = 'test-signing-key-at-least-32-characters'

test('duration gate allows exactly 600 seconds and flags anything longer', () => {
  assert.equal(DURATION_LIMIT_SEC, 600)
  assert.equal(decideDuration(600).decision, 'accepted')
  assert.equal(decideDuration(599.999).decision, 'accepted')
  assert.equal(decideDuration(600.001).decision, 'needs_episode_submission')
  assert.equal(decideDuration(601).publishable, false)
  assert.equal(decideDuration(0).decision, 'unreadable')
})

test('ladder never upscales and caps 4K masters at 1080', () => {
  const fourK = buildLadder(3840, 2160)
  assert.equal(Math.max(...fourK.map((rung) => rung.height)), 1080)
  assert.ok(fourK.every((rung) => rung.width <= 3840 && rung.height <= 1080))
  const small = buildLadder(320, 240)
  assert.deepEqual(small.map((rung) => rung.height), [240])
  const hd = buildLadder(1280, 720)
  assert.equal(Math.max(...hd.map((rung) => rung.height)), 720)
  assert.ok(!hd.some((rung) => rung.height > 720))
})

test('multipart plan accepts a 1GB object and rejects an unbounded part count', () => {
  const oneGb = 1024 * 1024 * 1024
  const plan = planMultipart(oneGb)
  assert.ok(plan.partCount >= 64 && plan.partCount < 10000)
  assert.equal(plan.parts.reduce((sum, part) => sum + part.size, 0), oneGb)
  assert.throws(() => planMultipart(5 * 1024 * 1024 * 10001, {
    partSize: 5 * 1024 * 1024,
    maxBytes: Number.MAX_SAFE_INTEGER,
  }))
})

test('4K entitlement stays off and publish keys reject the 4K folder', () => {
  const verdict = evaluateFourK({ width: 3840, height: 2160, rotation: 0 })
  assert.equal(verdict.source_eligible, true)
  assert.equal(verdict.entitled, false)
  assert.equal(verdict.included_in_manifest, false)
  assert.equal(verdict.billing_status, 'unconfigured')
  assert.equal(verdict.quota_bytes, null)
  assert.throws(() => assertPublishableKey('catalog/abagale/11111111-1111-4111-8111-111111111111/4k/asset/seg.ts'))
})

test('playback tokens reject tampering and expiry', async () => {
  const token = await signToken(SIGNING, { v: 1, scope: 'play', assetId: '11111111-1111-4111-8111-111111111111', exp: Math.floor(Date.now() / 1000) + 60 })
  assert.equal((await verifyToken(SIGNING, token)).scope, 'play')
  assert.equal(await verifyToken(SIGNING, `${token}x`), null)
  assert.equal(await verifyToken('wrong-signing-key-at-least-32-characters', token), null)
  const expired = await signToken(SIGNING, { v: 1, scope: 'play', assetId: '11111111-1111-4111-8111-111111111111', exp: Math.floor(Date.now() / 1000) - 5 })
  assert.equal(await verifyToken(SIGNING, expired), null)
})

test('catalog queue claims one job and does not use the motion queue', async () => {
  const db = createMemoryDb()
  const first = await db.enqueueJob({ assetId: '11111111-1111-4111-8111-111111111111', creatorId: '11111111-1111-4111-8111-111111111111', kind: 'probe', preset: 'h264_abr_1080', sha: 'abc' })
  await db.enqueueJob({ assetId: '22222222-2222-4222-8222-222222222222', creatorId: '11111111-1111-4111-8111-111111111111', kind: 'probe', preset: 'h264_abr_1080', sha: 'def' })
  const claimed = db.claim('worker-a')
  assert.equal(claimed.id, first.id)
  assert.equal(db.claim('worker-b'), null)
  const sql = await readFile(new URL('../../supabase/migrations/20261107210000_catalog_video.sql', import.meta.url), 'utf8')
  assert.match(sql, /claim_catalog_video_job/)
  assert.doesNotMatch(sql, /create table[^;]*motion_render_jobs/)
  assert.doesNotMatch(sql, /claim_motion_render_job/)
  assert.match(sql, /billing_status = 'unconfigured'/)
  assert.match(sql, /quota_bytes is null/)
  assert.match(sql, /p_max_running := 1/)
})
