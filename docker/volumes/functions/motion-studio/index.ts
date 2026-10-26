// SWADEBASE Motion Studio — edge function (self-hosted edge-runtime)
// Public URL: https://swadebase.cloud/functions/v1/motion-studio/...
//
//   GET  /app                          Motion Studio UI (public shell; data calls need a session)
//   GET  /health                       config check (no secrets returned)
//   GET  /styles[?category=&q=]        library cards          (auth)
//   GET  /styles/:id                   full style spec + sample video link (auth)
//   POST /styles/samples               founder: render our own sample per style { all | style_ids[], force }
//   POST /recommend                    { idea, property, format, audio } -> picks
//   POST /agent                        { message, project_id?, context } -> Kinetta reply
//   POST /uploads                      { kind: audio|start_image, filename, contentType, size } -> presigned PUT
//   GET  /projects                     my projects
//   POST /projects                     create draft (optionally render immediately)
//   GET  /projects/:id                 project + signed download links when ready
//   PATCH /projects/:id                edit draft
//   POST /projects/:id/render          queue compose + render { quality }
//   GET  /projects/:id/download?type=video|source|poster   { url } signed B2 link (?redirect=1 for 302)
//   POST /mcp                          MCP (JSON-RPC over streamable HTTP) for any agent program
//
// Secrets (server env only): SUPABASE_SERVICE_ROLE_KEY, B2_KEY_ID, B2_APP_KEY, ANTHROPIC_API_KEY / OPENAI_API_KEY.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { AwsClient } from 'npm:aws4fetch@1.0.20'
import { recommendStyles, normalizeRequest, styleCard, FORMATS, ADAPTER_VERSION } from './_shared/adapter.mjs'
import { AGENT_MANIFEST, AGENT_TOOLS, ruleBasedTurn, llmMessages, validateLlmTurn } from './_shared/motion-agent.mjs'

// Imported (not read from disk) so the edge runtime bundles them with the function.
import { LIBRARY as LIB_JSON } from './_shared/library.mjs'
import { APP_HTML } from './_shared/app-html.mjs'
const FILE_LIBRARY = (LIB_JSON as any).styles as any[]

const env = (k: string, d = '') => Deno.env.get(k) ?? d
const SUPABASE_URL = env('SUPABASE_URL', 'http://kong:8000')
const PUBLIC_URL = env('SUPABASE_PUBLIC_URL', 'https://swadebase.cloud')
const ANON_KEY = env('SUPABASE_ANON_KEY')
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
// Accept both naming schemes: B2_* (repo default) and BACKBLAZE_* (existing SWADEBASE functions.env).
const pickEnv = (...keys: string[]) => keys.map((k) => env(k)).find((v) => v) || ''
const B2 = {
  keyId: pickEnv('B2_KEY_ID', 'BACKBLAZE_KEY_ID'),
  appKey: pickEnv('B2_APP_KEY', 'BACKBLAZE_APPLICATION_KEY'),
  bucket: pickEnv('B2_BUCKET_NAME', 'BACKBLAZE_BUCKET_NAME'),
  endpoint: pickEnv('B2_ENDPOINT', 'BACKBLAZE_S3_ENDPOINT').replace(/\/$/, '').replace(/^(?!https?:\/\/)/, 'https://'),
  region: pickEnv('B2_REGION', 'BACKBLAZE_REGION') || 'us-east-005',
  prefix: env('MOTION_B2_PREFIX', 'swadesoul/motion-studio'),
}
// Long-lived keys for server-side agent hosts (e.g. Rakazo). Format: label:key:user_id[,label:key:user_id]
const AGENT_KEYS = env('MOTION_AGENT_KEYS')
  .split(',')
  .map((s) => s.trim().split(':'))
  .filter((p) => p.length === 3 && p[1].length >= 24)
  .map(([label, key, userId]) => ({ label, key, userId }))
const ADMIN_EMAILS = env('MOTION_ADMIN_EMAILS', 'swadesoul@gmail.com').toLowerCase().split(',').map((s) => s.trim())
const AGENT_NAME = env('MOTION_AGENT_NAME', AGENT_MANIFEST.name)
const MAX_UPLOAD_MB = Number(env('MOTION_MAX_UPLOAD_MB', '200'))

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const s3 = B2.keyId && B2.appKey ? new AwsClient({ accessKeyId: B2.keyId, secretAccessKey: B2.appKey, service: 's3', region: B2.region }) : null

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const fail = (status: number, msg: string) => json({ error: msg }, status)

/* ───────────── library (DB first so founder edits apply; file copy as fallback) ───────────── */
let libCache: { at: number; styles: any[]; samples: Record<string, any> } | null = null
async function loadLibrary() {
  if (libCache && Date.now() - libCache.at < 60_000) return libCache
  const { data, error } = await admin
    .from('motion_styles')
    .select('id, spec, sample_status, sample_video_b2_key, sample_poster_b2_key, sample_updated_at')
    .eq('is_active', true)
    .order('sort_order')
  const ok = !error && data?.length
  const styles = ok ? data.map((r: any) => r.spec) : FILE_LIBRARY
  const samples: Record<string, any> = {}
  if (ok) for (const r of data) samples[r.id] = { status: r.sample_status, video: r.sample_video_b2_key, poster: r.sample_poster_b2_key, updated: r.sample_updated_at }
  libCache = { at: Date.now(), styles, samples }
  return libCache
}
async function library(): Promise<any[]> {
  return (await loadLibrary()).styles
}
async function sampleLinks(id: string) {
  const smp = (await loadLibrary()).samples[id]
  if (!smp || smp.status !== 'ready' || !smp.video || !s3) return { sample_status: smp?.status || 'none' }
  return {
    sample_status: 'ready',
    sample_video: await presign('GET', smp.video, 21600),
    sample_poster: smp.poster ? await presign('GET', smp.poster, 21600) : null,
  }
}

async function queueSamples(user: User, body: any) {
  const styles = await library()
  const lib = await loadLibrary()
  let ids: string[] = body.all ? styles.map((s) => s.id) : (body.style_ids || []).filter((id: string) => styles.find((s) => s.id === id))
  if (!body.force) ids = ids.filter((id) => !['ready', 'queued', 'rendering'].includes(lib.samples[id]?.status))
  if (!ids.length) return { queued: 0, note: 'Every selected style already has a sample. Pass force to re-render.' }
  const rows = ids.map((id) => ({ kind: 'style_sample', style_id: id, owner_user_id: user.id }))
  let queued = 0
  for (const row of rows) {
    const { error } = await admin.from('motion_render_jobs').insert(row)
    if (!error) queued++
    else if (!/uq_motion_render_jobs_sample_active/.test(error.message)) throw new Error(error.message)
  }
  await admin.from('motion_styles').update({ sample_status: 'queued' }).in('id', ids)
  libCache = null
  return { queued, style_ids: ids }
}

/* ───────────── auth ───────────── */
type User = { id: string; email: string; isAdmin: boolean }
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

async function getUser(req: Request): Promise<User | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || req.headers.get('x-motion-key') || ''
  if (!token || token === ANON_KEY) return null
  const agentKey = AGENT_KEYS.find((k) => safeEqual(k.key, token))
  if (agentKey) {
    const { data } = await admin.auth.admin.getUserById(agentKey.userId)
    if (!data?.user) return null
    const email = (data.user.email || '').toLowerCase()
    return { id: data.user.id, email, isAdmin: ADMIN_EMAILS.includes(email) }
  }
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) return null
  const email = (data.user.email || '').toLowerCase()
  const role = (data.user.app_metadata as any)?.role
  return { id: data.user.id, email, isAdmin: ADMIN_EMAILS.includes(email) || role === 'founder' || role === 'super_admin' }
}

/* ───────────── B2 presign ───────────── */
const enc = (key: string) => key.split('/').map(encodeURIComponent).join('/')
async function presign(method: 'GET' | 'PUT', key: string, expires = 3600, contentType?: string, downloadName?: string) {
  if (!s3 || !B2.endpoint || !B2.bucket) throw new Error('Backblaze B2 is not configured on SWADEBASE')
  const url = new URL(`${B2.endpoint}/${B2.bucket}/${enc(key)}`)
  url.searchParams.set('X-Amz-Expires', String(expires))
  if (downloadName) url.searchParams.set('response-content-disposition', `attachment; filename="${downloadName}"`)
  const headers: Record<string, string> = {}
  if (method === 'PUT' && contentType) headers['content-type'] = contentType
  const signed = await s3.sign(new Request(url, { method, headers }), { aws: { signQuery: true } })
  return signed.url
}
const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'file'

/* ───────────── projects ───────────── */
const PROJECT_FIELDS = [
  'title', 'mode', 'format', 'duration_sec', 'fps', 'quality', 'style_id', 'style_pick', 'idea', 'script', 'property',
  'brand', 'audio_b2_key', 'audio_features', 'captions', 'start_image_b2_key', 'start_image_description', 'source_app',
]
function pick(body: any) {
  const out: Record<string, unknown> = {}
  for (const k of PROJECT_FIELDS) if (body[k] !== undefined) out[k] = body[k]
  return out
}

async function withDownloads(p: any) {
  // Direct signed B2 links (1 hour) so the browser, iOS and any agent can download without extra auth hops.
  const downloads: Record<string, string> = {}
  if (p.status === 'ready' && s3) {
    const stem = safeName(p.title || 'motion').replace(/\.[a-z0-9]+$/, '')
    if (p.video_b2_key) downloads.video = await presign('GET', p.video_b2_key, 3600, undefined, `${stem}.mp4`)
    if (p.source_zip_b2_key) downloads.source = await presign('GET', p.source_zip_b2_key, 3600, undefined, `${stem}-hyperframes.zip`)
    if (p.poster_b2_key) downloads.poster = await presign('GET', p.poster_b2_key, 3600)
    if (p.video_b2_key) downloads.video_preview = await presign('GET', p.video_b2_key, 3600)
  }
  return { ...p, downloads }
}

async function ownedProject(user: User, id: string) {
  const { data, error } = await admin.from('motion_projects').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  if (data.owner_user_id !== user.id && !user.isAdmin) return null
  return data
}

async function resolveStyle(body: any, styles: any[]) {
  if (body.style_id && body.style_id !== 'auto') {
    if (!styles.find((s) => s.id === body.style_id)) throw new Error(`Unknown style: ${body.style_id}`)
    return { style_id: body.style_id, style_pick: body.style_pick === 'agent' ? 'agent' : 'user', reasons: [] as string[] }
  }
  const brief = normalizeRequest({
    mode: body.mode, idea: [body.title, body.idea].filter(Boolean).join('\n'), property: body.property, format: body.format, audio: body.audio_features,
    startImage: body.start_image_description ? { description: body.start_image_description } : null,
  })
  const top = recommendStyles(styles, brief, 1)[0]
  return { style_id: top.id, style_pick: 'agent', reasons: top.reasons }
}

// Every referenced upload must sit under the caller's own prefix and respect the size limit.
// The presigned PUT can't bind Content-Length, so the real object size is checked here (and again by the worker).
async function assertUploads(user: User, body: any) {
  for (const k of ['audio_b2_key', 'start_image_b2_key']) {
    const key = body[k]
    if (!key) continue
    if (typeof key !== 'string' || key.includes('..')) throw new Error(`${k} is invalid`)
    if (!key.startsWith(`${B2.prefix}/${user.id}/uploads/`) && !user.isAdmin) throw new Error(`${k} is not yours`)
    if (!s3) throw new Error('Backblaze B2 is not configured on SWADEBASE')
    const head = await s3.fetch(`${B2.endpoint}/${B2.bucket}/${enc(key)}`, { method: 'HEAD' })
    if (!head.ok) throw new Error(`${k} was not found in storage; upload it again`)
    const bytes = Number(head.headers.get('content-length') || 0)
    if (bytes > MAX_UPLOAD_MB * 1024 * 1024) {
      await s3.fetch(`${B2.endpoint}/${B2.bucket}/${enc(key)}`, { method: 'DELETE' }).catch(() => {})
      throw new Error(`${k} is larger than ${MAX_UPLOAD_MB} MB and was removed`)
    }
  }
}

async function createProject(user: User, body: any) {
  const styles = await library()
  const mode = ['idea', 'audio', 'start_image'].includes(body.mode) ? body.mode : 'idea'
  if (mode === 'audio' && !body.audio_b2_key) throw new Error('Audio mode needs an uploaded audio file')
  if (mode === 'start_image' && !body.start_image_b2_key) throw new Error('Start-image mode needs an uploaded image')
  if (mode === 'idea' && !String(body.idea || body.title || '').trim()) throw new Error('Describe the idea first')
  await assertUploads(user, body)
  const style = await resolveStyle({ ...body, mode }, styles)
  const audioDur = Number(body.audio_features?.duration) || 0
  const row = {
    ...pick(body),
    mode,
    format: FORMATS[body.format as keyof typeof FORMATS] ? body.format : '16:9',
    duration_sec: Math.min(600, Math.max(3, Number(body.duration_sec) || (mode === 'audio' && audioDur ? audioDur : 15))),
    title: String(body.title || '').trim() || 'Untitled motion',
    style_id: style.style_id,
    style_pick: style.style_pick,
    agent_notes: { pick_reasons: style.reasons },
    owner_user_id: user.id,
    status: 'draft',
  }
  const { data, error } = await admin.from('motion_projects').insert(row).select('*').single()
  if (error) throw new Error(error.message)
  if (body.render !== false) return await queueRender(user, data, body.quality)
  return data
}

async function queueRender(user: User, project: any, quality?: string) {
  if (!project.style_id) throw new Error('Pick a style first')
  if (['queued', 'composing', 'rendering'].includes(project.status)) return project
  const q = ['draft', 'standard', 'high'].includes(String(quality)) ? quality : project.quality || 'standard'
  const { error: jerr } = await admin.from('motion_render_jobs').insert({ project_id: project.id, owner_user_id: project.owner_user_id, kind: 'compose_render' })
  if (jerr && !/uq_motion_render_jobs_active/.test(jerr.message)) throw new Error(jerr.message)
  const { data, error } = await admin
    .from('motion_projects')
    .update({ status: 'queued', progress: 0, quality: q, error_message: null })
    .eq('id', project.id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

/* ───────────── Kinetta (agent) ───────────── */
async function callLlm(system: string, messages: { role: string; content: string }[]) {
  const provider = env('MOTION_AGENT_PROVIDER') || (env('ANTHROPIC_API_KEY') ? 'anthropic' : env('OPENAI_API_KEY') ? 'openai' : env('OLLAMA_URL') ? 'ollama' : 'none')
  const ctl = AbortSignal.timeout(25_000)
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl,
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json', ...(env('ANTHROPIC_WORKSPACE_ID') && env('ANTHROPIC_USE_WORKSPACE_HEADER') === 'true' ? { 'anthropic-workspace-id': env('ANTHROPIC_WORKSPACE_ID') } : {}) },
      body: JSON.stringify({ model: env('MOTION_AGENT_MODEL', 'claude-haiku-4-5'), max_tokens: 700, system, messages: messages.map((m) => ({ role: m.role === 'agent' ? 'assistant' : m.role, content: m.content })) }),
    })
    if (!r.ok) throw new Error(`anthropic ${r.status}`)
    const j = await r.json()
    return { text: j.content?.map((c: any) => c.text || '').join('') || '', usage: j.usage, provider }
  }
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: ctl,
      headers: { authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('MOTION_AGENT_MODEL', 'gpt-4o-mini'), response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role === 'agent' ? 'assistant' : m.role, content: m.content }))] }),
    })
    if (!r.ok) throw new Error(`openai ${r.status}`)
    const j = await r.json()
    return { text: j.choices?.[0]?.message?.content || '', usage: j.usage, provider }
  }
  if (provider === 'ollama') {
    const r = await fetch(`${env('OLLAMA_URL').replace(/\/$/, '')}/api/chat`, {
      method: 'POST', signal: ctl, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('MOTION_AGENT_MODEL', 'qwen2.5:7b'), stream: false, format: 'json', messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role === 'agent' ? 'assistant' : m.role, content: m.content }))] }),
    })
    if (!r.ok) throw new Error(`ollama ${r.status}`)
    const j = await r.json()
    return { text: j.message?.content || '', usage: null, provider }
  }
  return null
}

async function agentTurn(user: User, body: any) {
  const styles = await library()
  const message = String(body.message || '').slice(0, 4000)
  const context = body.context || {}
  if (body.project_id) {
    const p = await ownedProject(user, body.project_id)
    if (p) Object.assign(context, { mode: p.mode, idea: p.idea, property: p.property, format: p.format, durationSec: p.duration_sec, audio: p.audio_features, styleId: p.style_id })
  }
  const base = ruleBasedTurn(styles, { message, context })
  let turn: any = base
  try {
    const { data: hist } = await admin
      .from('motion_agent_messages').select('role, content').eq('owner_user_id', user.id)
      .order('created_at', { ascending: false }).limit(8)
    const history = (hist || []).reverse().map((m: any) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }))
    while (history.length && history[0].role !== 'user') history.shift() // providers expect user-first turns
    const prompt = llmMessages(styles, { message, context, history })
    const out = await callLlm(prompt.system, prompt.messages)
    if (out?.text) turn = { ...validateLlmTurn(styles, out.text, base), provider: out.provider, usage: out.usage }
  } catch (e) {
    turn = { ...base, note: `LLM unavailable, used built-in picker (${(e as Error).message})` }
  }
  turn.reply = turn.reply.replaceAll(AGENT_MANIFEST.name, AGENT_NAME)
  turn.picks = turn.picks.map((p: any) => ({ ...p, card: styleCard(styles.find((s) => s.id === p.id)) }))
  await admin.from('motion_agent_messages').insert([
    { owner_user_id: user.id, project_id: body.project_id || null, role: 'user', content: message, data: { context } },
    { owner_user_id: user.id, project_id: body.project_id || null, role: 'agent', content: turn.reply, data: { picks: turn.picks.map((p: any) => p.id), chosen: turn.chosen, brain: turn.brain } },
  ])
  return { agent: AGENT_NAME, ...turn }
}

/* ───────────── MCP (JSON-RPC 2.0, streamable HTTP, stateless) ───────────── */
async function runTool(user: User, name: string, args: any = {}) {
  const styles = await library()
  switch (name) {
    case 'motion_list_styles': {
      const q = String(args.query || '').toLowerCase()
      return styles
        .filter((s) => !args.category || s.category === args.category)
        .filter((s) => !q || (s.name + ' ' + s.bestFor.join(' ') + ' ' + s.look).toLowerCase().includes(q))
        .map(styleCard)
    }
    case 'motion_recommend_styles':
      return recommendStyles(styles, normalizeRequest(args), Math.min(10, Number(args.limit) || 5))
    case 'motion_create_project': {
      const p = await createProject(user, { ...args, style_id: args.style_id || 'auto', render: args.render !== false, source_app: args.source_app || 'mcp' })
      return await withDownloads(p)
    }
    case 'motion_get_project': {
      const p = await ownedProject(user, String(args.project_id))
      if (!p) throw new Error('Project not found')
      return await withDownloads(p)
    }
    case 'motion_list_projects': {
      const { data } = await admin.from('motion_projects').select('id,title,status,progress,style_id,format,mode,created_at')
        .eq('owner_user_id', user.id).order('created_at', { ascending: false }).limit(Math.min(50, Number(args.limit) || 20))
      return data || []
    }
  }
  throw new Error(`Unknown tool ${name}`)
}

async function mcp(req: Request, user: User | null) {
  const msg = await req.json().catch(() => null)
  if (!msg) return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400)
  const batch = Array.isArray(msg) ? msg : [msg]
  const out = []
  for (const m of batch) {
    const reply = (result: unknown) => ({ jsonrpc: '2.0', id: m.id, result })
    const err = (code: number, message: string) => ({ jsonrpc: '2.0', id: m.id, error: { code, message } })
    if (m.id === undefined) continue // notification
    if (m.method === 'initialize') {
      out.push(reply({ protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'swadebase-motion-studio', version: ADAPTER_VERSION }, instructions: `${AGENT_NAME}: ${AGENT_MANIFEST.scope}` }))
    } else if (m.method === 'ping') out.push(reply({}))
    else if (m.method === 'tools/list') out.push(reply({ tools: AGENT_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.input_schema })) }))
    else if (m.method === 'tools/call') {
      if (!user) { out.push(err(-32001, 'Sign in to SWADEBASE (Bearer token) to use Motion Studio tools')); continue }
      try {
        const result = await runTool(user, m.params?.name, m.params?.arguments)
        out.push(reply({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: Array.isArray(result) ? { items: result } : result }))
      } catch (e) {
        out.push(reply({ content: [{ type: 'text', text: (e as Error).message }], isError: true }))
      }
    } else out.push(err(-32601, `Method not found: ${m.method}`))
  }
  if (!out.length) return new Response(null, { status: 202, headers: CORS })
  return json(Array.isArray(msg) ? out : out[0])
}

/* ───────────── router ───────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'motion-studio') parts.shift()
  const [a, b, c] = parts

  try {
    if (!a || a === 'app') {
      if (req.method !== 'GET') return fail(405, 'GET only')
      const html = APP_HTML.replaceAll('__SWADEBASE_URL__', PUBLIC_URL).replaceAll('__SWADEBASE_ANON_KEY__', ANON_KEY).replaceAll('__AGENT_NAME__', AGENT_NAME)
      return new Response(html, { headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
    }
    if (a === 'health') {
      const { count, error } = await admin.from('motion_styles').select('id', { count: 'exact', head: true })
      return json({ ok: true, adapter: ADAPTER_VERSION, agent: AGENT_NAME, styles_in_db: error ? null : count, styles_in_file: FILE_LIBRARY.length, b2: !!s3 && !!B2.bucket, db_error: error?.message || null })
    }

    const user = await getUser(req)
    if (a === 'mcp') return await mcp(req, user)
    if (!user) return fail(401, 'Sign in to SWADEBASE first')

    if (a === 'styles' && req.method === 'GET') {
      const styles = await library()
      if (b) {
        const s = styles.find((x) => x.id === b)
        return s ? json({ ...s, ...(await sampleLinks(s.id)) }) : fail(404, 'Style not found')
      }
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const cat = url.searchParams.get('category')
      const list = styles.filter((s) => (!cat || s.category === cat) && (!q || (s.name + ' ' + s.bestFor.join(' ')).toLowerCase().includes(q)))
      const cards = await Promise.all(list.map(async (s) => ({ ...styleCard(s), ...(await sampleLinks(s.id)) })))
      return json({ count: styles.length, categories: LIB_JSON.categories, is_admin: user.isAdmin, styles: cards })
    }
    if (a === 'styles' && b === 'samples' && req.method === 'POST') {
      if (!user.isAdmin) return fail(403, 'Only the founder can generate style samples')
      return json(await queueSamples(user, await req.json().catch(() => ({}))))
    }
    if (a === 'recommend' && req.method === 'POST') {
      const body = await req.json()
      return json({ picks: recommendStyles(await library(), normalizeRequest(body), Math.min(10, Number(body.limit) || 5)) })
    }
    if (a === 'agent' && req.method === 'POST') return json(await agentTurn(user, await req.json()))

    if (a === 'uploads' && req.method === 'POST') {
      const body = await req.json()
      const kind = body.kind === 'start_image' ? 'start_image' : body.kind === 'audio' ? 'audio' : null
      if (!kind) return fail(400, 'kind must be audio or start_image')
      const type = String(body.contentType || '')
      if (kind === 'audio' && !/^audio\//.test(type) && !/^video\/(mp4|quicktime)$/.test(type)) return fail(400, 'Upload an audio file (mp3, wav, m4a, aac, ogg)')
      if (kind === 'start_image' && !/^image\/(png|jpe?g|webp)$/.test(type)) return fail(400, 'Upload a PNG, JPG or WebP image')
      const size = Number(body.size)
      if (!Number.isFinite(size) || size <= 0) return fail(400, 'File size is required')
      if (size > MAX_UPLOAD_MB * 1024 * 1024) return fail(413, `Max ${MAX_UPLOAD_MB} MB`)
      const key = `${B2.prefix}/${user.id}/uploads/${crypto.randomUUID()}-${safeName(String(body.filename || kind))}`
      return json({ key, uploadUrl: await presign('PUT', key, 900, type), headers: { 'content-type': type }, expiresIn: 900 })
    }

    if (a === 'projects') {
      if (!b && req.method === 'GET') {
        const { data, error } = await admin.from('motion_projects')
          .select('id,title,mode,format,duration_sec,status,progress,style_id,style_pick,created_at,updated_at,poster_b2_key,video_b2_key,source_zip_b2_key,error_message')
          .eq('owner_user_id', user.id).order('created_at', { ascending: false }).limit(60)
        if (error) return fail(500, error.message)
        return json({ projects: await Promise.all((data || []).map(withDownloads)) })
      }
      if (!b && req.method === 'POST') return json(await withDownloads(await createProject(user, await req.json())), 201)

      const project = b ? await ownedProject(user, b) : null
      if (!project) return fail(404, 'Project not found')

      if (!c && req.method === 'GET') {
        const { data: jobs } = await admin.from('motion_render_jobs').select('id,status,attempts,error_message,queued_at,started_at,completed_at').eq('project_id', project.id).order('queued_at', { ascending: false }).limit(5)
        return json({ ...(await withDownloads(project)), jobs: jobs || [] })
      }
      if (!c && req.method === 'PATCH') {
        if (['queued', 'composing', 'rendering'].includes(project.status)) return fail(409, 'Wait for the current render to finish')
        const patch = pick(await req.json())
        await assertUploads(user, patch)
        if (patch.style_id) {
          const styles = await library()
          if (!styles.find((s) => s.id === patch.style_id)) return fail(400, 'Unknown style')
        }
        const { data, error } = await admin.from('motion_projects').update({ ...patch, status: 'draft' }).eq('id', project.id).select('*').single()
        if (error) return fail(500, error.message)
        return json(await withDownloads(data))
      }
      if (c === 'render' && req.method === 'POST') {
        const body = await req.json().catch(() => ({}))
        return json(await withDownloads(await queueRender(user, project, body.quality)))
      }
      if (c === 'download' && req.method === 'GET') {
        const type = url.searchParams.get('type') || 'video'
        const key = type === 'source' ? project.source_zip_b2_key : type === 'poster' ? project.poster_b2_key : project.video_b2_key
        if (!key) return fail(404, 'Not rendered yet')
        const stem = safeName(project.title || 'motion')
        const name = type === 'source' ? `${stem}-hyperframes.zip` : type === 'poster' ? undefined : `${stem}.mp4`
        const signed = await presign('GET', key, 3600, undefined, name)
        return url.searchParams.get('redirect') === '1' ? Response.redirect(signed, 302) : json({ url: signed, expiresIn: 3600 })
      }
    }
    return fail(404, 'Not found')
  } catch (e) {
    console.error('motion-studio error', e)
    return fail(400, (e as Error).message || 'Request failed')
  }
})
