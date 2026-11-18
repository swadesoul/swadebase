import { randomBytes } from 'node:crypto'
import { hashToken, tokensEqual } from './vault.mjs'

const SESSION_COOKIE = 'swadebots_session'
const REFRESH_COOKIE = 'swadebots_refresh'

export function createSessions({ config, store, fetchImpl = fetch, now = () => Date.now() }) {
  function stamp() {
    return now()
  }

  function establish({ actor, refreshToken, userAgent, identityStamp }) {
    const id = randomBytes(16).toString('base64url')
    const secret = randomBytes(32).toString('base64url')
    const refresh = refreshToken || randomBytes(32).toString('base64url')
    const created = stamp()
    const session = {
      id,
      secret_hash: hashToken(secret),
      user_id: actor.id,
      email: actor.email,
      tenant_id: actor.tenant_id,
      tier: actor.tier,
      role: actor.role,
      plan: actor.plan,
      provider: actor.provider || 'google',
      device: deviceLabel(userAgent),
      created_at: created,
      last_seen_at: created,
      reauth_at: created,
      absolute_expires_at: created + config.sessionAbsoluteMs,
      refresh_hash: hashToken(refresh),
      retired_refresh: [],
      identity_stamp: identityStamp || actor.email,
      revoked_at: null,
      revoke_reason: null,
      gotrue_refresh: refreshToken || null,
    }
    store.sessions.set(id, session)
    store.recentReauth.set(actor.id, created)
    store.audit({
      tenant_id: actor.tenant_id,
      actor: actor.id,
      kind: 'session.start',
      data: { session_id: id, device: session.device },
    })
    return { session, secret, refresh }
  }

  function resolve(cookieHeader) {
    const cookies = readCookies(cookieHeader)
    const raw = cookies[SESSION_COOKIE]
    if (!raw) return null
    const session = findSession(raw)
    if (!session) {
      const error = new Error('Sign in is required')
      error.status = 401
      error.code = 'unauthorized'
      throw error
    }
    const time = stamp()
    if (session.revoked_at || time > session.absolute_expires_at || time - session.last_seen_at > config.sessionIdleMs) {
      session.revoked_at = session.revoked_at || time
      session.revoke_reason = session.revoke_reason || 'expired'
      const error = new Error('The session has ended')
      error.status = 401
      error.code = 'session_expired'
      throw error
    }
    session.last_seen_at = time
    return actorFrom(session)
  }

  function findSession(raw) {
    const dot = raw.indexOf('.')
    if (dot < 0) return null
    const id = raw.slice(0, dot)
    const secret = raw.slice(dot + 1)
    const session = store.sessions.get(id)
    if (!session || !tokensEqual(session.secret_hash, hashToken(secret))) return null
    return session
  }

  async function rotate(cookieHeader) {
    const cookies = readCookies(cookieHeader)
    const raw = cookies[SESSION_COOKIE]
    const presented = cookies[REFRESH_COOKIE]
    if (!raw || !presented) {
      const error = new Error('Sign in is required')
      error.status = 401
      error.code = 'unauthorized'
      throw error
    }
    const session = findSession(raw)
    if (!session || session.revoked_at) {
      const error = new Error('Sign in is required')
      error.status = 401
      error.code = 'unauthorized'
      throw error
    }
    const presentedHash = hashToken(presented)
    if (session.retired_refresh.includes(presentedHash)) {
      revokeUser(session.user_id, 'refresh_reuse')
      const error = new Error('That sign-in was already used')
      error.status = 401
      error.code = 'refresh_reuse'
      throw error
    }
    if (!tokensEqual(session.refresh_hash, presentedHash)) {
      const error = new Error('Sign in is required')
      error.status = 401
      error.code = 'unauthorized'
      throw error
    }
    if (session.gotrue_refresh && config.authUrl) {
      const refreshed = await refreshGoTrue(config, session.gotrue_refresh, fetchImpl)
      if (refreshed.reuse) {
        revokeUser(session.user_id, 'refresh_reuse')
        const error = new Error('That sign-in was already used')
        error.status = 401
        error.code = 'refresh_reuse'
        throw error
      }
      if (refreshed.email && refreshed.email !== session.email) {
        revokeUser(session.user_id, 'account_changed')
        const error = new Error('The account changed. Sign in again.')
        error.status = 401
        error.code = 'account_changed'
        throw error
      }
      session.gotrue_refresh = refreshed.refresh_token
    }
    const next = randomBytes(32).toString('base64url')
    session.retired_refresh.push(session.refresh_hash)
    session.refresh_hash = hashToken(next)
    session.last_seen_at = stamp()
    store.audit({
      tenant_id: session.tenant_id,
      actor: session.user_id,
      kind: 'session.refresh',
      data: { session_id: session.id },
    })
    return { session, refresh: next, secret: secretFrom(raw) }
  }

  function revoke(sessionId, reason) {
    const session = store.sessions.get(sessionId)
    if (!session) return null
    session.revoked_at = stamp()
    session.revoke_reason = reason
    store.audit({
      tenant_id: session.tenant_id,
      actor: session.user_id,
      kind: 'session.revoke',
      data: { session_id: sessionId, reason },
    })
    return session
  }

  function revokeUser(userId, reason) {
    for (const session of store.sessions.values()) {
      if (session.user_id === userId && !session.revoked_at) revoke(session.id, reason)
    }
  }

  function list(actor) {
    return [...store.sessions.values()]
      .filter((session) => session.user_id === actor.id && !session.revoked_at)
      .map((session) => ({
        id: session.id,
        device: session.device,
        created_at: session.created_at,
        last_seen_at: session.last_seen_at,
        current: session.id === actor.session_id,
      }))
  }

  function cookiesFor(session, secret, refresh) {
    const maxAge = Math.max(0, Math.floor((session.absolute_expires_at - stamp()) / 1000))
    return [serialize(SESSION_COOKIE, `${session.id}.${secret}`, maxAge), serialize(REFRESH_COOKIE, refresh, maxAge)]
  }

  function clearCookies() {
    return [serialize(SESSION_COOKIE, '', 0), serialize(REFRESH_COOKIE, '', 0)]
  }

  function serialize(name, value, maxAge) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAge}`]
    if (config.cookieSecure) parts.push('Secure')
    return parts.join('; ')
  }

  return { establish, resolve, rotate, revoke, revokeUser, list, cookiesFor, clearCookies }
}

function actorFrom(session) {
  return {
    id: session.user_id,
    email: session.email,
    tenant_id: session.tenant_id,
    tier: session.tier,
    role: session.role,
    plan: session.plan,
    provider: session.provider,
    kind: 'user',
    scopes: session.role === 'super_admin' ? ['*'] : ['bots:read', 'bots:write', 'chat', 'tasks', 'uploads', 'vault:write'],
    session_id: session.id,
    reauth_at: session.reauth_at,
  }
}

function secretFrom(raw) {
  return raw.slice(raw.indexOf('.') + 1)
}

function deviceLabel(userAgent) {
  const agent = String(userAgent || 'unknown device')
  if (/iPad/i.test(agent)) return 'iPad'
  if (/iPhone/i.test(agent)) return 'iPhone'
  if (/Macintosh/i.test(agent)) return 'Mac'
  return agent.slice(0, 80)
}

function readCookies(header) {
  const out = {}
  for (const part of String(header || '').split(';')) {
    const text = part.trim()
    if (!text) continue
    const eq = text.indexOf('=')
    if (eq < 0) continue
    out[text.slice(0, eq)] = decodeURIComponent(text.slice(eq + 1))
  }
  return out
}

async function refreshGoTrue(config, refreshToken, fetchImpl) {
  const response = await fetchImpl(`${config.authUrl}/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.anonKey,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    return { reuse: response.status === 400 || response.status === 401 }
  }
  const body = await response.json()
  return { refresh_token: body.refresh_token || refreshToken, email: body.user?.email || '' }
}

export { readCookies }
