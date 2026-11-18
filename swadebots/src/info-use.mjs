import { randomUUID } from 'node:crypto'

const BANNED = /secret|password|token|authorization|credential|decrypted/i

export function createInfoLog() {
  const entries = []
  return {
    append(input) {
      const row = Object.freeze({
        id: randomUUID(),
        seq: entries.length + 1,
        at: new Date().toISOString(),
        tenant_id: String(input.tenant_id || ''),
        bot_id: String(input.bot_id || ''),
        task_id: input.task_id ? String(input.task_id) : null,
        ontology_terms: cleanList(input.ontology_terms),
        sources: cleanSources(input.sources),
        vault_entry_ids: cleanList(input.vault_entry_ids),
        tools: cleanList(input.tools),
        purpose: cleanText(input.purpose).slice(0, 500),
      })
      entries.push(row)
      return row
    },
    list(filter = {}) {
      return entries.filter((entry) => matches(entry, filter)).map((entry) => entry)
    },
  }
}

function cleanList(values) {
  return [...new Set((values || []).map((value) => cleanText(value)).filter(Boolean))]
}

function cleanSources(values) {
  return (values || [])
    .map((source) => ({
      type: cleanText(source?.type || 'source'),
      ref: cleanText(source?.ref || ''),
    }))
    .filter((source) => source.ref)
}

function cleanText(value) {
  return String(value ?? '')
    .replace(BANNED, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
}

function matches(entry, filter) {
  if (filter.tenantId && entry.tenant_id !== filter.tenantId) return false
  if (filter.botId && entry.bot_id !== filter.botId) return false
  if (filter.taskId && entry.task_id !== filter.taskId) return false
  if (filter.tool && !entry.tools.includes(filter.tool)) return false
  if (filter.source && !entry.sources.some((source) => source.type === filter.source || source.ref === filter.source)) {
    return false
  }
  return true
}

export function summarizeUse(entries) {
  if (!entries.length) return 'Information used: none.'
  const tools = [...new Set(entries.flatMap((entry) => entry.tools))]
  const sources = entries.flatMap((entry) => entry.sources).map((source) => `${source.type} ${source.ref}`)
  const terms = [...new Set(entries.flatMap((entry) => entry.ontology_terms))]
  const vaults = [...new Set(entries.flatMap((entry) => entry.vault_entry_ids))]
  return [
    'Information used:',
    `tools ${tools.join(', ') || 'none'}.`,
    `sources ${sources.join(', ') || 'none'}.`,
    `vault entries ${vaults.join(', ') || 'none'}.`,
    `ontology terms ${terms.join(', ') || 'none'}.`,
  ].join(' ')
}
