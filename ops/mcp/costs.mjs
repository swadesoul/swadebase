// Read-only cost reporting over swadebase_ops.ai_* (ledger, rate cards, balances).
// Lets SSS Brain answer "what did X spend on Y, and what credit is left?" through the MCP.
const err = (code, message) => Object.assign(Error(message), { code });
const PERIODS = { today: "1 day", "7d": "7 days", "30d": "30 days", mtd: null, all: "100 years" };
const NAME = /^[a-z0-9_.:\/-]{1,80}$/i;

export function makeCosts({ pool, guard }) {
  const q = async (sql, args = []) => (await pool.query(sql, args)).rows;

  async function report(actor, { period = "mtd", project = "", provider = "" } = {}) {
    await guard(actor, "ecosystem:read");
    if (!(period in PERIODS)) throw err("invalid_input", "period must be today, 7d, 30d, mtd or all.");
    if ((project && !NAME.test(project)) || (provider && !NAME.test(provider))) throw err("invalid_input", "Invalid project or provider name.");
    const since = period === "mtd" ? "date_trunc('month', now())" : `now() - interval '${PERIODS[period]}'`;
    const filt = `occurred_at >= ${since} and ($1 = '' or project = $1) and ($2 = '' or provider = $2)`;
    const args = [project, provider];

    const [totals] = await q(`select coalesce(sum(cost_usd),0)::float8 cost_usd, count(*)::int calls,
        count(*) filter (where not priced)::int unpriced_calls, count(*) filter (where status='blocked')::int blocked_calls
        from swadebase_ops.ai_usage_ledger where ${filt}`, args);
    const byProject = await q(`select project, round(sum(cost_usd),4)::float8 cost_usd, count(*)::int calls
        from swadebase_ops.ai_usage_ledger where ${filt} group by project order by 2 desc limit 20`, args);
    const byProviderModel = await q(`select provider, model, round(sum(cost_usd),4)::float8 cost_usd, count(*)::int calls,
        sum(input_tokens)::bigint input_tokens, sum(output_tokens)::bigint output_tokens
        from swadebase_ops.ai_usage_ledger where ${filt} group by 1,2 order by 3 desc limit 25`, args);
    const byFeature = await q(`select project, feature, round(sum(cost_usd),4)::float8 cost_usd, count(*)::int calls
        from swadebase_ops.ai_usage_ledger where ${filt} group by 1,2 order by 3 desc limit 20`, args);
    const balances = await q(`select provider, display_name, billing, round(credit_usd,4)::float8 credit_usd,
        round(spent_usd,4)::float8 spent_usd, round(balance_usd,4)::float8 balance_usd, round(month_to_date_usd,4)::float8 month_to_date_usd,
        opening_balance_recorded, (balance_usd is not null and balance_usd < low_balance_usd) low_balance, last_used_at
        from swadebase_ops.ai_provider_balances where ($1 = '' or provider = $1) order by provider`, [provider]);
    return {
      period, project: project || "all", provider: provider || "all",
      totals, by_project: byProject, by_provider_model: byProviderModel, by_feature: byFeature, provider_balances: balances,
      notes: [
        "Balances are recorded credit minus ledger spend; providers without an opening balance show balance null and paid calls to them are blocked.",
        "Self-hosted services (Voice Studio, Ollama, self-hosted LiveKit) cost $0 per call; hosting is prepaid separately.",
        "Unpriced calls used a unit with no rate card and are not in the cost total.",
      ],
    };
  }

  async function rateCards(actor, { provider = "" } = {}) {
    await guard(actor, "ecosystem:read");
    if (provider && !NAME.test(provider)) throw err("invalid_input", "Invalid provider name.");
    const items = await q(`select provider, model, unit, (usd_per_unit * case when unit in ('input_token','output_token') then 1e6 else 1 end)::float8 usd,
        case when unit in ('input_token','output_token') then 'per 1M tokens' else 'per '||unit end per,
        verified_at is not null verified, verified_at, source_url
        from swadebase_ops.ai_rate_cards where active and ($1 = '' or provider = $1) order by provider, model, unit`, [provider]);
    return { items };
  }

  return { report, rateCards };
}

