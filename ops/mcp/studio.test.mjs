import test from 'node:test';
import assert from 'node:assert/strict';
import { makeStudio } from './studio.mjs';

function fixture({ denied = false, ledgerDown = false, rows = [] } = {}) {
  const queries = [];
  const pool = { async query(sql, args) {
    queries.push({ sql, args });
    return { rows: sql.includes('count(*)') ? [{ total: 71, enabled: 63 }] : rows };
  } };
  const guard = async actor => { if (denied || actor.id !== 'owner') throw Object.assign(Error('denied'), { code: 'forbidden' }); };
  const costs = {
    async report(actor, { period }) { if (ledgerDown) throw Error('private connection string'); return { period, totals: { calls: 2, cost_usd: 0, unpriced_calls: 2 } }; },
    async rateCards() { if (ledgerDown) throw Error('secret'); return { items: Array.from({ length: 70 }, (_, i) => ({ provider: 'provider' + i })) }; },
  };
  return { overview: makeStudio({ pool, guard, costs }), queries };
}
const actor = { id: 'owner', scopes: ['ecosystem:read'] };
test('denied caller makes no inventory queries', async () => {
  const f = fixture({ denied: true }); await assert.rejects(f.overview(actor), /denied/); assert.equal(f.queries.length, 0);
});
test('pagination is bounded and parameterized', async () => {
  const rows = Array.from({ length: 3 }, (_, n) => ({ id: 'adapter-' + n, display_name: 'Adapter', status: 'live', enabled: true }));
  const f = fixture({ rows }); const result = await f.overview(actor, { limit: 2, offset: 4 });
  assert.equal(result.inventory.adapters.length, 2); assert.equal(result.inventory.next_offset, 6);
  assert.deepEqual(f.queries[1].args, [3, 4]); assert.equal(result.inventory.total, 71);
});
test('registry live never becomes workflow verified and extra DB fields are discarded', async () => {
  const f = fixture({ rows: [{ id: 'a', display_name: 'A', status: 'live', enabled: true, secret: 'hidden' }] });
  const result = await f.overview(actor); assert.equal(result.inventory.adapters[0].workflow_verification, 'not_attached');
  assert(!JSON.stringify(result).includes('hidden')); assert.equal(result.release_state, 'read_only_inventory');
});
test('unknown and unpriced usage remain explicit', async () => {
  const result = await fixture().overview(actor); assert.equal(result.usage.totals.unpriced_calls, 2); assert.match(result.coverage.usage, /not zero cost/);
  assert.equal(result.rates.items.length, 50); assert.equal(result.rates.total, 70);
});
test('ledger failure remains unavailable without leaking upstream exception', async () => {
  const result = await fixture({ ledgerDown: true }).overview(actor); assert.equal(result.usage.status, 'unavailable');
  assert.equal(result.rates.status, 'unavailable'); assert(!JSON.stringify(result).includes('connection string'));
});
test('invalid pagination and period cannot reach SQL', async () => {
  for (const args of [{ limit: 51 }, { limit: 0 }, { offset: -1 }, { offset: 0.5 }, { period: 'forever' }]) {
    const f = fixture(); await assert.rejects(f.overview(actor, args), /Invalid/); assert.equal(f.queries.length, 0);
  }
});
test('Studio runs only SELECTs and never asks a provider or worker to execute', async () => {
  const f = fixture(); await f.overview(actor); assert(f.queries.every(q => q.sql.startsWith('select ')));
});
