// Gateway JWT exemption for catalog-video media URLs only.
// Every other function, and every catalog-video data route, still requires VERIFY_JWT.

const TOKEN_MIN = 40

function partsOf(pathname) {
  return String(pathname || '').split('/').filter(Boolean)
}

export function catalogMediaRouteExempt(method, pathname, token) {
  const parts = partsOf(pathname)
  const at = parts.lastIndexOf('catalog-video')
  if (at < 0 || parts[at] !== 'catalog-video') return false
  // The service name must be the function segment, not a later arbitrary folder.
  if (at > 2) return false
  const after = parts.slice(at + 1)
  const verb = String(method || '').toUpperCase()
  const hasToken = typeof token === 'string' && token.length >= TOKEN_MIN
  if ((verb === 'GET' || verb === 'HEAD') && after[0] === 'hls' && after.length >= 2 && hasToken) return true
  if (verb === 'PUT' && after.length === 2 && after[0] === 'uploads' && after[1] === 'parts' && hasToken) return true
  return false
}
