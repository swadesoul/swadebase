import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { ONTOLOGY_PRIMER, INFORMATION_USE_RULE } from '../src/ontology-primer.mjs'
import { api, arm, boot, createMemoryVault, ownerToken } from './helpers.mjs'

const secret = 'vault-sentinel-value'

test('the ontology primer matches the docs file and is on every bot', async () => {
  const file = await readFile(new URL('../../docs/SWADE_ONTOLOGY_PRIMER.md', import.meta.url), 'utf8')
  assert.equal(file.trim(), ONTOLOGY_PRIMER)
  const app = await boot()
  try {
    const bots = await api(app, 'GET', '/v1/bots', { token: ownerToken() })
    for (const bot of bots.json.data) {
      assert.ok(bot.base_instructions.startsWith(ONTOLOGY_PRIMER))
      assert.ok(bot.base_instructions.includes(INFORMATION_USE_RULE))
    }
    const about = await api(app, 'GET', '/v1/about-swade', { token: ownerToken() })
    assert.equal(about.json.data.primer, ONTOLOGY_PRIMER)
  } finally {
    await app.close()
  }
})

test('credential use, knowledge queries, and fetches are logged without secrets and cannot be rewritten', async () => {
  const calls = []
  const app = await boot({}, {
    vault: createMemoryVault(),
    lookup: async () => [{ address: '203.0.113.10' }],
    fetchImpl: async (url) => {
      calls.push(String(url))
      if (String(url).includes('knowledge')) {
        return new Response(JSON.stringify({ data: { items: [] } }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response('public page', { status: 200, headers: { 'content-type': 'text/plain' } })
    },
  })
  try {
  const token = ownerToken()
  await arm(app, token)
  const created = await api(app, 'POST', '/v1/bots', {
    token,
    body: { name: 'Notes bot', controlled_systems: ['notes'] },
  })
  const botId = created.json.data.id

  const vaultGrant = await api(app, 'POST', `/v1/bots/${botId}/grants`, {
    token,
    body: { kind: 'vault', system: 'notes', action: 'read' },
  })
  await api(app, 'POST', `/v1/approvals/${vaultGrant.json.data.id}/decision`, { token, body: { decision: 'approve' } })
  const stored = await api(app, 'POST', '/v1/vault/secrets', {
    token,
    body: { system_slug: 'notes', leaf: 'password', secret },
  })
  await api(app, 'POST', `/v1/approvals/${vaultGrant.json.data.id}/bind`, {
    token,
    body: { secret_id: stored.json.data.id },
  })
  const vaultTask = await api(app, 'POST', `/v1/bots/${botId}/tasks`, {
    token,
    body: { prompt: 'Use the vault credential on notes to check the balance' },
  })
  await app.tasks.drain()

  const fetchGrant = await api(app, 'POST', `/v1/bots/${botId}/grants`, {
    token,
    body: { kind: 'tool', system: 'notes', action: 'read', tool: 'fetch_url' },
  })
  await api(app, 'POST', `/v1/approvals/${fetchGrant.json.data.id}/decision`, { token, body: { decision: 'approve' } })
  const fetchTask = await api(app, 'POST', `/v1/bots/${botId}/tasks`, {
    token,
    body: { prompt: 'Read https://example.test/page for notes' },
  })
  await app.tasks.drain()

  const knowledgeGrant = await api(app, 'POST', `/v1/bots/${botId}/grants`, {
    token,
    body: { kind: 'knowledge', system: 'notes', action: 'read' },
  })
  await api(app, 'POST', `/v1/approvals/${knowledgeGrant.json.data.id}/decision`, { token, body: { decision: 'approve' } })
  const knowledgeTask = await api(app, 'POST', `/v1/bots/${botId}/tasks`, {
    token,
    body: { prompt: 'What knowledge do you have about a Track on notes' },
  })
  await app.tasks.drain()

  const vaultLog = await api(app, 'GET', `/v1/tasks/${vaultTask.json.data.id}/information-use`, { token })
  const fetchLog = await api(app, 'GET', `/v1/tasks/${fetchTask.json.data.id}/information-use`, { token })
  const knowledgeLog = await api(app, 'GET', `/v1/tasks/${knowledgeTask.json.data.id}/information-use`, { token })
  assert.ok(vaultLog.json.data.some((entry) => entry.vault_entry_ids.includes(stored.json.data.id)))
  assert.ok(fetchLog.json.data.some((entry) => entry.tools.includes('fetch_url') && entry.sources.some((source) => source.type === 'url')))
  assert.ok(knowledgeLog.json.data.some((entry) => entry.tools.includes('swade_knowledge') && entry.ontology_terms.includes('notes')))
  const packed = JSON.stringify(app.store.infoUse.list({}))
  assert.equal(packed.includes(secret), false)
  const finished = await api(app, 'GET', `/v1/tasks/${fetchTask.json.data.id}`, { token })
  assert.match(finished.json.data.result.summary, /Information used:/)

  const frozen = app.store.infoUse.list({})[0]
  assert.throws(() => {
    frozen.purpose = 'tampered'
  })
  const removed = await api(app, 'DELETE', `/v1/tasks/${fetchTask.json.data.id}/information-use`, { token })
  assert.equal(removed.status, 405)
  assert.equal(app.store.infoUse.list({}).length > 0, true)
  assert.equal(typeof app.store.infoUse.delete, 'undefined')

  const filtered = await api(app, 'GET', '/v1/admin/information-use?tool=fetch_url', { token })
  assert.ok(filtered.json.data.every((entry) => entry.tools.includes('fetch_url')))
  const botTab = await api(app, 'GET', `/v1/bots/${botId}/information-use`, { token })
  assert.ok(botTab.json.data.length >= 3)
  } finally {
    await app.close()
  }
})
