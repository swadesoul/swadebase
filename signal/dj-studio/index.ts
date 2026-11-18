// Maestro AI DJ Studio + live DJ accounts. Runs on SWADEBASE; talks to the Maestro radio engine (AzuraCast).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON = Deno.env.get('CRON_SECRET') ?? ''
const ENGINE = 'https://radio.themaestroradio.com'
const db = createClient('http://kong:8000', SR, { db: { schema: 'maestroradio' }, auth: { persistSession: false } })
const authClient = createClient('http://kong:8000', SR, { auth: { persistSession: false } })
const MANAGER_ROLES = ['superadmin', 'admin', 'station_manager', 'content_manager', 'scheduler_manager']
const ORIGINS = [/^https:\/\/(www\.)?themaestroradio\.com$/, /^https:\/\/([a-z0-9-]+--)?maestroradio\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]*b66128c5-9232-47e2-853a-cab847b56554[a-z0-9.-]*$/, /^http:\/\/localhost(:\d+)?$/]
const SEGMENTS = ['backsell', 'intro', 'station_id', 'artist_spotlight', 'artist_signal', 'shoutout', 'sponsor', 'custom']

class HttpError extends Error { constructor(public status: number, m: string) { super(m) } }
const bad = (m: string) => new HttpError(400, m)

// ---------- engine (AzuraCast) ----------
let engineKey: string | null = null
async function engine(path: string, init: RequestInit = {}) {
  if (!engineKey) engineKey = (await db.from('artist_signal_settings').select('value').eq('key', 'azuracast_api_key').single()).data?.value ?? null
  if (!engineKey) throw new HttpError(503, 'Radio engine is not connected.')
  const r = await fetch(ENGINE + path, { ...init, headers: { 'X-API-Key': engineKey, 'content-type': 'application/json', ...(init.headers ?? {}) }, signal: AbortSignal.timeout(60000) })
  const t = await r.text()
  let j: any = null; try { j = t ? JSON.parse(t) : null } catch { j = { raw: t.slice(0, 200) } }
  if (!r.ok) throw new HttpError(502, `Radio engine said ${r.status}: ${(j?.message ?? j?.raw ?? '').toString().slice(0, 160)}`)
  return j
}
async function stationFor(stationId: string | null) {
  const q = stationId ? db.from('stations').select('*').eq('id', stationId) : db.from('stations').select('*').eq('slug', 'maestro-radio')
  const s = (await q.single()).data
  if (!s?.azuracast_station_id) throw bad('That station is not on the radio engine yet.')
  return s
}

// ---------- auth ----------
async function user(req: Request) {
  const t = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (t.split('.').length === 3) { const { data } = await authClient.auth.getUser(t); if (data?.user) return data.user }
  throw new HttpError(401, 'Sign in to do that.')
}
async function roles(uid: string) { return ((await db.from('user_roles').select('role').eq('user_id', uid)).data ?? []).map((r) => String(r.role)) }
async function isManager(uid: string) { return (await roles(uid)).some((r) => MANAGER_ROLES.includes(r)) }
async function canManageDj(uid: string, dj: any) { return dj.owner_user_id === uid || (await isManager(uid)) }
async function djById(id: unknown) {
  if (typeof id !== 'string') throw bad('dj_id is required.')
  const d = (await db.from('ai_djs').select('*').eq('id', id).maybeSingle()).data
  if (!d) throw new HttpError(404, 'DJ not found.')
  return d
}
const audit = (uid: string, action: string, table: string, id: string, nv: unknown) =>
  db.from('audit_log').insert({ user_id: uid, action: `dj_studio.${action}`, table_name: table, record_id: id, new_values: nv })

// ---------- facts + scripts ----------
async function facts(dj: any, station: any) {
  const np = await fetch(`${ENGINE}/api/nowplaying/${station.azuracast_shortcode}`, { signal: AbortSignal.timeout(10000) }).then((r) => r.json()).catch(() => null)
  const song = (x: any) => x?.song ? { artist: x.song.artist, title: x.song.title } : null
  const isDj = (x: any) => String(x?.song?.artist ?? '') === 'Maestro Radio'
  const history = (np?.song_history ?? []).filter((h: any) => !isDj(h)).slice(0, 3).map(song)
  const now = isDj(np?.now_playing) ? null : song(np?.now_playing)
  const next = isDj(np?.playing_next) ? null : song(np?.playing_next)
  const soon = (await db.from('artist_signal_airplays').select('scheduled_at,profile_id').eq('station_id', station.id).in('status', ['scheduled', 'rescheduled'])
    .gte('scheduled_at', new Date().toISOString()).lte('scheduled_at', new Date(Date.now() + 3 * 3600e3).toISOString()).order('scheduled_at').limit(3)).data ?? []
  const upcoming = []
  for (const a of soon) {
    const p = (await db.from('artist_signal_profiles').select('display_name,slug,active').eq('id', a.profile_id).single()).data
    if (p?.active) upcoming.push({ artist: p.display_name, at: a.scheduled_at, link: `themaestroradio.com/artist/${p.slug}` })
  }
  const shout = (await db.from('ai_dj_shoutouts').select('*').eq('dj_id', dj.id).eq('status', 'approved').order('created_at').limit(1)).data?.[0] ?? null
  const local = new Intl.DateTimeFormat('en-US', { timeZone: dj.timezone || 'America/Chicago', weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date())
  return { station: station.name, local_time: local, now_playing: now, up_next: next, just_played: history, artist_signal_upcoming: upcoming, shoutout: shout ? { id: shout.id, from: shout.from_name, message: shout.message } : null, zip: dj.zip_code ?? null }
}

async function writeScript(dj: any, type: string, f: any, notes?: string) {
  const url = Deno.env.get('SWADE_AI_GATEWAY_URL'), key = Deno.env.get('SWADE_AI_GATEWAY_KEY'), model = Deno.env.get('SWADE_AI_MODEL')
  if (!url || !model) throw new HttpError(503, 'Script writer is not configured.')
  const words = dj.tier === 'low' ? 25 : dj.tier === 'high' ? 70 : 45
  const system = [
    `You are ${dj.name}, an on-air radio DJ on ${f.station}. You are an AI-voiced DJ (an "SI" DJ) and never pretend to be human if asked.`,
    `Persona: ${dj.persona_brief || dj.personality || 'warm, upbeat, knows the music'}. Style: ${dj.style || 'smooth'}. Catchphrases you may use sparingly: ${Array.isArray(dj.catchphrases) ? dj.catchphrases.join(', ') : (dj.catchphrases || 'none')}.`,
    `Humor ${dj.humor}/10, energy ${dj.energy}/10, chattiness ${dj.chattiness}/10.`,
    'HARD RULES: Use ONLY the facts provided. Never invent song titles, artists, dates, news, weather, chart positions, quotes or listener names.',
    'No impersonating real people. No profanity. No medical, legal or financial advice. No claims about sponsors beyond the provided copy.',
    `Write one spoken radio break of at most ${words} words. Plain text only, no stage directions, no emojis, no hashtags. Spell out numbers as spoken.`,
  ].join('\n')
  const ask: Record<string, string> = {
    backsell: 'Back-announce what just played (first item of just_played) and tease up_next if known.',
    intro: 'Introduce the song that is up_next. If up_next is null, do a short station vibe check instead.',
    station_id: `A quick station ID with the local time (${f.local_time}).`,
    artist_spotlight: 'Spotlight the artist now playing or just played, using only their name and song title.',
    artist_signal: 'Tell listeners about the upcoming Artist Signal airplay in artist_signal_upcoming and that they can get an alert at the link. If none, do a station ID.',
    shoutout: 'Read the listener shoutout (from + message) warmly. If none, do a station ID.',
    sponsor: `Read this sponsor copy naturally, without adding claims: ${notes ?? '(none — do a station ID instead)'}`,
    custom: `Producer note: ${notes ?? ''}`,
  }
  const r = await fetch(/\/chat\/completions$/.test(url) ? url : `${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model, max_tokens: 220, temperature: 0.8, messages: [{ role: 'system', content: system }, { role: 'user', content: `FACTS (JSON): ${JSON.stringify(f)}\n\nTASK: ${ask[type]}${notes && type !== 'sponsor' && type !== 'custom' ? `\nProducer note: ${notes}` : ''}` }] }),
    signal: AbortSignal.timeout(45000),
  })
  if (!r.ok) throw new HttpError(502, `Script writer failed (${r.status}).`)
  const j = await r.json()
  const text = String(j?.choices?.[0]?.message?.content ?? '').replace(/\*|#|\[.*?\]|\(.*?pause.*?\)/gi, '').trim()
  if (!text) throw new HttpError(502, 'Script writer returned nothing.')
  return text.split(/\s+/).slice(0, words + 15).join(' ')
}

// ---------- render + queue ----------
async function render(seg: any, dj: any, uid: string | null) {
  const voice = (await db.from('ai_dj_voice').select('voice_profile_id').eq('dj_id', dj.id).maybeSingle()).data?.voice_profile_id
  if (!voice) throw bad('Pick a voice for this DJ first.')
  const station = await stationFor(dj.station_id)
  await db.from('ai_dj_segments').update({ status: 'rendering', error: null }).eq('id', seg.id)
  try {
    const base = (Deno.env.get('VOICE_SERVICE_URL') || '').replace(/\/$/, '')
    const vr = await fetch(`${base}/v1/voicebox/speak`, { method: 'POST', headers: { authorization: `Bearer ${Deno.env.get('VOICE_SERVICE_TOKEN')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text: seg.script, voice_profile_id: voice }), signal: AbortSignal.timeout(10 * 60000) })
    if (!vr.ok) throw new Error(`voice service ${vr.status}: ${(await vr.text()).slice(0, 120)}`)
    const audio = new Uint8Array(await vr.arrayBuffer())
    const ext = (vr.headers.get('content-type') ?? '').includes('mpeg') ? 'mp3' : 'wav'
    let b64 = ''; for (let i = 0; i < audio.length; i += 0x8000) b64 += String.fromCharCode(...audio.subarray(i, i + 0x8000))
    const path = `AI DJ/${dj.slug ?? dj.id}/seg-${seg.id}.${ext}`
    const sid = station.azuracast_station_id
    const up = await engine(`/api/station/${sid}/files`, { method: 'POST', body: JSON.stringify({ path, file: btoa(b64) }) })
    const mediaId = up?.id ?? up?.media?.id
    if (mediaId) await engine(`/api/station/${sid}/file/${mediaId}`, { method: 'PUT', body: JSON.stringify({ artist: 'Maestro Radio', title: `${dj.name} on the mic`, album: `seg-${seg.id.slice(0, 8)}` }) })
    const pid = await ensurePlaylist(dj, sid)
    await engine(`/api/station/${sid}/files/batch`, { method: 'PUT', body: JSON.stringify({ do: 'playlist', currentDirectory: '', files: [path], dirs: [], playlists: [pid] }) })
    const media = mediaId ? await engine(`/api/station/${sid}/file/${mediaId}`) : null
    await db.from('ai_dj_segments').update({ status: 'queued', azuracast_path: path, azuracast_media_id: mediaId ?? null, azuracast_song_id: media?.song_id ?? null,
      audio_bytes: audio.length, queued_at: new Date().toISOString() }).eq('id', seg.id)
    if (uid) await audit(uid, 'render_segment', 'ai_dj_segments', seg.id, { path })
    return { queued: true, path }
  } catch (e) {
    await db.from('ai_dj_segments').update({ status: 'failed', error: String((e as Error).message ?? e).slice(0, 300) }).eq('id', seg.id)
    throw e instanceof HttpError ? e : new HttpError(502, String((e as Error).message ?? e).slice(0, 200))
  }
}
async function ensurePlaylist(dj: any, sid: number) {
  const desired = { name: `AI DJ: ${dj.name}`, type: 'once_per_x_songs', play_per_songs: dj.break_every_songs ?? 3, source: 'songs', order: 'sequential', is_enabled: true, include_in_requests: false, avoid_duplicates: false }
  if (dj.azuracast_playlist_id) {
    try { await engine(`/api/station/${sid}/playlist/${dj.azuracast_playlist_id}`, { method: 'PUT', body: JSON.stringify(desired) }); return dj.azuracast_playlist_id } catch { /* recreate */ }
  }
  const p = await engine(`/api/station/${sid}/playlists`, { method: 'POST', body: JSON.stringify(desired) })
  await db.from('ai_djs').update({ azuracast_playlist_id: p.id }).eq('id', dj.id)
  dj.azuracast_playlist_id = p.id
  return p.id
}

async function draft(dj: any, type: string, notes: string | undefined, uid: string | null, auto = false) {
  if (!SEGMENTS.includes(type)) throw bad('Unknown segment type.')
  const station = await stationFor(dj.station_id)
  const f = await facts(dj, station)
  const script = await writeScript(dj, type, f, typeof notes === 'string' ? notes.slice(0, 600) : undefined)
  const { data, error } = await db.from('ai_dj_segments').insert({ dj_id: dj.id, segment_type: type, script, facts: f, created_by: uid, auto,
    status: auto ? 'approved' : 'draft' }).select('*').single()
  if (error) throw error
  if (type === 'shoutout' && f.shoutout) await db.from('ai_dj_shoutouts').update({ status: 'used' }).eq('id', f.shoutout.id)
  return data
}

// ---------- tick: mark aired, clean up, auto mode ----------
async function tick() {
  const out: Record<string, unknown> = { aired: 0, cleaned: 0, auto: [] as unknown[] }
  const queued = (await db.from('ai_dj_segments').select('*').eq('status', 'queued').order('queued_at')).data ?? []
  const byStation = new Map<string, any>()
  for (const seg of queued) {
    const dj = await djById(seg.dj_id)
    const st = await stationFor(dj.station_id).catch(() => null)
    if (!st) continue
    if (!byStation.has(st.id)) byStation.set(st.id, await fetch(`${ENGINE}/api/nowplaying/${st.azuracast_shortcode}`).then((r) => r.json()).catch(() => null))
    const np = byStation.get(st.id)
    const plays = [np?.now_playing, ...(np?.song_history ?? [])].filter((h: any) => h?.song?.album === `seg-${seg.id.slice(0, 8)}`)
    if (plays.length) {
      const at = new Date((plays[0].played_at ?? Date.now() / 1000) * 1000).toISOString()
      await db.from('ai_dj_segments').update({ status: 'aired', aired_at: at }).eq('id', seg.id)
      out.aired = (out.aired as number) + 1
      // remove the file once it has finished airing (not while it is on air)
      if (np?.now_playing?.song?.album !== `seg-${seg.id.slice(0, 8)}` && seg.azuracast_media_id) {
        await engine(`/api/station/${st.azuracast_station_id}/file/${seg.azuracast_media_id}`, { method: 'DELETE' }).catch(() => null)
        out.cleaned = (out.cleaned as number) + 1
      }
    }
  }
  // aired but file still there (it was on air last tick)
  const leftovers = (await db.from('ai_dj_segments').select('*').eq('status', 'aired').not('azuracast_media_id', 'is', null).gte('aired_at', new Date(Date.now() - 864e5).toISOString())).data ?? []
  for (const seg of leftovers) {
    const dj = await djById(seg.dj_id); const st = await stationFor(dj.station_id).catch(() => null)
    if (!st) continue
    const np = byStation.get(st.id) ?? await fetch(`${ENGINE}/api/nowplaying/${st.azuracast_shortcode}`).then((r) => r.json()).catch(() => null)
    if (np?.now_playing?.song?.album === `seg-${seg.id.slice(0, 8)}`) continue
    await engine(`/api/station/${st.azuracast_station_id}/file/${seg.azuracast_media_id}`, { method: 'DELETE' }).catch(() => null)
    await db.from('ai_dj_segments').update({ azuracast_media_id: null }).eq('id', seg.id)
  }
  // auto mode: keep two breaks ready during active shows, within the daily limit
  const djs = (await db.from('ai_djs').select('*').eq('auto_mode', true).eq('is_active', true).gt('daily_auto_segments', 0)).data ?? []
  for (const dj of djs) {
    const shows = (await db.from('ai_dj_shows').select('*').eq('dj_id', dj.id).eq('active', true)).data ?? []
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: dj.timezone || 'America/Chicago', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).map((p) => [p.type, p.value]))
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday); const hm = `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
    const show = shows.find((s) => s.days.includes(dow) && (s.start_time.slice(0, 5) <= s.end_time.slice(0, 5) ? hm >= s.start_time.slice(0, 5) && hm < s.end_time.slice(0, 5) : hm >= s.start_time.slice(0, 5) || hm < s.end_time.slice(0, 5)))
    if (!show) continue
    const ready = (await db.from('ai_dj_segments').select('id', { count: 'exact', head: true }).eq('dj_id', dj.id).in('status', ['queued', 'rendering'])).count ?? 0
    if (ready >= 2) continue
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: dj.timezone || 'America/Chicago' })); today.setHours(0, 0, 0, 0)
    const used = (await db.from('ai_dj_segments').select('id', { count: 'exact', head: true }).eq('dj_id', dj.id).eq('auto', true).gte('created_at', new Date(Date.now() - 864e5).toISOString())).count ?? 0
    if (used >= dj.daily_auto_segments) { (out.auto as unknown[]).push({ dj: dj.slug, skipped: 'daily limit reached' }); continue }
    const types = (show.segment_types?.length ? show.segment_types : ['backsell']).filter((t: string) => SEGMENTS.includes(t) && t !== 'sponsor' && t !== 'custom')
    const type = types[used % types.length] ?? 'backsell'
    try { const seg = await draft(dj, type, undefined, null, true); await render(seg, dj, null); (out.auto as unknown[]).push({ dj: dj.slug, queued: type }) }
    catch (e) { (out.auto as unknown[]).push({ dj: dj.slug, error: String((e as Error).message).slice(0, 120) }) }
  }
  return out
}

// ---------- live DJs ----------
async function createLiveDj(uid: string, b: any) {
  if (!(await isManager(uid))) throw new HttpError(403, 'Only admins and station managers can add live DJs.')
  const st = await stationFor(b.station_id ?? null)
  const username = String(b.username ?? '').toLowerCase()
  if (!/^[a-z0-9_]{3,32}$/.test(username)) throw bad('Username: 3–32 letters, numbers or underscores.')
  const display = String(b.display_name ?? username).slice(0, 60)
  const password = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXYZ2346789'[x % 52]).join('')
  const schedule = Array.isArray(b.schedule) ? b.schedule.slice(0, 20).map((s: any) => ({ start_time: Number(s.start_time), end_time: Number(s.end_time), days: (s.days ?? []).map(Number) })) : []
  const s = await engine(`/api/station/${st.azuracast_station_id}/streamers`, { method: 'POST', body: JSON.stringify({ streamer_username: username, streamer_password: password, display_name: display,
    is_active: true, enforce_schedule: !!b.enforce_schedule && schedule.length > 0, schedule_items: schedule }) })
  const { data, error } = await db.from('live_dj_accounts').insert({ station_id: st.id, user_id: b.user_id ?? null, display_name: display, streamer_username: username,
    azuracast_streamer_id: s?.id ?? null, enforce_schedule: !!b.enforce_schedule, schedule, created_by: uid }).select('*').single()
  if (error) throw bad(error.message)
  await audit(uid, 'create_live_dj', 'live_dj_accounts', data.id, { username, station: st.slug })
  return {
    live_dj: data,
    connection: { server: 'radio.themaestroradio.com', port: 8005, mount: '/', username, password, protocol: 'Icecast 2 (BUTT, Mixxx, OBS)',
      web_dj: `${ENGINE}/public/${st.azuracast_shortcode}/dj`, note: 'Save this password now; it is shown only once.' },
  }
}

// ---------- router ----------
Deno.serve(async (req) => {
  const o = req.headers.get('origin') ?? ''
  const h: Record<string, string> = { 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-allow-methods': 'GET, POST, OPTIONS', vary: 'origin' }
  if (ORIGINS.some((r) => r.test(o))) h['access-control-allow-origin'] = o
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h })
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...h, 'content-type': 'application/json' } })
  try {
    const url = new URL(req.url)
    let b: any = {}
    if (req.method === 'POST') { const t = await req.text(); if (t.length > 65536) throw bad('Request too large.'); b = t ? JSON.parse(t) : {} }
    for (const [k, v] of url.searchParams) if (b[k] === undefined) b[k] = v
    const action = String(b.action ?? '')
    if (action === 'tick') { if (!CRON || req.headers.get('x-cron-secret') !== CRON) throw new HttpError(401, 'Bad cron secret.'); return json(await tick()) }
    if (action === 'public_djs') return json({ djs: (await db.from('ai_djs').select('id,slug,name,avatar,location,style,background,disclosure,station_id,tier').eq('is_active', true).order('name')).data ?? [] })

    const u = await user(req)
    switch (action) {
      case 'shoutout': {
        const dj = (await db.from('ai_djs').select('id,is_active').eq('slug', String(b.dj_slug ?? '')).maybeSingle()).data
        if (!dj?.is_active) throw new HttpError(404, 'DJ not found.')
        const recent = (await db.from('ai_dj_shoutouts').select('id', { count: 'exact', head: true }).eq('from_user', u.id).gte('created_at', new Date(Date.now() - 3600e3).toISOString())).count ?? 0
        if (recent >= 3) throw bad('You can send three shoutouts an hour.')
        const { error } = await db.from('ai_dj_shoutouts').insert({ dj_id: dj.id, from_user: u.id, from_name: String(b.from_name ?? 'A listener').slice(0, 40), message: String(b.message ?? '').slice(0, 200) })
        if (error) throw bad(error.message)
        return json({ sent: true, note: 'A producer reviews shoutouts before they air.' })
      }
      case 'list_djs': {
        const all = (await db.from('ai_djs').select('*').order('name')).data ?? []
        const mgr = await isManager(u.id)
        return json({ djs: all.filter((d) => mgr || d.owner_user_id === u.id), can_create: mgr })
      }
      case 'voices': {
        if (!(await isManager(u.id))) throw new HttpError(403, 'Managers only.')
        const r = await fetch(`${(Deno.env.get('VOICE_SERVICE_URL') || '').replace(/\/$/, '')}/v1/voicebox/profiles`, { headers: { authorization: `Bearer ${Deno.env.get('VOICE_SERVICE_TOKEN')}` } })
        const d = await r.json(); const list = Array.isArray(d) ? d : d.profiles ?? d.data ?? []
        return json({ voices: list.map((v: any) => ({ id: v.id, name: v.name })) })
      }
      case 'studio': {
        const dj = await djById(b.dj_id); if (!(await canManageDj(u.id, dj))) throw new HttpError(403, 'Not your DJ.')
        const [shows, segs, shouts, voice] = await Promise.all([
          db.from('ai_dj_shows').select('*').eq('dj_id', dj.id).order('start_time'),
          db.from('ai_dj_segments').select('id,segment_type,script,status,auto,error,created_at,queued_at,aired_at').eq('dj_id', dj.id).order('created_at', { ascending: false }).limit(50),
          db.from('ai_dj_shoutouts').select('*').eq('dj_id', dj.id).in('status', ['pending', 'approved']).order('created_at'),
          db.from('ai_dj_voice').select('voice_profile_id').eq('dj_id', dj.id).maybeSingle(),
        ])
        const st = dj.station_id ? (await db.from('stations').select('id,name,slug,azuracast_shortcode,stream_url').eq('id', dj.station_id).single()).data : null
        const today = (segs.data ?? []).filter((s) => s.auto && Date.parse(s.created_at) > Date.now() - 864e5).length
        return json({ dj, voice_selected: !!voice.data, shows: shows.data ?? [], segments: segs.data ?? [], shoutouts: shouts.data ?? [], station: st, auto_used_last_24h: today, segment_types: SEGMENTS })
      }
      case 'upsert_dj': {
        const d = b.dj ?? {}
        const existing = d.id ? await djById(d.id) : null
        if (existing ? !(await canManageDj(u.id, existing)) : !(await isManager(u.id))) throw new HttpError(403, 'Not allowed.')
        const mgr = await isManager(u.id)
        const row: Record<string, unknown> = {}
        for (const k of ['name', 'personality', 'avatar', 'location', 'background', 'style', 'persona_brief', 'zip_code', 'timezone', 'tier']) if (d[k] !== undefined) row[k] = d[k]
        for (const k of ['humor', 'energy', 'chattiness', 'break_every_songs']) if (d[k] !== undefined) row[k] = Number(d[k])
        if (d.catchphrases !== undefined) row.catchphrases = d.catchphrases
        if (d.slug !== undefined) row.slug = String(d.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50)
        if (mgr) {
          for (const k of ['is_active', 'auto_mode']) if (typeof d[k] === 'boolean') row[k] = d[k]
          if (d.daily_auto_segments !== undefined) row.daily_auto_segments = Number(d.daily_auto_segments)
          if (d.station_id !== undefined) row.station_id = d.station_id
          if (d.owner_user_id !== undefined) row.owner_user_id = d.owner_user_id
        }
        if (row.auto_mode === true && Number(row.daily_auto_segments ?? existing?.daily_auto_segments ?? 0) <= 0) throw bad('Set a daily limit before turning on automatic mode.')
        const q = existing ? db.from('ai_djs').update(row).eq('id', existing.id) : db.from('ai_djs').insert({ is_active: false, ...row })
        const { data, error } = await q.select('*').single()
        if (error) throw bad(error.message)
        if (typeof d.voice_profile_id === 'string' && d.voice_profile_id) await db.from('ai_dj_voice').upsert({ dj_id: data.id, voice_profile_id: d.voice_profile_id, updated_at: new Date().toISOString() })
        if (data.azuracast_playlist_id && row.break_every_songs !== undefined) { const st = await stationFor(data.station_id).catch(() => null); if (st) await ensurePlaylist(data, st.azuracast_station_id).catch(() => null) }
        await audit(u.id, 'upsert_dj', 'ai_djs', data.id, { ...row, voice_set: !!d.voice_profile_id })
        return json({ dj: data })
      }
      case 'upsert_show': {
        const s = b.show ?? {}; const dj = await djById(s.dj_id); if (!(await canManageDj(u.id, dj))) throw new HttpError(403, 'Not your DJ.')
        const row = { dj_id: dj.id, station_id: dj.station_id, title: String(s.title ?? 'Show').slice(0, 80), days: (s.days ?? [0, 1, 2, 3, 4, 5, 6]).map(Number).filter((x: number) => x >= 0 && x <= 6),
          start_time: s.start_time ?? '00:00', end_time: s.end_time ?? '23:59', segment_types: (s.segment_types ?? ['backsell']).filter((t: string) => SEGMENTS.includes(t)), active: s.active !== false }
        const q = s.id ? db.from('ai_dj_shows').update(row).eq('id', s.id).eq('dj_id', dj.id) : db.from('ai_dj_shows').insert(row)
        const { data, error } = await q.select('*').single(); if (error) throw bad(error.message)
        await audit(u.id, 'upsert_show', 'ai_dj_shows', data.id, row)
        return json({ show: data })
      }
      case 'delete_show': {
        const s = (await db.from('ai_dj_shows').select('*').eq('id', b.id).single()).data; if (!s) throw new HttpError(404, 'Show not found.')
        if (!(await canManageDj(u.id, await djById(s.dj_id)))) throw new HttpError(403, 'Not your DJ.')
        await db.from('ai_dj_shows').delete().eq('id', s.id); return json({ deleted: true })
      }
      case 'draft_segment': {
        const dj = await djById(b.dj_id); if (!(await canManageDj(u.id, dj))) throw new HttpError(403, 'Not your DJ.')
        return json({ segment: await draft(dj, String(b.segment_type ?? 'backsell'), b.notes, u.id) })
      }
      case 'edit_segment': case 'approve_segment': case 'reject_segment': case 'render_segment': {
        const seg = (await db.from('ai_dj_segments').select('*').eq('id', b.id).single()).data; if (!seg) throw new HttpError(404, 'Segment not found.')
        const dj = await djById(seg.dj_id); if (!(await canManageDj(u.id, dj))) throw new HttpError(403, 'Not your DJ.')
        if (action === 'edit_segment') {
          if (!['draft', 'approved', 'failed'].includes(seg.status)) throw bad('Only drafts can be edited.')
          const script = String(b.script ?? '').trim().slice(0, 1200); if (!script) throw bad('Script is empty.')
          await db.from('ai_dj_segments').update({ script, status: 'draft' }).eq('id', seg.id); return json({ ok: true })
        }
        if (action === 'approve_segment') { await db.from('ai_dj_segments').update({ status: 'approved', approved_by: u.id }).eq('id', seg.id); await audit(u.id, 'approve_segment', 'ai_dj_segments', seg.id, {}); return json({ ok: true }) }
        if (action === 'reject_segment') { await db.from('ai_dj_segments').update({ status: 'rejected' }).eq('id', seg.id); return json({ ok: true }) }
        if (seg.status !== 'approved' && seg.status !== 'failed') throw bad('Approve the script before generating the voice.')
        return json(await render(seg, dj, u.id))
      }
      case 'moderate_shoutout': {
        const s = (await db.from('ai_dj_shoutouts').select('*').eq('id', b.id).single()).data; if (!s) throw new HttpError(404, 'Not found.')
        if (!(await canManageDj(u.id, await djById(s.dj_id)))) throw new HttpError(403, 'Not your DJ.')
        await db.from('ai_dj_shoutouts').update({ status: b.approve ? 'approved' : 'rejected' }).eq('id', s.id); return json({ ok: true })
      }
      case 'create_live_dj': return json(await createLiveDj(u.id, b))
      case 'list_live_djs': {
        if (!(await isManager(u.id))) throw new HttpError(403, 'Managers only.')
        return json({ live_djs: (await db.from('live_dj_accounts').select('*').order('created_at', { ascending: false })).data ?? [] })
      }
      case 'set_live_dj': {
        if (!(await isManager(u.id))) throw new HttpError(403, 'Managers only.')
        const a = (await db.from('live_dj_accounts').select('*').eq('id', b.id).single()).data; if (!a) throw new HttpError(404, 'Not found.')
        const st = await stationFor(a.station_id); const active = b.active !== false
        if (a.azuracast_streamer_id) await engine(`/api/station/${st.azuracast_station_id}/streamer/${a.azuracast_streamer_id}`, { method: 'PUT', body: JSON.stringify({ is_active: active }) })
        await db.from('live_dj_accounts').update({ status: active ? 'active' : 'disabled' }).eq('id', a.id)
        await audit(u.id, active ? 'enable_live_dj' : 'disable_live_dj', 'live_dj_accounts', a.id, {})
        return json({ ok: true, status: active ? 'active' : 'disabled' })
      }
    }
    throw bad('Unknown action.')
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    if (e instanceof SyntaxError) return json({ error: 'Invalid JSON.' }, 400)
    console.error('dj-studio', e)
    return json({ error: 'Something went wrong.' }, 500)
  }
})
