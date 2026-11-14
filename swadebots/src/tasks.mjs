import { randomUUID } from 'node:crypto'
import { classifyRisk, extractUrls } from './risky.mjs'
import { safeFetch, SsrfError } from './ssrf.mjs'
import { isLocalModel } from './models.mjs'
import { ownerSite } from './catalog.mjs'
import { summarizeUse } from './info-use.mjs'

export function createTaskRunner({ store, knowledge, spend, broker, config, fetchImpl, lookup }) {
  let pumping = false

  async function enqueue({ actor, bot, prompt, attachments = [] }) {
    const task = {
      id: randomUUID(),
      tenant_id: actor.tenant_id,
      bot_id: bot.id,
      user_id: actor.id,
      email: actor.email || '',
      title: String(prompt || '').slice(0, 120),
      input: String(prompt || ''),
      attachments,
      status: 'queued',
      progress: [],
      result: null,
      error: null,
      approval: null,
      cancel_requested: false,
      timeout_ms: config.taskTimeoutMs,
      created_at: new Date().toISOString(),
      started_at: null,
      finished_at: null,
      artifacts: [],
    }
    store.saveTask(task)
    store.handoffs.push({
      id: store.handoffs.length + 1,
      kind: 'task',
      source: 'swadebots',
      target_agent: bot.id,
      title: task.title,
      body: task.input.slice(0, 1000),
      meta: { tenant_id: actor.tenant_id, task_id: task.id },
      status: 'open',
      needs_approval: false,
      created_at: task.created_at,
    })
    store.addMessage(actor.tenant_id, bot.id, {
      role: 'assistant',
      text: 'On it. I will run this in the background and report back here.',
      task_id: task.id,
      kind: 'ack',
    })
    return task
  }

  async function drain() {
    if (pumping) return
    pumping = true
    try {
      for (const task of [...store.tasks.values()]) {
        if (task.status === 'queued' || task.status === 'running') await step(task)
      }
    } finally {
      pumping = false
    }
  }

  async function step(task) {
    const bot = store.getBot(task.tenant_id, task.bot_id)
    if (!bot) return fail(task, 'The bot is no longer available')
    if (task.cancel_requested) return finish(task, 'cancelled')
    const actor = {
      id: task.user_id,
      tenant_id: task.tenant_id,
      email: task.email || '',
      plan: store.settings.get(task.tenant_id)?.plan || 'free',
      role: 'member',
    }
    const waiting = ensureGrants(task, bot, actor)
    if (waiting) return task
    const risk = classifyRisk(task.input)
    if (risk && task.approval?.action !== `risk:${risk}`) {
      task.approval = { required: true, action: `risk:${risk}`, status: 'pending' }
      const grant = store.addRiskApproval({
        tenantId: task.tenant_id,
        botId: bot.id,
        action: risk,
        requestedBy: actor.id,
      })
      task.approval.grant_id = grant.id
      if (grant.status !== 'approved') {
        progress(task, 'Waiting for approval', `${risk} needs the owner's approval before anything is submitted.`)
        markHandoff(store, task, 'open', true)
        return task
      }
    }
    if (risk && !store.riskApproved(task.tenant_id, bot.id, risk)) {
      return task
    }
    task.status = 'running'
    task.started_at = task.started_at || new Date().toISOString()
    markHandoff(store, task, 'claimed', Boolean(risk))
    if (Date.now() - Date.parse(task.started_at) >= task.timeout_ms) return fail(task, 'The task timed out', 'timeout')
    progress(task, 'Started', 'Reading the request.')
    try {
      if (task.cancel_requested) return finish(task, 'cancelled')
      await runFetch(task, bot)
      if (task.cancel_requested) return finish(task, 'cancelled')
      await runKnowledge(task, bot)
      await runVault(task, bot, actor)
      await runSites(task, bot)
      const gate = await spend.authorize({
        actor,
        modelId: bot.model,
        estimateUsd: isLocalModel(bot.model) ? 0 : 0.01,
        feature: 'task',
      })
      if (!gate.allowed) return fail(task, gate.reason || gate.code || 'spend_blocked', gate.code || 'spend_blocked')
      const summary = `${summarize(task, risk)} ${summarizeUse(store.infoUse.list({ taskId: task.id }))}`
      task.result = {
        summary,
        links: task.artifacts.filter((item) => item.kind === 'url').map((item) => item.url),
        artifacts: task.artifacts,
        model: gate.model,
        provider: gate.provider,
        dispatched_external: false,
      }
      store.addMessage(task.tenant_id, task.bot_id, {
        role: 'assistant',
        text: summary,
        task_id: task.id,
        kind: 'result',
        result: task.result,
      })
      progress(task, 'Finished', 'Result posted to the thread.')
      markHandoff(store, task, 'done', false)
      store.notifications.push({
        id: randomUUID(),
        tenant_id: task.tenant_id,
        kind: 'task_done',
        title: 'Task finished',
        task_id: task.id,
        at: new Date().toISOString(),
        read: false,
      })
      return finish(task, 'done', task.result)
    } catch (error) {
      if (error instanceof SsrfError || error.code === 'ssrf_blocked') return fail(task, error.message, 'ssrf_blocked')
      if (error.code === 'forbidden') return fail(task, error.message, 'forbidden')
      return fail(task, 'The task failed', 'task_failed')
    }
  }

  function ensureGrants(task, bot, actor) {
    const needed = []
    const systems = mentionedSystems(task.input, bot)
    if (extractUrls(task.input).length) {
      if (!systems.length) return block(task, 'A URL fetch needs one of this bot\'s controlled systems.')
      for (const system of systems) needed.push({ kind: 'tool', system, action: 'read', tool: 'fetch_url' })
    }
    if (/\bknowledge\b|\bremember\b/i.test(task.input)) {
      if (!systems.length) return block(task, 'Knowledge needs one of this bot\'s controlled systems.')
      for (const system of systems) needed.push({ kind: 'knowledge', system, action: 'read' })
    }
    if (/\bvault\b|\bcredential\b/i.test(task.input)) {
      if (!systems.length) return block(task, 'A vault grant needs one of this bot\'s controlled systems.')
      for (const system of systems) needed.push({ kind: 'vault', system, action: 'read' })
    }
    const site = mentionedSite(task.input)
    if (site) {
      if (!(bot.controlled_systems || []).includes(site.slug)) return block(task, 'That site is outside this bot.')
      needed.push({ kind: 'site', system: site.slug, action: 'read' })
    }
    let waiting = false
    for (const need of needed) {
      if (store.isApproved(task.tenant_id, bot.id, need)) continue
      const grant = store.requestGrant({
        tenantId: task.tenant_id,
        botId: bot.id,
        requestedBy: actor.id,
        bot,
        input: need,
      })
      task.approval = { required: true, action: `grant:${need.kind}:${need.system}`, status: 'pending', grant_id: grant.id }
      waiting = true
    }
    if (waiting) {
      task.status = 'queued'
      progress(task, 'Waiting for approval', 'This bot has no grant for that access. The owner has to approve it.')
      markHandoff(store, task, 'open', true)
    }
    return waiting
  }

  async function runFetch(task, bot) {
    const urls = extractUrls(task.input)
    if (!urls.length) return
    const system = mentionedSystems(task.input, bot)[0]
    if (!store.isApproved(task.tenant_id, bot.id, { kind: 'tool', system, action: 'read', tool: 'fetch_url' })) {
      throw Object.assign(new Error('URL fetch is not approved'), { code: 'forbidden' })
    }
    for (const url of urls) {
      progress(task, 'Fetching', url)
      const page = await safeFetch(url, { fetchImpl, lookup })
      store.infoUse.append({
        tenant_id: task.tenant_id,
        bot_id: bot.id,
        task_id: task.id,
        sources: [{ type: 'url', ref: page.url }],
        tools: ['fetch_url'],
        purpose: task.input,
      })
      task.artifacts.push({ kind: 'url', url: page.url, status: page.status, excerpt: page.body.slice(0, 500) })
    }
  }

  async function runKnowledge(task, bot) {
    const asked = /\bknowledge\b|\bremember\b/i.test(task.input)
    if (!asked) return
    const scope = mentionedSystems(task.input, bot)[0]
    if (!store.isApproved(task.tenant_id, bot.id, { kind: 'knowledge', system: scope, action: 'read' })) {
      throw Object.assign(new Error('knowledge scope is not approved'), { code: 'forbidden' })
    }
    progress(task, 'Knowledge', 'Asking SWADE for this tenant.')
    const found = await knowledge.search({
      tenantId: task.tenant_id,
      scope,
      query: task.input,
      taskId: task.id,
      botId: bot.id,
      purpose: task.input,
    })
    task.artifacts.push({ kind: 'knowledge', source: found.source, ready: found.ready, items: found.items || [] })
  }

  async function runVault(task, bot, actor) {
    if (!/\bvault\b|\bcredential\b/i.test(task.input)) return
    const system = mentionedSystems(task.input, bot)[0]
    if (!store.isApproved(task.tenant_id, bot.id, { kind: 'vault', system, action: 'read' })) {
      throw Object.assign(new Error('vault access is not approved'), { code: 'forbidden' })
    }
    const grant = store.findGrant(task.tenant_id, bot.id, { kind: 'vault', system, action: 'read' })
    if (!grant.secret_id) {
      progress(task, 'Vault', 'The grant is approved and no credential is bound yet.')
      task.artifacts.push({ kind: 'vault', grant_id: grant.id, used: false })
      return
    }
    const outcome = await broker.withGrant({
      grant,
      actor,
      purpose: task.input,
      taskId: task.id,
      botId: bot.id,
      fn: async (secret) => ({ used: true, length: String(secret).length }),
    })
    task.artifacts.push({ kind: 'vault', grant_id: grant.id, used: outcome.used, secret_injected: true })
    progress(task, 'Vault', 'Used a credential grant. The value stayed on the server.')
  }

  async function runSites(task, bot) {
    const site = mentionedSite(task.input)
    if (!site) return
    if (!store.isApproved(task.tenant_id, bot.id, { kind: 'site', system: site.slug, action: 'read' })) {
      throw Object.assign(new Error('site access is not approved'), { code: 'forbidden' })
    }
    task.artifacts.push({
      kind: 'site',
      slug: site.slug,
      permission_verified: false,
      dispatched: false,
      note: site.verification_note,
    })
    progress(task, 'Site', `${site.name} is not verified, so nothing was sent to it.`)
  }

  function cancel(task) {
    task.cancel_requested = true
    if (task.status === 'queued') {
      markHandoff(store, task, 'dropped', false)
      return finish(task, 'cancelled')
    }
    return task
  }

  return { enqueue, drain, cancel, step }
}

function block(task, message) {
  task.status = 'failed'
  task.error = { code: 'outside_charter', message }
  task.finished_at = new Date().toISOString()
  progress(task, 'Blocked', message)
  return true
}

function mentionedSystems(text, bot) {
  const source = String(text || '').toLowerCase()
  return (bot.controlled_systems || []).filter((system) => source.includes(String(system).toLowerCase()))
}

function mentionedSite(text) {
  const source = String(text || '').toLowerCase()
  return ownerSite(
    (
      [
        ['sssbrain', 'sss brain'],
        ['videosaywhat', 'videosaywhat'],
        ['resinglab', 'resing'],
        ['teachvirt', 'teachvirt'],
        ['abagale', 'abagale'],
      ].find(([, needle]) => source.includes(needle)) || []
    )[0],
  )
}

function summarize(task, risk) {
  const pages = task.artifacts.filter((item) => item.kind === 'url')
  const knowledge = task.artifacts.find((item) => item.kind === 'knowledge')
  const lines = ['Finished.']
  if (pages.length) lines.push(`Fetched ${pages.length} URL${pages.length === 1 ? '' : 's'}.`)
  if (knowledge) {
    lines.push(
      knowledge.ready
        ? `SWADE returned ${knowledge.items.length} item${knowledge.items.length === 1 ? '' : 's'}.`
        : 'SWADE knowledge is not connected, so this result has no knowledge items.',
    )
  }
  if (task.artifacts.some((item) => item.kind === 'vault' && item.secret_injected)) {
    lines.push('A vault grant was used on the server. The secret is not in this result.')
  }
  if (task.artifacts.some((item) => item.kind === 'site')) {
    lines.push('The site is unverified, so no request was sent.')
  }
  if (risk) lines.push(`You approved “${risk}”. Nothing was submitted to an outside service.`)
  if (lines.length === 1) lines.push('No outside system was contacted.')
  return lines.join(' ')
}

function progress(task, milestone, detail) {
  const last = task.progress[task.progress.length - 1]
  if (last && last.milestone === milestone && last.detail === detail) return
  task.progress.push({ at: new Date().toISOString(), milestone, detail })
}

function markHandoff(store, task, status, needsApproval) {
  const handoff = store.handoffs.find((row) => row.meta?.task_id === task.id)
  if (!handoff) return
  handoff.status = status
  handoff.needs_approval = needsApproval
}

function finish(task, status, result) {
  task.status = status
  task.finished_at = new Date().toISOString()
  if (result) task.result = result
  return task
}

function fail(task, message, code = 'task_failed') {
  task.error = { code, message }
  progress(task, 'Failed', message)
  task.status = 'failed'
  task.finished_at = new Date().toISOString()
  return task
}
