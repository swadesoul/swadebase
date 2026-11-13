import assert from 'node:assert/strict'
import test from 'node:test'
import { createLedger } from '../ledger.mjs'

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
