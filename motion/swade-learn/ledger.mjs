// In-process port of swadebase_ops.ai_can_spend and ai_record_usage (commit bbc49e8c01).
// The SQL migration is the production table. This ledger is what local renders record
// when that migration has not been applied. Paid video calls also require a recorded budget.

const round6 = (n) => Math.round((n + Number.EPSILON) * 1e6) / 1e6

const PAID_VIDEO_PROVIDERS = new Set(['elevenlabs', 'together'])

function account(provider, displayName, billing, hardStop = 0, low = 0, notes = '') {
  return {
    provider,
    display_name: displayName,
    billing,
    hard_stop_usd: hardStop,
    low_balance_usd: low,
    notes,
  }
}

function card(provider, model, unit, usd) {
  return { provider, model, unit, usd_per_unit: usd, active: true }
}

export function createLedger() {
  const accounts = new Map([
    ['elevenlabs', account('elevenlabs', 'ElevenLabs', 'subscription', 0, 0, 'Legacy fallback only')],
    ['swade_voice', account('swade_voice', 'SWADE Voice Studio (Kokoro CPU)', 'self_hosted', 0, 0, '$0 marginal')],
    ['together', account('together', 'Together', 'prepaid', 1, 5, 'Premium video. No opening balance until a top-up is recorded.')],
    ['remotion', account('remotion', 'Remotion CPU render', 'self_hosted', 0, 0, '$0 marginal')],
    ['hyperframes', account('hyperframes', 'HyperFrames CPU render', 'self_hosted', 0, 0, '$0 marginal')],
  ])
  const cards = [
    card('swade_voice', '*', 'character', 0),
    card('swade_voice', '*', 'audio_second', 0),
    card('swade_voice', 'hexgrad/Kokoro-82M', 'character', 0),
    card('swade_voice', 'hexgrad/Kokoro-82M', 'audio_second', 0),
    card('swade_voice', 'local-pcm', 'character', 0),
    card('swade_voice', 'local-pcm', 'audio_second', 0),
    card('remotion', '4.0.543', 'request', 0),
    card('remotion', '*', 'request', 0),
    card('hyperframes', '0.8.206', 'request', 0),
    card('hyperframes', '*', 'request', 0),
    // Public list prices, not verified against an invoice. Unknown prices block the call.
    card('elevenlabs', 'eleven_multilingual_v2', 'character', 0.0003),
    card('together', 'Wan-AI/wan2.7-t2v', 'request', 0.1),
  ]
  const topups = []
  const usage = []
  let nextId = 1

  function ensureAccount(provider) {
    if (!accounts.has(provider)) {
      accounts.set(provider, account(provider, provider, 'prepaid', 0, 0, 'auto-added by ledger; set billing and balance'))
    }
  }

  function priceOf(provider, model, unit) {
    const exact = cards.find((c) => c.active && c.provider === provider && c.model === model && c.unit === unit)
    if (exact) return exact.usd_per_unit
    const wildcard = cards.find((c) => c.active && c.provider === provider && c.model === '*' && c.unit === unit)
    return wildcard ? wildcard.usd_per_unit : null
  }

  function balance(provider) {
    const row = accounts.get(provider)
    if (!row) return null
    const mine = topups.filter((t) => t.provider === provider)
    const credit = mine.reduce((sum, t) => sum + t.amount_usd, 0)
    const opening = mine.some((t) => t.kind === 'opening_balance')
    const spentRows = usage.filter((u) => u.provider === provider)
    const spent = spentRows.reduce((sum, u) => sum + u.cost_usd, 0)
    return {
      ...row,
      credit_usd: credit,
      spent_usd: spent,
      balance_usd: row.billing === 'prepaid' ? credit - spent : null,
      opening_balance_recorded: opening,
    }
  }

  // Same CASE as swadebase_ops.ai_can_spend.
  function aiCanSpend(provider, estimateUsd = 0) {
    const b = balance(provider)
    if (!b) return false
    if (['self_hosted', 'subscription', 'postpaid'].includes(b.billing)) return true
    if (!b.opening_balance_recorded) return false
    return b.balance_usd - (Number(estimateUsd) || 0) >= b.hard_stop_usd
  }

  // Video Studio paid providers need a recorded opening balance even when the
  // SQL function allows a subscription account through with no credit.
  function hasBudget(provider, estimateUsd = 0) {
    const b = balance(provider)
    if (!b) return false
    if (!PAID_VIDEO_PROVIDERS.has(provider)) {
      if (b.billing === 'self_hosted' || b.billing === 'postpaid') return true
      if (!b.opening_balance_recorded) return false
      return (b.balance_usd ?? 0) - (Number(estimateUsd) || 0) >= b.hard_stop_usd
    }
    if (!b.opening_balance_recorded) return false
    const available = b.credit_usd - b.spent_usd
    return available - (Number(estimateUsd) || 0) >= b.hard_stop_usd
  }

  function estimate(provider, model, units = {}) {
    let usd = 0
    let priced = true
    for (const [unit, qty] of Object.entries(units)) {
      const amount = Number(qty) || 0
      if (!amount) continue
      const price = priceOf(provider, model, unit)
      if (price == null) priced = false
      else usd += amount * price
    }
    return { usd: priced ? round6(usd) : null, priced }
  }

  function addTopup({ provider, amount_usd, kind = 'topup', note = '' }) {
    ensureAccount(provider)
    topups.push({ provider, amount_usd: Number(amount_usd), kind, note })
  }

  function record(input) {
    const provider = input.provider
    const model = input.model
    ensureAccount(provider)
    const units = { ...(input.units || {}) }
    let cost = 0
    let priced = true
    for (const [unit, qty] of Object.entries(units)) {
      const amount = Number(qty) || 0
      if (!amount) continue
      const price = priceOf(provider, model, unit)
      if (price == null) priced = false
      else cost += amount * price
    }
    const row = {
      ledger_id: nextId++,
      occurred_at: new Date().toISOString(),
      project: input.project,
      feature: input.feature,
      provider,
      model,
      user_id: input.user_id ?? null,
      input_tokens: input.input_tokens || 0,
      output_tokens: input.output_tokens || 0,
      units,
      cost_usd: round6(cost),
      priced,
      status: input.status || 'ok',
      request_id: input.request_id ?? null,
      meta: input.meta || {},
    }
    usage.push(row)
    return { ledger_id: row.ledger_id, cost_usd: row.cost_usd, priced: row.priced }
  }

  return {
    aiCanSpend,
    hasBudget,
    estimate,
    addTopup,
    record,
    balance,
    rows: () => usage.map((row) => ({ ...row, units: { ...row.units }, meta: { ...row.meta } })),
  }
}

export async function premiumDecision(ledger, { provider, model, units }) {
  try {
    const quote = await ledger.estimate(provider, model, units)
    const estimateUsd = quote.priced ? quote.usd : 0
    const [aiCanSpend, budget] = await Promise.all([
      ledger.aiCanSpend(provider, estimateUsd),
      ledger.hasBudget(provider, estimateUsd),
    ])
    return {
      allowed: Boolean(quote.priced && aiCanSpend && budget),
      ai_can_spend: Boolean(aiCanSpend),
      budget: Boolean(budget),
      priced: quote.priced,
      estimate_usd: quote.usd,
    }
  } catch (error) {
    if (error.code !== 'ledger_unavailable') throw error
    return { allowed: false, ai_can_spend: false, budget: false, priced: false, estimate_usd: null, ledger: 'unavailable' }
  }
}

function budgetFromQuote(row, provider, estimateUsd) {
  if (!row?.provider) return false
  const estimate = Number(estimateUsd) || 0
  if (!PAID_VIDEO_PROVIDERS.has(provider)) {
    if (row.billing === 'self_hosted' || row.billing === 'postpaid') return true
    if (!row.opening_balance_recorded) return false
    return Number(row.balance_usd) - estimate >= Number(row.hard_stop_usd)
  }
  if (!row.opening_balance_recorded) return false
  return Number(row.credit_usd) - Number(row.spent_usd) - estimate >= Number(row.hard_stop_usd)
}

// Worker ledger. Quotes and writes go through public.swade_learn_* which call
// swadebase_ops.ai_can_spend and ai_record_usage. A missing migration fails closed
// for paid calls and still keeps a local row for the job result.
export function createSqlLedger(rpc) {
  const usage = []
  let last = null

  async function quote(provider, model, units, estimateUsd) {
    const { data, error } = await rpc('swade_learn_quote', {
      p_provider: provider,
      p_model: model,
      p_units: units || {},
      p_estimate_usd: estimateUsd ?? null,
    })
    if (error || data == null) {
      const failure = new Error('ledger_unavailable')
      failure.code = 'ledger_unavailable'
      throw failure
    }
    return data
  }

  return {
    source: 'swadebase_ops',
    async estimate(provider, model, units = {}) {
      last = await quote(provider, model, units, null)
      return { usd: last.priced ? Number(last.estimate_usd) : null, priced: Boolean(last.priced) }
    },
    async aiCanSpend(provider, estimateUsd = 0) {
      const row = last?.provider === provider ? last : await quote(provider, '*', {}, estimateUsd)
      last = row
      return Boolean(row.ai_can_spend)
    },
    async hasBudget(provider, estimateUsd = 0) {
      const row = last?.provider === provider ? last : await quote(provider, '*', {}, estimateUsd)
      last = row
      return budgetFromQuote(row, provider, estimateUsd)
    },
    async record(input) {
      const args = {
        p_project: input.project,
        p_feature: input.feature,
        p_provider: input.provider,
        p_model: input.model,
        p_user: input.user_id ?? null,
        p_units: input.units || {},
        p_status: input.status || 'ok',
        p_request_id: input.request_id ?? null,
        p_meta: input.meta || {},
      }
      try {
        const { data, error } = await rpc('swade_learn_record_usage', args)
        if (error) {
          const failure = new Error('ledger_unavailable')
          failure.code = 'ledger_unavailable'
          throw failure
        }
        const saved = Array.isArray(data) ? data[0] : data
        const row = {
          ledger_id: saved?.ledger_id ?? null,
          project: input.project,
          feature: input.feature,
          provider: input.provider,
          model: input.model,
          units: input.units || {},
          cost_usd: Number(saved?.cost_usd ?? 0),
          priced: Boolean(saved?.priced),
          status: input.status || 'ok',
          request_id: input.request_id ?? null,
          meta: input.meta || {},
        }
        usage.push(row)
        return { ledger_id: row.ledger_id, cost_usd: row.cost_usd, priced: row.priced }
      } catch (error) {
        if (PAID_VIDEO_PROVIDERS.has(input.provider) && (input.status || 'ok') === 'ok') throw error
        const row = {
          ledger_id: null,
          project: input.project,
          feature: input.feature,
          provider: input.provider,
          model: input.model,
          units: input.units || {},
          cost_usd: 0,
          priced: false,
          status: input.status || 'ok',
          request_id: input.request_id ?? null,
          meta: { ...(input.meta || {}), ledger_write: 'unavailable' },
        }
        usage.push(row)
        return { ledger_id: null, cost_usd: 0, priced: false }
      }
    },
    rows: () => usage.map((row) => ({ ...row, units: { ...row.units }, meta: { ...row.meta } })),
  }
}
