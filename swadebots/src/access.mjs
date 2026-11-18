export const WILDCARDS = new Set(['*', 'all', 'any', 'everything'])

export const ROLE_TEMPLATES = [
  {
    id: 'radio',
    name: 'Radio bot',
    role: 'Radio',
    controlled_systems: ['maestro-radio', 'swade-radio'],
    suggested: [
      { kind: 'site', system: 'maestro-radio', action: 'read' },
      { kind: 'knowledge', system: 'maestro-radio', action: 'read' },
      { kind: 'site', system: 'swade-radio', action: 'read' },
    ],
  },
  {
    id: 'course',
    name: 'Course bot',
    role: 'Course',
    controlled_systems: ['teachvirt', 'virtteach'],
    suggested: [
      { kind: 'site', system: 'teachvirt', action: 'read' },
      { kind: 'knowledge', system: 'teachvirt', action: 'read' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance bot',
    role: 'Finance',
    controlled_systems: ['finance'],
    suggested: [{ kind: 'knowledge', system: 'finance', action: 'read' }],
  },
]

export function normalizeSystems(values) {
  const systems = [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))]
  for (const system of systems) {
    if (WILDCARDS.has(system.toLowerCase())) {
      const error = new Error('A controlled system cannot be a wildcard')
      error.status = 400
      error.code = 'wildcard_rejected'
      throw error
    }
  }
  return systems
}

export function normalizeGrant(bot, input, now = Date.now()) {
  const system = String(input.system || '').trim()
  const action = input.action || 'read'
  const kind = String(input.kind || '').trim()
  const tool = input.tool ? String(input.tool).trim() : null
  if (!['tool', 'vault', 'site', 'knowledge'].includes(kind)) {
    const error = new Error('Grant kind is not valid')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  if (!['read', 'write'].includes(action)) {
    const error = new Error('Grant action must be read or write')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  for (const value of [system, kind, tool || '']) {
    if (value && WILDCARDS.has(value.toLowerCase())) {
      const error = new Error('Wildcard grants are not allowed')
      error.status = 400
      error.code = 'wildcard_rejected'
      throw error
    }
  }
  if (!system) {
    const error = new Error('A grant needs one controlled system')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  const controlled = normalizeSystems(bot.controlled_systems)
  if (!controlled.includes(system)) {
    const error = new Error('That system is outside this bot')
    error.status = 403
    error.code = 'outside_charter'
    throw error
  }
  let expiresAt = null
  if (input.expires_at) {
    const time = Date.parse(input.expires_at)
    if (!Number.isFinite(time) || time <= now) {
      const error = new Error('Grant expiry must be in the future')
      error.status = 400
      error.code = 'invalid_request'
      throw error
    }
    expiresAt = new Date(time).toISOString()
  }
  return { kind, system, action, tool, expires_at: expiresAt }
}

export function grantAllows(grant, need, now = Date.now()) {
  if (!grant || grant.status !== 'approved') return false
  if (grant.kind !== need.kind || grant.system !== need.system) return false
  if (need.tool && grant.tool !== need.tool) return false
  if (grant.expires_at && Date.parse(grant.expires_at) <= now) return false
  if (need.action === 'write') return grant.action === 'write'
  return grant.action === 'read' || grant.action === 'write'
}
