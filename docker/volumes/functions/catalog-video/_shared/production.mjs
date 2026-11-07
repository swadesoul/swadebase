import { CatalogError, DEFAULT_MAX_MASTER_BYTES, assertId, assertTenant } from './policy.mjs'

function headers(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
    ...extra,
  }
}

async function rest(env, path, { method = 'GET', body, prefer } = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new CatalogError(503, 'Catalog database is not configured.')
  }
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, {
    method,
    headers: headers(env, prefer ? { prefer } : {}),
    body: body == null ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = data?.message || data?.error || `Catalog database returned HTTP ${response.status}.`
    throw new CatalogError(response.status === 409 ? 409 : 502, message)
  }
  return data
}

function one(rows) {
  return Array.isArray(rows) ? rows[0] || null : rows
}

export function createRestDb(env) {
  return {
    async createSeries({ tenant, creatorId, title }) {
      assertTenant(tenant)
      assertId(creatorId, 'Creator')
      const rows = await rest(env, 'catalog_video_series', {
        method: 'POST',
        body: { tenant, creator_user_id: creatorId, title },
        prefer: 'return=representation',
      })
      await this.ensureQuote(tenant, creatorId)
      return one(rows)
    },
    async getSeries(id) {
      assertId(id, 'Series')
      return one(await rest(env, `catalog_video_series?id=eq.${id}&select=*`))
    },
    async setSourceMaster(seriesId, assetId, creatorId) {
      assertId(seriesId, 'Series')
      assertId(assetId, 'Asset')
      assertId(creatorId, 'Creator')
      const show = await this.getSeries(seriesId)
      const asset = await this.getAsset(assetId)
      if (!show || show.creator_user_id !== creatorId) return null
      if (!asset || asset.creator_user_id !== creatorId || asset.tenant !== show.tenant) {
        throw new CatalogError(404, 'That original is not in this catalog.')
      }
      if (asset.series_id === show.id && asset.episode_order != null) {
        throw new CatalogError(409, 'An episode cannot also be the long source master. Upload the episodes as separate files.')
      }
      await rest(env, `catalog_video_assets?id=eq.${assetId}`, {
        method: 'PATCH',
        body: { series_id: seriesId, episode_order: null },
      })
      return one(await rest(env, `catalog_video_series?id=eq.${seriesId}`, {
        method: 'PATCH',
        body: { source_master_asset_id: assetId, updated_at: new Date().toISOString() },
        prefer: 'return=representation',
      }))
    },
    async ensureQuote(tenant, creatorId) {
      assertTenant(tenant)
      assertId(creatorId, 'Creator')
      const existing = one(await rest(env, `catalog_video_entitlements?creator_user_id=eq.${creatorId}&tenant=eq.${tenant}&select=*`))
      if (existing) return existing
      try {
        return one(await rest(env, 'catalog_video_entitlements', {
          method: 'POST',
          body: { tenant, creator_user_id: creatorId },
          prefer: 'return=representation',
        }))
      } catch (error) {
        if (error.status !== 409) throw error
        return one(await rest(env, `catalog_video_entitlements?creator_user_id=eq.${creatorId}&tenant=eq.${tenant}&select=*`))
      }
    },
    async getEntitlement(tenant, creatorId) {
      return this.ensureQuote(tenant, creatorId)
    },
    async createAsset(input) {
      assertTenant(input.tenant)
      assertId(input.creatorId, 'Creator')
      if (input.idempotencyKey) {
        const key = encodeURIComponent(input.idempotencyKey)
        const existing = one(await rest(env, `catalog_video_assets?creator_user_id=eq.${input.creatorId}&tenant=eq.${input.tenant}&idempotency_key=eq.${key}&select=*`))
        if (existing) return { row: existing, reused: true }
      }
      const rows = await rest(env, 'catalog_video_assets', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          tenant: input.tenant,
          creator_user_id: input.creatorId,
          series_id: input.seriesId ?? null,
          episode_order: input.episodeOrder ?? null,
          episode_title: input.episodeTitle ?? null,
          title: input.title,
          source_type: input.sourceType,
          youtube_id: input.youtubeId ?? null,
          rights_web: input.rights.web,
          rights_roku: input.rights.roku,
          idempotency_key: input.idempotencyKey,
          status: input.sourceType === 'youtube_embed' ? 'embed_only' : 'reserved',
        },
      })
      await this.ensureQuote(input.tenant, input.creatorId)
      return { row: one(rows), reused: false }
    },
    async getAsset(id) {
      assertId(id, 'Asset')
      return one(await rest(env, `catalog_video_assets?id=eq.${id}&select=*`))
    },
    async updateAsset(id, patch) {
      assertId(id, 'Asset')
      const rows = await rest(env, `catalog_video_assets?id=eq.${id}`, {
        method: 'PATCH',
        body: { ...patch, updated_at: new Date().toISOString() },
        prefer: 'return=representation',
      })
      const row = one(rows)
      if (!row) throw new CatalogError(404, 'Asset not found.')
      return row
    },
    async listEpisodes(seriesId) {
      assertId(seriesId, 'Series')
      const rows = await rest(env, `catalog_video_assets?series_id=eq.${seriesId}&episode_order=not.is.null&select=*&order=episode_order.asc`)
      return rows || []
    },
    async enqueueJob({ assetId, creatorId, kind, preset, sha }) {
      assertId(assetId, 'Asset')
      assertId(creatorId, 'Creator')
      const filter = `asset_id=eq.${assetId}&kind=eq.${encodeURIComponent(kind)}&preset_id=eq.${encodeURIComponent(preset)}&source_sha256=eq.${encodeURIComponent(sha)}&status=in.(queued,running,done)&select=*`
      const existing = one(await rest(env, `catalog_video_jobs?${filter}`))
      if (existing) return existing
      return one(await rest(env, 'catalog_video_jobs', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          asset_id: assetId,
          creator_user_id: creatorId,
          kind,
          preset_id: preset,
          source_sha256: sha,
        },
      }))
    },
    async claim(workerId) {
      const row = await rest(env, 'rpc/claim_catalog_video_job', {
        method: 'POST',
        body: { p_worker_id: workerId, p_max_running: 1 },
      })
      return row && row.id ? row : null
    },
    async heartbeat(id) {
      assertId(id, 'Job')
      await rest(env, `catalog_video_jobs?id=eq.${id}&status=eq.running`, {
        method: 'PATCH',
        body: { heartbeat_at: new Date().toISOString() },
      })
    },
    async completeJob(id) {
      assertId(id, 'Job')
      await rest(env, `catalog_video_jobs?id=eq.${id}`, {
        method: 'PATCH',
        body: { status: 'done', completed_at: new Date().toISOString() },
      })
    },
    async failJob(id, message) {
      assertId(id, 'Job')
      const job = one(await rest(env, `catalog_video_jobs?id=eq.${id}&select=*`))
      if (!job) return null
      const failed = job.attempts >= job.max_attempts
      await rest(env, `catalog_video_jobs?id=eq.${id}`, {
        method: 'PATCH',
        body: {
          status: failed ? 'failed' : 'queued',
          error_message: message,
          completed_at: failed ? new Date().toISOString() : null,
        },
      })
      return job
    },
  }
}

async function loadAws() {
  try {
    return await import('aws4fetch')
  } catch {
    return await import('npm:aws4fetch@1.0.20')
  }
}

function encodeKey(key) {
  return key.split('/').map(encodeURIComponent).join('/')
}

export async function createS3Store(env) {
  const { AwsClient } = await loadAws()
  const endpoint = String(env.CATALOG_VIDEO_S3_ENDPOINT || '').replace(/\/$/, '')
  const bucket = env.CATALOG_VIDEO_S3_BUCKET
  const region = env.CATALOG_VIDEO_S3_REGION || 'us-east-1'
  if (!endpoint || !bucket || !env.CATALOG_VIDEO_S3_ACCESS_KEY_ID || !env.CATALOG_VIDEO_S3_SECRET_ACCESS_KEY) {
    throw new CatalogError(503, 'Catalog object storage is not configured.')
  }
  const client = new AwsClient({
    accessKeyId: env.CATALOG_VIDEO_S3_ACCESS_KEY_ID,
    secretAccessKey: env.CATALOG_VIDEO_S3_SECRET_ACCESS_KEY,
    service: 's3',
    region,
  })
  const urlFor = (key, query = '') => `${endpoint}/${bucket}/${encodeKey(key)}${query}`
  return {
    kind: 's3',
    async createMultipart({ key, contentType }) {
      const response = await client.fetch(urlFor(key, '?uploads'), {
        method: 'POST',
        headers: { 'content-type': contentType || 'application/octet-stream' },
      })
      const text = await response.text()
      if (!response.ok) throw new CatalogError(502, 'Object storage did not open a multipart upload.')
      const uploadId = text.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1]
      if (!uploadId) throw new CatalogError(502, 'Object storage did not return an upload id.')
      return { uploadId }
    },
    async presignPart({ key, uploadId, partNumber }) {
      const url = new URL(urlFor(key))
      url.searchParams.set('partNumber', String(partNumber))
      url.searchParams.set('uploadId', uploadId)
      url.searchParams.set('X-Amz-Expires', '7200')
      const signed = await client.sign(new Request(url, { method: 'PUT' }), { aws: { signQuery: true } })
      return signed.url
    },
    async presignGet(key, expires = 900) {
      const url = new URL(urlFor(key))
      url.searchParams.set('X-Amz-Expires', String(expires))
      const signed = await client.sign(new Request(url, { method: 'GET' }), { aws: { signQuery: true } })
      return signed.url
    },
    async complete({ uploadId, parts, key }) {
      const safeParts = parts.map((part) => {
        const etag = String(part.etag || '').replaceAll('"', '')
        if (!/^[0-9a-fA-F-]{8,128}$/.test(etag) || !Number.isInteger(part.part_number)) {
          throw new CatalogError(400, 'A part etag is invalid.')
        }
        return { part_number: part.part_number, etag }
      }).sort((a, b) => a.part_number - b.part_number)
      const xml = `<CompleteMultipartUpload>${safeParts.map((part) => `<Part><PartNumber>${part.part_number}</PartNumber><ETag>"${part.etag}"</ETag></Part>`).join('')}</CompleteMultipartUpload>`
      const response = await client.fetch(urlFor(key, `?uploadId=${encodeURIComponent(uploadId)}`), {
        method: 'POST',
        headers: { 'content-type': 'application/xml' },
        body: xml,
      })
      if (!response.ok) throw new CatalogError(502, 'Object storage did not finish the multipart upload.')
      const head = await client.fetch(urlFor(key), { method: 'HEAD' })
      const bytes = Number(head.headers.get('content-length') || 0)
      return { key, bytes, sha256: null }
    },
    async download(key, dest) {
      const signed = await this.presignGet(key, 3600)
      const response = await fetch(signed)
      if (!response.ok || !response.body) throw new CatalogError(502, 'Object storage did not return the original.')
      const { createWriteStream } = await import('node:fs')
      const { pipeline } = await import('node:stream/promises')
      await pipeline(response.body, createWriteStream(dest))
    },
    localPath() {
      throw new CatalogError(501, 'Download the master into the worker temp directory before probing.')
    },
  }
}

export async function createProductionDeps(env) {
  const deps = {
    signingKey: env.CATALOG_VIDEO_SIGNING_KEY,
    publicBase: env.CATALOG_VIDEO_PUBLIC_BASE || `${(env.SUPABASE_PUBLIC_URL || '').replace(/\/$/, '')}/functions/v1/catalog-video`,
    maxMasterBytes: Number(env.CATALOG_VIDEO_MAX_MASTER_BYTES || DEFAULT_MAX_MASTER_BYTES),
    workerId: env.CATALOG_VIDEO_WORKER_ID || 'catalog-video-worker',
    x264Preset: env.CATALOG_VIDEO_X264_PRESET || 'veryfast',
    x264Crf: Number(env.CATALOG_VIDEO_X264_CRF || 20),
    hlsTime: Number(env.CATALOG_VIDEO_HLS_TIME || 6),
    transcodeTimeoutMs: Number(env.CATALOG_VIDEO_JOB_TIMEOUT_MS || 20 * 60 * 1000),
    auth: {
      async userFromRequest(req) {
        const header = req.headers.get('authorization') || ''
        const token = header.match(/^Bearer\s+(\S+)$/i)?.[1]
        if (!token || !env.SUPABASE_URL) return null
        const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
          headers: {
            apikey: env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) return null
        const user = await response.json()
        return user?.id ? { id: user.id, email: user.email || '' } : null
      },
    },
    db: createRestDb(env),
    store: null,
  }
  if (env.CATALOG_VIDEO_S3_ENDPOINT) deps.store = await createS3Store(env)
  return deps
}
