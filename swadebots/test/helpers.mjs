import { encodeTestToken } from '../src/auth.mjs'
import { createApp } from '../src/app.mjs'
import { createMemoryVault } from '../src/vault.mjs'
import { createMemoryLedger } from '../src/spend.mjs'

export async function boot(extra = {}, options = {}) {
  const app = await createApp({
    env: {
      SWADEBOTS_CONSOLE_ENABLED: 'true',
      SWADEBOTS_ALLOW_TEST_TOKENS: 'true',
      SWADEBOTS_SUPER_ADMIN_EMAILS: 'owner@example.test',
      ...extra,
    },
    ...options,
  })
  return app
}

export function ownerToken(extra = {}) {
  return encodeTestToken({ sub: 'owner-user', email: 'owner@example.test', provider: 'google', plan: 'paid', ...extra })
}

export function publicToken() {
  return encodeTestToken({
    sub: 'public-user',
    email: 'member@example.test',
    provider: 'google',
    tenant_id: 'public-demo',
    tier: 'public',
    plan: 'free',
  })
}

export async function api(app, method, path, { token, body, headers } = {}) {
  const response = await fetch(`${app.url}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body && !Buffer.isBuffer(body) ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: Buffer.isBuffer(body) ? body : body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: response.status, json, text }
}

export function multipart(filename, content, contentType) {
  const boundary = '----swadebots'
  const typeLine = contentType ? `Content-Type: ${contentType}\r\n` : ''
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n${typeLine}\r\n`
  const body = Buffer.concat([
    Buffer.from(head, 'utf8'),
    Buffer.isBuffer(content) ? content : Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
  ])
  return { body, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

export { createMemoryVault, createMemoryLedger }
