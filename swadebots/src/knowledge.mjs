// SWADE knowledge facade adapter.
// The Auto Ontology facade was not on master when this was written.
// Calls use the documented shape below and drop any row whose tenant does not match.
//
// GET {SWADE_FACADE_URL}/v1/status
// POST {SWADE_FACADE_URL}/v1/apps/swadebots/knowledge/search
//   body: { tenant_id, scope, query }  -- tenant_id is set by this server, never by the caller
//   response: { ok, data: { items: [{ id, title, excerpt, tenant_id }] } }

export function createKnowledge({ facadeUrl = '', facadeToken = '', fetchImpl = fetch, infoLog } = {}) {
  return {
    async status() {
      if (!facadeUrl) {
        return {
          adapter: 'swade.knowledge',
          ready: false,
          blockers: ['SWADE facade URL is not configured'],
          source: 'stub',
        }
      }
      return probe(facadeUrl, facadeToken, fetchImpl)
    },
    async search({ tenantId, scope = '', query = '', taskId = null, botId = '', purpose = '' }) {
      const found = await searchFacade({ facadeUrl, facadeToken, fetchImpl, tenantId, scope, query })
      const terms = [scope, ...found.items.map((item) => item.term || item.title)].filter(Boolean)
      infoLog?.append({
        tenant_id: tenantId,
        bot_id: botId,
        task_id: taskId,
        ontology_terms: terms,
        sources: [{ type: 'swade', ref: scope || 'swade' }],
        tools: ['swade_knowledge'],
        purpose: purpose || query,
      })
      return found
    },
  }
}

async function searchFacade({ facadeUrl, facadeToken, fetchImpl, tenantId, scope, query }) {
  if (!facadeUrl) return { source: 'stub', ready: false, items: [] }
  const response = await fetchImpl(`${facadeUrl}/v1/apps/swadebots/knowledge/search`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(facadeToken ? { authorization: `Bearer ${facadeToken}` } : {}),
    },
    body: JSON.stringify({ tenant_id: tenantId, scope, query }),
  })
  if (!response.ok) return { source: 'facade', ready: false, items: [] }
  const body = await response.json()
  const items = body?.data?.items || body?.items || []
  return {
    source: 'facade',
    ready: true,
    items: items.filter((item) => item.tenant_id === tenantId),
  }
}

async function probe(facadeUrl, facadeToken, fetchImpl) {
  try {
    const response = await fetchImpl(`${facadeUrl}/v1/status`, {
      headers: facadeToken ? { authorization: `Bearer ${facadeToken}` } : {},
    })
    if (!response.ok) {
      return { adapter: 'swade.knowledge', ready: false, blockers: [`Facade status ${response.status}`], source: 'facade' }
    }
    const body = await response.json()
    return { ...body, source: 'facade' }
  } catch {
    return { adapter: 'swade.knowledge', ready: false, blockers: ['SWADE facade could not be reached'], source: 'facade' }
  }
}
