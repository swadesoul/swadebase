import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { makeEntryContext } from './entry-context.mjs';

const BIBLE = 'site-bibles/SWADEBASE_Master_Site_Bible.md';
const RULES = 'STANDING_RULES.md';
const ACTOR = { id: 'fixture-actor', scopes: ['ecosystem:read'] };
const sha = value => createHash('sha256').update(value).digest('hex');
const rules = (name = 'Example Merchant', account = 'acct_ExampleMerchant') => `# Standing rules

## Shared Stripe merchant — current owner decision

Use the existing SWADEBASE Stripe merchant **${name}**, account \`${account}\`, as the default for future Stripe builds, integrations and billing setups.

Owner approval is still required for actions.

## Unrelated section

Historical account: acct_UnrelatedHistory
`;
const bible = decision => `# SWADEBASE Master Site Bible

Private roadmap: lantern-market.

## Existing architecture

Reuse the existing service.

## Recent decisions

${decision}
`;
const healthyInspection = () => ({
  timer: { LoadState: 'loaded', ActiveState: 'active', UnitFileState: 'enabled' },
  service: {
    LoadState: 'loaded', ActiveState: 'inactive', ExecMainStatus: '0',
    DropInPaths: '/etc/systemd/system/sssbrain-guardian.service.d/merch.conf /etc/systemd/system/sssbrain-guardian.service.d/guardian-knowledge-index.conf',
  },
});

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'swade-entry-context-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const docsRoot = path.join(root, 'docs');
  await mkdir(path.join(docsRoot, 'site-bibles'), { recursive: true });
  const receiptPath = path.join(root, 'knowledge-sync.json');
  let clock = new Date('2026-11-07T12:00:00.000Z');
  const index = new Map();
  const queries = [];
  let failure;
  let system = healthyInspection();
  let inspections = 0;
  const pool = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (failure) throw failure;
      assert.match(sql, /^select /i);
      assert.deepEqual(values.length, 1);
      return { rows: values[0].filter(docPath => index.has(docPath)).map(docPath => ({
        doc_path: docPath, doc_sha: index.get(docPath), updated_at: '2020-01-01T00:00:00Z',
        content: 'STALE INDEX TEXT MUST NEVER BE USED',
      })) };
    },
  };
  async function put(docPath, content, sync = true) {
    await writeFile(path.join(docsRoot, docPath), content);
    if (sync) index.set(docPath, sha(content));
  }
  async function receipt(value = {}) {
    await writeFile(receiptPath, JSON.stringify({
      time_utc: clock.toISOString(), status: 'ok', sources_considered: 135,
      added: 0, changed: 0, removed: 0, paid_calls: 0, ...value,
    }));
  }
  await put(BIBLE, bible('Use the current verified renderer.'));
  await put(RULES, rules());
  await receipt();
  const options = {
    pool, docsRoot, receiptPath, now: () => new Date(clock),
    readAutomation: async () => { inspections++; if (system instanceof Error) throw system; return structuredClone(system); },
  };
  return {
    root, docsRoot, receiptPath, index, queries, options, put, receipt,
    entry: () => makeEntryContext(options),
    setTime: value => { clock = new Date(value); },
    setSystem: value => { system = value; },
    setFailure: value => { failure = value; },
    inspections: () => inspections,
  };
}

function sanitizedUnavailable(root) {
  return error => {
    assert.equal(error.code, 'bible_unavailable');
    assert.equal(error.status, 503);
    assert.doesNotMatch(error.message, /ENOENT|EACCES|secret|password|postgres:\/\//i);
    assert.equal(error.message.includes(root), false);
    assert.equal(JSON.stringify(error).includes(root), false);
    return true;
  };
}

test('current files, matching index and verified automation produce bounded reference context', async t => {
  const f = await fixture(t);
  const result = await f.entry().check(ACTOR);
  assert.equal(result.status, 'ready');
  assert.equal(result.automation.status, 'healthy');
  assert.deepEqual(result.automation.reasons, []);
  assert.equal(result.reference_boundary, 'approved_reference_not_action_authorization');
  assert.equal(result.documents.length, 2);
  assert.ok(result.documents.every(document => document.index_status === 'current' && !('content' in document)));
  assert.equal(result.stripe_default.name, 'Example Merchant');
  assert.equal(result.stripe_default.account_id, 'acct_ExampleMerchant');
  assert.equal(result.recent_decisions, 'Use the current verified renderer.');
  assert.equal(JSON.stringify(result).includes(f.root), false);
  assert.equal(f.queries.length, 1);
  assert.deepEqual(f.queries[0].values, [[BIBLE, RULES]]);
});

test('readBible always returns current file text and original-byte SHA, never indexed text', async t => {
  const f = await fixture(t);
  f.index.set(BIBLE, sha('old version'));
  const result = await f.entry().readBible(BIBLE);
  const actual = await readFile(path.join(f.docsRoot, BIBLE));
  assert.equal(result.doc_sha, sha(actual));
  assert.equal(result.index_status, 'stale');
  assert.equal(result.source, 'live_file');
  assert.match(result.content, /current verified renderer/);
  assert.doesNotMatch(result.content, /STALE INDEX TEXT/);
  assert.notEqual(result.updated_at, '2020-01-01T00:00:00Z');
});

test('every entry rereads files, merchant facts and index hashes even when process inspection is cached', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  const first = await entry.check(ACTOR);
  await f.put(BIBLE, bible('Use the newly verified local renderer.'), false);
  await f.put(RULES, rules('Updated Merchant', 'acct_UpdatedMerchant'), false);
  const second = await entry.check(ACTOR);
  assert.equal(second.status, 'ready_live_reference');
  assert.equal(second.automation.status, 'degraded');
  assert.ok(second.documents.every(document => document.index_status === 'stale'));
  assert.notEqual(second.documents[0].doc_sha, first.documents[0].doc_sha);
  assert.equal(second.recent_decisions, 'Use the newly verified local renderer.');
  assert.equal(second.stripe_default.name, 'Updated Merchant');
  assert.equal(second.stripe_default.account_id, 'acct_UpdatedMerchant');
  assert.equal(f.inspections(), 1);
  for (const docPath of [BIBLE, RULES]) f.index.set(docPath, sha(await readFile(path.join(f.docsRoot, docPath))));
  assert.equal((await entry.check(ACTOR)).status, 'ready');
});

test('a fresh successful receipt cannot make stale or missing source hashes healthy', async t => {
  const f = await fixture(t);
  f.index.delete(RULES);
  f.index.set(BIBLE, sha('prior source'));
  const result = await f.entry().check(ACTOR);
  assert.deepEqual(result.documents.map(document => document.index_status), ['stale', 'missing']);
  assert.equal(result.status, 'ready_live_reference');
  assert.equal(result.automation.status, 'degraded');
  assert.ok(result.automation.reasons.includes('index_not_current'));
});

test('metadata failure degrades to live reference and never exposes database errors', async t => {
  const f = await fixture(t);
  f.setFailure(new Error(`postgres://swade:secret-password@private-db ${f.root}/private.env`));
  const entry = f.entry();
  const result = await entry.check(ACTOR);
  assert.equal(result.status, 'ready_live_reference');
  assert.ok(result.documents.every(document => document.index_status === 'unavailable'));
  assert.match(result.recent_decisions, /verified renderer/);
  assert.doesNotMatch(JSON.stringify(result), /secret-password|private-db|private\.env/);
  assert.match((await entry.readBible(BIBLE)).content, /Private roadmap/);
});

test('public Bible reads reject traversal, alternate roots, encoded paths and internal rules', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  for (const docPath of [
    '../STANDING_RULES.md', '/etc/passwd', 'site-bibles/../../private.md',
    'site-bibles/%2e%2e%2fprivate.md', 'site-bibles\\private.md',
    'site-bibles/a.md\0', 'site-bibles/a.txt', 'learning-approved/private.md', RULES,
  ]) {
    await assert.rejects(entry.readBible(docPath), error => error.code === 'invalid_bible_path' && error.status === 400);
  }
  assert.equal(f.queries.length, 0);
});

test('symlinks cannot escape to sibling directories sharing the root prefix', async t => {
  const f = await fixture(t);
  const outside = path.join(f.root, 'docs-private');
  await mkdir(outside);
  await writeFile(path.join(outside, 'Secret.md'), 'private-outside-secret');
  await symlink(path.join(outside, 'Secret.md'), path.join(f.docsRoot, 'site-bibles', 'Escape.md'));
  await assert.rejects(f.entry().readBible('site-bibles/Escape.md'), sanitizedUnavailable(f.root));
});

test('a directory symlink cannot redirect mandatory live reads outside the approved root', async t => {
  const f = await fixture(t);
  const outside = path.join(f.root, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'SWADEBASE_Master_Site_Bible.md'), 'outside-private-source');
  await rm(path.join(f.docsRoot, 'site-bibles'), { recursive: true });
  await symlink(outside, path.join(f.docsRoot, 'site-bibles'));
  await assert.rejects(f.entry().check(ACTOR), sanitizedUnavailable(f.root));
  assert.equal(f.inspections(), 0);
});

test('missing either mandatory reference fails before metadata or automation work', async t => {
  for (const docPath of [BIBLE, RULES]) {
    await t.test(docPath, async t => {
      const f = await fixture(t);
      await rm(path.join(f.docsRoot, docPath));
      await assert.rejects(f.entry().check(ACTOR), sanitizedUnavailable(f.root));
      assert.equal(f.queries.length, 0);
      assert.equal(f.inspections(), 0);
    });
  }
});

test('document limit is enforced in bytes and accepts the exact supported maximum', async t => {
  const f = await fixture(t);
  await f.put('site-bibles/Limit.md', 'a'.repeat(512 * 1024));
  assert.equal((await f.entry().readBible('site-bibles/Limit.md')).content.length, 512 * 1024);
  await f.put('site-bibles/Limit.md', 'a'.repeat(512 * 1024 + 1));
  await assert.rejects(f.entry().readBible('site-bibles/Limit.md'), sanitizedUnavailable(f.root));
  await f.put('site-bibles/Unicode.md', '🎶'.repeat(140_000));
  await assert.rejects(f.entry().readBible('site-bibles/Unicode.md'), sanitizedUnavailable(f.root));
});

test('non-files and invalid UTF-8 are unavailable instead of returning arbitrary bytes', async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.docsRoot, 'site-bibles', 'Directory.md'));
  await assert.rejects(f.entry().readBible('site-bibles/Directory.md'), sanitizedUnavailable(f.root));
  await writeFile(path.join(f.docsRoot, 'site-bibles', 'Binary.md'), Buffer.from([0xff, 0xfe]));
  await assert.rejects(f.entry().readBible('site-bibles/Binary.md'), sanitizedUnavailable(f.root));
});

test('secrets are redacted from live text and summaries without changing the source hash', async t => {
  const f = await fixture(t);
  const raw = bible(`STRIPE_SECRET_KEY=sk_live_testSecretValue
Webhook whsec_anotherPrivateValue
Authorization: Bearer privateBearerValue
Connect postgres://operator:privateDatabasePassword@db.internal/app
password: obscureFixturePassword
-----BEGIN PRIVATE KEY-----
private-key-fixture-body
-----END PRIVATE KEY-----
Use the current account safely.`);
  await f.put(BIBLE, raw);
  const entry = f.entry();
  const document = await entry.readBible(BIBLE);
  const context = await entry.check(ACTOR);
  assert.equal(document.doc_sha, sha(raw));
  assert.match(document.content, /\[REDACTED/);
  for (const secret of ['sk_live_testSecretValue', 'whsec_anotherPrivateValue', 'privateBearerValue', 'privateDatabasePassword', 'obscureFixturePassword', 'private-key-fixture-body']) {
    assert.equal(JSON.stringify({ document, context }).includes(secret), false, secret);
  }
});

test('quoted and nested JSON credentials are redacted while version and account fields remain intact', async t => {
  const f = await fixture(t);
  const payload = {
    api_key: 'dummy-json-"quoted"-private-suffix',
    nested: { service_token: 'dummy-nested-service-token', version: 'service-v3' },
    version: 'renderer-v2.4', token_version: 'owner-token-v5', account_id: 'acct_ExampleMerchant',
  };
  const raw = bible(JSON.stringify(payload));
  await f.put(BIBLE, raw);
  const entry = f.entry();
  const document = await entry.readBible(BIBLE);
  const parsed = JSON.parse(document.content.split('\n').find(line => line.startsWith('{')));
  assert.equal(parsed.api_key, '[REDACTED]');
  assert.equal(parsed.nested.service_token, '[REDACTED]');
  assert.equal(parsed.nested.version, 'service-v3');
  assert.equal(parsed.version, 'renderer-v2.4');
  assert.equal(parsed.token_version, 'owner-token-v5');
  assert.equal(parsed.account_id, 'acct_ExampleMerchant');
  assert.equal(document.doc_sha, sha(raw));
  const output = JSON.stringify({ document, context: await entry.check(ACTOR) });
  assert.doesNotMatch(output, /dummy-json|private-suffix|dummy-nested-service-token/);
});

test('quoted YAML, block credentials and generic owner/service token assignments are redacted', async t => {
  const f = await fixture(t);
  const raw = bible(`"api_key": "dummy-yaml-api"
'password': 'dummy-yaml-password'
ADAPTERS_OWNER_TOKEN=dummy-owner-token
INTERNAL_SERVICE_TOKEN='dummy-service-token'
"service_role_key": "dummy-service-role"
"client_secret": |
  dummy-block-first-line
  dummy-block-second-line
version: renderer-v2.4
ADAPTERS_OWNER_TOKEN_VERSION=owner-token-v5
account_id: acct_ExampleMerchant`);
  await f.put(BIBLE, raw);
  const entry = f.entry();
  const document = await entry.readBible(BIBLE);
  const output = JSON.stringify({ document, context: await entry.check(ACTOR) });
  assert.doesNotMatch(output, /dummy-yaml-api|dummy-yaml-password|dummy-owner-token|dummy-service-token|dummy-service-role|dummy-block/);
  assert.match(document.content, /version: renderer-v2\.4/);
  assert.match(document.content, /ADAPTERS_OWNER_TOKEN_VERSION=owner-token-v5/);
  assert.match(document.content, /account_id: acct_ExampleMerchant/);
  assert.equal(document.doc_sha, sha(raw));
});

test('merch-only actors and malformed scopes receive no private reference data', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  for (const actor of [{ scopes: ['merch:read', 'merch:report'] }, { scopes: 'ecosystem:read' }, { scopes: ['ecosystem:read-extra'] }, {}]) {
    const result = await entry.check(actor);
    assert.deepEqual(Object.keys(result).sort(), ['automation', 'checked_at', 'reference_boundary', 'status', 'version']);
    assert.deepEqual(result.automation, { status: 'healthy' });
    assert.doesNotMatch(JSON.stringify(result), /acct_|Merchant|lantern-market|STANDING_RULES|site-bibles|doc_sha/);
  }
  assert.equal((await entry.check(ACTOR)).stripe_default.account_id, 'acct_ExampleMerchant');
});

test('limited actors cannot bypass a missing mandatory reference', async t => {
  const f = await fixture(t);
  await rm(path.join(f.docsRoot, RULES));
  await assert.rejects(f.entry().check({ scopes: ['merch:read'] }), sanitizedUnavailable(f.root));
});

test('receipt failures degrade health even when the service exit status is zero', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  const cases = [
    [{ status: 'error', error: 'private-error-secret' }, 'receipt_failed'],
    [{ time_utc: '2026-11-07T11:47:59Z' }, 'receipt_stale'],
    [{ time_utc: '2026-11-07T12:01:01Z' }, 'receipt_future'],
    [{ time_utc: 'not-a-date' }, 'receipt_invalid'],
  ];
  for (const [value, reason] of cases) {
    await f.receipt(value);
    const result = await entry.check(ACTOR);
    assert.equal(result.status, 'ready_live_reference');
    assert.equal(result.automation.status, 'degraded');
    assert.ok(result.automation.reasons.includes(reason));
    assert.doesNotMatch(JSON.stringify(result), /private-error-secret/);
  }
  await rm(f.receiptPath);
  assert.ok((await entry.check(ACTOR)).automation.reasons.includes('receipt_missing'));
  await writeFile(f.receiptPath, 'invalid JSON with a private-token');
  const invalid = await entry.check(ACTOR);
  assert.ok(invalid.automation.reasons.includes('receipt_invalid'));
  assert.doesNotMatch(JSON.stringify(invalid), /private-token/);
});

test('receipt freshness is reevaluated on every entry with precise age bounds', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  await f.receipt({ time_utc: '2026-11-07T11:48:00Z' });
  assert.equal((await entry.check(ACTOR)).automation.status, 'healthy');
  f.setTime('2026-11-07T12:00:00.001Z');
  assert.ok((await entry.check(ACTOR)).automation.reasons.includes('receipt_stale'));
  await f.receipt({ time_utc: '2026-11-07T12:01:00Z' });
  assert.equal((await entry.check(ACTOR)).automation.status, 'healthy');
  assert.equal(f.inspections(), 1);
});

test('active timer does not count as healthy without the exact loaded indexing hook', async t => {
  const f = await fixture(t);
  for (const DropInPaths of ['', '/etc/systemd/system/sssbrain-guardian.service.d/guardian-knowledge-index.conf.backup', '/etc/systemd/system/another.service.d/guardian-knowledge-index.conf']) {
    const system = healthyInspection();
    system.service.DropInPaths = DropInPaths;
    f.setSystem(system);
    const result = await f.entry().check(ACTOR);
    assert.equal(result.automation.timer_active, true);
    assert.equal(result.automation.hook_loaded, false);
    assert.equal(result.automation.status, 'degraded');
  }
  const inactive = healthyInspection();
  inactive.timer.ActiveState = 'inactive';
  f.setSystem(inactive);
  assert.ok((await f.entry().check(ACTOR)).automation.reasons.includes('timer_not_active'));
  const unloaded = healthyInspection();
  unloaded.service.LoadState = 'not-found';
  f.setSystem(unloaded);
  assert.equal((await f.entry().check(ACTOR)).automation.hook_loaded, false);
});

test('inspection errors are sanitized and cached only briefly while files remain live', async t => {
  const f = await fixture(t);
  f.setSystem(new Error(`Failed /private/system/path SECRET=do-not-return ${f.root}`));
  const entry = f.entry();
  const failed = await entry.check(ACTOR);
  assert.ok(failed.automation.reasons.includes('automation_inspection_unavailable'));
  assert.doesNotMatch(JSON.stringify(failed), /do-not-return|private\/system\/path/);
  f.setSystem(healthyInspection());
  f.setTime('2026-11-07T12:00:11Z');
  assert.equal((await entry.check(ACTOR)).automation.status, 'healthy');
  assert.equal(f.inspections(), 2);
});

test('merchant extraction ignores fenced examples and unrelated historical accounts', async t => {
  const f = await fixture(t);
  await f.put(RULES, `# Rules\n\n\`\`\`markdown\n## Shared Stripe merchant\nDefault merchant **Fake** account acct_Fake\n\`\`\`\n\n${rules('Actual Current Merchant', 'acct_CurrentSource')}`);
  const result = await f.entry().check(ACTOR);
  assert.equal(result.stripe_default.name, 'Actual Current Merchant');
  assert.equal(result.stripe_default.account_id, 'acct_CurrentSource');
  assert.doesNotMatch(result.stripe_default.reference_excerpt, /acct_Fake|acct_UnrelatedHistory/);
});

test('ambiguous or missing merchant authority stays unresolved without a hardcoded fallback', async t => {
  const f = await fixture(t);
  await f.put(RULES, '# Rules\n\n## Shared Stripe merchant\n\nDefault merchant **One**, account acct_One.\n\nDefault merchant **Two**, account acct_Two.\n');
  let result = await f.entry().check(ACTOR);
  assert.equal(result.stripe_default.status, 'unresolved');
  assert.equal(result.stripe_default.account_id, null);
  await f.put(RULES, '# Rules\n\nNo merchant decision is documented.\n');
  result = await f.entry().check(ACTOR);
  assert.equal(result.stripe_default.name, null);
  assert.equal(result.stripe_default.reference_excerpt, '');
});

test('recent decisions and merchant excerpts remain compact', async t => {
  const f = await fixture(t);
  await f.put(BIBLE, bible('Current decision. '.repeat(500)));
  await f.put(RULES, rules().replace('Owner approval', 'Context. '.repeat(500) + 'Owner approval'));
  const result = await f.entry().check(ACTOR);
  assert.equal(result.recent_decisions.length, 1600);
  assert.ok(result.stripe_default.reference_excerpt.length <= 1200);
  assert.equal(result.stripe_default.account_id, 'acct_ExampleMerchant');
});

test('latest appended checkpoint supersedes older decisions and supplies a fallback without special headings', async t => {
  const f = await fixture(t);
  const entry = f.entry();
  await f.put(BIBLE, `${bible('An older renderer decision.')}\n## Shared Stripe merchant — owner reaffirmed November 7, 2026\n\nThe current checkpoint uses the verified shared merchant.\n`);
  let result = await entry.check(ACTOR);
  assert.equal(result.recent_decisions, 'The current checkpoint uses the verified shared merchant.');
  assert.doesNotMatch(result.recent_decisions, /older renderer/);
  await f.put(BIBLE, '# Master\n\n## Earlier architecture\n\nOld context.\n\n## Entry automation checkpoint\n\n' + 'Use the newest verified entry behavior. '.repeat(100));
  result = await entry.check(ACTOR);
  assert.match(result.recent_decisions, /^Use the newest verified entry behavior\./);
  assert.equal(result.recent_decisions.length, 1600);
});

test('internal readReference reads current standing rules but keeps the same path and redaction boundaries', async t => {
  const f = await fixture(t);
  await f.put(RULES, rules('Current Internal Merchant', 'acct_InternalCurrent') + '\nADAPTERS_OWNER_TOKEN=dummy-internal-owner-token\n', false);
  const entry = f.entry();
  const result = await entry.readReference(RULES);
  assert.equal(result.doc_path, RULES);
  assert.equal(result.index_status, 'stale');
  assert.match(result.content, /Current Internal Merchant/);
  assert.doesNotMatch(result.content, /dummy-internal-owner-token/);
  assert.equal(result.doc_sha, sha(await readFile(path.join(f.docsRoot, RULES))));
  assert.equal((await entry.readReference(BIBLE)).source, 'live_file');
  for (const docPath of ['../STANDING_RULES.md', '/etc/passwd', 'site-bibles/../../private.md', 'learning-approved/private.md']) {
    await assert.rejects(entry.readReference(docPath), error => error.code === 'invalid_bible_path' && error.status === 400);
  }
  await assert.rejects(entry.readBible(RULES), error => error.code === 'invalid_bible_path' && error.status === 400);
});
