// Shared catalog-video rules. Pure functions: safe for the edge function and the worker.
// 4K playback stays off in this stage. The $100/year figure is a quote, not a charge.

export const DURATION_LIMIT_SEC = 600
export const TENANTS = ['abagale', 'blacktales']
export const DEFAULT_PART_SIZE = 16 * 1024 * 1024
export const S3_MIN_PART = 5 * 1024 * 1024
export const MAX_PARTS = 10000
export const PRICE_QUOTE_CENTS = 10000
export const PRICE_QUOTE = Object.freeze({
  amount_cents: PRICE_QUOTE_CENTS,
  currency: 'USD',
  period: 'year',
  per: 'creator',
  billing_status: 'unconfigured',
})
// Safety ceiling so one object cannot fill an unmeasured disk. This is not a commercial quota.
export const DEFAULT_MAX_MASTER_BYTES = 8 * 1024 * 1024 * 1024
export const PRESET_ID = 'h264_abr_1080'

const BANDWIDTH = { 1080: 5_500_000, 720: 2_800_000, 480: 1_400_000, 360: 800_000 }

export class CatalogError extends Error {
  constructor(status, message, extra = undefined) {
    super(message)
    this.name = 'CatalogError'
    this.status = status
    this.extra = extra
  }
}

export function assertTenant(tenant) {
  if (!TENANTS.includes(tenant)) {
    throw new CatalogError(400, 'Tenant must be abagale or blacktales.')
  }
  return tenant
}

export function requireTitle(value, label = 'Title') {
  if (typeof value !== 'string') throw new CatalogError(400, `${label} is required.`)
  const title = value.trim()
  if (title.length < 1 || title.length > 200) {
    throw new CatalogError(400, `${label} must be 1 to 200 characters.`)
  }
  return title
}

export function assertId(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new CatalogError(400, `${label} is invalid.`)
  }
  return value
}

export function assertStorageKey(key) {
  if (typeof key !== 'string' || key.length < 3 || key.length > 512) {
    throw new CatalogError(400, 'Storage key is invalid.')
  }
  if (key.startsWith('/') || key.includes('..') || key.includes('\\') || key.includes('\0')) {
    throw new CatalogError(400, 'Storage key is invalid.')
  }
  return key
}

export function planMultipart(bytes, { partSize = DEFAULT_PART_SIZE, maxBytes = DEFAULT_MAX_MASTER_BYTES } = {}) {
  if (!Number.isSafeInteger(bytes) || bytes < 1) {
    throw new CatalogError(400, 'File size must be a positive whole number of bytes.')
  }
  if (bytes > maxBytes) {
    throw new CatalogError(413, `This file is above the current safety cap of ${maxBytes} bytes. The cap is not a storage quota. Measure disk before raising it.`)
  }
  let size = partSize
  if (bytes <= size) {
    return { partSize: bytes, partCount: 1, parts: [{ partNumber: 1, size: bytes }] }
  }
  if (size < S3_MIN_PART) size = S3_MIN_PART
  const partCount = Math.ceil(bytes / size)
  if (partCount > MAX_PARTS) {
    throw new CatalogError(400, 'This file needs more than 10,000 parts. Use a larger part size.')
  }
  const parts = []
  let remaining = bytes
  for (let n = 1; n <= partCount; n++) {
    const partBytes = Math.min(size, remaining)
    parts.push({ partNumber: n, size: partBytes })
    remaining -= partBytes
  }
  return { partSize: size, partCount, parts }
}

export function displayedSize(width, height, rotation = 0) {
  const turn = ((Math.round(Number(rotation) || 0) % 360) + 360) % 360
  if (turn === 90 || turn === 270) return { width: height, height: width }
  return { width, height }
}

export function isNative4k(width, height, rotation = 0) {
  const size = displayedSize(width, height, rotation)
  return size.width >= 3840 && size.height >= 2160
}

function evenDown(n) {
  const v = Math.floor(Number(n))
  if (v < 2) return 2
  return v % 2 === 0 ? v : v - 1
}

export function buildLadder(width, height) {
  const heights = [1080, 720, 480, 360].filter((h) => h <= height && h <= 1080)
  const chosen = heights.length > 0 ? heights : [evenDown(Math.min(height, 1080))]
  return chosen.map((h) => {
    const scaledW = evenDown(width * (h / height))
    const scaledH = evenDown(h)
    if (scaledH > height || scaledW > width) {
      throw new CatalogError(500, 'Ladder tried to upscale the master.')
    }
    return {
      id: `h${scaledH}`,
      width: scaledW,
      height: scaledH,
      bandwidth: BANDWIDTH[h] || 1_000_000,
    }
  })
}

// Authoritative duration is the larger of the container and video-stream values.
export function authoritativeDuration(containerSec, streamSec) {
  const values = [containerSec, streamSec].map(Number).filter((n) => Number.isFinite(n) && n > 0)
  if (values.length === 0) return null
  return Math.max(...values)
}

export function decideDuration(durationSec) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return {
      decision: 'unreadable',
      publishable: false,
      message: 'The server could not read a duration from this file. The original is saved.',
    }
  }
  if (durationSec > DURATION_LIMIT_SEC) {
    return {
      decision: 'needs_episode_submission',
      publishable: false,
      message: 'This video is longer than 10 minutes. The original is saved. Submit each episode as its own file of 10 minutes or less.',
    }
  }
  return { decision: 'accepted', publishable: true, message: 'Duration is within 10 minutes.' }
}

export function masterKey(tenant, creatorId, assetId) {
  assertTenant(tenant)
  assertId(creatorId, 'Creator')
  assertId(assetId, 'Asset')
  return assertStorageKey(`catalog/${tenant}/${creatorId}/masters/${assetId}/original`)
}

export function hlsPrefix(tenant, creatorId, assetId) {
  assertTenant(tenant)
  assertId(creatorId, 'Creator')
  assertId(assetId, 'Asset')
  return assertStorageKey(`catalog/${tenant}/${creatorId}/1080/${assetId}`)
}

export function posterKey(tenant, creatorId, assetId) {
  assertTenant(tenant)
  assertId(creatorId, 'Creator')
  assertId(assetId, 'Asset')
  return assertStorageKey(`catalog/${tenant}/${creatorId}/posters/${assetId}.jpg`)
}

// Reserved layout only. This stage never writes it.
export function fourKPrefix(tenant, creatorId, assetId) {
  assertTenant(tenant)
  assertId(creatorId, 'Creator')
  assertId(assetId, 'Asset')
  return assertStorageKey(`catalog/${tenant}/${creatorId}/4k/${assetId}`)
}

export function assertPublishableKey(key) {
  assertStorageKey(key)
  if (key.includes('/4k/')) {
    throw new CatalogError(409, '4K storage is disabled until billing and numeric quotas are authorized.')
  }
  return key
}

export function quoteEntitlement(row = null) {
  return {
    plan_code: 'four_k_annual',
    price_quote_cents: PRICE_QUOTE_CENTS,
    currency: 'USD',
    period: 'year',
    per: 'creator',
    billing_status: 'unconfigured',
    four_k_playback_until: null,
    quota_minutes: null,
    quota_bytes: null,
    quota_egress_bytes: null,
    stored: row ? { id: row.id, tenant: row.tenant, creator_user_id: row.creator_user_id } : null,
  }
}

// Hard-disabled. A forged "active" row still cannot unlock 4K in this build.
export function evaluateFourK(probe) {
  const sourceEligible = !!(probe && isNative4k(probe.width, probe.height, probe.rotation))
  return {
    source_eligible: sourceEligible,
    entitled: false,
    included_in_manifest: false,
    billing_status: 'unconfigured',
    price_quote_cents: PRICE_QUOTE_CENTS,
    currency: 'USD',
    period: 'year',
    per: 'creator',
    quota_minutes: null,
    quota_bytes: null,
    quota_egress_bytes: null,
    reason: 'billing_unconfigured_quotas_unset',
  }
}

export function validateRights(sourceType, rights) {
  if (!rights || typeof rights.web !== 'boolean' || typeof rights.roku !== 'boolean') {
    throw new CatalogError(400, 'Set web and Roku rights to true or false. A missing right is not a grant.')
  }
  if (sourceType === 'youtube_embed' && rights.roku) {
    throw new CatalogError(400, 'YouTube plays in a web embed. It cannot be an HLS or Roku stream.')
  }
  return { web: rights.web, roku: sourceType === 'youtube_embed' ? false : rights.roku }
}

export function validateYoutubeId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{6,32}$/.test(id)) {
    throw new CatalogError(400, 'YouTube id must be 6 to 32 letters, numbers, underscores, or hyphens.')
  }
  return id
}

export function h264Codecs(hasAudio) {
  return hasAudio ? 'avc1.640028,mp4a.40.2' : 'avc1.640028'
}

export function buildMasterPlaylist(ladder, hasAudio) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3']
  for (const rung of ladder) {
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${rung.bandwidth},RESOLUTION=${rung.width}x${rung.height},CODECS="${h264Codecs(hasAudio)}"`)
    lines.push(`${rung.id}/index.m3u8`)
  }
  lines.push('')
  return lines.join('\n')
}

export function rewritePlaylist(text, mapUri) {
  return text.split(/\r?\n/).map((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return line
    return mapUri(trimmed)
  }).join('\n')
}

export function contentTypeFor(name) {
  if (name.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
  if (name.endsWith('.ts')) return 'video/mp2t'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

export function healthBody(enabled = false) {
  return {
    ok: true,
    service: 'catalog-video',
    stage: 'first',
    enabled: enabled === true,
    duration_limit_sec: DURATION_LIMIT_SEC,
    queue: 'catalog_video_jobs',
    motion_studio_queue: 'not_used',
    four_k: 'disabled',
    billing: 'unconfigured',
    price_quote: PRICE_QUOTE,
    quotas: null,
  }
}
