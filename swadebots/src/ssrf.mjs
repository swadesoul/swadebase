import { lookup as defaultLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const BLOCKED_NAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
])

export class SsrfError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SsrfError'
    this.code = 'ssrf_blocked'
  }
}

export function isBlockedAddress(address) {
  const ip = String(address || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (!ip) return true
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  const v4 = mapped ? mapped[1] : ip
  const parts = v4.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return !isIP(ip) || ip.includes(':')
  }
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true
  return false
}

function blockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (BLOCKED_NAMES.has(host)) return true
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) return true
  return false
}

export async function assertPublicUrl(raw, options = {}) {
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new SsrfError('URL is not valid')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfError('Only http and https URLs can be fetched')
  }
  if (url.username || url.password) throw new SsrfError('URLs with credentials are blocked')
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (blockedHostname(hostname)) throw new SsrfError('That host is blocked')
  const ips = isIP(hostname) ? [hostname] : await resolve(hostname, options.lookup || defaultLookup)
  if (!ips.length) throw new SsrfError('The host did not resolve')
  for (const ip of ips) {
    if (isBlockedAddress(ip)) throw new SsrfError('Private, loopback, and metadata addresses are blocked')
  }
  return { href: url.href, hostname, ips }
}

async function resolve(hostname, lookup) {
  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map((record) => record.address)
}

export async function safeFetch(raw, options = {}) {
  const fetchImpl = options.fetchImpl || fetch
  let current = raw
  for (let hop = 0; hop < 3; hop += 1) {
    const checked = await assertPublicUrl(current, options)
    const response = await fetchImpl(checked.href, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': 'swadebots/1.0' },
      signal: options.signal,
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw new SsrfError('Redirect is missing a location')
      current = new URL(location, checked.href).href
      continue
    }
    const text = await response.text()
    return {
      url: checked.href,
      status: response.status,
      content_type: response.headers.get('content-type') || '',
      body: text.slice(0, 20000),
    }
  }
  throw new SsrfError('Too many redirects')
}
