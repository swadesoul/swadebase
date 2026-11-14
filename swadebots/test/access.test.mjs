import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, arm, boot, createMemoryVault, ownerToken } from './helpers.mjs'

test('a bot cannot use a system outside its charter, and wildcards are rejected', async () => {
  const app = await boot({}, { vault: createMemoryVault() })
  try {
    const token = ownerToken()
    await arm(app, token)
    const created = await api(app, 'POST', '/v1/bots', {
      token,
      body: { name: 'Notes only', template_id: 'course' },
    })
    assert.deepEqual(created.json.data.controlled_systems, ['teachvirt', 'virtteach'])
    assert.ok(created.json.data.access_map.every((grant) => grant.status === 'pending'))
    const outside = await api(app, 'POST', `/v1/bots/${created.json.data.id}/grants`, {
      token,
      body: { kind: 'vault', system: 'sssbrain', action: 'read' },
    })
    assert.equal(outside.status, 403)
    assert.equal(outside.json.error.code, 'outside_charter')
    const wildcard = await api(app, 'POST', `/v1/bots/${created.json.data.id}/grants`, {
      token,
      body: { kind: 'vault', system: '*', action: 'read' },
    })
    assert.equal(wildcard.status, 400)
    assert.equal(wildcard.json.error.code, 'wildcard_rejected')
    const all = await api(app, 'POST', `/v1/bots/${created.json.data.id}/grants`, {
      token,
      body: { kind: 'knowledge', system: 'all', action: 'read' },
    })
    assert.equal(all.status, 400)
    const own = await api(app, 'POST', `/v1/bots/${created.json.data.id}/grants`, {
      token,
      body: { kind: 'vault', system: 'teachvirt', action: 'read' },
    })
    assert.equal(own.status, 202)
    app.store.grants.get(own.json.data.id).system = '*'
    const forced = await api(app, 'POST', `/v1/approvals/${own.json.data.id}/decision`, {
      token,
      body: { decision: 'approve' },
    })
    assert.equal(forced.status, 400)
    assert.notEqual(app.store.grants.get(own.json.data.id).status, 'approved')
  } finally {
    await app.close()
  }
})
