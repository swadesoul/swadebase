import {
  CatalogError,
  PRESET_ID,
  assertId,
  assertTenant,
  buildMasterPlaylist,
  contentTypeFor,
  decideDuration,
  evaluateFourK,
  fourKPrefix,
  healthBody,
  masterKey,
  planMultipart,
  quoteEntitlement,
  requireTitle,
  rewritePlaylist,
  validateRights,
  validateYoutubeId,
} from './policy.mjs'
import { signToken, verifyToken } from './tokens.mjs'

const PLAY_TTL_SEC = 15 * 60
const PART_TTL_SEC = 2 * 60 * 60

function cors(headers = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type, apikey, idempotency-key',
    'access-control-allow-methods': 'GET, POST, PUT, HEAD, OPTIONS',
    'access-control-expose-headers': 'accept-ranges, content-length, content-range',
    ...headers,
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }),
  })
}

export function catalogPath(pathname) {
  const marks = ['/functions/v1/catalog-video', '/catalog-video']
  let path = pathname
  for (const mark of marks) {
    const at = path.indexOf(mark)
    if (at >= 0) {
      path = path.slice(at + mark.length)
      break
    }
  }
  if (!path.startsWith('/')) path = `/${path}`
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path || '/'
}

function publicBase(req, deps) {
  if (deps.publicBase) return String(deps.publicBase).replace(/\/$/, '')
  const url = new URL(req.url)
  const path = catalogPath(url.pathname)
  const suffix = path === '/' ? '' : path
  const at = url.pathname.lastIndexOf(suffix)
  const prefix = at >= 0 ? url.pathname.slice(0, at) : url.pathname
  return `${url.origin}${prefix}`.replace(/\/$/, '')
}

async function readJson(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {}
  const text = await req.text()
  if (!text) return {}
  try {
    const body = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new CatalogError(400, 'Send a JSON object.')
    }
    return body
  } catch (error) {
    if (error instanceof CatalogError) throw error
    throw new CatalogError(400, 'Request body is not valid JSON.')
  }
}

function bearer(req) {
  const header = req.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(\S+)$/i)
  return match ? match[1] : null
}

async function requireUser(req, deps) {
  const user = await deps.auth.userFromRequest(req)
  if (!user?.id) throw new CatalogError(401, 'Sign in to SWADEBASE first.')
  assertId(user.id, 'Creator')
  return user
}

function ownAsset(asset, user) {
  if (!asset || asset.creator_user_id !== user.id) {
    throw new CatalogError(404, 'Asset not found in your catalog.')
  }
  return asset
}

function playbackView(asset, extra = {}) {
  return {
    asset_id: asset.id,
    tenant: asset.tenant,
    title: asset.title,
    series_id: asset.series_id,
    episode_order: asset.episode_order,
    episode_title: asset.episode_title,
    source_type: asset.source_type,
    status: asset.status,
    duration_probe_sec: asset.duration_probe_sec,
    duration_decision: asset.duration_decision,
    rights: { web: asset.rights_web, roku: asset.rights_roku },
    four_k: evaluateFourK({ width: asset.width, height: asset.height, rotation: asset.rotation || 0 }),
    price_quote: quoteEntitlement(),
    master_retained: !!asset.master_key,
    ...extra,
  }
}

export async function handle(req, deps) {
  try {
    return await route(req, deps)
  } catch (error) {
    const status = error instanceof CatalogError ? error.status : 500
    const message = error instanceof CatalogError
      ? error.message
      : 'Catalog video request failed. The original file was not deleted.'
    if (!(error instanceof CatalogError)) console.error(error)
    return json({ error: message, ...(error instanceof CatalogError ? error.extra || {} : {}) }, status)
  }
}

async function route(req, deps) {
  const url = new URL(req.url)
  const path = catalogPath(url.pathname)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() })
  if (req.method === 'GET' && path === '/health') return json(healthBody(deps.enabled === true))
  if (deps.enabled !== true) {
    throw new CatalogError(503, 'Catalog video is off. It stays off until storage, capacity, and the live baseline are verified.')
  }

  if (path.startsWith('/uploads/parts')) return putPart(req, url, deps)
  if (path.startsWith('/hls/')) return serveHls(req, url, path, deps)

  const user = await requireUser(req, deps)
  const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? await readJson(req) : {}
  const parts = path.split('/').filter(Boolean)

  if (req.method === 'POST' && path === '/series') return createSeries(user, body, deps)
  if (req.method === 'GET' && parts[0] === 'series' && parts.length === 2) return getSeries(user, parts[1], deps)
  if (req.method === 'POST' && parts[0] === 'series' && parts[2] === 'source-master') {
    return linkSourceMaster(user, parts[1], body, deps)
  }
  if (req.method === 'POST' && path === '/assets') return createAsset(req, user, body, deps)
  if (req.method === 'GET' && parts[0] === 'assets' && parts.length === 2) return getAsset(user, parts[1], deps)
  if (req.method === 'POST' && parts[0] === 'assets' && parts[2] === 'uploads' && parts.length === 3) {
    return startUpload(req, user, parts[1], body, deps)
  }
  if (req.method === 'POST' && parts[0] === 'assets' && parts[2] === 'uploads' && parts[3] === 'complete') {
    return completeUpload(user, parts[1], body, deps)
  }
  if (req.method === 'POST' && parts[0] === 'assets' && parts[2] === 'rights') {
    return updateRights(user, parts[1], body, deps)
  }
  if (req.method === 'GET' && parts[0] === 'assets' && parts[2] === 'playback') {
    return playback(req, user, parts[1], url, deps)
  }
  throw new CatalogError(404, 'Catalog video route not found.')
}

async function createSeries(user, body, deps) {
  const tenant = assertTenant(body.tenant)
  const title = requireTitle(body.title, 'Series title')
  const row = await deps.db.createSeries({ tenant, creatorId: user.id, title })
  return json({ series: row, price_quote: quoteEntitlement() }, 201)
}

async function getSeries(user, id, deps) {
  assertId(id, 'Series')
  const row = await deps.db.getSeries(id)
  if (!row || row.creator_user_id !== user.id) throw new CatalogError(404, 'Series not found in your catalog.')
  const episodes = (await deps.db.listEpisodes(id)).map((asset) => ({
    id: asset.id,
    episode_order: asset.episode_order,
    episode_title: asset.episode_title,
    title: asset.title,
    status: asset.status,
    duration_decision: asset.duration_decision,
    duration_probe_sec: asset.duration_probe_sec,
    publishable: asset.status === 'ready' && asset.duration_decision === 'accepted',
  }))
  return json({ series: row, episodes, price_quote: quoteEntitlement() })
}

async function linkSourceMaster(user, seriesId, body, deps) {
  assertId(seriesId, 'Series')
  assertId(body.asset_id, 'Asset')
  const row = await deps.db.setSourceMaster(seriesId, body.asset_id, user.id)
  if (!row) throw new CatalogError(404, 'Series not found in your catalog.')
  return json({
    series: row,
    message: 'The long original stays stored with the series. Upload each episode as its own file of 10 minutes or less.',
  })
}

function idempotencyKey(req) {
  const key = req.headers.get('idempotency-key')
  if (key == null || key === '') return null
  if (!/^[\w.~:-]{1,80}$/.test(key)) {
    throw new CatalogError(400, 'Idempotency-Key must be 1 to 80 letters, numbers, or . _ : ~ - characters.')
  }
  return key
}

async function createAsset(req, user, body, deps) {
  const tenant = assertTenant(body.tenant)
  const title = requireTitle(body.title)
  const sourceType = body.source_type
  if (sourceType !== 'original' && sourceType !== 'youtube_embed') {
    throw new CatalogError(400, 'source_type must be original or youtube_embed.')
  }
  const rights = validateRights(sourceType, body.rights)
  const youtubeId = sourceType === 'youtube_embed' ? validateYoutubeId(body.youtube_id) : null
  let episodeOrder = null
  if (body.episode_order != null) {
    if (!Number.isInteger(body.episode_order) || body.episode_order < 1) {
      throw new CatalogError(400, 'Episode order must be a whole number starting at 1.')
    }
    episodeOrder = body.episode_order
  }
  const episodeTitle = body.episode_title == null ? null : requireTitle(body.episode_title, 'Episode title')
  const seriesId = body.series_id == null ? null : assertId(body.series_id, 'Series')
  const created = await deps.db.createAsset({
    tenant,
    creatorId: user.id,
    title,
    sourceType,
    youtubeId,
    rights,
    seriesId,
    episodeOrder,
    episodeTitle,
    idempotencyKey: idempotencyKey(req),
  })
  return json({
    asset: created.row,
    reused: created.reused,
    upload: sourceType === 'original' ? 'POST /assets/:id/uploads with the file size in bytes.' : null,
    four_k_prefix_reserved: fourKPrefix(tenant, user.id, created.row.id),
    four_k_writes: 'disabled',
  }, created.reused ? 200 : 201)
}

async function getAsset(user, id, deps) {
  assertId(id, 'Asset')
  const asset = ownAsset(await deps.db.getAsset(id), user)
  const decision = asset.duration_probe_sec == null ? null : decideDuration(Number(asset.duration_probe_sec))
  return json({
    asset,
    duration_message: decision?.message ?? null,
    four_k: evaluateFourK(asset),
    price_quote: quoteEntitlement(),
  })
}

function requireStore(deps) {
  if (!deps.store) throw new CatalogError(503, 'Catalog object storage is not configured.')
  return deps.store
}

async function startUpload(req, user, id, body, deps) {
  assertId(id, 'Asset')
  const asset = ownAsset(await deps.db.getAsset(id), user)
  if (asset.source_type !== 'original') {
    throw new CatalogError(400, 'YouTube videos stay as embeds. There is no master upload and no HLS package.')
  }
  if (!['reserved', 'failed'].includes(asset.status)) {
    throw new CatalogError(409, 'This original is already stored. It was not replaced.')
  }
  const bytes = body.bytes
  const plan = planMultipart(bytes, { maxBytes: deps.maxMasterBytes })
  const key = masterKey(asset.tenant, user.id, asset.id)
  const created = await requireStore(deps).createMultipart({ key, contentType: body.content_type || 'application/octet-stream' })
  await deps.db.updateAsset(asset.id, { status: 'uploading', upload_id: created.uploadId, declared_bytes: bytes, master_key: key })
  const base = publicBase(req, deps)
  const parts = []
  for (const part of plan.parts) {
    const token = await signToken(deps.signingKey, {
      v: 1,
      scope: 'part',
      assetId: asset.id,
      uploadId: created.uploadId,
      partNumber: part.partNumber,
      exp: Math.floor(Date.now() / 1000) + PART_TTL_SEC,
    })
    const direct = deps.store.presignPart
      ? await deps.store.presignPart({ key, uploadId: created.uploadId, partNumber: part.partNumber })
      : `${base}/uploads/parts?token=${encodeURIComponent(token)}`
    parts.push({ part_number: part.partNumber, size: part.size, method: 'PUT', url: direct })
  }
  return json({
    upload_id: created.uploadId,
    key,
    part_size: plan.partSize,
    part_count: plan.partCount,
    parts,
    expires_in: PART_TTL_SEC,
  })
}

async function putPart(req, url, deps) {
  if (req.method !== 'PUT') throw new CatalogError(405, 'Upload each part with PUT.')
  const payload = await verifyToken(deps.signingKey, url.searchParams.get('token'))
  if (!payload || payload.scope !== 'part') {
    throw new CatalogError(401, 'Upload link is invalid or expired. Start the part again.')
  }
  const asset = await deps.db.getAsset(payload.assetId)
  if (!asset || asset.upload_id !== payload.uploadId) {
    throw new CatalogError(404, 'Upload session not found. Start the upload again.')
  }
  const plan = planMultipart(asset.declared_bytes, { maxBytes: deps.maxMasterBytes })
  const expected = plan.parts.find((part) => part.partNumber === payload.partNumber)
  const bytes = new Uint8Array(await req.arrayBuffer())
  if (!expected || bytes.byteLength !== expected.size) {
    throw new CatalogError(400, `Part ${payload.partNumber} must be ${expected ? expected.size : 'the planned'} bytes.`)
  }
  const stored = await deps.store.putPart({ uploadId: payload.uploadId, partNumber: payload.partNumber, bytes })
  return json({ etag: stored.etag, part_number: payload.partNumber })
}

async function completeUpload(user, id, body, deps) {
  assertId(id, 'Asset')
  const asset = ownAsset(await deps.db.getAsset(id), user)
  if (!body.upload_id || body.upload_id !== asset.upload_id) {
    throw new CatalogError(400, 'upload_id does not match the open upload.')
  }
  if (!Array.isArray(body.parts) || body.parts.length === 0) {
    throw new CatalogError(400, 'Send the part numbers and etags to finish the upload.')
  }
  const result = await deps.store.complete({
    uploadId: body.upload_id,
    key: asset.master_key,
    parts: body.parts.map((part) => ({ part_number: part.part_number, etag: part.etag })),
  })
  if (result.bytes != null && result.bytes !== asset.declared_bytes) {
    if (asset.status === 'uploading') await deps.store.remove?.(result.key || asset.master_key)
    throw new CatalogError(400, 'Uploaded size does not match the declared size. Send the file again.')
  }
  const updated = await deps.db.updateAsset(asset.id, {
    status: 'uploaded',
    master_key: result.key || asset.master_key,
    sha256: result.sha256 || `pending:${asset.id}`,
    bytes: result.bytes ?? asset.declared_bytes,
    upload_id: null,
    error_message: null,
  })
  await deps.db.enqueueJob({
    assetId: asset.id,
    creatorId: user.id,
    kind: 'probe',
    preset: PRESET_ID,
    sha: result.sha256,
  })
  return json({
    asset: updated,
    message: 'Original stored. The server will probe the duration before any transcode.',
    master_retained: true,
  })
}

async function updateRights(user, id, body, deps) {
  assertId(id, 'Asset')
  const asset = ownAsset(await deps.db.getAsset(id), user)
  const rights = validateRights(asset.source_type, body.rights)
  const updated = await deps.db.updateAsset(asset.id, { rights_web: rights.web, rights_roku: rights.roku })
  if (updated.duration_decision === 'accepted' && updated.status !== 'ready' && (rights.web || rights.roku)) {
    await deps.db.enqueueJob({
      assetId: asset.id,
      creatorId: user.id,
      kind: 'package',
      preset: PRESET_ID,
      sha: updated.sha256,
    })
    await deps.db.updateAsset(asset.id, { status: 'queued' })
  }
  return json({ asset: await deps.db.getAsset(asset.id) })
}

async function playback(req, user, id, url, deps) {
  assertId(id, 'Asset')
  const asset = ownAsset(await deps.db.getAsset(id), user)
  const target = url.searchParams.get('target') || 'web'
  if (target !== 'web' && target !== 'roku') {
    throw new CatalogError(400, 'target must be web or roku.')
  }
  if (asset.source_type === 'youtube_embed') {
    return json(playbackView(asset, {
      mode: 'youtube_embed',
      youtube_id: asset.youtube_id,
      hls: null,
      roku: null,
      message: 'YouTube plays in a web embed. It is not an HLS or Roku stream.',
    }))
  }
  if (asset.duration_decision === 'needs_episode_submission') {
    return json(playbackView(asset, {
      mode: 'needs_episode_submission',
      hls: null,
      roku: null,
      message: decideDuration(Number(asset.duration_probe_sec)).message,
    }))
  }
  if (asset.status !== 'ready' || !asset.hls_prefix) {
    return json(playbackView(asset, { mode: 'pending', hls: null, roku: null }))
  }
  if (target === 'web' && !asset.rights_web) {
    throw new CatalogError(403, 'Web playback is off for this video. Set the web right when you have a license to deliver the original.')
  }
  if (target === 'roku' && !asset.rights_roku) {
    throw new CatalogError(403, 'Roku playback is off for this video. Set the Roku right when you have a license to deliver the original.')
  }
  const exp = Math.floor(Date.now() / 1000) + PLAY_TTL_SEC
  const token = await signToken(deps.signingKey, { v: 1, scope: 'play', assetId: asset.id, target, exp })
  const base = publicBase(req, deps)
  const manifestUrl = `${base}/hls/${asset.id}/master.m3u8?token=${encodeURIComponent(token)}`
  const posterUrl = asset.poster_key
    ? `${base}/hls/${asset.id}/poster.jpg?token=${encodeURIComponent(token)}`
    : null
  const maxHeight = Math.max(...(asset.ladder || []).map((rung) => rung.height))
  return json(playbackView(asset, {
    mode: 'hls',
    hls: {
      manifest_url: manifestUrl,
      expires_at: new Date(exp * 1000).toISOString(),
      max_height: maxHeight,
      codecs: asset.has_audio ? 'avc1.640028,mp4a.40.2' : 'avc1.640028',
    },
    poster_url: posterUrl,
    roku: target === 'roku' ? { stream_url: manifestUrl, format: 'hls' } : null,
  }))
}

async function serveHls(req, url, path, deps) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw new CatalogError(405, 'Playlists and segments are fetched with GET.')
  const bits = path.split('/').filter(Boolean)
  const id = bits[1]
  const name = bits.slice(2).join('/')
  assertId(id, 'Asset')
  if (!name || name.includes('..')) throw new CatalogError(400, 'Playback path is invalid.')
  const payload = await verifyToken(deps.signingKey, url.searchParams.get('token'))
  if (!payload || payload.scope !== 'play' || payload.assetId !== id) {
    throw new CatalogError(401, 'Playback link is invalid or expired. Request a new one.')
  }
  const asset = await deps.db.getAsset(id)
  if (!asset || asset.status !== 'ready' || !asset.hls_prefix) {
    throw new CatalogError(404, 'This video has no HLS package.')
  }
  if (payload.target === 'roku' && !asset.rights_roku) throw new CatalogError(403, 'Roku playback is off for this video.')
  if (payload.target === 'web' && !asset.rights_web) throw new CatalogError(403, 'Web playback is off for this video.')
  const token = url.searchParams.get('token')
  const base = publicBase(req, deps)
  if (name === 'master.m3u8') {
    const playlist = rewritePlaylist(buildMasterPlaylist(asset.ladder || [], asset.has_audio), (uri) => {
      return `${base}/hls/${id}/${uri}?token=${encodeURIComponent(token)}`
    })
    return mediaResponse(req, playlist, 'application/vnd.apple.mpegurl')
  }
  if (name === 'poster.jpg') {
    return bytesResponse(req, await deps.store.get(asset.poster_key), 'image/jpeg')
  }
  const [rung, file] = name.split('/')
  if (!rung || !file || !/^[A-Za-z0-9._-]+$/.test(rung) || !/^[A-Za-z0-9._-]+$/.test(file)) {
    throw new CatalogError(400, 'Playback path is invalid.')
  }
  const key = `${asset.hls_prefix}/${rung}/${file}`
  if (!key.startsWith(`${asset.hls_prefix}/`)) throw new CatalogError(403, 'That file is outside this video.')
  if (file.endsWith('.m3u8')) {
    const raw = new TextDecoder().decode(await deps.store.get(key))
    const playlist = rewritePlaylist(raw, (uri) => `${base}/hls/${id}/${rung}/${uri.split('/').pop()}?token=${encodeURIComponent(token)}`)
    return mediaResponse(req, playlist, 'application/vnd.apple.mpegurl')
  }
  if (deps.store.presignGet && file.endsWith('.ts')) {
    const signed = await deps.store.presignGet(key, 900)
    return new Response(null, { status: 302, headers: cors({ location: signed, 'cache-control': 'private, max-age=60' }) })
  }
  const opened = await deps.store.open(key)
  return rangedFile(req, opened, contentTypeFor(file))
}

function mediaResponse(req, text, type) {
  const body = req.method === 'HEAD' ? null : text
  return new Response(body, {
    status: 200,
    headers: cors({
      'content-type': type,
      'content-length': String(new TextEncoder().encode(text).length),
      'cache-control': 'private, max-age=60',
    }),
  })
}

function bytesResponse(req, bytes, type) {
  const body = req.method === 'HEAD' ? null : bytes
  return new Response(body, {
    status: 200,
    headers: cors({ 'content-type': type, 'content-length': String(bytes.byteLength), 'cache-control': 'private, max-age=300' }),
  })
}

async function rangedFile(req, opened, type) {
  const size = opened.bytes
  const range = req.headers.get('range')
  if (!range) {
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: cors({ 'content-type': type, 'content-length': String(size), 'accept-ranges': 'bytes' }) })
    }
    const data = await depsRead(opened)
    return new Response(data, { status: 200, headers: cors({ 'content-type': type, 'content-length': String(data.byteLength), 'accept-ranges': 'bytes' }) })
  }
  const match = range.match(/^bytes=(\d+)-(\d*)$/)
  if (!match) throw new CatalogError(416, 'Range must look like bytes=start-end.')
  const start = Number(match[1])
  const end = match[2] ? Number(match[2]) : size - 1
  if (start > end || end >= size) throw new CatalogError(416, 'Range is outside this segment.')
  if (req.method === 'HEAD') {
    return new Response(null, {
      status: 206,
      headers: cors({
        'content-type': type,
        'content-length': String(end - start + 1),
        'content-range': `bytes ${start}-${end}/${size}`,
        'accept-ranges': 'bytes',
      }),
    })
  }
  const chunks = []
  for await (const chunk of opened.stream(start, end)) chunks.push(chunk)
  const data = Buffer.concat(chunks)
  return new Response(data, {
    status: 206,
    headers: cors({
      'content-type': type,
      'content-length': String(data.length),
      'content-range': `bytes ${start}-${end}/${size}`,
      'accept-ranges': 'bytes',
    }),
  })
}

async function depsRead(opened) {
  if (opened.stream) {
    const chunks = []
    for await (const chunk of opened.stream(0, opened.bytes - 1)) chunks.push(chunk)
    return Buffer.concat(chunks)
  }
  return opened
}
