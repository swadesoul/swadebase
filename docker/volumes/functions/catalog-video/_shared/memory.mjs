import { CatalogError, quoteEntitlement } from './policy.mjs'

const STALE_MS = 10 * 60 * 1000

function clone(row) {
  return row ? structuredClone(row) : null
}

export function createMemoryDb() {
  const series = new Map()
  const assets = new Map()
  const jobs = []
  const entitlements = new Map()
  const idem = new Map()

  function entitlementKey(tenant, creatorId) {
    return `${tenant}:${creatorId}`
  }

  function ensureQuote(tenant, creatorId) {
    const key = entitlementKey(tenant, creatorId)
    if (!entitlements.has(key)) {
      entitlements.set(key, {
        id: crypto.randomUUID(),
        tenant,
        creator_user_id: creatorId,
        ...quoteEntitlement(),
        created_at: new Date().toISOString(),
      })
    }
    return entitlements.get(key)
  }

  return {
    ensureQuote,
    getEntitlement(tenant, creatorId) {
      return clone(ensureQuote(tenant, creatorId))
    },
    createSeries({ tenant, creatorId, title }) {
      const row = {
        id: crypto.randomUUID(),
        tenant,
        creator_user_id: creatorId,
        title,
        source_master_asset_id: null,
        created_at: new Date().toISOString(),
      }
      series.set(row.id, row)
      ensureQuote(tenant, creatorId)
      return clone(row)
    },
    getSeries(id) {
      return clone(series.get(id))
    },
    setSourceMaster(seriesId, assetId, creatorId) {
      const show = series.get(seriesId)
      const asset = assets.get(assetId)
      if (!show || show.creator_user_id !== creatorId) return null
      if (!asset || asset.creator_user_id !== creatorId || asset.tenant !== show.tenant) {
        throw new CatalogError(404, 'That original is not in this catalog.')
      }
      if (asset.series_id === show.id && asset.episode_order != null) {
        throw new CatalogError(409, 'An episode cannot also be the long source master. Upload the episodes as separate files.')
      }
      show.source_master_asset_id = assetId
      asset.series_id = show.id
      asset.episode_order = null
      return clone(show)
    },
    createAsset(input) {
      if (input.idempotencyKey) {
        const key = `${input.creatorId}:${input.tenant}:${input.idempotencyKey}`
        const existing = idem.get(key)
        if (existing) return { row: clone(assets.get(existing)), reused: true }
      }
      if (input.seriesId) {
        const show = series.get(input.seriesId)
        if (!show || show.creator_user_id !== input.creatorId || show.tenant !== input.tenant) {
          throw new CatalogError(404, 'Series not found in this catalog.')
        }
        if (input.episodeOrder != null) {
          for (const asset of assets.values()) {
            if (asset.series_id === input.seriesId && asset.episode_order === input.episodeOrder) {
              throw new CatalogError(409, `Episode order ${input.episodeOrder} is already used in this series. Choose a different order.`)
            }
          }
        }
      } else if (input.episodeOrder != null) {
        throw new CatalogError(400, 'Add a series id before setting an episode order.')
      }
      const row = {
        id: crypto.randomUUID(),
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
        master_key: null,
        sha256: null,
        bytes: null,
        duration_probe_sec: null,
        duration_decision: null,
        width: null,
        height: null,
        rotation: null,
        video_codec: null,
        pix_fmt: null,
        audio_codec: null,
        native_4k: false,
        status: input.sourceType === 'youtube_embed' ? 'embed_only' : 'reserved',
        hls_prefix: null,
        poster_key: null,
        ladder: null,
        has_audio: false,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      assets.set(row.id, row)
      if (input.idempotencyKey) idem.set(`${input.creatorId}:${input.tenant}:${input.idempotencyKey}`, row.id)
      ensureQuote(input.tenant, input.creatorId)
      return { row: clone(row), reused: false }
    },
    getAsset(id) {
      return clone(assets.get(id))
    },
    updateAsset(id, patch) {
      const row = assets.get(id)
      if (!row) throw new CatalogError(404, 'Asset not found.')
      Object.assign(row, patch, { updated_at: new Date().toISOString() })
      return clone(row)
    },
    listEpisodes(seriesId) {
      return [...assets.values()]
        .filter((asset) => asset.series_id === seriesId && asset.episode_order != null)
        .sort((a, b) => a.episode_order - b.episode_order)
        .map(clone)
    },
    enqueueJob({ assetId, creatorId, kind, preset, sha }) {
      const existing = jobs.find((job) => job.asset_id === assetId && job.kind === kind && job.preset_id === preset && job.source_sha256 === sha && (job.status === 'queued' || job.status === 'running' || job.status === 'done'))
      if (existing) return clone(existing)
      const job = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        creator_user_id: creatorId,
        kind,
        preset_id: preset,
        source_sha256: sha,
        status: 'queued',
        attempts: 0,
        max_attempts: 2,
        worker_id: null,
        error_message: null,
        queued_at: Date.now(),
        started_at: null,
        heartbeat_at: null,
        completed_at: null,
      }
      jobs.push(job)
      return clone(job)
    },
    claim(workerId, now = Date.now()) {
      for (const job of jobs) {
        if (job.status === 'running' && job.heartbeat_at != null && now - job.heartbeat_at > STALE_MS) {
          if (job.attempts >= job.max_attempts) {
            job.status = 'failed'
            job.error_message = job.error_message || 'worker heartbeat lost'
            job.completed_at = now
          } else {
            job.status = 'queued'
            job.error_message = job.error_message || 'worker heartbeat lost'
          }
        }
      }
      if (jobs.some((job) => job.status === 'running')) return null
      const next = jobs.filter((job) => job.status === 'queued').sort((a, b) => a.queued_at - b.queued_at)[0]
      if (!next) return null
      next.status = 'running'
      next.worker_id = workerId
      next.attempts += 1
      next.started_at = next.started_at || now
      next.heartbeat_at = now
      return clone(next)
    },
    heartbeat(id, now = Date.now()) {
      const job = jobs.find((item) => item.id === id)
      if (!job || job.status !== 'running') return null
      job.heartbeat_at = now
      return clone(job)
    },
    completeJob(id) {
      const job = jobs.find((item) => item.id === id)
      if (!job) return null
      job.status = 'done'
      job.completed_at = Date.now()
      return clone(job)
    },
    failJob(id, message) {
      const job = jobs.find((item) => item.id === id)
      if (!job) return null
      job.error_message = message
      if (job.attempts >= job.max_attempts) {
        job.status = 'failed'
        job.completed_at = Date.now()
      } else {
        job.status = 'queued'
      }
      return clone(job)
    },
    jobs() {
      return jobs.map(clone)
    },
  }
}
