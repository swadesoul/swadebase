import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, boot, ownerToken } from './helpers.mjs'

const app = await boot()
after(() => app.close())

test('chat acknowledges immediately and keeps history', async () => {
  const response = await api(app, 'POST', '/v1/bots/cos/chat', {
    token: ownerToken(),
    body: { prompt: 'Draft a morning note' },
  })
  assert.equal(response.status, 200)
  assert.match(response.text, /event: ack/)
  assert.match(response.text, /On it/)
  const history = await api(app, 'GET', '/v1/bots/cos/messages', { token: ownerToken() })
  assert.ok(history.json.data.some((message) => message.role === 'user'))
  assert.ok(history.json.data.some((message) => message.kind === 'ack'))
})

test('a new bot is returned in the Agent OS worker shape with no tools', async () => {
  const created = await api(app, 'POST', '/v1/bots', {
    token: ownerToken(),
    body: {
      name: 'Research',
      role: 'Researcher',
      objective: 'Find public notes',
      project_scope: 'notes',
      provider: 'auto',
      tool_scopes: ['fetch_url'],
      budget_cents: 0,
      approval_mode: 'approval_required',
    },
  })
  assert.equal(created.status, 201)
  assert.deepEqual(created.json.data.tools, [])
  assert.equal(created.json.data.agent_os_worker.role, 'Researcher')
  assert.equal(created.json.data.agent_os_worker.provider, 'auto')
  assert.deepEqual(created.json.data.agent_os_worker.tool_scopes, [])
  assert.equal(created.json.data.registry.kind, 'role')
  assert.equal(created.json.data.registry.status, 'draft')
})

test('upload accepts an iPad-style file with no part content type and stays in the tenant', async () => {
  const { multipart } = await import('./helpers.mjs')
  const form = multipart('photo.jpg', 'jpeg-bytes')
  const saved = await api(app, 'POST', '/v1/bots/cos/uploads', {
    token: ownerToken(),
    body: form.body,
    headers: form.headers,
  })
  assert.equal(saved.status, 201)
  const fetched = await api(app, 'GET', `/v1/uploads/${saved.json.data.id}`, { token: ownerToken() })
  assert.equal(fetched.status, 200)
  assert.equal(fetched.text, 'jpeg-bytes')
  const other = await api(app, 'GET', `/v1/uploads/${saved.json.data.id}`, {
    token: (await import('./helpers.mjs')).publicToken(),
  })
  assert.equal(other.status, 404)
})

test('an oversized upload is rejected', async () => {
  const small = await boot({ SWADEBOTS_UPLOAD_MAX_BYTES: '32' })
  try {
    const { multipart } = await import('./helpers.mjs')
    const form = multipart('photo.jpg', 'x'.repeat(80))
    const saved = await api(small, 'POST', '/v1/bots/cos/uploads', {
      token: ownerToken(),
      body: form.body,
      headers: form.headers,
    })
    assert.equal(saved.status, 413)
  } finally {
    await small.close()
  }
})
