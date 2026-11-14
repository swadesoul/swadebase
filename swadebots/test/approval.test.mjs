import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, boot, ownerToken } from './helpers.mjs'

const app = await boot()
after(() => app.close())

test('delete, send, and the task lifecycle wait for approval and can be cancelled', async () => {
  const task = await api(app, 'POST', '/v1/bots/cos/tasks', {
    token: ownerToken(),
    body: { prompt: 'Delete the old draft' },
  })
  await app.tasks.drain()
  const waiting = await api(app, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
  assert.equal(waiting.json.data.status, 'queued')
  assert.match(waiting.json.data.approval.action, /delete/)
  await api(app, 'POST', `/v1/approvals/${waiting.json.data.approval.grant_id}/decision`, {
    token: ownerToken(),
    body: { decision: 'approve' },
  })
  await app.tasks.drain()
  const done = await api(app, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
  assert.equal(done.json.data.status, 'done')
  assert.match(done.json.data.result.summary, /Nothing was submitted/)
  assert.equal(done.json.data.result.dispatched_external, false)

  const other = await api(app, 'POST', '/v1/bots/cos/tasks', {
    token: ownerToken(),
    body: { prompt: 'Draft only' },
  })
  const cancelled = await api(app, 'POST', `/v1/tasks/${other.json.data.id}/cancel`, { token: ownerToken() })
  assert.equal(cancelled.json.data.status, 'cancelled')
})

test('a queued task times out', async () => {
  const timed = await boot({ SWADEBOTS_TASK_TIMEOUT_MS: '0' })
  try {
    const task = await api(timed, 'POST', '/v1/bots/cos/tasks', {
      token: ownerToken(),
      body: { prompt: 'Draft only' },
    })
    await timed.tasks.drain()
    const status = await api(timed, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
    assert.equal(status.json.data.status, 'failed')
    assert.equal(status.json.data.error.code, 'timeout')
  } finally {
    await timed.close()
  }
})

test('MCP exposes the tenant tools and not owner-only reveal', async () => {
  const response = await api(app, 'POST', '/mcp', {
    token: ownerToken(),
    body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  })
  const names = response.json.result.tools.map((tool) => tool.name)
  assert.ok(names.includes('create_bot'))
  assert.ok(names.includes('create_task'))
  assert.equal(names.includes('reveal_secret'), false)
  assert.equal(names.includes('admin_overview'), false)
})
