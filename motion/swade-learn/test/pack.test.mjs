import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { hyperframesArgs, hyperframesHtml } from '../hyperframes.mjs'
import { validatePack } from '../pack.mjs'
import { renderKey } from '../store.mjs'
import { samplePack } from './fixture.mjs'

test('a production pack is 15/5/5/5/15 plus 4 graphics', () => {
  const result = validatePack(samplePack())
  assert.equal(result.ok, true)
  assert.deepEqual(result.pack.clips.map((clip) => clip.duration_sec), [15, 5, 5, 5, 15])
  assert.equal(result.pack.graphics.length, 4)
  assert.equal(result.pack.voice.provider, 'kokoro')
  assert.equal(result.pack.visuals.provider, 'remotion')
})

test('the pack rejects a different clip length', () => {
  const pack = samplePack()
  pack.clips[1].duration_sec = 15
  const result = validatePack(pack)
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /clips\[1\]\.duration_sec/)
})

test('hyperframes source carries the five clip durations and four graphics', () => {
  const { pack } = validatePack(samplePack())
  const html = hyperframesHtml(pack)
  assert.match(html, /data-composition-id="main"/)
  assert.match(html, /data-duration="45"/)
  for (const duration of [15, 5, 5, 5, 15]) assert.match(html, new RegExp(`data-duration="${duration}"`))
  for (const graphic of pack.graphics) assert.match(html, new RegExp(`id="gfx-${graphic.id}"`))
  assert.match(html, /window\.__timelines\["main"\]/)
})

test('hyperframes render stays on the CPU worker command', () => {
  assert.deepEqual(hyperframesArgs('/tmp/job', '/tmp/job/out.mp4', { fps: 8, quality: 'draft' }), [
    '--no-install',
    'hyperframes',
    'render',
    '/tmp/job',
    '--output',
    '/tmp/job/out.mp4',
    '--fps',
    '8',
    '--quality',
    'draft',
    '--workers',
    '1',
  ])
})

test('render keys stay under teachvirt/swade-learn/renders', () => {
  assert.equal(renderKey('localrender01', 'video.mp4'), 'teachvirt/swade-learn/renders/localrender01/video.mp4')
  assert.throws(() => renderKey('../etc', 'video.mp4'))
  assert.throws(() => renderKey('localrender01', '../video.mp4'))
})

test('the edge function uses the same pack validator', () => {
  const source = readFileSync(new URL('../pack.mjs', import.meta.url))
  const copy = readFileSync(new URL('../../../docker/volumes/functions/motion-studio/_shared/swade-learn-pack.mjs', import.meta.url))
  const hash = (buf) => createHash('sha256').update(buf).digest('hex')
  assert.equal(hash(source), hash(copy))
})
