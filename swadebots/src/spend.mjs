import { findModel, isLocalModel } from './models.mjs'

export class LedgerUnavailable extends Error {
  constructor() {
    super('AI ledger is unavailable')
    this.name = 'LedgerUnavailable'
    this.code = 'ledger_unavailable'
  }
}

export function createFailClosedLedger() {
  return {
    connected: false,
    async canSpend() {
      throw new LedgerUnavailable()
    },
    async record() {
      throw new LedgerUnavailable()
    },
    async report() {
      return { connected: false, rows: [] }
    },
  }
}

// Mirrors swadebase_ops.ai_can_spend. A test double or a SQL client may implement it.
// Missing function, missing opening balance, or a thrown error all fail closed.
export function createMemoryLedger() {
  const accounts = new Map()
  const rows = []
  return {
    connected: true,
    setAccount(provider, account) {
      accounts.set(provider, {
        billing: 'prepaid',
        hard_stop_usd: 0,
        opening_balance_recorded: false,
        balance_usd: 0,
        ...account,
      })
    },
    async canSpend(provider, estimateUsd = 0) {
      const account = accounts.get(provider)
      if (!account) return false
      if (['self_hosted', 'subscription', 'postpaid'].includes(account.billing)) return true
      if (!account.opening_balance_recorded) return false
      return Number(account.balance_usd) - (Number(estimateUsd) || 0) >= Number(account.hard_stop_usd)
    },
    async record(input) {
      const row = {
        project: 'swadebots',
        feature: input.feature,
        provider: input.provider,
        model: input.model,
        tenant_id: input.tenant_id,
        cost_usd: Number(input.cost_usd) || 0,
        status: input.status || 'ok',
        meta: input.meta || {},
        occurred_at: new Date().toISOString(),
      }
      rows.push(row)
      return row
    },
    async report(tenantId) {
      return {
        connected: true,
        rows: rows.filter((row) => row.tenant_id === tenantId),
      }
    },
  }
}

export function createSpendGate({ ledger, founderEmails = [] }) {
  return {
    async authorize({ actor, modelId, estimateUsd = 0.01, feature = 'chat' }) {
      const model = findModel(modelId)
      if (!model) return { allowed: false, code: 'model_not_allowed', fallback: false }
      const free = actor.plan === 'free'
      if (free && model.tier !== 'local') {
        return { allowed: false, code: 'model_not_allowed', fallback: false, model: model.id }
      }
      if (isLocalModel(model.id)) {
        try {
          await ledger.record({
            feature,
            provider: model.provider,
            model: model.id,
            tenant_id: actor.tenant_id,
            cost_usd: 0,
            status: 'ok',
            meta: { local: true },
          })
        } catch {
          // A local call does not spend. A missed $0 row does not block it.
        }
        return { allowed: true, local: true, cost_usd: 0, provider: model.provider, model: model.id, fallback: false }
      }
      let can = false
      try {
        can = await ledger.canSpend(model.provider, estimateUsd)
      } catch {
        return { allowed: false, code: 'spend_blocked', reason: 'ledger_unavailable', fallback: false }
      }
      if (!can) return { allowed: false, code: 'spend_blocked', reason: 'ai_can_spend_false', fallback: false }
      const founder = founderEmails.includes(String(actor.email || '').toLowerCase())
      const cost = founder ? 0 : estimateUsd
      try {
        await ledger.record({
          feature,
          provider: model.provider,
          model: model.id,
          tenant_id: actor.tenant_id,
          cost_usd: cost,
          status: 'ok',
          meta: { founder_exempt: founder, estimate_usd: estimateUsd },
        })
      } catch {
        return { allowed: false, code: 'spend_blocked', reason: 'ledger_unavailable', fallback: false }
      }
      return {
        allowed: true,
        local: false,
        cost_usd: cost,
        founder_exempt: founder,
        provider: model.provider,
        model: model.id,
        fallback: false,
      }
    },
  }
}
