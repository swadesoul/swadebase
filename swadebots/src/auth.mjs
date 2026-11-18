import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export class AuthError extends Error {
  constructor(code, message, status = 401) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function encodeTestToken(payload) {
  return `test.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`
}

export function hashKey(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function issueAppKey() {
  return `sbk_${randomBytes(24).toString('base64url')}`
}

export function createAuth({ config, store, fetchImpl = fetch }) {
  return {
    async actorFromRequest(request) {
      const header = request.headers.authorization || request.headers.Authorization || ''
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
      if (!token) throw new AuthError('unauthorized', 'Sign in is required')
      if (token.startsWith('sbk_')) return appActor(store, token)
      if (token.startsWith('test.')) return testActor(config, token)
      return gotrueActor(config, token, fetchImpl)
    },
  }
}

function appActor(store, token) {
  const record = store.keys.get(hashKey(token))
  if (!record || record.revoked_at) throw new AuthError('unauthorized', 'App credential is not valid')
  return {
    id: record.id,
    email: '',
    tenant_id: record.tenant_id,
    tier: record.tier,
    role: 'member',
    plan: record.plan,
    kind: 'app',
    scopes: record.scopes,
    app_id: record.id,
  }
}

function testActor(config, token) {
  if (!config.allowTestTokens) throw new AuthError('unauthorized', 'Sign in is required')
  let payload
  try {
    payload = JSON.parse(Buffer.from(token.slice(5), 'base64url').toString())
  } catch {
    throw new AuthError('unauthorized', 'Sign in is required')
  }
  return finishUser(
    config,
    {
      id: payload.sub || payload.id,
      email: payload.email || '',
      tenant_id: payload.tenant_id,
      tier: payload.tier,
      plan: payload.plan || 'free',
      provider: payload.provider || '',
    },
    payload.role,
  )
}

async function gotrueActor(config, token, fetchImpl) {
  if (!config.authUrl) throw new AuthError('unauthorized', 'Sign in is required')
  const response = await fetchImpl(`${config.authUrl}/user`, {
    headers: {
      authorization: `Bearer ${token}`,
      apikey: config.anonKey,
    },
  })
  if (!response.ok) throw new AuthError('unauthorized', 'Sign in is required')
  const user = await response.json()
  const meta = user.app_metadata || {}
  const identityProvider = (user.identities || []).find((identity) => identity.provider === 'google')
  return finishUser(
    config,
    {
      id: user.id,
      email: user.email || '',
      tenant_id: meta.tenant_id,
      tier: meta.tier,
      plan: meta.plan || 'free',
      provider: identityProvider ? 'google' : meta.provider || '',
    },
    meta.swadebots_role,
  )
}

export function actorFromVerifiedUser(config, user, accessToken) {
  const identity = (user.identities || []).find((item) => item.provider === 'google')
  const meta = user.app_metadata || {}
  const actor = finishUser(
    config,
    {
      id: user.id,
      email: user.email || '',
      tenant_id: meta.tenant_id,
      tier: meta.tier,
      plan: meta.plan || 'paid',
      provider: identity ? 'google' : meta.provider || '',
    },
    meta.swadebots_role,
  )
  actor.access_token = accessToken || ''
  return actor
}

function finishUser(config, user, claimedRole) {
  const email = String(user.email || '').toLowerCase()
  const google = user.provider === 'google'
  const superAdmin = google && config.superAdminEmails.includes(email)
  if (superAdmin) {
    return {
      id: user.id,
      email,
      tenant_id: config.ownerTenantId,
      tier: 'owner',
      role: 'super_admin',
      plan: 'paid',
      kind: 'user',
      scopes: ['*'],
    }
  }
  if (!user.tenant_id || user.tenant_id === config.ownerTenantId) {
    throw new AuthError('forbidden', 'This account is not in a tenant', 403)
  }
  if (user.tier === 'owner') throw new AuthError('forbidden', 'This account is not in a tenant', 403)
  const role = claimedRole === 'admin' ? 'admin' : 'member'
  return {
    id: user.id,
    email,
    tenant_id: user.tenant_id,
    tier: 'public',
    role,
    plan: user.plan === 'paid' ? 'paid' : 'free',
    kind: 'user',
    scopes: ['bots:read', 'bots:write', 'chat', 'tasks', 'uploads', 'vault:write'],
  }
}

export function keysMatch(left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
