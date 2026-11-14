import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, arm, boot, createMemoryVault, ownerToken, publicToken } from './helpers.mjs'

const secret = 'owner-vault-sentinel'
const app = await boot({}, { vault: createMemoryVault() })
after(() => app.close())

test('a public tenant cannot see owner bots, sites, knowledge, or vault grants', async () => {
  const owner = await api(app, 'GET', '/v1/bots', { token: ownerToken() })
  assert.ok(owner.json.data.some((bot) => bot.id === 'cos'))
  const pubBots = await api(app, 'GET', '/v1/bots', { token: publicToken() })
  assert.equal(pubBots.json.data.length, 0)
  const hidden = await api(app, 'GET', '/v1/bots/cos', { token: publicToken() })
  assert.equal(hidden.status, 404)
  const sites = await api(app, 'GET', '/v1/sites', { token: publicToken() })
  assert.deepEqual(sites.json.data, [])
  await arm(app, ownerToken())
  const stored = await api(app, 'POST', '/v1/vault/secrets', {
    token: ownerToken(),
    body: { system_slug: 'notes', secret, leaf: 'password' },
  })
  assert.equal(stored.status, 201)
  assert.equal(stored.text.includes(secret), false)
  const ownerVault = await api(app, 'GET', '/v1/vault/systems', { token: ownerToken() })
  assert.equal(ownerVault.json.data.length, 1)
  const pubVault = await api(app, 'GET', '/v1/vault/systems', { token: publicToken() })
  assert.deepEqual(pubVault.json.data, [])
  const reveal = await api(app, 'POST', `/v1/vault/secrets/${stored.json.data.id}/reveal`, {
    token: publicToken(),
    body: { reauth_token: 'nope' },
  })
  assert.equal(reveal.status, 403)
  const supplied = await api(app, 'POST', '/v1/bots', {
    token: publicToken(),
    body: { name: 'Public bot', tenant_id: 'swade-personal' },
  })
  assert.equal(supplied.status, 400)
})

test('owner sites are listed as unverified and are not visible to a public tenant', async () => {
  const sites = await api(app, 'GET', '/v1/sites', { token: ownerToken() })
  assert.ok(sites.json.data.some((site) => site.slug === 'sssbrain'))
  assert.ok(sites.json.data.every((site) => site.permission_verified === false))
})
