import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readBody, parseMultipart, rejectExecutable } from './upload.mjs'
import { encodeTestToken } from './auth.mjs'
import { ONTOLOGY_PRIMER } from './ontology-primer.mjs'
import { randomUUID as uuid } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const files = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/app.js': 'app.js',
  '/app.css': 'app.css',
}

export function createHandler(ctx) {
  return async function handle(req, res) {
    const requestId = randomUUID()
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { status: 'ok', enabled: ctx.config.enabled })
      }
      if (!ctx.config.enabled) {
        if (url.pathname.startsWith('/v1') || url.pathname === '/mcp') {
          return fail(res, 503, 'disabled', 'SWADEBOTS is turned off', requestId)
        }
        return text(res, 404, 'Not found')
      }
      if (req.method === 'GET' && files[url.pathname]) return serve(res, files[url.pathname])
      if (req.method === 'POST' && url.pathname === '/mcp') return mcp(ctx, req, res, requestId)
      const actor = await maybeActor(ctx, req, url)
      const result = await route(ctx, req, url, actor, requestId)
      if (result?.sse) return sse(res, result.events, requestId)
      if (result?.file) return file(res, result.file)
      return send(res, result?.status || 200, { ok: true, data: result?.data ?? result, request_id: requestId })
    } catch (error) {
      const codes = { unauthorized: 401, forbidden: 403, not_found: 404, invalid_request: 400, conflict: 409, vault_unavailable: 503, reauth_required: 401 }
      const status = error.status || codes[error.code] || 500
      return fail(res, status, error.code || 'error', error.message || 'Request failed', requestId)
    }
  }
}

async function route(ctx, req, url, actor, requestId) {
  const { ops, config, store } = ctx
  const path = url.pathname
  if (req.method === 'GET' && path === '/v1/status') {
    requireActor(actor)
    return {
      data: {
        adapter: 'swadebots',
        service: 'swadebots-console',
        contractVersion: 1,
        ready: config.enabled,
        blockers: config.enabled ? [] : ['SWADEBOTS_CONSOLE_ENABLED is not true'],
        api_version: '1',
      },
    }
  }
  if (req.method === 'GET' && path === '/v1/auth/google') {
    return { data: ops.googleUrl(url.searchParams.get('redirect_to') || '') }
  }
  if (req.method === 'GET' && path === '/v1/demo-session') {
    if (!config.allowTestTokens || !config.superAdminEmails[0]) {
      const error = new Error('Not found')
      error.status = 404
      error.code = 'not_found'
      throw error
    }
    return {
      data: {
        token: encodeTestToken({
          sub: 'demo-owner',
          email: config.superAdminEmails[0],
          provider: 'google',
          plan: 'paid',
        }),
        provider: 'google',
        role: 'super_admin',
      },
    }
  }
  requireActor(actor)
  if (req.method === 'GET' && path === '/v1/about-swade') return { data: { primer: ONTOLOGY_PRIMER } }
  if (req.method === 'GET' && path === '/v1/bots') return { data: ops.listBots(actor, url.searchParams) }
  if (req.method === 'POST' && path === '/v1/bots') return { status: 201, data: ops.createBot(actor, await jsonBody(req)) }
  const bot = path.match(/^\/v1\/bots\/([^/]+)$/)
  if (bot && req.method === 'GET') return { data: ops.getBot(actor, bot[1]) }
  if (bot && req.method === 'PATCH') return { data: ops.updateBot(actor, bot[1], await jsonBody(req)) }
  if (req.method === 'POST' && path.match(/^\/v1\/bots\/([^/]+)\/archive$/)) {
    return { data: ops.archiveBot(actor, path.split('/')[3]) }
  }
  const grants = path.match(/^\/v1\/bots\/([^/]+)\/grants$/)
  if (grants && req.method === 'POST') return { status: 202, data: ops.requestGrant(actor, grants[1], await jsonBody(req)) }
  if (req.method === 'GET' && path === '/v1/approvals') return { data: ops.listApprovals(actor) }
  const decision = path.match(/^\/v1\/approvals\/([^/]+)\/decision$/)
  if (decision && req.method === 'POST') {
    const body = await jsonBody(req)
    return { data: ops.decide(actor, decision[1], body.decision) }
  }
  const chat = path.match(/^\/v1\/bots\/([^/]+)\/chat$/)
  if (chat && req.method === 'POST') {
    const body = await jsonBody(req)
    const task = await ops.enqueue(actor, chat[1], body.prompt || body.message || '')
    return {
      sse: true,
      events: [
        { event: 'ack', data: { text: 'On it. I will run this in the background and report back here.', task_id: task.id } },
        { event: 'done', data: { task_id: task.id, status: task.status } },
      ],
    }
  }
  const taskCreate = path.match(/^\/v1\/bots\/([^/]+)\/tasks$/)
  if (taskCreate && req.method === 'POST') {
    const body = await jsonBody(req)
    return { status: 202, data: await ops.enqueue(actor, taskCreate[1], body.prompt || '') }
  }
  if (taskCreate && req.method === 'GET') return { data: ops.listTasks(actor, taskCreate[1]) }
  const messages = path.match(/^\/v1\/bots\/([^/]+)\/messages$/)
  if (messages && req.method === 'GET') return { data: ops.messages(actor, messages[1]) }
  const oneTask = path.match(/^\/v1\/tasks\/([^/]+)$/)
  if (oneTask && (req.method === 'PATCH' || req.method === 'DELETE')) return methodNotAllowed()
  if (oneTask && req.method === 'GET') return { data: ops.getTask(actor, oneTask[1]) }
  const taskInfo = path.match(/^\/v1\/tasks\/([^/]+)\/information-use$/)
  if (taskInfo && req.method === 'GET') {
    ops.getTask(actor, taskInfo[1])
    return { data: ops.informationUse(actor, { taskId: taskInfo[1] }) }
  }
  if (taskInfo && (req.method === 'PATCH' || req.method === 'DELETE' || req.method === 'POST')) return methodNotAllowed()
  const botInfo = path.match(/^\/v1\/bots\/([^/]+)\/information-use$/)
  if (botInfo && req.method === 'GET') {
    ops.getBot(actor, botInfo[1])
    return { data: ops.informationUse(actor, { botId: botInfo[1] }) }
  }
  if (botInfo && (req.method === 'PATCH' || req.method === 'DELETE' || req.method === 'POST')) return methodNotAllowed()
  if (req.method === 'POST' && path.match(/^\/v1\/tasks\/([^/]+)\/cancel$/)) {
    return { data: ops.cancelTask(actor, path.split('/')[3]) }
  }
  if (req.method === 'GET' && path.match(/^\/v1\/tasks\/([^/]+)\/result$/)) {
    const task = ops.getTask(actor, path.split('/')[3])
    return { data: task.result }
  }
  const upload = path.match(/^\/v1\/bots\/([^/]+)\/uploads$/)
  if (upload && req.method === 'POST') return { status: 201, data: await saveUpload(ctx, req, actor, upload[1]) }
  const download = path.match(/^\/v1\/uploads\/([^/]+)$/)
  if (download && req.method === 'GET') return { file: loadUpload(store, actor, download[1]) }
  if (req.method === 'GET' && path === '/v1/settings') return { data: await ops.settings(actor) }
  if (req.method === 'PATCH' && path === '/v1/settings') return { data: ops.updateSettings(actor, await jsonBody(req)) }
  if (req.method === 'GET' && path === '/v1/models') return { data: ops.models(actor) }
  if (req.method === 'GET' && path === '/v1/sites') return { data: ops.sites(actor) }
  if (req.method === 'GET' && path === '/v1/notifications') return { data: ops.notifications(actor) }
  if (req.method === 'GET' && path === '/v1/vault/systems') return { data: await ops.vaultSystems(actor, url.searchParams) }
  if (req.method === 'POST' && path === '/v1/vault/secrets') return { status: 201, data: await ops.storeCredential(actor, await jsonBody(req)) }
  if (req.method === 'POST' && path === '/v1/auth/reauth') return { data: ops.reauth(actor, (await jsonBody(req)).confirmation) }
  const reveal = path.match(/^\/v1\/vault\/secrets\/([^/]+)\/reveal$/)
  if (reveal && req.method === 'POST') {
    const body = await jsonBody(req)
    return { data: await ops.reveal(actor, reveal[1], body.reauth_token) }
  }
  if (req.method === 'POST' && path === '/v1/vault/signups') return { status: 202, data: await ops.signup(actor, await jsonBody(req)) }
  const signup = path.match(/^\/v1\/vault\/signups\/([^/]+)\/decision$/)
  if (signup && req.method === 'POST') {
    const body = await jsonBody(req)
    return { data: await ops.decideSignup(actor, signup[1], body.decision) }
  }
  const bind = path.match(/^\/v1\/approvals\/([^/]+)\/bind$/)
  if (bind && req.method === 'POST') {
    const body = await jsonBody(req)
    return { data: ops.bindVault(actor, bind[1], body.secret_id) }
  }
  const useVault = path.match(/^\/v1\/bots\/([^/]+)\/vault\/use$/)
  if (useVault && req.method === 'POST') return { data: await ops.useVaultGrant(actor, useVault[1], await jsonBody(req)) }
  if (req.method === 'POST' && path === '/v1/admin/app-credentials') {
    return { status: 201, data: ops.issueKey(actor, await jsonBody(req)) }
  }
  if (req.method === 'GET' && path === '/v1/admin/overview') return { data: ops.adminOverview(actor) }
  if (req.method === 'GET' && path === '/v1/admin/information-use') {
    if (actor.role !== 'super_admin') {
      const error = new Error('Only the owner can do that')
      error.status = 403
      error.code = 'forbidden'
      throw error
    }
    return {
      data: ops.informationUse(actor, {
        botId: url.searchParams.get('bot_id') || undefined,
        taskId: url.searchParams.get('task_id') || undefined,
        tool: url.searchParams.get('tool') || undefined,
        source: url.searchParams.get('source') || undefined,
      }),
    }
  }
  const error = new Error('Not found')
  error.status = 404
  error.code = 'not_found'
  throw error
}

function methodNotAllowed() {
  const error = new Error('Information-use records are append-only')
  error.status = 405
  error.code = 'append_only'
  throw error
}

function requireActor(actor) {
  if (!actor) {
    const error = new Error('Sign in is required')
    error.status = 401
    error.code = 'unauthorized'
    throw error
  }
}

async function maybeActor(ctx, req, url) {
  if (url.pathname === '/v1/auth/google' || url.pathname === '/v1/demo-session') return null
  if (url.pathname === '/v1/status' && !(req.headers.authorization || '')) return null
  return ctx.auth.actorFromRequest(req)
}

async function jsonBody(req) {
  const raw = await readBody(req, 1024 * 1024)
  if (!raw.length) return {}
  try {
    return JSON.parse(raw.toString())
  } catch {
    const error = new Error('JSON body is not valid')
    error.status = 400
    error.code = 'invalid_json'
    throw error
  }
}

async function saveUpload(ctx, req, actor, botId) {
  ctx.ops.getBot(actor, botId)
  const raw = await readBody(req, ctx.config.uploadMaxBytes)
  const file = parseMultipart(raw, req.headers['content-type'])
  rejectExecutable(file)
  const id = uuid()
  ctx.store.uploads.set(id, {
    id,
    tenant_id: actor.tenant_id,
    bot_id: botId,
    filename: file.filename,
    content_type: file.contentType || 'application/octet-stream',
    bytes: file.bytes,
  })
  return { id, filename: file.filename, content_type: file.contentType || 'application/octet-stream', size: file.bytes.length }
}

function loadUpload(store, actor, id) {
  const file = store.uploads.get(id)
  if (!file || file.tenant_id !== actor.tenant_id) {
    const error = new Error('Upload not found')
    error.status = 404
    error.code = 'not_found'
    throw error
  }
  return file
}

async function serve(res, name) {
  const body = await readFile(join(root, name))
  const type = name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(body)
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function text(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' })
  res.end(body)
}

function fail(res, status, code, message, requestId) {
  send(res, status, { ok: false, error: { code, message, retryable: status >= 500 }, request_id: requestId })
}

function sse(res, events, requestId) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache',
    'x-request-id': requestId,
  })
  for (const event of events) {
    res.write(`event: ${event.event}\n`)
    res.write(`data: ${JSON.stringify({ ...event.data, request_id: requestId })}\n\n`)
  }
  res.end()
}

function file(res, upload) {
  res.writeHead(200, {
    'content-type': upload.content_type || 'application/octet-stream',
    'content-disposition': `attachment; filename="${encodeURIComponent(upload.filename)}"`,
  })
  res.end(upload.bytes)
}

async function mcp(ctx, req, res, requestId) {
  const body = await jsonBody(req)
  const actor = await ctx.auth.actorFromRequest(req)
  const result = await mcpCall(ctx, actor, body)
  send(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result })
  void requestId
  void createReadStream
}

async function mcpCall(ctx, actor, body) {
  if (body.method === 'initialize') {
    return { protocolVersion: '2024-11-05', serverInfo: { name: 'swadebots', version: '1.0.0' }, capabilities: { tools: {} } }
  }
  if (body.method === 'tools/list') {
    return {
      tools: ['list_bots', 'get_bot', 'create_bot', 'update_bot', 'archive_bot', 'create_task', 'get_task', 'cancel_task', 'request_grant'].map(
        (name) => ({ name, description: name.replaceAll('_', ' '), inputSchema: { type: 'object' } }),
      ),
    }
  }
  if (body.method !== 'tools/call') {
    const error = new Error('MCP method is not supported')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  const name = body.params?.name
  const args = body.params?.arguments || {}
  const ops = ctx.ops
  let data
  if (name === 'list_bots') data = ops.listBots(actor, new URLSearchParams())
  else if (name === 'get_bot') data = ops.getBot(actor, args.id)
  else if (name === 'create_bot') data = ops.createBot(actor, args)
  else if (name === 'update_bot') data = ops.updateBot(actor, args.id, args)
  else if (name === 'archive_bot') data = ops.archiveBot(actor, args.id)
  else if (name === 'create_task') data = await ops.enqueue(actor, args.bot_id, args.prompt || '')
  else if (name === 'get_task') data = ops.getTask(actor, args.id)
  else if (name === 'cancel_task') data = ops.cancelTask(actor, args.id)
  else if (name === 'request_grant') data = ops.requestGrant(actor, args.bot_id, args)
  else {
    const error = new Error('Tool is not available')
    error.status = 404
    error.code = 'not_found'
    throw error
  }
  return { content: [{ type: 'text', text: JSON.stringify(data) }], isError: false }
}
