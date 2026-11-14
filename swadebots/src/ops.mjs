import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { publicBot } from './registry.mjs'
import { findModel, modelsForPlan } from './models.mjs'
import { OWNER_SITES, ownerSite } from './catalog.mjs'
import { generatePassword, hashToken, tokensEqual } from './vault.mjs'
import { issueAppKey, hashKey } from './auth.mjs'

export function createOps(ctx) {
  const { store, tasks, broker, spend, config } = ctx

  function view(actor, bot) {
    return publicBot(bot, store.grantsFor(actor.tenant_id))
  }

  function requireBot(actor, id) {
    const bot = store.getBot(actor.tenant_id, id)
    if (!bot) {
      const error = new Error('Bot not found')
      error.status = 404
      error.code = 'not_found'
      throw error
    }
    return bot
  }

  function requireOwner(actor) {
    if (actor.role !== 'super_admin') {
      const error = new Error('Only the owner can do that')
      error.status = 403
      error.code = 'forbidden'
      throw error
    }
  }

  return {
    listBots(actor, query) {
      return store.listBots(actor.tenant_id, {
        includeHidden: query.get('include')?.includes('hidden') || false,
        includeArchived: query.get('include')?.includes('archived') || false,
      })
    },
    getBot(actor, id) {
      return view(actor, requireBot(actor, id))
    },
    createBot(actor, input) {
      if (input.tenant_id || input.tenantId) {
        const error = new Error('Tenant is taken from the signed-in account')
        error.status = 400
        error.code = 'invalid_request'
        throw error
      }
      const model = input.model || 'ollama/qwen3:4b'
      assertModel(actor, model)
      const bot = store.createBot(actor.tenant_id, actor.tier, { ...input, tools: [], model })
      const requested = [...(input.tools || []), ...(input.tool_scopes || [])]
      for (const tool of requested) {
        store.requestGrant({
          tenantId: actor.tenant_id,
          botId: bot.id,
          kind: 'tool',
          resource: tool,
          requestedBy: actor.id,
        })
      }
      if (input.knowledge_scope || input.project_scope) {
        bot.knowledge_scope = input.knowledge_scope || input.project_scope
        store.requestGrant({
          tenantId: actor.tenant_id,
          botId: bot.id,
          kind: 'knowledge',
          resource: bot.knowledge_scope,
          requestedBy: actor.id,
        })
      }
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'bot.create',
        data: { bot_id: bot.id },
      })
      return view(actor, bot)
    },
    updateBot(actor, id, patch) {
      if (patch.tenant_id || patch.tenantId) {
        const error = new Error('Tenant is taken from the signed-in account')
        error.status = 400
        error.code = 'invalid_request'
        throw error
      }
      const bot = requireBot(actor, id)
      if (patch.model) assertModel(actor, patch.model)
      if (patch.tools || patch.tool_scopes) {
        for (const tool of patch.tool_scopes || patch.tools) {
          store.requestGrant({
            tenantId: actor.tenant_id,
            botId: bot.id,
            kind: 'tool',
            resource: tool,
            requestedBy: actor.id,
          })
        }
        delete patch.tools
        delete patch.tool_scopes
      }
      store.updateBot(bot, patch)
      return view(actor, bot)
    },
    archiveBot(actor, id) {
      const bot = requireBot(actor, id)
      store.archiveBot(bot)
      store.audit({ tenant_id: actor.tenant_id, actor: actor.id, kind: 'bot.archive', data: { bot_id: id } })
      return view(actor, bot)
    },
    requestGrant(actor, botId, input) {
      const bot = requireBot(actor, botId)
      const grant = store.requestGrant({
        tenantId: actor.tenant_id,
        botId: bot.id,
        kind: input.kind,
        resource: input.resource,
        requestedBy: actor.id,
      })
      return grant
    },
    listApprovals(actor) {
      const rows = actor.role === 'super_admin' ? [...store.grants.values()] : store.grantsFor(actor.tenant_id)
      if (actor.role !== 'super_admin') {
        return rows.filter((grant) => grant.tenant_id === actor.tenant_id)
      }
      return rows
    },
    decide(actor, grantId, decision) {
      requireOwner(actor)
      const grant = store.decideGrant({ actor, grantId, decision })
      if (!grant) {
        const error = new Error('Approval not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      return grant
    },
    async enqueue(actor, botId, prompt) {
      const bot = requireBot(actor, botId)
      store.addMessage(actor.tenant_id, bot.id, { role: 'user', text: prompt, kind: 'user' })
      const task = await tasks.enqueue({ actor, bot, prompt })
      return task
    },
    messages(actor, botId) {
      requireBot(actor, botId)
      return store.listMessages(actor.tenant_id, botId).map(publicMessage)
    },
    getTask(actor, id) {
      const task = store.getTask(actor.tenant_id, id)
      if (!task) {
        const error = new Error('Task not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      return withUse(store, actor, task)
    },
    listTasks(actor, botId) {
      if (botId) requireBot(actor, botId)
      return store.listTasks(actor.tenant_id, botId).map((task) => withUse(store, actor, task))
    },
    cancelTask(actor, id) {
      const task = store.getTask(actor.tenant_id, id)
      if (!task) {
        const error = new Error('Task not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      tasks.cancel(task)
      return withUse(store, actor, task)
    },
    async useVaultGrant(actor, botId, input = {}) {
      const bot = requireBot(actor, botId)
      const grant = store.findGrant(actor.tenant_id, bot.id, 'vault', 'default')
      const outcome = await broker.withGrant({
        grant,
        actor,
        purpose: input.purpose || 'explicit-use',
        taskId: input.task_id || null,
        botId: bot.id,
        fn: async (secret) => ({ used: true, length: String(secret).length }),
      })
      return { used: outcome.used, secret_injected: true }
    },
    informationUse(actor, filter) {
      return store.infoUse.list({ tenantId: actor.tenant_id, ...filter })
    },
    sites(actor) {
      if (actor.tier !== 'owner') return []
      return OWNER_SITES
    },
    async settings(actor) {
      const settings = store.ensureSettings(actor.tenant_id, actor.tier, actor.plan)
      const usage = await spendSafe(ctx.ledger, actor.tenant_id)
      return {
        ...settings,
        models: modelsForPlan(actor.plan),
        usage,
        google: { provider: 'google', configured: Boolean(config.authUrl) },
      }
    },
    updateSettings(actor, patch) {
      const settings = store.ensureSettings(actor.tenant_id, actor.tier, actor.plan)
      if (patch.model) assertModel(actor, patch.model)
      if (patch.theme) settings.theme = patch.theme
      if (patch.accent) settings.accent = patch.accent
      if (patch.notifications) settings.notifications = { ...settings.notifications, ...patch.notifications }
      if (patch.model) settings.model = patch.model
      if (patch.signup_policy) settings.signup_policy = { ...settings.signup_policy, ...patch.signup_policy }
      if (patch.owner_default_email !== undefined) settings.owner_default_email = String(patch.owner_default_email)
      if (patch.approval_rules) settings.approval_rules = { ...settings.approval_rules, ...patch.approval_rules }
      return settings
    },
    async vaultSystems(actor, query) {
      let systems
      try {
        systems = await broker.listSystems(actor.tenant_id)
      } catch (error) {
        if (error.code === 'vault_unavailable') {
          error.status = 503
          throw error
        }
        throw error
      }
      const q = (query.get('q') || '').toLowerCase()
      const method = query.get('method') || ''
      return systems
        .map((system) => decorateSystem(store, actor.tenant_id, system))
        .filter((system) => !q || system.slug.includes(q) || system.name.toLowerCase().includes(q))
        .filter((system) => !method || system.sign_in_method === method)
    },
    async storeCredential(actor, input) {
      requireOwner(actor)
      const saved = await broker.storeSecret({
        tenantId: actor.tenant_id,
        systemSlug: input.system_slug,
        leaf: input.leaf || 'password',
        secret: input.secret,
        description: input.description || '',
        actor,
      })
      return { id: saved.id, name: saved.name, write_only: true }
    },
    async reveal(actor, secretId, reauthToken) {
      requireOwner(actor)
      const record = store.reauth.get(hashToken(reauthToken || ''))
      if (!record || record.actor !== actor.id || record.expires < Date.now()) {
        const error = new Error('Reveal needs a fresh owner sign-in')
        error.status = 401
        error.code = 'reauth_required'
        throw error
      }
      store.reauth.delete(hashToken(reauthToken))
      const secret = await broker.reveal({ actor, secretId })
      return { secret }
    },
    reauth(actor, confirmation) {
      requireOwner(actor)
      if (confirmation !== 'reveal') {
        const error = new Error('Confirmation does not match')
        error.status = 401
        error.code = 'reauth_required'
        throw error
      }
      const token = randomBytes(24).toString('base64url')
      store.reauth.set(hashToken(token), { actor: actor.id, expires: Date.now() + 60_000 })
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'auth.reauth',
        data: { purpose: 'vault.reveal' },
      })
      return { reauth_token: token, expires_in: 60 }
    },
    async signup(actor, input) {
      const settings = store.ensureSettings(actor.tenant_id, actor.tier, actor.plan)
      const preferGoogle = settings.signup_policy?.prefer_google !== false
      const signup = {
        id: randomUUID(),
        tenant_id: actor.tenant_id,
        system_slug: input.system_slug,
        method: preferGoogle ? 'google' : 'email',
        status: 'pending',
        requested_by: actor.id,
        created_at: new Date().toISOString(),
      }
      store.signups.set(signup.id, signup)
      store.notifications.push({
        id: randomUUID(),
        tenant_id: actor.tenant_id,
        kind: 'approval',
        title: 'Account sign-up needs approval',
        signup_id: signup.id,
        at: signup.created_at,
        read: false,
      })
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'signup.request',
        data: { signup_id: signup.id, system_slug: signup.system_slug, method: signup.method },
      })
      return publicSignup(signup)
    },
    async decideSignup(actor, id, decision) {
      requireOwner(actor)
      const signup = store.signups.get(id)
      if (!signup || (actor.role !== 'super_admin' && signup.tenant_id !== actor.tenant_id)) {
        const error = new Error('Sign-up not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      if (signup.tenant_id !== actor.tenant_id && actor.tier === 'owner') {
        // Owner decides only inside the tenant the signup belongs to when that tenant is the session tenant.
      }
      if (signup.tenant_id !== actor.tenant_id) {
        const error = new Error('Sign-up not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      if (decision === 'deny') {
        signup.status = 'denied'
        store.audit({
          tenant_id: actor.tenant_id,
          actor: actor.id,
          kind: 'signup.denied',
          data: { signup_id: id },
        })
        return publicSignup(signup)
      }
      const settings = store.ensureSettings(actor.tenant_id, actor.tier, actor.plan)
      if (signup.method === 'google') {
        signup.status = 'approved'
        signup.submitted = false
        store.audit({
          tenant_id: actor.tenant_id,
          actor: actor.id,
          kind: 'signup.approved',
          data: { signup_id: id, method: 'google', stored_secret: false },
        })
        return publicSignup(signup)
      }
      if (!settings.owner_default_email) {
        const error = new Error('Set the default email before an email sign-up')
        error.status = 400
        error.code = 'invalid_request'
        throw error
      }
      const password = generatePassword()
      const saved = await broker.storeSecret({
        tenantId: actor.tenant_id,
        systemSlug: signup.system_slug,
        leaf: 'password',
        secret: password,
        description: 'Generated sign-up password',
        actor,
      })
      signup.status = 'approved'
      signup.secret_id = saved.id
      signup.submitted = false
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'signup.approved',
        data: { signup_id: id, method: 'email', secret_id: saved.id, stored_secret: true },
      })
      return publicSignup(signup)
    },
    notifications(actor) {
      return store.notifications.filter((item) => item.tenant_id === actor.tenant_id)
    },
    models(actor) {
      return modelsForPlan(actor.plan)
    },
    issueKey(actor, input) {
      requireOwner(actor)
      const tenantId = input.tenant_id || actor.tenant_id
      if (tenantId === config.ownerTenantId && input.tier === 'public') {
        const error = new Error('A public app cannot be bound to the owner tenant')
        error.status = 400
        error.code = 'invalid_request'
        throw error
      }
      const secret = issueAppKey()
      const tier = tenantId === config.ownerTenantId ? 'owner' : 'public'
      const record = {
        id: randomUUID(),
        name: input.name || 'app',
        tenant_id: tenantId,
        tier,
        plan: tier === 'public' ? 'free' : 'paid',
        scopes: input.scopes || ['bots:read', 'bots:write', 'chat', 'tasks', 'uploads'],
        revoked_at: null,
      }
      store.keys.set(hashKey(secret), record)
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'app_key.issue',
        data: { app_id: record.id, tenant_id: tenantId },
      })
      return { id: record.id, token: secret, tenant_id: tenantId, scopes: record.scopes }
    },
    adminOverview(actor) {
      requireOwner(actor)
      return {
        bots: store.listBots(actor.tenant_id, { includeHidden: true, includeArchived: true }),
        approvals: [...store.grants.values()],
        audit: store.auditLog.map((row) => ({ ...row, data: row.data })),
        ledger_connected: Boolean(ctx.ledger.connected),
        paid_calls: ctx.ledger.connected ? 'gated' : 'blocked',
        sites: OWNER_SITES.map((site) => ({ ...site, permission_verified: false })),
        tenants: [
          { id: config.ownerTenantId, tier: 'owner', personal: true },
          ...[...store.settings.keys()]
            .filter((id) => id !== config.ownerTenantId)
            .map((id) => ({ id, tier: 'public', personal: false })),
        ],
      }
    },
    googleUrl(redirectTo) {
      if (!config.authUrl) return { configured: false, provider: 'google', url: null }
      const url = new URL(`${config.authUrl}/authorize`)
      url.searchParams.set('provider', 'google')
      if (redirectTo) url.searchParams.set('redirect_to', redirectTo)
      return { configured: true, provider: 'google', url: url.toString() }
    },
    bindVault(actor, grantId, secretId) {
      requireOwner(actor)
      const grant = store.grants.get(grantId)
      if (!grant || grant.tenant_id !== actor.tenant_id || grant.status !== 'approved') {
        const error = new Error('Approved grant not found')
        error.status = 404
        error.code = 'not_found'
        throw error
      }
      grant.secret_id = secretId
      store.audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'vault.bind',
        data: { grant_id: grantId, secret_id: secretId },
      })
      return { id: grant.id, status: grant.status, secret_id: secretId }
    },
  }
}

function assertModel(actor, modelId) {
  const model = findModel(modelId)
  if (!model || (actor.plan === 'free' && model.tier !== 'local')) {
    const error = new Error('That model is not available on this plan')
    error.status = 403
    error.code = 'model_not_allowed'
    throw error
  }
}

function publicMessage(message) {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    kind: message.kind || 'message',
    task_id: message.task_id || null,
    at: message.at,
    result: message.result ? { ...message.result, artifacts: message.result.artifacts || [] } : null,
  }
}

function publicTask(task) {
  return {
    id: task.id,
    bot_id: task.bot_id,
    tenant_id: task.tenant_id,
    title: task.title,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error: task.error,
    approval: task.approval,
    created_at: task.created_at,
    started_at: task.started_at,
    finished_at: task.finished_at,
  }
}

function withUse(store, actor, task) {
  return {
    ...publicTask(task),
    information_use: store.infoUse.list({ tenantId: actor.tenant_id, taskId: task.id }),
  }
}

function publicSignup(signup) {
  return {
    id: signup.id,
    system_slug: signup.system_slug,
    method: signup.method,
    status: signup.status,
    submitted: Boolean(signup.submitted),
    secret_id: signup.secret_id || null,
  }
}

function decorateSystem(store, tenantId, system) {
  const known = ownerSite(system.slug)
  const grants = [...store.grants.values()].filter(
    (grant) => grant.tenant_id === tenantId && grant.kind === 'vault' && grant.resource === system.slug && grant.status === 'approved',
  )
  return {
    ...system,
    name: known?.name || system.slug,
    sign_in_method: 'google',
    permission_verified: false,
    bots: grants.map((grant) => grant.bot_id),
    status: grants.length ? 'granted' : 'no-grants',
  }
}

async function spendSafe(ledger, tenantId) {
  try {
    return await ledger.report(tenantId)
  } catch {
    return { connected: false, rows: [] }
  }
}

export function hashReauth(value) {
  return createHash('sha256').update(value).digest('hex')
}

void tokensEqual
void hashToken
