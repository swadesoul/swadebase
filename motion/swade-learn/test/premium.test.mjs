import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createLedger } from '../ledger.mjs'
import { refusePaidFetch, togetherVideoRequest } from '../narration.mjs'
import { runSwadeLearnPack } from '../pipeline.mjs'
import { localStore } from '../store.mjs'
import { samplePack } from './fixture.mjs'

async function run(pack, extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'swade-learn-premium-'))
  try {
    return await runSwadeLearnPack({
      store: localStore(dir),
      dir,
      renderId: 'premiumtest01',
      skipRender: true,
      synthesize: async () => {
        throw new Error('local narration should not run')
      },
      ...extra,
      pack,
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test('premium off never calls ElevenLabs', async () => {
  let calls = 0
  const ledger = createLedger()
  await assert.rejects(
    () =>
      run(samplePack({ voice: { provider: 'elevenlabs', voice_id: 'test-voice' } }), {
        premiumEnabled: false,
        ledger,
        fetchImpl: () => {
          calls += 1
          throw new Error('network')
        },
      }),
    (error) => error.code === 'premium_disabled',
  )
  assert.equal(calls, 0)
  assert.equal(ledger.rows()[0].status, 'blocked')
  assert.equal(ledger.rows()[0].meta.reason, 'premium_disabled')
  assert.equal(ledger.rows()[0].provider, 'elevenlabs')
})

test('premium on with no budget returns spend_blocked', async () => {
  let calls = 0
  const ledger = createLedger()
  const fetchImpl = () => {
    calls += 1
    throw new Error('network')
  }
  await assert.rejects(
    () =>
      run(samplePack({ voice: { provider: 'elevenlabs', voice_id: 'test-voice' } }), {
        premiumEnabled: true,
        ledger,
        fetchImpl,
      }),
    (error) => error.code === 'spend_blocked' && error.result.ai_can_spend === true && error.result.budget === false && error.result.ai_usage_ledger[0].status === 'blocked',
  )
  const together = createLedger()
  await assert.rejects(
    () =>
      run(samplePack({ visuals: { provider: 'together' } }), {
        premiumEnabled: true,
        ledger: together,
        fetchImpl,
        synthesize: async (_text, dest) => {
          const { writeFile } = await import('node:fs/promises')
          await writeFile(dest, Buffer.alloc(0))
          return { provider: 'swade_voice', model: 'local-pcm', engine: 'local-pcm', characters: 1, audio_seconds: 0.1 }
        },
      }),
    (error) => error.code === 'spend_blocked' && error.result.provider === 'together' && error.result.ai_can_spend === false,
  )
  assert.equal(calls, 0)
  assert.equal(ledger.rows()[0].meta.reason, 'spend_blocked')
  assert.equal(together.rows()[0].status, 'blocked')
  assert.equal(together.rows()[0].provider, 'together')
})

test('a funded stub can build the Together request without a live call', async () => {
  const ledger = createLedger()
  ledger.addTopup({ provider: 'together', amount_usd: 20, kind: 'opening_balance' })
  let calls = 0
  const result = await run(samplePack({ visuals: { provider: 'together' } }), {
    premiumEnabled: true,
    ledger,
    apiKeys: { together: 'test-not-a-secret' },
    synthesize: async (_text, dest) => {
      const { writeFile } = await import('node:fs/promises')
      await writeFile(dest, Buffer.alloc(0))
      return { provider: 'swade_voice', model: 'hexgrad/Kokoro-82M', engine: 'kokoro-js', characters: 4, audio_seconds: 0.2 }
    },
    fetchImpl: async (url, init) => {
      calls += 1
      assert.equal(new URL(url).hostname, 'api.together.ai')
      assert.equal(init.headers.authorization, 'Bearer test-not-a-secret')
      return new Response(JSON.stringify({ id: 'vid_test', status: 'queued' }), { status: 200 })
    },
  })
  assert.equal(calls, 1)
  assert.equal(result.status, 'submitted')
  const videoRow = ledger.rows().find((row) => row.provider === 'together' && row.status === 'ok')
  assert.ok(videoRow)
  assert.equal(JSON.stringify(result).includes('test-not-a-secret'), false)
})

test('the paid-call guard rejects ElevenLabs and Together before fetch', () => {
  assert.throws(() => refusePaidFetch('https://api.elevenlabs.io/v1/text-to-speech/voice'), (error) => error.code === 'paid_call_refused')
  assert.throws(() => refusePaidFetch('https://api.together.ai/v2/videos'), (error) => error.code === 'paid_call_refused')
  const request = togetherVideoRequest({ apiKey: 'test-not-a-secret', prompt: 'A title card', seconds: 5 })
  assert.equal(request.url, 'https://api.together.ai/v2/videos')
  assert.equal(JSON.parse(request.init.body).model, 'Wan-AI/wan2.7-t2v')
})
