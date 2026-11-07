const enc = new TextEncoder()
const dec = new TextDecoder()

function bytesToB64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function b64urlToBytes(value) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const bin = atob(value.replaceAll('-', '+').replaceAll('_', '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

export function assertSigningKey(secret) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('CATALOG_VIDEO_SIGNING_KEY must be at least 32 characters.')
  }
  return secret
}

export async function signToken(secret, payload) {
  assertSigningKey(secret)
  const body = bytesToB64url(enc.encode(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)))
  return `${body}.${bytesToB64url(sig)}`
}

export async function verifyToken(secret, token) {
  assertSigningKey(secret)
  if (typeof token !== 'string' || !token.includes('.')) return null
  const dot = token.indexOf('.')
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!body || !sig || sig.includes('.')) return null
  const key = await hmacKey(secret)
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)))
  const got = b64urlToBytes(sig)
  if (got.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= got[i] ^ expected[i]
  if (diff !== 0) return null
  try {
    const payload = JSON.parse(dec.decode(b64urlToBytes(body)))
    if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}
