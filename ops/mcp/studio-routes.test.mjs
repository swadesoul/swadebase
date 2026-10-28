import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mcpRoutes from './route.mjs';

async function fixture(run, { paused = false } = {}) {
  const queries = [];
  const pool = { async query(sql) {
    queries.push(sql);
    if (sql.includes("where id='swadebase-mcp'")) return { rows: [{ enabled: !paused, status: 'live' }] };
    if (sql.includes('count(*)::int total')) return { rows: [{ total: 1, enabled: 1 }] };
    if (sql.includes('select id,display_name,owner_site')) return { rows: [{ id: 'fixture', display_name: 'Fixture', enabled: true, status: 'live' }] };
    if (sql.includes('coalesce(sum(cost_usd)')) return { rows: [{ calls: 0, cost_usd: 0, unpriced_calls: 0 }] };
    return { rows: [] };
  } };
  const handle = mcpRoutes({ pool, auth: { csrfOk: () => false }, admin: { isSuperAdmin: async id => id === 'owner' }, classifier: () => { throw Error('unexpected model'); } });
  const app = http.createServer(async (req, res) => {
    const session = req.headers['x-test-user'] ? { userId: req.headers['x-test-user'] } : null;
    try { const handled = await handle(req, res, new URL(req.url, 'https://swadebase.cloud'), session); if (handled === false) { res.writeHead(404); res.end(); } }
    catch (e) { res.writeHead(e.status || 500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.code || 'failed' })); }
  });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const get = (path, headers = {}) => fetch(`http://127.0.0.1:${app.address().port}${path}`, { headers: { host: 'swadebase.cloud', ...headers }, redirect: 'manual' });
  try { await run(get, queries); } finally { await new Promise(resolve => app.close(resolve)); }
}

test('anonymous Studio page redirects to login; data and assets stay private', async () => fixture(async (get, queries) => {
  const page = await get('/adapters/mcp/studio'); assert.equal(page.status, 303); assert.match(page.headers.get('location'), /login/);
  for (const path of ['/adapters/api/mcp-connect/studio', '/adapters/mcp/studio.js', '/adapters/mcp/studio.css']) assert.equal((await get(path)).status, 403);
  assert.equal(queries.length, 0);
}));
test('ordinary user and hostile origins are denied before inventory reads', async () => fixture(async (get, queries) => {
  assert.equal((await get('/adapters/api/mcp-connect/studio', { 'x-test-user': 'customer' })).status, 403);
  assert.equal((await get('/adapters/api/mcp-connect/studio', { 'x-test-user': 'owner', origin: 'https://attacker.test' })).status, 403);
  assert.equal(queries.length, 0);
}));
test('owner gets read-only inventory through existing session policy', async () => fixture(async (get, queries) => {
  const response = await get('/adapters/api/mcp-connect/studio', { 'x-test-user': 'owner' }); assert.equal(response.status, 200);
  const data = (await response.json()).data; assert.equal(data.inventory.adapters[0].workflow_verification, 'not_attached');
  assert(queries.every(sql => sql.startsWith('select '))); assert.equal(response.headers.get('cache-control'), 'no-store');
}));
test('paused MCP rejects Studio data rather than bypassing the kill switch', async () => fixture(async get => {
  assert.equal((await get('/adapters/api/mcp-connect/studio', { 'x-test-user': 'owner' })).status, 503);
}, { paused: true }));
test('owner Studio page preserves a restrictive CSP', async () => fixture(async get => {
  const page = await get('/adapters/mcp/studio', { 'x-test-user': 'owner' }); assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/); assert.match(await page.text(), /MCP Studio/);
  const bad = await get('/adapters/api/mcp-connect/studio?limit=500', { 'x-test-user': 'owner' }); assert.equal(bad.status, 400);
}));
