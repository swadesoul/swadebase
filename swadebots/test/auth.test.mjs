import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, arm, boot, ownerToken, publicToken } from './helpers.mjs'

const app = await boot()
after(() => app.close())

test('missing and bad tokens are rejected', async () => {
  const missing = await api(app, 'GET', '/v1/bots')
  assert.equal(missing.status, 401)
  const bad = await api(app, 'GET', '/v1/bots', { token: 'not-a-token' })
  assert.equal(bad.status, 401)
})

test('a matching email without Google is not the owner', async () => {
  const token = (await import('../src/auth.mjs')).encodeTestToken({
    sub: 'mail-user',
    email: 'owner@example.test',
    provider: 'email',
    plan: 'paid',
  })
  const response = await api(app, 'GET', '/v1/bots', { token })
  assert.equal(response.status, 403)
})

test('a member cannot open admin', async () => {
  const response = await api(app, 'GET', '/v1/admin/overview', { token: publicToken() })
  assert.equal(response.status, 403)
})

test('the owner can open admin and a claimed role is ignored', async () => {
  const token = (await import('../src/auth.mjs')).encodeTestToken({
    sub: 'owner-user',
    email: 'owner@example.test',
    provider: 'google',
    role: 'member',
    plan: 'free',
  })
  await arm(app, token)
  const response = await api(app, 'GET', '/v1/admin/overview', { token })
  assert.equal(response.status, 200)
  assert.equal(response.json.data.paid_calls, 'blocked')
})

test('the console stays off unless the flag is true', async () => {
  const disabled = await boot({ SWADEBOTS_CONSOLE_ENABLED: 'false' })
  try {
    const health = await api(disabled, 'GET', '/health')
    assert.equal(health.status, 200)
    assert.equal(health.json.enabled, false)
    const bots = await api(disabled, 'GET', '/v1/bots', { token: ownerToken() })
    assert.equal(bots.status, 503)
    assert.equal(bots.json.error.code, 'disabled')
    const page = await api(disabled, 'GET', '/')
    assert.equal(page.status, 404)
  } finally {
    await disabled.close()
  }
})

test('Google sign-in uses the existing auth authorize URL and returns no client secret', async () => {
  const google = await boot({ SWADEBASE_AUTH_URL: 'http://auth.example.test/auth/v1' })
  try {
    const response = await api(google, 'GET', '/v1/auth/google?redirect_to=http://127.0.0.1/swadebots/')
    assert.equal(response.status, 200)
    assert.equal(response.json.data.provider, 'google')
    assert.match(response.json.data.url, /provider=google/)
    assert.doesNotMatch(response.text, /client_secret|GOOGLE_SECRET/)
  } finally {
    await google.close()
  }
})
