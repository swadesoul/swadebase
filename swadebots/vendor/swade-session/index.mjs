/**
 * Vendored from swadesoul/swade-ecosystem-hub PR #66
 * packages/swade-session @ 2d032d7e14e591a522ac3ffa8b8a20cb16d8a873
 * Runtime entry for the SWADEBOTS service. The live Google path is createFetchAuthHandler.
 */
export const IDLE_TIMEOUT = '720h'
export const ABSOLUTE_TIMEOUT = '2160h'
export const JWT_EXP_SECONDS = 3600
export const REFRESH_REUSE_INTERVAL_SECONDS = 10
export const STEP_UP_MAX_AGE_SECONDS = 10 * 60
export const ABSOLUTE_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60
export const VERIFIER_COOKIE_MAX_AGE_SECONDS = 10 * 60
export const SWADE_AUTH_BASE_PATH = '/api/auth'
export const SWADE_AUTH_NEXT_COOKIE = 'swade_auth_next'
export const SENSITIVE_ACTIONS = ['vault', 'grants', 'billing', 'admin', 'key_issuance']

export function isSensitiveAction(value) {
  return SENSITIVE_ACTIONS.includes(value)
}

export function isVerifierCookie(name) {
  return name.includes('code-verifier')
}
export function isSessionCookie(name) {
  return name.includes('auth-token') && !isVerifierCookie(name)
}
export function isSwadeAuthCookie(name) {
  return isSessionCookie(name) || isVerifierCookie(name) || name === SWADE_AUTH_NEXT_COOKIE
}

export function applySwadeCookieOptions(name, options, secure) {
  const clearing = options?.maxAge === 0
  const next = { path: '/', httpOnly: true, secure, sameSite: 'lax' }
  if (clearing) return { ...next, maxAge: 0 }
  if (name === SWADE_AUTH_NEXT_COOKIE || isVerifierCookie(name)) {
    return { ...next, maxAge: options?.maxAge ?? VERIFIER_COOKIE_MAX_AGE_SECONDS }
  }
  if (isSessionCookie(name)) return { ...next, maxAge: ABSOLUTE_COOKIE_MAX_AGE_SECONDS }
  return { ...next, maxAge: options?.maxAge }
}

export function serializeCookie(name, value, options) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`]
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite === 'lax') parts.push('SameSite=Lax')
  else if (options.sameSite === 'strict') parts.push('SameSite=Strict')
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`)
  return parts.join('; ')
}

export function readCookieHeader(header) {
  if (!header) return []
  const cookies = []
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i <= 0) continue
    const name = part.slice(0, i).trim()
    const raw = part.slice(i + 1).trim()
    if (!name) continue
    let value = raw
    try { value = decodeURIComponent(raw) } catch { value = raw }
    cookies.push({ name, value })
  }
  return cookies
}

export function safeNextPath(value, fallback = '/') {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.includes('\\') || value.includes('://') || /[\u0000-\u001f]/.test(value)) return fallback
  return value
}

function base64UrlToString(input) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64').toString('utf8')
}

export function decodeJwtPayload(token) {
  const parts = String(token || '').split('.')
  if (parts.length < 2 || !parts[1]) return null
  try {
    const parsed = JSON.parse(base64UrlToString(parts[1]))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function readAmr(payload) {
  const raw = payload?.amr
  if (!Array.isArray(raw)) return []
  const entries = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.method !== 'string' || typeof item.timestamp !== 'number') continue
    entries.push({ method: item.method, timestamp: item.timestamp })
  }
  return entries
}

export function latestOAuthAuthentication(amr) {
  let latest = null
  for (const entry of amr) {
    if (entry.method !== 'oauth' && entry.method !== 'google') continue
    if (latest === null || entry.timestamp > latest) latest = entry.timestamp
  }
  return latest
}

export function requireRecentAuth(args) {
  const now = args.now ?? Math.floor(Date.now() / 1000)
  const maxAge = args.maxAgeSeconds ?? STEP_UP_MAX_AGE_SECONDS
  const authenticatedAt = latestOAuthAuthentication(readAmr(decodeJwtPayload(args.accessToken)))
  if (authenticatedAt === null || authenticatedAt > now + 60 || now - authenticatedAt > maxAge) {
    return { ok: false, code: 'recent_auth_required', status: 401, authenticatedAt }
  }
  return { ok: true, authenticatedAt, method: 'oauth' }
}

export function isRefreshTokenReuse(error) {
  if (!error) return false
  const code = (error.code || '').toLowerCase()
  if (code === 'refresh_token_already_used') return true
  const message = (error.message || '').toLowerCase()
  return message.includes('already used') && message.includes('refresh')
}

function adapterFor(request, secure) {
  const jar = { incoming: readCookieHeader(request.headers.get('cookie')), setCookies: [] }
  const adapter = {
    getAll: () => jar.incoming.map((cookie) => ({ ...cookie })),
    setAll(cookies) {
      for (const cookie of cookies) {
        const options = applySwadeCookieOptions(cookie.name, cookie.options, secure)
        jar.setCookies.push(serializeCookie(cookie.name, cookie.value, options))
        const index = jar.incoming.findIndex((item) => item.name === cookie.name)
        if (cookie.value === '' || options.maxAge === 0) {
          if (index >= 0) jar.incoming.splice(index, 1)
        } else if (index >= 0) jar.incoming[index] = { name: cookie.name, value: cookie.value }
        else jar.incoming.push({ name: cookie.name, value: cookie.value })
      }
    },
  }
  return { adapter, jar }
}

function json(status, body, jar) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  for (const cookie of jar.setCookies) headers.append('set-cookie', cookie)
  return new Response(JSON.stringify(body), { status, headers })
}

function redirect(location, jar) {
  const headers = new Headers({ location, 'cache-control': 'no-store' })
  for (const cookie of jar.setCookies) headers.append('set-cookie', cookie)
  return new Response(null, { status: 302, headers })
}

function sameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  return origin === new URL(request.url).origin
}

export function createFetchAuthHandler(options) {
  const base = (options.basePath ?? SWADE_AUTH_BASE_PATH).replace(/\/$/, '')
  const secure = options.secure !== false
  const fallback = options.fallbackNext ?? '/'
  const now = options.now ?? Date.now
  return async function handle(request) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith(base)) return new Response('Not found', { status: 404 })
    const { adapter, jar } = adapterFor(request, secure)
    if (!options.createClient) return json(503, { code: 'auth_not_configured' }, jar)
    const client = options.createClient(adapter)
    const route = url.pathname.slice(base.length) || '/'
    if ((route === '/google' || route === '/step-up') && request.method === 'GET') {
      const next = safeNextPath(url.searchParams.get('next'), fallback)
      adapter.setAll([{ name: SWADE_AUTH_NEXT_COOKIE, value: next, options: { maxAge: 600 } }])
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${url.origin}${base}/callback`,
          skipBrowserRedirect: true,
          queryParams: route === '/step-up' ? { prompt: 'login', max_age: '0' } : { prompt: 'select_account' },
        },
      })
      if (error || !data?.url) return json(502, { code: 'oauth_start_failed' }, jar)
      let target
      try { target = new URL(data.url) } catch { return json(502, { code: 'oauth_start_failed' }, jar) }
      if (target.origin !== new URL(options.url).origin) return json(502, { code: 'oauth_start_failed' }, jar)
      return redirect(target.toString(), jar)
    }
    if (route === '/callback' && request.method === 'GET') {
      const nextCookie = adapter.getAll().find((cookie) => cookie.name === SWADE_AUTH_NEXT_COOKIE)?.value
      const next = safeNextPath(nextCookie || url.searchParams.get('next'), fallback)
      adapter.setAll([{ name: SWADE_AUTH_NEXT_COOKIE, value: '', options: { maxAge: 0 } }])
      if (!url.searchParams.get('code')) return redirect(next, jar)
      const { error } = await client.auth.exchangeCodeForSession(url.searchParams.get('code') || '')
      if (error) return redirect(fallback, jar)
      return redirect(next, jar)
    }
    if (route === '/session' && request.method === 'GET') {
      const userResult = await client.auth.getUser()
      if (userResult.error && isRefreshTokenReuse(userResult.error)) {
        return json(401, { signedIn: false, code: 'refresh_reused' }, jar)
      }
      const user = userResult.data.user
      if (userResult.error || !user?.id) return json(200, { signedIn: false }, jar)
      const sessionResult = await client.auth.getSession()
      const accessToken = sessionResult.data.session?.access_token
      const payload = accessToken ? decodeJwtPayload(accessToken) : null
      const recent = accessToken
        ? requireRecentAuth({ accessToken, now: Math.floor(now() / 1000) })
        : { ok: false, authenticatedAt: null }
      return json(200, {
        signedIn: true,
        user: { id: user.id, email: user.email ?? null, providers: (user.identities || []).map((item) => item.provider).filter(Boolean) },
        sessionId: typeof payload?.session_id === 'string' ? payload.session_id : null,
        authenticatedAt: recent.authenticatedAt,
        recentAuth: recent.ok,
      }, jar)
    }
    if ((route === '/sign-out' || route === '/sign-out-all') && request.method === 'POST') {
      if (!sameOrigin(request)) return json(403, { code: 'bad_origin' }, jar)
      const scope = route === '/sign-out-all' ? 'global' : 'local'
      await client.auth.signOut({ scope })
      return json(200, { ok: true, scope }, jar)
    }
    if (route === '/devices' && request.method === 'GET') {
      const userResult = await client.auth.getUser()
      if (!userResult.data.user?.id) return json(401, { code: 'unauthorized' }, jar)
      if (!options.deviceStore) return json(501, { code: 'device_store_required' }, jar)
      const sessionResult = await client.auth.getSession()
      const payload = decodeJwtPayload(sessionResult.data.session?.access_token || '')
      const devices = await options.deviceStore.list(userResult.data.user.id, payload?.session_id || null)
      return json(200, { devices }, jar)
    }
    return json(404, { code: 'not_found' }, jar)
  }
}
