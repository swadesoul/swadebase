import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, boot, createMemoryLedger, ownerToken, publicToken } from './helpers.mjs'

test('a free plan cannot select a paid model and nothing falls back', async () => {
  const app = await boot()
  try {
    const models = await api(app, 'GET', '/v1/models', { token: publicToken() })
    assert.ok(models.json.data.every((model) => model.tier === 'local'))
    const created = await api(app, 'POST', '/v1/bots', {
      token: publicToken(),
      body: { name: 'Free bot', model: 'auto/cheap' },
    })
    assert.equal(created.status, 403)
    assert.equal(created.json.error.code, 'model_not_allowed')
  } finally {
    await app.close()
  }
})

test('a paid model is blocked when the ledger is unavailable', async () => {
  let gatewayCalls = 0
  const app = await boot({}, {
    fetchImpl: async () => {
      gatewayCalls += 1
      return new Response('nope', { status: 500 })
    },
  })
  try {
    const created = await api(app, 'POST', '/v1/bots', {
      token: ownerToken(),
      body: { name: 'Paid bot', model: 'auto/cheap' },
    })
    assert.equal(created.status, 201)
    const task = await api(app, 'POST', `/v1/bots/${created.json.data.id}/tasks`, {
      token: ownerToken(),
      body: { prompt: 'Say hello' },
    })
    await app.tasks.drain()
    const status = await api(app, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
    assert.equal(status.json.data.status, 'failed')
    assert.equal(status.json.data.error.code, 'spend_blocked')
    assert.equal(gatewayCalls, 0)
  } finally {
    await app.close()
  }
})

test('ai_can_spend false blocks a paid call and true records founder exempt at zero', async () => {
  const ledger = createMemoryLedger()
  ledger.setAccount('omniroute', { billing: 'prepaid', opening_balance_recorded: false, balance_usd: 0 })
  const blocked = await boot({}, { ledger })
  try {
    const created = await api(blocked, 'POST', '/v1/bots', {
      token: ownerToken(),
      body: { name: 'Blocked bot', model: 'auto/cheap' },
    })
    const task = await api(blocked, 'POST', `/v1/bots/${created.json.data.id}/tasks`, {
      token: ownerToken(),
      body: { prompt: 'Say hello' },
    })
    await blocked.tasks.drain()
    const status = await api(blocked, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
    assert.equal(status.json.data.error.message, 'ai_can_spend_false')
  } finally {
    await blocked.close()
  }

  const funded = createMemoryLedger()
  funded.setAccount('omniroute', {
    billing: 'prepaid',
    opening_balance_recorded: true,
    balance_usd: 5,
    hard_stop_usd: 0,
  })
  const allowed = await boot({}, { ledger: funded })
  try {
    const created = await api(allowed, 'POST', '/v1/bots', {
      token: ownerToken(),
      body: { name: 'Funded bot', model: 'auto/cheap' },
    })
    const task = await api(allowed, 'POST', `/v1/bots/${created.json.data.id}/tasks`, {
      token: ownerToken(),
      body: { prompt: 'Say hello' },
    })
    await allowed.tasks.drain()
    const status = await api(allowed, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
    assert.equal(status.json.data.status, 'done')
    const report = await funded.report('swade-personal')
    assert.ok(report.rows.some((row) => row.meta.founder_exempt === true && row.cost_usd === 0))
  } finally {
    await allowed.close()
  }
})
