const SECRET_KEYS = /secret|password|token|authorization|credential|api_key|decrypted/i

export function redact(value, depth = 0) {
  if (depth > 8 || value == null) return value
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  if (typeof value !== 'object') return value
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEYS.test(key) ? '[redacted]' : redact(item, depth + 1)
  }
  return out
}

export function containsSecret(value, secret) {
  if (!secret) return false
  return JSON.stringify(value).includes(secret)
}
