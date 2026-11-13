// Prepared only. Run explicitly on the existing host after the scoped deployment.
// No credential creation, SQL writes, payment calls, model calls, or service changes.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';

const BASE = 'https://swadebase.cloud';
const MCP = '/opt/swadebase/ops/mcp';
const ADAPTERS = '/opt/swadebase-adapters';
const DOCS = '/opt/swadebase/docs';
const ACCOUNT = 'acct_1SizGm43OPTHaIwn';
const REQUIRED = ['site-bibles/SWADEBASE_Master_Site_Bible.md', 'STANDING_RULES.md'];
const ALLOWED_DOCS = new Set([...REQUIRED, 'site-agents/SPEC.md']);
const checks = [];
const coverage = {};
const sha = text => createHash('sha256').update(text).digest('hex');
const realFetch = globalThis.fetch;
let stage = 'configuration';
let rawPool;
let modelCalls = 0;

function check(condition, code) {
  if (!condition) throw Object.assign(new Error(code), { verificationCode: code });
  checks.push(code);
}
function noLeak(value, label) {
  const text = JSON.stringify(value);
  check(!text.includes(ACCOUNT), `${label}:no_merchant`);
  check(!text.includes('SWADEBASE_Master_Site_Bible.md'), `${label}:no_bible_path`);
  check(!text.includes('STANDING_RULES.md'), `${label}:no_rules_path`);
  check(!text.includes('SWADEBASE Master Site Bible'), `${label}:no_bible_content`);
  check(!text.includes('SWADEBASE ecosystem standing rules'), `${label}:no_rules_content`);
  for (const name of ['documents', 'stripe_default', 'recent_decisions']) {
    check(!Object.hasOwn(value || {}, name), `${label}:no_${name}`);
  }
}
function restrictedContext(value, label) {
  check(value && typeof value === 'object', `${label}:exists`);
  const allowed = new Set(['version', 'checked_at', 'status', 'automation', 'reference_boundary']);
  check(Object.keys(value).every(key => allowed.has(key)), `${label}:restricted_fields`);
  check(value.automation && Object.keys(value.automation).every(key => key === 'status'), `${label}:restricted_automation`);
  noLeak(value, label);
}
function verifiedNativeSource(value, label) {
  const source = value?.sources?.[0];
  check(source?.doc_path === 'STANDING_RULES.md' && source.source === 'live_file', `${label}:first_source_is_current_rules`);
  check(typeof source.excerpt === 'string' && source.excerpt.includes(ACCOUNT), `${label}:first_source_contains_default_merchant`);
  check(source.visibility === 'shared_reference', `${label}:first_source_is_shared_reference`);
  const currentRules = value.entry_context?.documents?.find(doc => doc.doc_path === 'STANDING_RULES.md');
  check(source.doc_sha === currentRules?.doc_sha, `${label}:first_source_hash_matches_context`);
  check(value.generated === false && value.paid_fallback === false, `${label}:retrieval_without_generation`);
}
async function verifiedContext(value, pool, label) {
  check(value?.version === 1, `${label}:version`);
  check(['ready', 'ready_live_reference'].includes(value?.status), `${label}:ready`);
  const checkedAt = Date.parse(value?.checked_at);
  check(Number.isFinite(checkedAt) && checkedAt >= Date.now() - 120_000 && checkedAt <= Date.now() + 60_000, `${label}:current_timestamp`);
  check(Array.isArray(value?.documents), `${label}:documents`);
  check(REQUIRED.every(path => value.documents.some(doc => doc.doc_path === path)), `${label}:required_documents`);
  const indexed = await pool.query(
    'select doc_path,doc_sha from sssbrain.swadebase_docs where doc_path=any($1::text[])',
    [value.documents.map(doc => doc.doc_path)],
  );
  for (const doc of value.documents) {
    check(ALLOWED_DOCS.has(doc.doc_path), `${label}:approved_path`);
    const hash = sha(await readFile(`${DOCS}/${doc.doc_path}`));
    check(doc.doc_sha === hash, `${label}:disk_hash:${doc.doc_path}`);
    check(indexed.rows.some(row => row.doc_path === doc.doc_path && row.doc_sha === hash), `${label}:index_hash:${doc.doc_path}`);
    check(doc.index_status === 'current', `${label}:index_current:${doc.doc_path}`);
  }
  check(value.automation?.status === 'healthy', `${label}:automation_healthy`);
  check(value.automation.timer_active === true, `${label}:timer_active`);
  check(value.automation.hook_loaded === true, `${label}:hook_loaded`);
  const lastSync = Date.parse(value.automation.last_success_at);
  check(Number.isFinite(lastSync) && lastSync <= Date.now() + 60_000 && lastSync >= Date.now() - 12 * 60_000, `${label}:recent_success`);
  check(value.stripe_default?.status === 'resolved', `${label}:merchant_resolved`);
  check(value.stripe_default.account_id === ACCOUNT, `${label}:merchant_matches`);
  check(ALLOWED_DOCS.has(value.stripe_default.source_doc_path), `${label}:merchant_source`);
  check(value.reference_boundary === 'approved_reference_not_action_authorization', `${label}:reference_boundary`);
}
async function optionalRuntimeEnvironment() {
  const pid = process.env.SWADE_VERIFY_RUNTIME_PID;
  if (!pid) return () => {};
  check(/^[1-9][0-9]*$/.test(pid), 'runtime_pid_valid');
  const command = await readFile(`/proc/${pid}/cmdline`, 'utf8');
  check(command.split('\0').includes(`${ADAPTERS}/server.mjs`), 'runtime_pid_is_existing_adapter');
  const values = new Map((await readFile(`/proc/${pid}/environ`, 'utf8')).split('\0').filter(Boolean).map(entry => {
    const equal = entry.indexOf('=');
    return [entry.slice(0, equal), entry.slice(equal + 1)];
  }));
  const keys = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  for (const key of keys) if (values.has(key)) process.env[key] = values.get(key);
  values.clear();
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  };
}
function readOnlyPool(pool) {
  return {
    async query(text, values) {
      const client = await pool.connect();
      try {
        await client.query('begin read only');
        const result = await client.query(text, values);
        await client.query('commit');
        return result;
      } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
      } finally { client.release(); }
    },
    async connect() {
      const client = await pool.connect();
      try { await client.query('set default_transaction_read_only=on'); }
      catch (error) { client.release(); throw error; }
      return client;
    },
  };
}
async function post(path, data, headers = {}) {
  const response = await realFetch(BASE + path, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
    headers: { 'content-type': 'application/json', origin: BASE, ...headers },
    body: JSON.stringify(data),
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { status: response.status, body };
}
function ownerHeaders() {
  const bearer = process.env.SWADE_VERIFY_MCP_BEARER;
  if (bearer) {
    check(/^swmcp_[A-Za-z0-9_-]{43}$/.test(bearer), 'existing_mcp_bearer_format');
    return { Authorization: `Bearer ${bearer}` };
  }
  const session = process.env.SWADE_VERIFY_ADMIN_COOKIE;
  const csrf = process.env.SWADE_VERIFY_ADMIN_CSRF;
  if (session && csrf) {
    check(/^[A-Za-z0-9_-]{43}$/.test(session) && /^[A-Za-z0-9_-]+$/.test(csrf), 'existing_admin_session_format');
    return { cookie: `swb_admin=${session}`, origin: BASE, 'x-csrf-token': csrf };
  }
  return null;
}
async function clientModule() {
  const require = createRequire(`${MCP}/package.json`);
  return import(pathToFileURL(require.resolve('@modelcontextprotocol/client')).href);
}
async function mockNativeRequest(route, path, body, withIdentity = true) {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);
  Object.assign(req, {
    method: 'POST', url: path,
    headers: {
      host: 'swadebase.cloud', origin: BASE, 'content-type': 'application/json',
      ...(withIdentity ? { authorization: 'Bearer fixture.native.identity' } : {}),
    },
    socket: { remoteAddress: '127.0.0.1' },
  });
  let status = 200;
  let responseBody;
  const res = {
    setHeader() {},
    writeHead(code) { status = code; },
    end(text) { responseBody = text ? JSON.parse(String(text)) : null; },
  };
  await route(req, res, new URL(path, BASE), null);
  return { status, body: responseBody };
}

async function main() {
  const ownerId = process.env.SWADE_VERIFY_OWNER_ID;
  check(/^[0-9a-f-]{36}$/i.test(ownerId || ''), 'existing_owner_identity_required');
  // No provider/model network is permitted while loading/exercising the real service.
  globalThis.fetch = async () => { throw Object.assign(new Error('Network forbidden in direct checks'), { verificationCode: 'unexpected_direct_network' }); };
  const restore = await optionalRuntimeEnvironment();
  try {
    const { makePool } = await import(pathToFileURL(`${ADAPTERS}/lib/db.mjs`).href);
    rawPool = makePool();
  } finally { restore(); }
  const pool = readOnlyPool(rawPool);
  const identity = await pool.query('select swadebase_ops.is_super_admin($1::uuid) as ok', [ownerId]);
  check(identity.rows[0]?.ok === true, 'existing_owner_is_current_super_admin');
  const { makeService } = await import(pathToFileURL(`${MCP}/service.mjs`).href);
  const classifier = async () => { modelCalls++; throw new Error('Model execution forbidden'); };
  const service = makeService({ pool, classifier });
  const actor = { id: ownerId, scopes: ['ecosystem:read', 'operator:plan'] };
  const restricted = { id: ownerId, scopes: ['merch:read'] };

  stage = 'real_service_entry';
  await verifiedContext(await service.enter(actor), pool, 'service_enter');
  await verifiedContext(await service.currentEntry(actor), pool, 'service_current');
  const bible = await service.bible(actor, { program: 'swadebase' });
  check(bible.status === 'available', 'real_bible_available');
  await verifiedContext(bible.entry_context, pool, 'bible_response');
  const plan = await service.plan(actor, { request: 'Read the current SWADEBASE default Stripe account; prepare no execution.', rules_only: true });
  await verifiedContext(plan.entry_context, pool, 'rules_only_plan');
  check(plan.execution_authorized === false, 'plan_does_not_authorize_execution');

  stage = 'restricted_service_entry';
  restrictedContext(await service.enter(restricted), 'restricted_enter');
  restrictedContext(await service.currentEntry(restricted), 'restricted_current');
  for (const [name, args] of [['bible', { program: 'swadebase' }], ['capabilities', { limit: 1 }]]) {
    let rejected = false;
    try { await service[name](restricted, args); }
    catch (error) {
      check(error.status === 403 && ['insufficient_scope', 'forbidden_scope', 'forbidden'].includes(error.code), `restricted_${name}_scope_error`);
      rejected = true;
      noLeak({ code: error.code, message: error.message, entry_context: error.entry_context }, `restricted_${name}_error`);
    }
    check(rejected, `restricted_${name}_denied`);
  }
  await verifiedContext(await service.currentEntry(actor), pool, 'owner_after_restricted');
  coverage.direct_service_and_database = 'verified_with_existing_owner_and_read_only_transactions';

  stage = 'native_handler_mock_identity';
  const { default: mcpRoutes } = await import(pathToFileURL(`${MCP}/route.mjs`).href);
  const admin = {
    verifyAccessToken: async token => token === 'fixture.native.identity' ? { id: ownerId } : null,
    isSuperAdmin: async id => (await pool.query('select swadebase_ops.is_super_admin($1::uuid) as ok', [id])).rows[0]?.ok === true,
  };
  const route = mcpRoutes({ pool, admin, auth: { csrfOk: () => false }, classifier, log() {} });
  const native = await mockNativeRequest(route, '/adapters/operator/knowledge', {
    question: 'SWADEBASE default Stripe account', voice_reply: false, include_capabilities: false,
  });
  check(native.status === 200, 'native_handler_success_with_mock_identity');
  verifiedNativeSource(native.body?.data, 'native_handler_source');
  await verifiedContext(native.body?.data?.entry_context, pool, 'native_handler_response');
  const missing = await mockNativeRequest(route, '/adapters/operator/knowledge', { question: 'Read standing rules' }, false);
  check(missing.status === 403, 'native_handler_missing_identity_denied');
  noLeak(missing.body, 'native_handler_missing_identity');
  coverage.native_handler = 'real_route_and_database_with_mocked_identity_and_transport_not_live_auth';
  check(modelCalls === 0, 'no_classifier_calls');

  stage = 'missing_auth_live_https';
  const health = await realFetch(`${BASE}/adapters/mcp/health`, {
    redirect: 'error', signal: AbortSignal.timeout(20_000),
  });
  check(health.status === 200 && (await health.json()).version === '1.1.1', 'live_mcp_release_version');
  const anonymous = await post('/adapters/mcp', {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'entry-readonly-audit', version: '1' } },
  });
  check(anonymous.status === 401, 'live_mcp_missing_auth_denied');
  noLeak(anonymous.body, 'live_mcp_anonymous');
  const anonymousNative = await post('/adapters/operator/knowledge', { question: 'Read standing rules', voice_reply: false });
  check(anonymousNative.status === 403, 'live_native_missing_auth_denied');
  noLeak(anonymousNative.body, 'live_native_anonymous');
  coverage.live_anonymous_https = 'verified';

  // Optional: reuse real existing credentials. Never mint, sign, register, or insert one.
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    check(url.origin === BASE && url.pathname.startsWith('/adapters/'), 'sdk_request_stays_on_verified_service');
    return realFetch(input, init);
  };
  const headers = ownerHeaders();
  coverage.live_authenticated_mcp = 'not_run_no_existing_credential';
  if (headers) {
    stage = 'live_authenticated_mcp';
    const { Client, StreamableHTTPClientTransport } = await clientModule();
    const client = new Client({ name: 'entry-readonly-audit', version: '1.0.0' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/adapters/mcp`), { requestInit: { headers } }));
      const result = await client.callTool({ name: 'swade_get_site_bible', arguments: { program: 'swadebase' } });
      check(!result.isError, 'live_mcp_bible_read');
      await verifiedContext(result.structuredContent?.entry_context, pool, 'live_mcp_context');
      coverage.live_authenticated_mcp = 'verified_with_existing_credential';
    } finally { await client.close().catch(() => {}); }
  }
  coverage.live_restricted_mcp = 'not_run_no_existing_restricted_credential';
  if (process.env.SWADE_VERIFY_RESTRICTED_MCP_BEARER) {
    stage = 'live_restricted_mcp';
    const bearer = process.env.SWADE_VERIFY_RESTRICTED_MCP_BEARER;
    check(/^swmcp_[A-Za-z0-9_-]{43}$/.test(bearer), 'existing_restricted_bearer_format');
    const { Client, StreamableHTTPClientTransport } = await clientModule();
    const client = new Client({ name: 'entry-restricted-readonly-audit', version: '1.0.0' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/adapters/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${bearer}` } },
      }));
      const result = await client.callTool({ name: 'swade_get_site_bible', arguments: { program: 'swadebase' } });
      check(result.isError === true, 'live_restricted_bible_denied');
      noLeak(result, 'live_restricted_result');
      coverage.live_restricted_mcp = 'verified_with_existing_restricted_credential';
    } finally { await client.close().catch(() => {}); }
  }
  coverage.live_native_auth = 'not_run_no_existing_gotrue_user_token';
  const userToken = process.env.SWADE_VERIFY_GOTRUE_USER_TOKEN;
  if (userToken) {
    stage = 'live_native_auth';
    check(/^[A-Za-z0-9._-]{20,8192}$/.test(userToken) && !userToken.startsWith('swmcp_'), 'existing_native_user_token_format');
    const result = await post('/adapters/operator/knowledge', {
      question: 'SWADEBASE default Stripe account', voice_reply: false, include_capabilities: false,
    }, { Authorization: `Bearer ${userToken}` });
    check(result.status === 200, 'live_native_authorized_read');
    verifiedNativeSource(result.body?.data, 'live_native_source');
    await verifiedContext(result.body?.data?.entry_context, pool, 'live_native_context');
    coverage.live_native_auth = 'verified_with_existing_user_token';
  }
  console.log(JSON.stringify({ status: 'scoped_checks_passed', checks_passed: checks.length, coverage, credential_creation: false, direct_sql_writes: false, model_calls: modelCalls, payment_calls: 0, production_configuration_changes: false }, null, 2));
}

if (process.argv.includes('--run-readonly-verification')) {
  try { await main(); }
  catch (error) {
    // Never print raw errors, responses, headers, tokens, owner UUIDs, or Bible content.
    console.error(JSON.stringify({ status: 'failed_or_blocked', stage, reason: error.verificationCode || 'operation_failed_without_sensitive_details', checks_passed: checks.length, coverage }));
    process.exitCode = 1;
  } finally {
    globalThis.fetch = realFetch;
    await rawPool?.end().catch(() => {});
  }
} else {
  console.log('Prepared verification harness. No checks ran. Explicit --run-readonly-verification and an existing verified owner identity are required.');
}
