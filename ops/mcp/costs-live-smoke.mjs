// Live check of the cost tools as the swadebase_adapters role (run with the adapter env loaded).
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {makeCosts} from './costs.mjs';
const pg = createRequire('/opt/swadebase-adapters/package.json')('pg');
assert(process.env.PGUSER, 'adapter PG* environment not loaded');
const pool = new pg.Pool({max: 2});
const costs = makeCosts({pool, guard: async () => {}});
try {
  const r = await costs.report({id: 'smoke', scopes: ['ecosystem:read']}, {period: 'mtd'});
  assert(Array.isArray(r.provider_balances) && r.provider_balances.length >= 10);
  const cards = await costs.rateCards({id: 'smoke'}, {provider: 'qwencloud'});
  assert(cards.items.some(c => c.model === 'qwen-flash' && c.verified));
  await assert.rejects(costs.report({id: 'smoke'}, {period: 'forever'}));
  console.log(JSON.stringify({ok: true, providers: r.provider_balances.length, calls: r.totals.calls, qwen_flash: cards.items.map(c => `${c.unit} $${c.usd} ${c.per}`)}));
} finally { await pool.end(); }

