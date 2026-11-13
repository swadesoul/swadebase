import assert from 'node:assert/strict'
import test from 'node:test'
import { createLedger, createSqlLedger, premiumDecision } from '../ledger.mjs'
import { renderProvenance } from '../pipeline.mjs'

test('ai_can_spend matches the shared cost ledger', () => {
  const ledger = createLedger()
  assert.equal(ledger.aiCanSpend('missing', 0), false)
  assert.equal(ledger.aiCanSpend('swade_voice', 1), true)
  assert.equal(ledger.aiCanSpend('together', 0), false)
  assert.equal(ledger.aiCanSpend('elevenlabs', 10), true)

  ledger.addTopup({ provider: 'together', amount_usd: 10, kind: 'opening_balance' })
  assert.equal(ledger.aiCanSpend('together', 0), true)
  assert.equal(ledger.aiCanSpend('together', 9.5), false)
})

test('a subscription with no opening balance has no video budget', () => {
  const ledger = createLedger()
  assert.equal(ledger.aiCanSpend('elevenlabs', 0.1), true)
  assert.equal(ledger.hasBudget('elevenlabs', 0.1), false)
  ledger.addTopup({ provider: 'elevenlabs', amount_usd: 5, kind: 'topup' })
  assert.equal(ledger.hasBudget('elevenlabs', 0.1), false)
  ledger.addTopup({ provider: 'elevenlabs', amount_usd: 5, kind: 'opening_balance' })
  assert.equal(ledger.hasBudget('elevenlabs', 0.1), true)
})

test('ElevenLabs narration is counted as paid in the render result', () => {
  const clips = Array.from({ length: 5 }, (_, index) => ({ provider: 'elevenlabs', clip: { id: `c${index}` } }))
  assert.deepEqual(renderProvenance(clips, null), { paid_calls: 5, narration_provider: 'elevenlabs' })
  assert.deepEqual(renderProvenance([{ provider: 'swade_voice' }], null), { paid_calls: 0, narration_provider: 'swade_voice' })
})

test('the shared ledger quote supplies the budget instead of an empty memory ledger', async () => {
  const calls = []
  const ledger = createSqlLedger(async (fn, args) => {
    calls.push({ fn, args })
    if (fn === 'swade_learn_quote') {
      return {
        data: {
          provider: 'elevenlabs',
          priced: true,
          estimate_usd: 0.03,
          ai_can_spend: true,
          billing: 'subscription',
          credit_usd: 25,
          spent_usd: 1,
          hard_stop_usd: 0,
          opening_balance_recorded: true,
        },
      }
    }
    if (fn === 'swade_learn_record_usage') return { data: [{ ledger_id: 41, cost_usd: 0.03, priced: true }] }
    return { error: { message: 'unexpected' } }
  })
  const allowed = await premiumDecision(ledger, {
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    units: { character: 100 },
  })
  assert.equal(allowed.allowed, true)
  assert.equal(allowed.budget, true)
  await ledger.record({
    project: 'swade-learn',
    feature: 'narration',
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    status: 'ok',
    units: { character: 100 },
  })
  assert.equal(calls.some((call) => call.fn === 'swade_learn_record_usage'), true)
  assert.equal(ledger.rows()[0].ledger_id, 41)

  const blocked = createSqlLedger(async () => ({
    data: {
      provider: 'elevenlabs',
      priced: true,
      estimate_usd: 0.03,
      ai_can_spend: true,
      billing: 'subscription',
      credit_usd: 0,
      spent_usd: 0,
      hard_stop_usd: 0,
      opening_balance_recorded: false,
    },
  }))
  const denied = await premiumDecision(blocked, {
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    units: { character: 100 },
  })
  assert.equal(denied.ai_can_spend, true)
  assert.equal(denied.budget, false)
  assert.equal(denied.allowed, false)

  const down = createSqlLedger(async () => ({ error: { message: 'function missing' } }))
  const unavailable = await premiumDecision(down, {
    provider: 'together',
    model: 'Wan-AI/wan2.7-t2v',
    units: { request: 1 },
  })
  assert.equal(unavailable.allowed, false)
  assert.equal(unavailable.ledger, 'unavailable')
})

test('usage rows price a known card and mark an unknown unit unpriced', () => {
  const ledger = createLedger()
  const priced = ledger.record({
    project: 'swade-learn',
    feature: 'narration',
    provider: 'swade_voice',
    model: 'hexgrad/Kokoro-82M',
    units: { character: 20, audio_second: 1.5 },
    status: 'ok',
  })
  assert.equal(priced.cost_usd, 0)
  assert.equal(priced.priced, true)
  const unknown = ledger.record({
    project: 'swade-learn',
    feature: 'narration',
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    units: { mystery: 1 },
    status: 'blocked',
  })
  assert.equal(unknown.priced, false)
  assert.equal(ledger.rows().at(-1).status, 'blocked')
})
