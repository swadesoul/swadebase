// Maestro Artist Signal: artist pages, fan follows, web push, and real now-playing detection.
// One function, many actions. Runs on SWADEBASE; uses the maestroradio schema.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON = Deno.env.get('CRON_SECRET') ?? ''
const SITE = 'https://themaestroradio.com'
const db = createClient('http://kong:8000', SR, { db: { schema: 'maestroradio' }, auth: { persistSession: false } })
const authClient = createClient('http://kong:8000', SR, { auth: { persistSession: false } })

const ORIGINS = [/^https:\/\/(www\.)?themaestroradio\.com$/, /^https:\/\/([a-z0-9-]+--)?maestroradio\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]*b66128c5-9232-47e2-853a-cab847b56554[a-z0-9.-]*$/, /^https:\/\/[a-z0-9.-]+\.sslip\.io$/, /^http:\/\/localhost(:\d+)?$/]
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/,
  /\.notify\.windows\.com$/, /^push\.services\.mozilla\.com$/, /^android\.googleapis\.com$/]
const ADMIN_ROLES = ['admin', 'super_admin', 'owner']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
const bad = (m: string) => new HttpError(400, m)

function cors(req: Request) {
  const o = req.headers.get('origin') ?? ''
  const h: Record<string, string> = {
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-signal-token',
    'access-control-allow-methods': 'GET, POST, OPTIONS', vary: 'origin',
  }
  if (ORIGINS.some((r) => r.test(o))) h['access-control-allow-origin'] = o
  return h
}

// ---------- helpers ----------
export function norm(s: string) {
  return (s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/\s*[\(\[](feat|ft|featuring|prod|explicit|clean|radio edit)[^\)\]]*[\)\]]/g, '')
    .replace(/\s+(feat\.?|ft\.?|featuring)\s+.*$/, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}
export function splitIcy(text: string) {
  const i = text.indexOf(' - ')
  return i > 0 ? { artist: text.slice(0, i).trim(), title: text.slice(i + 3).trim() } : { artist: '', title: text.trim() }
}

async function setting(key: string, make?: () => string | Promise<string>) {
  const { data } = await db.from('artist_signal_settings').select('value').eq('key', key).maybeSingle()
  if (data) return data.value as string
  if (!make) return null
  await db.from('artist_signal_settings').upsert({ key, value: await make() }, { onConflict: 'key', ignoreDuplicates: true })
  const again = await db.from('artist_signal_settings').select('value').eq('key', key).single()
  return again.data!.value as string
}
async function vapid() {
  const pub = await setting('vapid_public', async () => {
    const k = webpush.generateVAPIDKeys()
    await db.from('artist_signal_settings').upsert({ key: 'vapid_private', value: k.privateKey }, { onConflict: 'key', ignoreDuplicates: true })
    return k.publicKey
  })
  const priv = await setting('vapid_private')
  return { pub: pub!, priv: priv! }
}
const hex = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('')

async function logEvent(e: Record<string, unknown>) { await db.from('artist_signal_events').insert(e) }

async function userFrom(req: Request, required = true) {
  const t = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (t && t.split('.').length === 3) {
    const { data } = await authClient.auth.getUser(t)
    if (data?.user) return data.user
  }
  if (required) throw new HttpError(401, 'Sign in to do that.')
  return null
}
async function isAdmin(uid: string) {
  const { data } = await db.from('user_roles').select('role').eq('user_id', uid)
  return (data ?? []).some((r) => ADMIN_ROLES.includes(String(r.role)))
}
async function profileBySlug(slug: unknown, activeOnly = true) {
  if (typeof slug !== 'string' || !/^[a-z0-9-]{2,60}$/.test(slug)) throw bad('Unknown artist.')
  let q = db.from('artist_signal_profiles').select('*').eq('slug', slug)
  if (activeOnly) q = q.eq('active', true)
  const { data } = await q.maybeSingle()
  if (!data) throw new HttpError(404, 'Artist not found.')
  return data
}

// ---------- public ----------
async function publicProfile(slug: unknown) {
  const p = await profileBySlug(slug)
  const now = Date.now()
  const [tracks, airplays, followers] = await Promise.all([
    db.from('artist_signal_tracks').select('id,title,song_id,station_ids').eq('profile_id', p.id).eq('active', true),
    db.from('artist_signal_airplays').select('id,track_id,station_id,scheduled_at,actual_started_at,status')
      .eq('profile_id', p.id).in('status', ['tentative', 'scheduled', 'rescheduled', 'playing'])
      .or(`scheduled_at.gte.${new Date(now - 3600e3).toISOString()},status.eq.playing`).order('scheduled_at', { ascending: true }).limit(20),
    db.from('artist_signal_follows').select('id', { count: 'exact', head: true }).eq('profile_id', p.id),
  ])
  const stationIds = [...new Set([...(airplays.data ?? []).map((a) => a.station_id), ...(tracks.data ?? []).flatMap((t) => t.station_ids ?? [])])]
  const stations = stationIds.length
    ? (await db.from('stations').select('id,name,slug,genre,stream_url,logo_url,status').in('id', stationIds)).data ?? []
    : (await db.from('stations').select('id,name,slug,genre,stream_url,logo_url,status').in('status', ['live', 'active']).limit(5)).data ?? []
  const { pub } = await vapid()
  const playing = (airplays.data ?? []).find((a) => a.status === 'playing') ?? null
  const upcoming = (airplays.data ?? []).filter((a) => a.status !== 'playing' && a.scheduled_at && Date.parse(a.scheduled_at) > now - 60e3)
  return {
    artist: {
      slug: p.slug, display_name: p.display_name, artwork_url: p.artwork_url, biography: p.biography, genre: p.genre,
      social_links: p.social_links, artist_type: p.artist_type, disclosure: p.artist_type === 'human' ? null : p.disclosure, verified: p.verified,
    },
    tracks: tracks.data ?? [], stations, now_playing: playing, upcoming,
    next_airplay: upcoming.find((a) => a.status !== 'tentative') ?? null,
    followers: followers.count ?? 0, vapid_public_key: pub,
    share_url: `${SITE}/artist/${p.slug}`,
    notes: { push: 'Alerts are best-effort; phones and browsers can delay them.', tentative: 'Tentative times may move.' },
  }
}

// ---------- fan ----------
async function follow(uid: string, b: any, on: boolean) {
  const p = await profileBySlug(b.slug)
  if (on) {
    const { count } = await db.from('artist_signal_follows').select('id', { count: 'exact', head: true }).eq('fan_id', uid)
    if ((count ?? 0) >= 500) throw bad('Follow limit reached.')
    const source = typeof b.source === 'string' ? b.source.slice(0, 60) : null
    const { error } = await db.from('artist_signal_follows').upsert({ fan_id: uid, profile_id: p.id, source }, { onConflict: 'fan_id,profile_id', ignoreDuplicates: true })
    if (error) throw error
    await logEvent({ event_type: 'follow', profile_id: p.id, fan_id: uid, event_metadata: { source } })
  } else {
    await db.from('artist_signal_follows').delete().eq('fan_id', uid).eq('profile_id', p.id)
    await logEvent({ event_type: 'unfollow', profile_id: p.id, fan_id: uid })
  }
  return { following: on }
}

async function subscribe(uid: string, b: any, req: Request) {
  const s = b.subscription
  if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) throw bad('Missing push subscription.')
  let host = ''
  try { const u = new URL(s.endpoint); if (u.protocol !== 'https:') throw 0; host = u.hostname } catch { throw bad('Invalid push endpoint.') }
  if (!PUSH_HOSTS.some((r) => r.test(host))) throw bad('Unsupported push service.')
  if (String(s.keys.p256dh).length > 200 || String(s.keys.auth).length > 60) throw bad('Invalid push keys.')
  const { count } = await db.from('artist_signal_push_subscriptions').select('id', { count: 'exact', head: true }).eq('fan_id', uid).eq('enabled', true)
  if ((count ?? 0) >= 10) throw bad('Too many devices. Remove one first.')
  const row = { fan_id: uid, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth_secret: s.keys.auth, enabled: true, failure_count: 0,
    device_label: typeof b.device_label === 'string' ? b.device_label.slice(0, 60) : null, user_agent: (req.headers.get('user-agent') ?? '').slice(0, 200) }
  const { data, error } = await db.from('artist_signal_push_subscriptions').upsert(row, { onConflict: 'endpoint' }).select('id').single()
  if (error) throw error
  await logEvent({ event_type: 'push_subscribe', fan_id: uid, event_metadata: { host } })
  return { device_id: data.id }
}

async function preferences(uid: string, b: any) {
  if (b.set) {
    const profile_id = b.slug ? (await profileBySlug(b.slug)).id : null
    const adv = Number(b.advance_minutes ?? 5)
    if (![0, 5, 15, 30].includes(adv)) throw bad('Lead time must be 0, 5, 15 or 30 minutes.')
    const time = (v: unknown) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : null)
    const tz = typeof b.timezone === 'string' && b.timezone.length < 60 ? b.timezone : 'America/Chicago'
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }) } catch { throw bad('Unknown time zone.') }
    const station_ids = Array.isArray(b.station_ids) ? b.station_ids.filter((x: unknown) => typeof x === 'string' && UUID.test(x)).slice(0, 50) : []
    const row = { fan_id: uid, profile_id, advance_minutes: adv, actual_playback_alerts: b.actual_playback_alerts !== false,
      quiet_start: time(b.quiet_start), quiet_end: time(b.quiet_end), timezone: tz, station_ids, enabled: b.enabled !== false }
    const { error } = await db.from('artist_signal_preferences').upsert(row, { onConflict: 'fan_id,profile_id' })
    if (error) throw error
  }
  const { data } = await db.from('artist_signal_preferences').select('*').eq('fan_id', uid)
  return { preferences: data ?? [] }
}

async function myState(uid: string) {
  const [f, prefs, subs] = await Promise.all([
    db.from('artist_signal_follows').select('profile_id,created_at').eq('fan_id', uid),
    db.from('artist_signal_preferences').select('*').eq('fan_id', uid),
    db.from('artist_signal_push_subscriptions').select('id,device_label,enabled,created_at,last_success_at').eq('fan_id', uid),
  ])
  const ids = (f.data ?? []).map((x) => x.profile_id)
  const artists = ids.length ? (await db.from('artist_signal_profiles').select('id,slug,display_name,artwork_url,genre').in('id', ids).eq('active', true)).data ?? [] : []
  const upcoming = ids.length ? (await db.from('artist_signal_airplays').select('id,profile_id,station_id,scheduled_at,status')
    .in('profile_id', ids).in('status', ['tentative', 'scheduled', 'rescheduled', 'playing']).order('scheduled_at').limit(50)).data ?? [] : []
  return { following: artists, preferences: prefs.data ?? [], devices: subs.data ?? [], upcoming }
}

async function deleteMyData(uid: string) {
  const out: Record<string, number> = {}
  for (const t of ['artist_signal_follows', 'artist_signal_preferences', 'artist_signal_push_subscriptions', 'artist_signal_events']) {
    const { count } = await db.from(t).delete({ count: 'exact' }).eq('fan_id', uid)
    out[t.replace('artist_signal_', '')] = count ?? 0
  }
  return { deleted: out }
}

// ---------- artist + admin ----------
async function artistStats(uid: string, b: any) {
  const p = await profileBySlug(b.slug, false)
  if (p.owner_user_id !== uid && !(await isAdmin(uid))) throw new HttpError(403, 'Not your artist page.')
  const from = b.from ? new Date(b.from).toISOString() : new Date(Date.now() - 30 * 864e5).toISOString()
  const to = b.to ? new Date(b.to).toISOString() : new Date().toISOString()
  const count = async (t: string, f: (q: any) => any) => (await f(db.from(t).select('id', { count: 'exact', head: true }))).count ?? 0
  const airplays = (await db.from('artist_signal_airplays').select('id,status,station_id,scheduled_at,actual_started_at')
    .eq('profile_id', p.id).or(`scheduled_at.gte.${from},actual_started_at.gte.${from}`).limit(1000)).data ?? []
  const apIds = airplays.map((a) => a.id)
  const jobs = apIds.length ? (await db.from('artist_signal_notification_jobs').select('status,opened_at,notification_type')
    .in('airplay_id', apIds).gte('created_at', from).lte('created_at', to).limit(50000)).data ?? [] : []
  const sources = (await db.from('artist_signal_follows').select('source').eq('profile_id', p.id).gte('created_at', from)).data ?? []
  const bySource: Record<string, number> = {}
  for (const s of sources) bySource[s.source ?? 'direct'] = (bySource[s.source ?? 'direct'] ?? 0) + 1
  const by = (k: string) => airplays.filter((a) => a.status === k).length
  return {
    period: { from, to },
    measured: {
      followers_total: await count('artist_signal_follows', (q) => q.eq('profile_id', p.id)),
      new_followers: sources.length, follows_by_source: bySource,
      page_views: await count('artist_signal_events', (q) => q.eq('profile_id', p.id).eq('event_type', 'page_view').gte('event_timestamp', from).lte('event_timestamp', to)),
      airplays_confirmed_played: by('played') + by('playing'), airplays_upcoming: by('scheduled') + by('rescheduled') + by('tentative'),
      airplays_missed: by('missed'), airplays_canceled: by('canceled'),
      notifications_accepted_by_push_service: jobs.filter((j) => j.status === 'sent').length,
      notifications_failed: jobs.filter((j) => j.status === 'failed').length,
      notifications_opened: jobs.filter((j) => j.opened_at).length,
    },
    caveat: 'Accepted by a push service does not prove the fan saw it, and an open does not prove they listened.',
  }
}

async function adminOverview() {
  const c = async (t: string, f: (q: any) => any = (q) => q) => (await f(db.from(t).select('*', { count: 'exact', head: true }))).count ?? 0
  const since = new Date(Date.now() - 864e5).toISOString()
  return {
    active_artists: await c('artist_signal_profiles', (q) => q.eq('active', true)),
    pending_artists: await c('artist_signal_profiles', (q) => q.eq('active', false)),
    active_devices: await c('artist_signal_push_subscriptions', (q) => q.eq('enabled', true)),
    upcoming_airplays: await c('artist_signal_airplays', (q) => q.in('status', ['scheduled', 'rescheduled', 'tentative'])),
    jobs_pending: await c('artist_signal_notification_jobs', (q) => q.eq('status', 'pending')),
    jobs_failed_24h: await c('artist_signal_notification_jobs', (q) => q.eq('status', 'failed').gte('updated_at', since)),
    jobs_sent_24h: await c('artist_signal_notification_jobs', (q) => q.eq('status', 'sent').gte('updated_at', since)),
    stations: (await db.from('artist_signal_station_sources').select('*')).data ?? [],
    last_tick: await setting('tick_lock'),
  }
}

async function adminWrite(uid: string, b: any) {
  const admin = await isAdmin(uid)
  const audit = (action: string, table: string, id: string, nv: unknown) =>
    db.from('audit_log').insert({ user_id: uid, action: `artist_signal.${action}`, table_name: table, record_id: id, new_values: nv })
  switch (b.action) {
    case 'upsert_profile': {
      const f = b.profile ?? {}
      const existing = f.slug ? (await db.from('artist_signal_profiles').select('*').eq('slug', f.slug).maybeSingle()).data : null
      if (existing && existing.owner_user_id !== uid && !admin) throw new HttpError(403, 'Not your artist page.')
      const row: Record<string, unknown> = {
        slug: f.slug, display_name: f.display_name, artwork_url: f.artwork_url ?? null, biography: f.biography ?? null, genre: f.genre ?? null,
        social_links: typeof f.social_links === 'object' && f.social_links ? f.social_links : {}, artist_type: f.artist_type ?? 'human',
        disclosure: f.disclosure ?? null,
      }
      if (f.consent === true && !existing?.consent_at) row.consent_at = new Date().toISOString()
      if (!existing) row.owner_user_id = admin && f.owner_user_id ? f.owner_user_id : uid
      if (admin) { if (typeof f.active === 'boolean') row.active = f.active; if (typeof f.verified === 'boolean') row.verified = f.verified }
      const { data, error } = await db.from('artist_signal_profiles').upsert(row, { onConflict: 'slug' }).select('*').single()
      if (error) throw bad(error.message)
      await audit('upsert_profile', 'artist_signal_profiles', data.id, row)
      return { profile: data }
    }
    case 'upsert_track': {
      if (!admin) throw new HttpError(403, 'Admins only.')
      const p = await profileBySlug(b.slug, false)
      const t = b.track ?? {}
      const row = { profile_id: p.id, title: t.title, song_id: t.song_id ?? null, match_artist: norm(t.broadcast_artist ?? p.display_name),
        match_title: norm(t.broadcast_title ?? t.title), station_ids: Array.isArray(t.station_ids) ? t.station_ids : [], active: t.active !== false }
      const { data, error } = await db.from('artist_signal_tracks').upsert(row, { onConflict: 'match_artist,match_title' }).select('*').single()
      if (error) throw bad(error.message)
      await audit('upsert_track', 'artist_signal_tracks', data.id, row)
      return { track: data }
    }
    case 'schedule_airplay': {
      if (!admin) throw new HttpError(403, 'Admins only.')
      const a = b.airplay ?? {}
      if (!a.scheduled_at || isNaN(Date.parse(a.scheduled_at))) throw bad('scheduled_at is required.')
      const track = (await db.from('artist_signal_tracks').select('*').eq('id', a.track_id).single()).data
      if (!track) throw bad('Unknown track.')
      if (a.id) {
        const cur = (await db.from('artist_signal_airplays').select('*').eq('id', a.id).single()).data
        if (!cur) throw bad('Unknown airplay.')
        const moved = Date.parse(cur.scheduled_at) !== Date.parse(a.scheduled_at)
        const { data, error } = await db.from('artist_signal_airplays').update({ scheduled_at: a.scheduled_at, station_id: a.station_id ?? cur.station_id,
          status: moved ? 'rescheduled' : (a.tentative ? 'tentative' : cur.status) }).eq('id', a.id).select('*').single()
        if (error) throw bad(error.message)
        if (moved) await db.from('artist_signal_notification_jobs').delete().eq('airplay_id', a.id).eq('status', 'pending').eq('notification_type', 'advance')
        await audit('reschedule_airplay', 'artist_signal_airplays', a.id, a)
        return { airplay: data }
      }
      const { data, error } = await db.from('artist_signal_airplays').insert({ profile_id: track.profile_id, track_id: track.id, station_id: a.station_id,
        scheduled_at: a.scheduled_at, status: a.tentative ? 'tentative' : 'scheduled', schedule_source: 'manual' }).select('*').single()
      if (error) throw bad(error.message)
      await audit('schedule_airplay', 'artist_signal_airplays', data.id, a)
      return { airplay: data }
    }
    case 'cancel_airplay': {
      if (!admin) throw new HttpError(403, 'Admins only.')
      await db.from('artist_signal_airplays').update({ status: 'canceled' }).eq('id', b.id).in('status', ['tentative', 'scheduled', 'rescheduled'])
      const { count } = await db.from('artist_signal_notification_jobs').update({ status: 'canceled' }, { count: 'exact' }).eq('airplay_id', b.id).eq('status', 'pending')
      await audit('cancel_airplay', 'artist_signal_airplays', b.id, { canceled_jobs: count })
      return { canceled_jobs: count ?? 0 }
    }
    case 'retry_failed': {
      if (!admin) throw new HttpError(403, 'Admins only.')
      const { count } = await db.from('artist_signal_notification_jobs').update({ status: 'pending', attempts: 0, scheduled_for: new Date().toISOString() }, { count: 'exact' })
        .eq('status', 'failed').gte('updated_at', new Date(Date.now() - 3600e3).toISOString())
      await audit('retry_failed', 'artist_signal_notification_jobs', 'bulk', { count })
      return { retried: count ?? 0 }
    }
    case 'disable_device': {
      if (!admin) throw new HttpError(403, 'Admins only.')
      await db.from('artist_signal_push_subscriptions').update({ enabled: false }).eq('id', b.id)
      await audit('disable_device', 'artist_signal_push_subscriptions', b.id, {})
      return { disabled: true }
    }
  }
  throw bad('Unknown action.')
}

// ---------- now playing ----------
async function readIcy(url: string) {
  const res = await fetch(url, { headers: { 'Icy-MetaData': '1', 'User-Agent': 'MaestroArtistSignal/1.0' }, signal: AbortSignal.timeout(10000) })
  if (!res.ok || !res.body) throw new Error(`stream HTTP ${res.status}`)
  const metaint = Number(res.headers.get('icy-metaint') ?? 0)
  if (!metaint) { await res.body.cancel(); throw new Error('stream sends no song metadata') }
  const reader = res.body.getReader()
  let buf = new Uint8Array(0)
  try {
    while (true) {
      if (buf.length > metaint) {
        const len = buf[metaint] * 16
        if (buf.length >= metaint + 1 + len) {
          const raw = new TextDecoder().decode(buf.slice(metaint + 1, metaint + 1 + len)).replace(/\0+$/, '')
          const m = raw.match(/StreamTitle='(.*?)';/)
          return m ? m[1].trim() : ''
        }
      }
      const { value, done } = await reader.read()
      if (done) throw new Error('stream ended early')
      const n = new Uint8Array(buf.length + value.length); n.set(buf); n.set(value, buf.length); buf = n
      if (buf.length > metaint + 4096 + 256) throw new Error('metadata not found')
    }
  } finally { try { await reader.cancel() } catch { /* closed */ } }
}

async function onNowPlaying(station: any, artist: string, title: string, source: 'now_playing' | 'webhook', startedAt: Date, extId?: string) {
  const text = artist ? `${artist} - ${title}` : title
  const src = (await db.from('artist_signal_station_sources').select('*').eq('station_id', station.id).maybeSingle()).data
  const nowIso = new Date().toISOString()
  const key = (t: string) => { const x = splitIcy(t); return `${norm(x.artist)}|${norm(x.title)}` }
  if (src && key(src.last_seen_text ?? '') === key(text)) {
    await db.from('artist_signal_station_sources').update({ last_seen_at: nowIso, healthy: true, updated_at: nowIso }).eq('station_id', station.id)
    return { changed: false }
  }
  if (extId) {
    const seen = await db.from('artist_signal_airplays').select('id').eq('station_id', station.id).eq('external_event_id', extId).maybeSingle()
    if (seen.data) return { changed: false, duplicate: true }
  }
  // the previous song ended
  const ended = await db.from('artist_signal_airplays').update({ status: 'played', actual_ended_at: startedAt.toISOString() })
    .eq('station_id', station.id).eq('status', 'playing').select('id,profile_id,track_id')
  for (const a of ended.data ?? []) await logEvent({ event_type: 'airplay_end', profile_id: a.profile_id, track_id: a.track_id, station_id: station.id })
  await db.from('artist_signal_station_sources').upsert({ station_id: station.id, source_type: source === 'webhook' ? 'webhook' : (src?.source_type ?? 'icy'),
    source_url: src?.source_url ?? station.stream_url, last_seen_text: text, last_seen_at: nowIso, last_change_at: nowIso, healthy: true, updated_at: nowIso })

  const na = norm(artist), nt = norm(title)
  if (!nt) return { changed: true, matched: false }
  const { data: tracks } = await db.from('artist_signal_tracks').select('*').eq('active', true).eq('match_title', nt)
  const track = (tracks ?? []).find((t) => (!na || t.match_artist === na) && (!t.station_ids?.length || t.station_ids.includes(station.id)))
  if (!track) return { changed: true, matched: false }
  const prof = (await db.from('artist_signal_profiles').select('*').eq('id', track.profile_id).single()).data
  if (!prof?.active) return { changed: true, matched: false }

  const win = 45 * 60e3
  const { data: sched } = await db.from('artist_signal_airplays').select('*').eq('track_id', track.id).eq('station_id', station.id)
    .in('status', ['tentative', 'scheduled', 'rescheduled'])
    .gte('scheduled_at', new Date(startedAt.getTime() - win).toISOString()).lte('scheduled_at', new Date(startedAt.getTime() + win).toISOString())
    .order('scheduled_at').limit(1)
  let airplay: any
  if (sched?.length) {
    airplay = (await db.from('artist_signal_airplays').update({ status: 'playing', actual_started_at: startedAt.toISOString(), ...(extId ? { external_event_id: extId } : {}) }).eq('id', sched[0].id).select('*').single()).data
  } else {
    const ext = extId ?? `${source}:${track.id}:${startedAt.toISOString().slice(0, 16)}`
    const ins = await db.from('artist_signal_airplays').upsert({ profile_id: prof.id, track_id: track.id, station_id: station.id, status: 'playing',
      actual_started_at: startedAt.toISOString(), schedule_source: source, external_event_id: ext }, { onConflict: 'station_id,external_event_id', ignoreDuplicates: true }).select('*')
    airplay = ins.data?.[0]
    if (!airplay) return { changed: true, matched: true, duplicate: true }
  }
  // advance alerts that have not gone out yet are now obsolete
  await db.from('artist_signal_notification_jobs').update({ status: 'skipped', last_error: 'song started before this alert was due' })
    .eq('airplay_id', airplay.id).eq('notification_type', 'advance').eq('status', 'pending')
  const created = await queueFor(airplay, 'now_playing', () => new Date())
  await logEvent({ event_type: 'airplay_start', profile_id: prof.id, track_id: track.id, station_id: station.id, event_metadata: { source, text, queued: created } })
  return { changed: true, matched: true, airplay_id: airplay.id, queued: created }
}

// Creates jobs for every follower device that wants this kind of alert. Unique key dedupes repeats.
async function queueFor(airplay: any, type: 'advance' | 'now_playing', when: (advance: number) => Date | null) {
  const { data: fans } = await db.from('artist_signal_follows').select('fan_id').eq('profile_id', airplay.profile_id).limit(100000)
  if (!fans?.length) return 0
  const fanIds = fans.map((f) => f.fan_id)
  let n = 0
  for (let i = 0; i < fanIds.length; i += 500) {
    const chunk = fanIds.slice(i, i + 500)
    const [prefs, subs] = await Promise.all([
      db.from('artist_signal_preferences').select('*').in('fan_id', chunk),
      db.from('artist_signal_push_subscriptions').select('id,fan_id').in('fan_id', chunk).eq('enabled', true),
    ])
    const rows: any[] = []
    for (const s of subs.data ?? []) {
      const mine = (prefs.data ?? []).filter((p) => p.fan_id === s.fan_id)
      const pref = mine.find((p) => p.profile_id === airplay.profile_id) ?? mine.find((p) => p.profile_id === null)
      const enabled = pref?.enabled ?? true
      if (!enabled) continue
      if (pref?.station_ids?.length && !pref.station_ids.includes(airplay.station_id)) continue
      if (type === 'now_playing' && pref && pref.actual_playback_alerts === false) continue
      const adv = pref?.advance_minutes ?? 5
      if (type === 'advance' && adv === 0) continue
      const at = when(adv)
      if (!at) continue
      rows.push({ airplay_id: airplay.id, fan_id: s.fan_id, subscription_id: s.id, notification_type: type, scheduled_for: at.toISOString() })
    }
    if (rows.length) {
      const { data } = await db.from('artist_signal_notification_jobs').upsert(rows, { onConflict: 'airplay_id,subscription_id,notification_type', ignoreDuplicates: true }).select('id')
      n += data?.length ?? 0
    }
  }
  return n
}

async function planAdvance() {
  const now = Date.now()
  const { data } = await db.from('artist_signal_airplays').select('*').in('status', ['scheduled', 'rescheduled'])
    .gte('scheduled_at', new Date(now).toISOString()).lte('scheduled_at', new Date(now + 31 * 60e3).toISOString()).limit(500)
  let n = 0
  for (const a of data ?? []) {
    const prof = (await db.from('artist_signal_profiles').select('active').eq('id', a.profile_id).single()).data
    if (!prof?.active) continue
    n += await queueFor(a, 'advance', (adv) => {
      const t = Date.parse(a.scheduled_at) - adv * 60e3
      // lead time already passed but the song is still ahead: alert now with the true minutes left
      return Date.parse(a.scheduled_at) <= now + 30e3 ? null : new Date(Math.max(t, now))
    })
  }
  return n
}

function inQuiet(pref: any, at: Date) {
  if (!pref?.quiet_start || !pref?.quiet_end) return false
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: pref.timezone || 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false }).format(at)
  const s = pref.quiet_start.slice(0, 5), e = pref.quiet_end.slice(0, 5)
  return s <= e ? hm >= s && hm < e : hm >= s || hm < e
}

async function dispatch() {
  const { pub, priv } = await vapid()
  webpush.setVapidDetails('mailto:swadesoul@gmail.com', pub, priv)
  const nowIso = new Date().toISOString()
  const due = (await db.from('artist_signal_notification_jobs').select('id').eq('status', 'pending').lte('scheduled_for', nowIso).order('scheduled_for').limit(300)).data ?? []
  if (!due.length) return { sent: 0, failed: 0, skipped: 0 }
  const claimed = (await db.from('artist_signal_notification_jobs').update({ status: 'sending' }).in('id', due.map((d) => d.id)).eq('status', 'pending').select('*')).data ?? []
  const cache = new Map<string, any>()
  const get = async (t: string, id: string) => {
    const k = `${t}:${id}`
    if (!cache.has(k)) cache.set(k, (await db.from(t).select('*').eq('id', id).maybeSingle()).data)
    return cache.get(k)
  }
  const tally = { sent: 0, failed: 0, skipped: 0 }
  for (const j of claimed) {
    const finish = (status: string, extra: Record<string, unknown> = {}) => db.from('artist_signal_notification_jobs').update({ status, ...extra }).eq('id', j.id)
    const a = await get('artist_signal_airplays', j.airplay_id)
    const sub = await get('artist_signal_push_subscriptions', j.subscription_id)
    if (!a || !sub?.enabled) { await finish('canceled', { last_error: 'airplay or device gone' }); tally.skipped++; continue }
    if (a.status === 'canceled') { await finish('canceled'); tally.skipped++; continue }
    if (j.notification_type === 'advance') {
      if (!['scheduled', 'rescheduled'].includes(a.status)) { await finish('skipped', { last_error: `airplay is ${a.status}` }); tally.skipped++; continue }
      if (Date.parse(a.scheduled_at) < Date.now() - 60e3) { await finish('expired'); tally.skipped++; continue }
    } else {
      if (a.status !== 'playing') { await finish('skipped', { last_error: 'song is no longer playing' }); tally.skipped++; continue }
      if (Date.parse(j.created_at) < Date.now() - 8 * 60e3) { await finish('expired'); tally.skipped++; continue }
    }
    const prefs = (await db.from('artist_signal_preferences').select('*').eq('fan_id', j.fan_id)).data ?? []
    const pref = prefs.find((p) => p.profile_id === a.profile_id) ?? prefs.find((p) => p.profile_id === null)
    if (inQuiet(pref, new Date())) { await finish('skipped', { last_error: 'quiet hours' }); tally.skipped++; continue }
    const prof = await get('artist_signal_profiles', a.profile_id)
    const st = await get('stations', a.station_id)
    const tr = a.track_id ? await get('artist_signal_tracks', a.track_id) : null
    const mins = Math.max(1, Math.round((Date.parse(a.scheduled_at ?? nowIso) - Date.now()) / 60e3))
    const label = prof.artist_type === 'human' ? prof.display_name : `${prof.display_name} (SI artist)`
    const payload = j.notification_type === 'advance'
      ? { title: `${label} in about ${mins} min`, body: `${label} is scheduled on ${st?.name ?? 'Maestro Radio'} in about ${mins} minutes. Tap to listen.` }
      : { title: `Now playing: ${label}`, body: `${label}${tr ? ` — ${tr.title}` : ''}. Listen live on ${st?.name ?? 'Maestro Radio'}.` }
    const body = JSON.stringify({ ...payload, url: `${SITE}/artist/${prof.slug}?play=1&station=${st?.slug ?? ''}&n=${j.id}`,
      tag: `asig-${a.id}`, job_id: j.id, icon: prof.artwork_url ?? `${SITE}/icons/icon-192.png` })
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_secret } }, body,
        { TTL: j.notification_type === 'advance' ? 15 * 60 : 5 * 60, urgency: 'high' })
      await finish('sent', { delivered_at: new Date().toISOString(), attempts: j.attempts + 1, last_error: null })
      await db.from('artist_signal_push_subscriptions').update({ failure_count: 0, last_success_at: new Date().toISOString() }).eq('id', sub.id)
      tally.sent++
    } catch (e: any) {
      const code = e?.statusCode ?? 0
      const msg = `${code} ${String(e?.body ?? e?.message ?? e).slice(0, 200)}`
      if (code === 404 || code === 410) {
        await db.from('artist_signal_push_subscriptions').update({ enabled: false }).eq('id', sub.id)
        sub.enabled = false
        await finish('failed', { last_error: `device unsubscribed: ${msg}`, attempts: j.attempts + 1 })
      } else if (j.attempts + 1 < 3) {
        await finish('pending', { attempts: j.attempts + 1, last_error: msg, scheduled_for: new Date(Date.now() + 2 ** (j.attempts + 1) * 30e3).toISOString() })
      } else {
        await db.from('artist_signal_push_subscriptions').update({ failure_count: (sub.failure_count ?? 0) + 1 }).eq('id', sub.id)
        await finish('failed', { last_error: msg, attempts: j.attempts + 1 })
      }
      tally.failed++
    }
  }
  return tally
}

async function tick() {
  const nowIso = new Date().toISOString()
  // one tick at a time
  await setting('tick_lock', () => '1970-01-01T00:00:00.000Z')
  const lock = await db.from('artist_signal_settings').update({ value: nowIso }).eq('key', 'tick_lock')
    .lt('value', new Date(Date.now() - 45e3).toISOString()).select('key')
  if (!lock.data?.length) return { skipped: 'another tick is running' }

  const out: Record<string, unknown> = { stations: [] as unknown[] }
  const { data: stations } = await db.from('stations').select('id,name,slug,stream_url,status').in('status', ['live', 'active'])
  for (const st of stations ?? []) {
    const src = (await db.from('artist_signal_station_sources').select('*').eq('station_id', st.id).maybeSingle()).data
    if (src?.source_type === 'webhook' && src.last_seen_at && Date.parse(src.last_seen_at) > Date.now() - 10 * 60e3) {
      (out.stations as unknown[]).push({ station: st.slug, via: 'webhook' }); continue
    }
    if (!st.stream_url) continue
    try {
      const text = await readIcy(st.stream_url)
      const { artist, title } = splitIcy(text)
      const r = await onNowPlaying(st, artist, title, 'now_playing', new Date())
      ;(out.stations as unknown[]).push({ station: st.slug, ok: true, ...r })
    } catch (e) {
      const msg = String((e as Error)?.message ?? e).slice(0, 200)
      await db.from('artist_signal_station_sources').upsert({ station_id: st.id, source_type: src?.source_type ?? 'icy', source_url: st.stream_url,
        last_seen_text: src?.last_seen_text ?? null, last_error: msg, last_error_at: nowIso, healthy: false, updated_at: nowIso })
      ;(out.stations as unknown[]).push({ station: st.slug, ok: false, error: msg })
    }
  }
  // songs nobody saw end (station offline or watcher gap): close them without inventing an end time
  const stale = await db.from('artist_signal_airplays').update({ status: 'played' }).eq('status', 'playing')
    .lt('actual_started_at', new Date(Date.now() - 30 * 60e3).toISOString()).select('id')
  const missed = await db.from('artist_signal_airplays').update({ status: 'missed' }).in('status', ['scheduled', 'rescheduled', 'tentative'])
    .lt('scheduled_at', new Date(Date.now() - 60 * 60e3).toISOString()).select('id')
  out.closed_unconfirmed = stale.data?.length ?? 0
  out.marked_missed = missed.data?.length ?? 0
  out.advance_queued = await planAdvance()
  out.dispatch = await dispatch()
  // retention: events 400 days, finished jobs 120 days
  if (new Date().getUTCMinutes() === 7) {
    await db.from('artist_signal_events').delete().lt('event_timestamp', new Date(Date.now() - 400 * 864e5).toISOString())
    await db.from('artist_signal_notification_jobs').delete().in('status', ['sent', 'failed', 'canceled', 'skipped', 'expired'])
      .lt('created_at', new Date(Date.now() - 120 * 864e5).toISOString())
  }
  return out
}

async function ingest(req: Request, b: any) {
  const token = req.headers.get('x-signal-token') ?? new URL(req.url).searchParams.get('token') ?? ''
  const real = await setting('ingest_token', () => hex(24))
  if (!token || token.length !== real!.length || !crypto.subtle || token !== real) throw new HttpError(401, 'Bad token.')
  // AzuraCast "song changed" webhook or a simple {station_slug, artist, title, started_at}
  const np = b.now_playing ?? null
  const artist = np?.song?.artist ?? b.artist ?? ''
  const title = np?.song?.title ?? b.title ?? ''
  const started = np?.played_at ? new Date(np.played_at * 1000) : (b.started_at ? new Date(b.started_at) : new Date())
  const listen = b.station?.listen_url ?? null
  let q = db.from('stations').select('id,name,slug,stream_url,status')
  q = b.station_slug ? q.eq('slug', b.station_slug) : listen ? q.eq('stream_url', listen) : q.eq('slug', '__none__')
  const { data: st } = await q.maybeSingle()
  if (!st) throw bad('Station not recognized.')
  if (isNaN(started.getTime()) || Math.abs(started.getTime() - Date.now()) > 15 * 60e3) throw bad('started_at is too far from now.')
  const ext = np?.sh_id ? `azuracast:${np.sh_id}` : (b.event_id ? `ext:${String(b.event_id).slice(0, 80)}` : undefined)
  return await onNowPlaying(st, artist, title, 'webhook', started, ext)
}

// ---------- router ----------
Deno.serve(async (req) => {
  const h = cors(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h })
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...h, 'content-type': 'application/json' } })
  try {
    const url = new URL(req.url)
    let b: any = {}
    if (req.method === 'POST') { const t = await req.text(); if (t.length > 65536) throw bad('Request too large.'); b = t ? JSON.parse(t) : {} }
    for (const [k, v] of url.searchParams) if (b[k] === undefined) b[k] = v
    const action = String(b.action ?? '')
    switch (action) {
      case 'profile': {
        const r = await publicProfile(b.slug)
        logEvent({ event_type: 'page_view', profile_id: (await profileBySlug(b.slug)).id, event_metadata: { src: typeof b.src === 'string' ? b.src.slice(0, 60) : null } })
        return json(r)
      }
      case 'artists': return json({ artists: (await db.from('artist_signal_profiles').select('slug,display_name,artwork_url,genre,artist_type,verified').eq('active', true).order('display_name').limit(500)).data ?? [] })
      case 'vapid': return json({ vapid_public_key: (await vapid()).pub })
      case 'opened': {
        if (typeof b.job_id === 'string' && UUID.test(b.job_id)) {
          const { data } = await db.from('artist_signal_notification_jobs').update({ opened_at: new Date().toISOString() }).eq('id', b.job_id).is('opened_at', null).select('airplay_id,fan_id')
          if (data?.[0]) {
            const a = (await db.from('artist_signal_airplays').select('profile_id,station_id,track_id').eq('id', data[0].airplay_id).single()).data
            await logEvent({ event_type: 'notification_open', fan_id: data[0].fan_id, profile_id: a?.profile_id, station_id: a?.station_id, track_id: a?.track_id })
          }
        }
        return json({ ok: true })
      }
      case 'ingest': return json(await ingest(req, b))
      case 'tick': {
        if (!CRON || req.headers.get('x-cron-secret') !== CRON) throw new HttpError(401, 'Bad cron secret.')
        return json(await tick())
      }
      case 'ingest_url': {
        const u = await userFrom(req); if (!(await isAdmin(u.id))) throw new HttpError(403, 'Admins only.')
        const t = await setting('ingest_token', () => hex(24))
        return json({ webhook_url: `https://swadebase.cloud/functions/v1/artist-signal?action=ingest&token=${t}` })
      }
    }
    const u = await userFrom(req)
    switch (action) {
      case 'follow': return json(await follow(u.id, b, true))
      case 'unfollow': return json(await follow(u.id, b, false))
      case 'subscribe': return json(await subscribe(u.id, b, req))
      case 'unsubscribe': {
        if (typeof b.endpoint !== 'string') throw bad('Missing endpoint.')
        await db.from('artist_signal_push_subscriptions').delete().eq('fan_id', u.id).eq('endpoint', b.endpoint)
        return json({ removed: true })
      }
      case 'preferences': return json(await preferences(u.id, b))
      case 'me': return json(await myState(u.id))
      case 'delete_my_data': return json(await deleteMyData(u.id))
      case 'artist_stats': return json(await artistStats(u.id, b))
      case 'admin_overview': if (!(await isAdmin(u.id))) throw new HttpError(403, 'Admins only.'); return json(await adminOverview())
      default: return json(await adminWrite(u.id, b))
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    if (e instanceof SyntaxError) return json({ error: 'Invalid JSON.' }, 400)
    console.error('artist-signal', e)
    return json({ error: 'Something went wrong.' }, 500)
  }
})
