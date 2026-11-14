import { randomUUID } from 'node:crypto'
import { publicBot, ROLE_SEEDS } from './registry.mjs'
import { createInfoLog } from './info-use.mjs'
import { findModel } from './models.mjs'

export class MemoryStore {
  constructor() {
    this.bots = new Map()
    this.messages = []
    this.tasks = new Map()
    this.uploads = new Map()
    this.settings = new Map()
    this.auditLog = []
    this.keys = new Map()
    this.grants = new Map()
    this.notifications = []
    this.handoffs = []
    this.reauth = new Map()
    this.recentReauth = new Map()
    this.sessions = new Map()
    this.signups = new Map()
    this.infoUse = createInfoLog()
  }

  exportSessions() {
    return [...this.sessions.values()].map((session) => structuredClone(session))
  }

  importSessions(rows) {
    for (const session of rows) this.sessions.set(session.id, structuredClone(session))
  }

  audit(entry) {
    const row = {
      id: randomUUID(),
      at: new Date().toISOString(),
      ...entry,
      data: entry.data || {},
    }
    this.auditLog.push(row)
    return row
  }

  ensureSettings(tenantId, tier, plan) {
    if (!this.settings.has(tenantId)) {
      this.settings.set(tenantId, {
        tenant_id: tenantId,
        tier,
        theme: 'ink',
        accent: 'amber',
        notifications: { task_done: true, approval: true },
        model: 'ollama/qwen3:4b',
        plan: plan || (tier === 'public' ? 'free' : 'paid'),
        signup_policy: { prefer_google: true },
        owner_default_email: '',
        approval_rules: { send_message: 'require', payment: 'require', delete: 'require', signup: 'require' },
        connectors: [],
      })
    }
    return this.settings.get(tenantId)
  }

  seedOwnerBots(tenantId) {
    for (const seed of ROLE_SEEDS) {
      if ([...this.bots.values()].some((bot) => bot.tenant_id === tenantId && bot.id === seed.id)) continue
      this.bots.set(`${tenantId}:${seed.id}`, botFromSeed(tenantId, seed))
    }
  }

  listBots(tenantId, { includeHidden = false, includeArchived = false } = {}) {
    return [...this.bots.values()]
      .filter((bot) => bot.tenant_id === tenantId)
      .filter((bot) => includeHidden || !bot.policy.console?.hidden)
      .filter((bot) => includeArchived || bot.status !== 'retired')
      .map((bot) => publicBot(bot, this.grantsFor(tenantId)))
  }

  getBot(tenantId, id) {
    const bot = [...this.bots.values()].find((item) => item.tenant_id === tenantId && item.id === id)
    return bot || null
  }

  createBot(tenantId, tier, input) {
    const id = uniqueId(this, tenantId, input.id || slugify(input.name))
    const now = new Date().toISOString()
    const tools = input.tool_scopes || input.tools || []
    const model = input.model || 'ollama/qwen3:4b'
    const bot = {
      id,
      tenant_id: tenantId,
      tier,
      kind: input.kind || 'role',
      site_slug: input.site_slug || null,
      status: 'draft',
      status_before_pause: null,
      paused_by: null,
      paused_reason: null,
      paused_at: null,
      model_tier: input.model_tier || (findModel(model)?.tier === 'local' ? 'T0' : 'T1'),
      routines: input.routines || [],
      api_key_id: null,
      last_heartbeat_at: null,
      last_run: null,
      version: 1,
      name: input.name,
      avatar: input.avatar || initials(input.name),
      title: input.title || input.role || 'SWADEBOT',
      description: input.description || '',
      instructions: input.instructions || input.objective || '',
      knowledge_scope: input.knowledge_scope || input.project_scope || '',
      tools,
      model,
      policy: {
        console: { hidden: false, archived: false },
        site_grants: {},
        agent_os: {
          role: input.role || input.title || '',
          objective: input.objective || input.instructions || '',
          project_scope: input.project_scope || input.knowledge_scope || null,
          provider: input.provider || 'auto',
          tool_scopes: tools,
          budget_cents: Number(input.budget_cents) || 0,
          approval_mode: input.approval_mode || 'approval_required',
          metadata: input.metadata || {},
          parent_worker_id: input.parent_worker_id || null,
        },
      },
      created_at: now,
      updated_at: now,
    }
    this.bots.set(`${tenantId}:${id}`, bot)
    return bot
  }

  updateBot(bot, patch) {
    const consolePolicy = { ...bot.policy.console }
    const agentOs = { ...bot.policy.agent_os }
    if (patch.name) bot.name = patch.name
    if (patch.avatar) bot.avatar = patch.avatar
    if (patch.title || patch.role) bot.title = patch.title || patch.role
    if (patch.description !== undefined) bot.description = patch.description
    if (patch.instructions !== undefined || patch.objective !== undefined) {
      bot.instructions = patch.instructions ?? patch.objective
      agentOs.objective = bot.instructions
    }
    if (patch.knowledge_scope !== undefined || patch.project_scope !== undefined) {
      bot.knowledge_scope = patch.knowledge_scope ?? patch.project_scope
      agentOs.project_scope = bot.knowledge_scope
    }
    if (patch.tools || patch.tool_scopes) {
      bot.tools = patch.tool_scopes || patch.tools
      agentOs.tool_scopes = bot.tools
    }
    if (patch.model) {
      bot.model = patch.model
      bot.model_tier = findModel(patch.model)?.tier === 'local' ? 'T0' : 'T1'
    }
    if (patch.provider) agentOs.provider = patch.provider
    if (patch.budget_cents !== undefined) agentOs.budget_cents = Number(patch.budget_cents) || 0
    if (patch.approval_mode) agentOs.approval_mode = patch.approval_mode
    if (patch.metadata) agentOs.metadata = patch.metadata
    if (patch.parent_worker_id !== undefined) agentOs.parent_worker_id = patch.parent_worker_id
    if (patch.hidden !== undefined) consolePolicy.hidden = Boolean(patch.hidden)
    if (patch.routines) bot.routines = patch.routines
    if (patch.site_grants) bot.policy.site_grants = patch.site_grants
    if (patch.status && ['draft', 'testing', 'ready', 'paused', 'retired'].includes(patch.status)) {
      bot.status = patch.status
    }
    bot.policy = { ...bot.policy, console: consolePolicy, agent_os: agentOs }
    bot.version += 1
    bot.updated_at = new Date().toISOString()
    return bot
  }

  archiveBot(bot) {
    bot.status = 'retired'
    bot.policy.console = { ...bot.policy.console, archived: true, hidden: true }
    bot.version += 1
    bot.updated_at = new Date().toISOString()
    return bot
  }

  addMessage(tenantId, botId, message) {
    const row = {
      id: randomUUID(),
      tenant_id: tenantId,
      bot_id: botId,
      at: new Date().toISOString(),
      ...message,
    }
    this.messages.push(row)
    return row
  }

  listMessages(tenantId, botId) {
    return this.messages.filter((message) => message.tenant_id === tenantId && message.bot_id === botId)
  }

  saveTask(task) {
    this.tasks.set(task.id, task)
    return task
  }

  getTask(tenantId, id) {
    const task = this.tasks.get(id)
    if (!task || task.tenant_id !== tenantId) return null
    return task
  }

  listTasks(tenantId, botId) {
    return [...this.tasks.values()].filter((task) => task.tenant_id === tenantId && (!botId || task.bot_id === botId))
  }

  grantsFor(tenantId, botId) {
    return [...this.grants.values()].filter(
      (grant) => grant.tenant_id === tenantId && (!botId || grant.bot_id === botId),
    )
  }

  findGrant(tenantId, botId, kind, resource) {
    const rows = this.grantsFor(tenantId, botId).filter(
      (grant) => grant.kind === kind && grant.resource === resource,
    )
    return rows.length ? rows[rows.length - 1] : null
  }

  isApproved(tenantId, botId, kind, resource) {
    return this.findGrant(tenantId, botId, kind, resource)?.status === 'approved'
  }

  requestGrant({ tenantId, botId, kind, resource, requestedBy }) {
    const existing = this.findGrant(tenantId, botId, kind, resource)
    if (existing && (existing.status === 'approved' || existing.status === 'pending')) return existing
    const grant = {
      id: randomUUID(),
      tenant_id: tenantId,
      bot_id: botId,
      kind,
      resource,
      status: 'pending',
      requested_by: requestedBy,
      decided_by: null,
      decided_at: null,
      created_at: new Date().toISOString(),
    }
    this.grants.set(grant.id, grant)
    this.audit({
      tenant_id: tenantId,
      actor: requestedBy,
      kind: 'grant.request',
      data: { grant_id: grant.id, bot_id: botId, grant_kind: kind, resource },
    })
    this.notifications.push({
      id: randomUUID(),
      tenant_id: tenantId,
      kind: 'approval',
      title: 'Approval needed',
      grant_id: grant.id,
      bot_id: botId,
      at: grant.created_at,
      read: false,
    })
    return grant
  }

  decideGrant({ actor, grantId, decision }) {
    const grant = this.grants.get(grantId)
    if (!grant) return null
    if (actor.role !== 'super_admin') {
      const error = new Error('only the owner can decide grants')
      error.code = 'forbidden'
      throw error
    }
    const next = { approve: 'approved', deny: 'denied', revoke: 'revoked' }[decision]
    if (!next) {
      const error = new Error('decision must be approve, deny, or revoke')
      error.code = 'invalid_request'
      throw error
    }
    if (decision === 'revoke' && grant.status !== 'approved') {
      const error = new Error('only an approved grant can be revoked')
      error.code = 'conflict'
      throw error
    }
    grant.status = next
    grant.decided_by = actor.id
    grant.decided_at = new Date().toISOString()
    this.audit({
      tenant_id: grant.tenant_id,
      actor: actor.id,
      kind: `grant.${next}`,
      data: { grant_id: grant.id, bot_id: grant.bot_id, grant_kind: grant.kind, resource: grant.resource },
    })
    return grant
  }
}

function botFromSeed(tenantId, seed) {
  const now = new Date().toISOString()
  return {
    id: seed.id,
    tenant_id: tenantId,
    tier: 'owner',
    kind: seed.kind,
    site_slug: null,
    status: 'draft',
    status_before_pause: null,
    paused_by: null,
    paused_reason: null,
    paused_at: null,
    model_tier: 'T0',
    routines: seed.routines,
    api_key_id: null,
    last_heartbeat_at: null,
    last_run: null,
    version: 1,
    name: seed.name,
    avatar: initials(seed.name),
    title: seed.title,
    description: seed.description,
    instructions: seed.instructions,
      knowledge_scope: '',
    tools: seed.tools,
    model: 'ollama/qwen3:4b',
    policy: {
      console: { hidden: false, archived: false },
      site_grants: {},
      agent_os: {
        role: seed.title,
        objective: seed.instructions,
        project_scope: '',
        provider: 'auto',
        tool_scopes: seed.tools,
        budget_cents: 0,
        approval_mode: 'approval_required',
        metadata: { source: 'swadebots-role-seed' },
        parent_worker_id: null,
      },
    },
    created_at: now,
    updated_at: now,
  }
}

function slugify(name) {
  const slug = String(name || 'bot')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return slug || 'bot'
}

function uniqueId(store, tenantId, base) {
  let id = base
  let n = 2
  while (store.getBot(tenantId, id)) {
    id = `${base}-${n}`
    n += 1
  }
  return id
}

function initials(name) {
  return String(name || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}
