import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isBlockedAddress, assertPublicUrl, safeFetch, SsrfError } from '../src/ssrf.mjs'
import { api, boot, ownerToken } from './helpers.mjs'

test('private, loopback, and metadata addresses are blocked', () => {
  for (const ip of ['127.0.0.1', '10.1.1.1', '192.168.1.4', '172.16.0.4', '169.254.169.254', '::1']) {
    assert.equal(isBlockedAddress(ip), true, ip)
  }
  assert.equal(isBlockedAddress('203.0.113.10'), false)
})

test('blocked hostnames never resolve to a fetch', async () => {
  await assert.rejects(() => assertPublicUrl('http://127.0.0.1/latest'), SsrfError)
  await assert.rejects(() => assertPublicUrl('http://metadata.google.internal/computeMetadata'), SsrfError)
  await assert.rejects(
    () => assertPublicUrl('http://example.test/', { lookup: async () => [{ address: '10.0.0.8' }] }),
    SsrfError,
  )
})

test('a redirect onto a private address is blocked', async () => {
  const calls = []
  await assert.rejects(
    () =>
      safeFetch('http://example.test/start', {
        lookup: async () => [{ address: '203.0.113.10' }],
        fetchImpl: async (url) => {
          calls.push(url)
          return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } })
        },
      }),
    SsrfError,
  )
  assert.deepEqual(calls, ['http://example.test/start'])
})

test('a task cannot fetch a URL until the owner approves the grant', async () => {
  const calls = []
  const app = await boot({}, {
    lookup: async () => [{ address: '203.0.113.10' }],
    fetchImpl: async (url) => {
      calls.push(url)
      return new Response('public page', { status: 200, headers: { 'content-type': 'text/plain' } })
    },
  })
  const task = await api(app, 'POST', '/v1/bots/cos/tasks', {
    token: ownerToken(),
    body: { prompt: 'Read https://example.test/report' },
  })
  await app.tasks.drain()
  const waiting = await api(app, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
  assert.equal(waiting.json.data.status, 'queued')
  assert.equal(calls.length, 0)
  const grant = waiting.json.data.approval.grant_id
  await api(app, 'POST', `/v1/approvals/${grant}/decision`, { token: ownerToken(), body: { decision: 'approve' } })
  await app.tasks.drain()
  const done = await api(app, 'GET', `/v1/tasks/${task.json.data.id}`, { token: ownerToken() })
  assert.equal(done.json.data.status, 'done')
  assert.equal(calls.length, 1)
  await app.close()
})
