// Owner-only read model over the existing adapter registry and usage ledger.
// Registry labels are inventory, never a claim that an app workflow passed.
export function makeStudio({ pool, guard, costs }) {
  return async function overview(actor, { offset = 0, limit = 20, period = 'mtd' } = {}) {
    await guard(actor, 'ecosystem:read');
    if (!Number.isInteger(offset) || offset < 0 || offset > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 50 || !['today', '7d', '30d', 'mtd', 'all'].includes(period)) {
      throw Object.assign(Error('Invalid Studio pagination or period.'), { code: 'invalid_input', status: 400 });
    }
    const count = await pool.query(`select count(*)::int total, count(*) filter (where enabled)::int enabled from swadebase_ops.adapters_registry`);
    const result = await pool.query(`select id,display_name,owner_site,status,enabled,last_used_at,updated_at from swadebase_ops.adapters_registry order by id limit $1 offset $2`, [limit + 1, offset]);
    const adapters = result.rows.slice(0, limit).map(row => ({
      id: row.id, name: row.display_name, owner_site: row.owner_site || null,
      registry_status: row.status, enabled: row.enabled === true,
      last_used_at: row.last_used_at, updated_at: row.updated_at,
      workflow_verification: 'not_attached',
    }));
    const readCosts = async () => {
      try { return { status: 'available', ...(await costs.report(actor, { period })) }; }
      catch { return { status: 'unavailable', note: 'The existing cost ledger could not be read. No zero-cost conclusion can be drawn.' }; }
    };
    const readRates = async () => {
      try { const r = await costs.rateCards(actor, {}); return { status: 'available', items: r.items.slice(0, 50), total: r.items.length }; }
      catch { return { status: 'unavailable', items: [], note: 'Existing rate cards could not be read.' }; }
    };
    const [usage, rates] = await Promise.all([readCosts(), readRates()]);
    return {
      generated_at: new Date().toISOString(), release_state: 'read_only_inventory',
      inventory: { total: count.rows[0]?.total ?? 0, enabled: count.rows[0]?.enabled ?? 0, adapters, next_offset: result.rows.length > limit ? offset + limit : null },
      usage, rates,
      coverage: {
        applications: 'Adapter owner labels only; the complete application registry is not attached.',
        health: 'Authenticated API and customer journey verification are not attached.',
        usage: 'Recorded ledger entries only. Missing instrumentation and unpriced calls are not zero cost.',
        repair_execution: 'Not enabled by Studio. Existing owner approvals and report-only controls remain in force.',
      },
    };
  };
}
