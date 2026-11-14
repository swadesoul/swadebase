import assert from 'node:assert/strict'
import { test } from 'node:test'
import { boot, ownerToken } from './helpers.mjs'
import { requireRecentAuth, ABSOLUTE_COOKIE_MAX_AGE_SECONDS, STEP_UP_MAX_AGE_SECONDS } from '../vendor/swade-session/index.mjs'

function tokenFor(nowSeconds) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({
    sub: 'owner-user',
    email: 'owner@example.test',
    session_id: '11111111-1111-4111-8111-111111111111',
    amr: [{ method: 'oauth', timestamp: nowSeconds }],
  })).toString('base64url')
  return `${header}.${body}.sig`
}

function memoryAuth(nowSeconds) {
  return function createAuthClient(adapter) {
    return {
      auth: {
        async signInWithOAuth() {
          return { data: { url: 'http://auth.example.test/authorize?provider=google' }, error: null }
        },
        async exchangeCodeForSession() {
          adapter.setAll([{ name: 'sb-swadebase-auth-token', value: tokenFor(nowSeconds) }])
          return { error: null }
        },
        async getUser() {
          const cookie = adapter.getAll().find((item) => item.name.includes('auth-token'))
          if (!cookie?.value) return { data: { user: null }, error: { message: 'missing' } }
          return {
            data: { user: { id: 'owner-user', email: 'owner@example.test', identities: [{ provider: 'google' }], app_metadata: { plan: 'paid' } } },
            error: null,
          }
        },
        async getSession() {
          const cookie = adapter.getAll().find((item) => item.name.includes('auth-token'))
          return { data: { session: cookie?.value ? { access_token: cookie.value } : null }, error: null }
        },
        async signOut() {
          adapter.setAll([{ name: 'sb-swadebase-auth-token', value: '', options: { maxAge: 0 } }])
          return { error: null }
        },
      },
    }
  }
}

test('cookie sign-in persists, lists the device, and step-up expires', async () => {
  let now = 1_800_000_000_000
  const devices = []
  const app = await boot(
    { SWADEBASE_AUTH_URL: 'http://auth.example.test', SWADEBOTS_COOKIE_SECURE: 'true' },
    {
      now: () => now,
      createAuthClient: memoryAuth(Math.floor(now / 1000)),
      deviceStore: {
        async list(userId, current) {
          return [{ id: current, createdAt: null, refreshedAt: null, userAgent: 'iPad', ip: null, aal: 'aal1', current: true, userId }]
        },
        async revoke() { return true },
      },
    },
  )
  try {
    const start = await fetch(`${app.url}/api/auth/google?next=/`, { redirect: 'manual' })
    assert.equal(start.status, 302)
    const verifier = start.headers.get('set-cookie') || ''
    assert.match(verifier, /HttpOnly/)
    assert.match(verifier, /Secure/)
    assert.match(verifier, /SameSite=Lax/)
    assert.doesNotMatch(verifier, /Domain=/)
    const callback = await fetch(`${app.url}/api/auth/callback?code=ok`, {
      redirect: 'manual',
      headers: { cookie: cookieHeader(start) },
    })
    assert.equal(callback.status, 302)
    const sessionCookie = cookieHeader(callback)
    assert.match(sessionCookie, /auth-token/)
    assert.match(callback.headers.get('set-cookie') || '', new RegExp(`Max-Age=${ABSOLUTE_COOKIE_MAX_AGE_SECONDS}`))
    const first = await fetch(`${app.url}/v1/bots`, { headers: { cookie: sessionCookie } })
    assert.equal(first.status, 200)
    const restarted = await fetch(`${app.url}/v1/bots`, { headers: { cookie: sessionCookie } })
    assert.equal(restarted.status, 200)
    const session = await fetch(`${app.url}/api/auth/session`, { headers: { cookie: sessionCookie } })
    const body = await session.json()
    assert.equal(body.signedIn, true)
    assert.equal(body.recentAuth, true)
    assert.equal(body.user.email, 'owner@example.test')
    const deviceList = await fetch(`${app.url}/api/auth/devices`, { headers: { cookie: sessionCookie } })
    const deviceBody = await deviceList.json()
    assert.equal(deviceBody.devices[0].userAgent, 'iPad')
    const stale = requireRecentAuth({
      accessToken: tokenFor(Math.floor(now / 1000) - STEP_UP_MAX_AGE_SECONDS - 5),
      now: Math.floor(now / 1000),
    })
    assert.equal(stale.ok, false)
    const signedOut = await fetch(`${app.url}/api/auth/sign-out`, {
      method: 'POST',
      headers: { cookie: sessionCookie, origin: app.url },
    })
    assert.equal(signedOut.status, 200)
    void devices
    void ownerToken
  } finally {
    await app.close()
  }
})

function cookieHeader(response) {
  return (response.headers.getSetCookie?.() || []).map((cookie) => cookie.split(';')[0]).join('; ')
}
