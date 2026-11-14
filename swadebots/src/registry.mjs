// Maps a console bot onto the unapplied swadesoul.agents row and onto the
// SSS Brain agent_os_workers columns. This process does not write either
// database. See docs/SWADEBOTS_CONSOLE.md for deviations.

import { baseInstructions } from './ontology-primer.mjs'

export const REGISTRY_STATUSES = ['draft', 'testing', 'ready', 'paused', 'retired']
export const AGENT_KINDS = ['role', 'site', 'platform', 'prober']
export const APPROVAL_MODES = ['observe', 'prepare', 'approval_required']

export function toRegistryAgent(bot) {
  return {
    id: bot.id,
    kind: bot.kind,
    site_slug: bot.site_slug,
    status: bot.status,
    status_before_pause: bot.status_before_pause,
    paused_by: bot.paused_by,
    paused_reason: bot.paused_reason,
    paused_at: bot.paused_at,
    model_tier: bot.model_tier,
    routines: bot.routines,
    policy: bot.policy,
    api_key_id: bot.api_key_id,
    last_heartbeat_at: bot.last_heartbeat_at,
    last_run: bot.last_run,
    version: bot.version,
    updated_at: bot.updated_at,
  }
}

export function toAgentOsWorker(bot) {
  const agentOs = bot.policy.agent_os || {}
  return {
    id: bot.id,
    name: bot.name,
    role: bot.title || agentOs.role || '',
    objective: agentOs.objective ?? bot.instructions ?? '',
    project_scope: agentOs.project_scope ?? bot.knowledge_scope ?? null,
    provider: agentOs.provider || 'auto',
    tool_scopes: agentOs.tool_scopes || bot.tools || [],
    budget_cents: agentOs.budget_cents ?? 0,
    approval_mode: agentOs.approval_mode || 'approval_required',
    active: bot.status !== 'retired' && bot.status !== 'paused',
    metadata: agentOs.metadata || {},
    parent_worker_id: agentOs.parent_worker_id || null,
  }
}

export function publicBot(bot, grants = []) {
  const approvedTools = grants
    .filter((grant) => grant.bot_id === bot.id && grant.kind === 'tool' && grant.status === 'approved')
    .map((grant) => grant.resource)
  const knowledge = grants.find(
    (grant) => grant.bot_id === bot.id && grant.kind === 'knowledge' && grant.status === 'approved',
  )
  return {
    id: bot.id,
    tenant_id: bot.tenant_id,
    name: bot.name,
    avatar: bot.avatar,
    title: bot.title,
    description: bot.description,
    instructions: bot.instructions,
    base_instructions: baseInstructions(bot.instructions),
    knowledge_scope: knowledge ? knowledge.resource : '',
    requested_knowledge_scope: bot.knowledge_scope || '',
    tools: approvedTools,
    requested_tools: bot.tools || [],
    role: bot.role || bot.title,
    controlled_systems: bot.controlled_systems || [],
    access_map: (grants || [])
      .filter((grant) => grant.bot_id === bot.id)
      .map((grant) => ({
        id: grant.id,
        kind: grant.kind,
        system: grant.system,
        action: grant.action,
        tool: grant.tool,
        status: grant.status,
        expires_at: grant.expires_at,
      })),
    model: bot.model,
    hidden: Boolean(bot.policy.console?.hidden),
    archived: bot.status === 'retired' || Boolean(bot.policy.console?.archived),
    routines: bot.routines,
    site_grants: bot.policy.site_grants || {},
    registry: toRegistryAgent(bot),
    agent_os_worker: {
      ...toAgentOsWorker(bot),
      tool_scopes: approvedTools,
      project_scope: knowledge ? knowledge.resource : null,
      metadata: { ...(bot.policy.agent_os?.metadata || {}), requested_tool_scopes: bot.tools || [] },
    },
    updated_at: bot.updated_at,
  }
}

export const ROLE_SEEDS = [
  {
    id: 'cos',
    kind: 'role',
    name: 'Chief of Staff',
    title: 'Operating partner',
    description: 'Coordinates the SWADEBOTS team, reads the daily summary, and drafts what needs a decision.',
    instructions: 'Coordinate work across SWADEBOTS. Draft replies. Never send, spend, delete, or deploy without approval.',
    tools: [],
    role: 'Chief of Staff',
    controlled_systems: [],
    routines: [
      { name: 'Morning brief', cron: '30 7 * * *', tz: 'America/Chicago' },
      { name: 'Approvals check', cron: '30 12 * * *', tz: 'America/Chicago' },
    ],
  },
  {
    id: 'finance',
    kind: 'role',
    name: 'Finance',
    title: 'Money picture',
    description: 'Reads balances and drafts the cost picture. Does not move money.',
    instructions: 'Report spend and balances. Every refund, payout, and price change waits for approval.',
    tools: [],
    role: 'Finance',
    controlled_systems: ['finance'],
    routines: [{ name: 'Daily money loop', cron: '0 8 * * *', tz: 'America/Chicago' }],
  },
  {
    id: 'marketing',
    kind: 'role',
    name: 'Marketing',
    title: 'Promotion drafts',
    description: 'Drafts posts and scouts venues. Publishing waits for approval.',
    instructions: 'Draft promotion. Do not post, buy ads, or message anyone without approval.',
    tools: [],
    role: 'Marketing',
    controlled_systems: [],
    routines: [{ name: 'Daily social plan', cron: '0 9 * * *', tz: 'America/Chicago' }],
  },
  {
    id: 'video',
    kind: 'role',
    name: 'Video Production',
    title: 'Video room',
    description: 'Tracks render jobs and drafts storyboards. Publishing waits for approval.',
    instructions: 'Track video jobs and costs. Do not publish or exceed a spend gate.',
    tools: [],
    role: 'Video',
    controlled_systems: [],
    routines: [{ name: 'Queue sweep', cron: '0 8-20/2 * * *', tz: 'America/Chicago' }],
  },
]
