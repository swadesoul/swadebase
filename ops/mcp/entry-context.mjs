import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const MAX_DOCUMENT = 512 * 1024;
const MAX_RECEIPT = 64 * 1024;
const BIBLE = 'site-bibles/SWADEBASE_Master_Site_Bible.md';
const RULES = 'STANDING_RULES.md';
const BOUNDARY = 'approved_reference_not_action_authorization';
const OPEN_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;

function unavailable() {
  return Object.assign(new Error('A required current reference is unavailable.'), {
    code: 'bible_unavailable', status: 503,
  });
}

function approved(docPath, internal = false) {
  return typeof docPath === 'string' && docPath.length <= 240
    && ((internal && docPath === RULES)
      || /^site-bibles\/[A-Za-z0-9][A-Za-z0-9_.-]*\.md$/.test(docPath));
}

function contained(root, file) {
  const relative = path.relative(root, file);
  return relative !== '' && !path.isAbsolute(relative)
    && relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

function credentialKey(value) {
  const key = value.trim().replace(/[ .-]+/g, '_');
  return /(?:^|_)(?:API_KEY|TOKEN|SECRET|PASSWORD|PASSWD|SERVICE_ROLE_KEY|PRIVATE_KEY|SECRET_KEY|SECRET_ACCESS_KEY)$/i.test(key);
}

const CREDENTIAL_NAME = '(?:[A-Za-z_][A-Za-z0-9_. -]{0,100}[_. -])?(?:API[_. -]+KEY|TOKEN|SECRET|PASSWORD|PASSWD|SERVICE[_. -]+ROLE[_. -]+KEY|PRIVATE[_. -]+KEY|SECRET[_. -]+(?:ACCESS[_. -]+)?KEY)';
const CREDENTIAL_VALUE = /(\[REDACTED(?: [^\]\r\n]+)?\]|"(?:\\.|[^"\\])*"|'(?:''|\\.|[^'\\])*'|`[^`]*`|[^\r\n,}\]]*)/.source;
const CREDENTIAL_ASSIGNMENT = new RegExp(`((?:"${CREDENTIAL_NAME}"|'${CREDENTIAL_NAME}'|\\b${CREDENTIAL_NAME})\\s*[:=]\\s*)${CREDENTIAL_VALUE}`, 'gi');

function redactAssignments(text) {
  const lines = text.split('\n');
  const output = [];
  for (let index = 0; index < lines.length; index++) {
    const block = lines[index].match(/^([ \t]*)(?:("[^"]+"|'[^']+'|[A-Za-z_][A-Za-z0-9_. -]*))[ \t]*:[ \t]*[|>][0-9+-]*[ \t]*(?:#.*)?\r?$/);
    if (block && credentialKey(block[2].replace(/^["']|["']$/g, ''))) {
      output.push(`${block[1]}${block[2]}: [REDACTED]`);
      while (index + 1 < lines.length && (!lines[index + 1].trim()
          || lines[index + 1].match(/^[ \t]*/)[0].length > block[1].length)) index++;
    } else output.push(lines[index]);
  }
  return output.join('\n').replace(
    CREDENTIAL_ASSIGNMENT,
    (match, prefix, value) => {
      const quote = ['"', "'", '`'].includes(value[0]) ? value[0] : '';
      return `${prefix}${quote}[REDACTED]${quote}`;
    },
  );
}

// Hash original bytes before redaction; source SHA describes the actual file.
function redact(text) {
  const recognized = text
    .replace(/-----BEGIN [^\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^\r\n]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/g, '[REDACTED]')
    .replace(/\b(?:whsec_|gh[pousr]_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/\bAKIA[A-Z0-9]{16}\b/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g, '[REDACTED]')
    .replace(/(\bBearer\s+)[^\s`"'<>]+/gi, '$1[REDACTED]')
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[REDACTED]@');
  return redactAssignments(recognized)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}

async function bounded(handle, maximum) {
  const before = await handle.stat({ bigint: true });
  if (!before.isFile() || before.size > BigInt(maximum)) throw unavailable();
  const buffer = Buffer.alloc(maximum + 1);
  let offset = 0;
  while (offset < buffer.length) {
    const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
    if (!bytesRead) break;
    offset += bytesRead;
  }
  const after = await handle.stat({ bigint: true });
  if (offset > maximum || after.size !== before.size
      || after.mtimeNs !== before.mtimeNs || after.ctimeNs !== before.ctimeNs) throw unavailable();
  return {
    bytes: buffer.subarray(0, offset),
    updated_at: new Date(Number(after.mtimeNs / 1_000_000n)).toISOString(),
  };
}

function properties(output) {
  return Object.fromEntries(output.split('\n').filter(line => line.includes('='))
    .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
}

async function inspectAutomation() {
  const options = { timeout: 2000, maxBuffer: 16 * 1024, encoding: 'utf8', killSignal: 'SIGKILL' };
  const [timer, service] = await Promise.all([
    execute('/usr/bin/systemctl', ['show', 'sssbrain-guardian.timer', '--property=LoadState,ActiveState,UnitFileState', '--no-pager'], options),
    execute('/usr/bin/systemctl', ['show', 'sssbrain-guardian.service', '--property=LoadState,DropInPaths', '--no-pager'], options),
  ]);
  return { timer: properties(timer.stdout), service: properties(service.stdout) };
}

function sections(content) {
  const lines = content.split(/\r?\n/);
  const headings = [];
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const marker = lines[index].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      continue;
    }
    if (fence) continue;
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) headings.push({ level: match[1].length, title: match[2], index });
  }
  return headings.map((heading, index) => {
    const next = headings.slice(index + 1).find(item => item.level <= heading.level);
    return { ...heading, content: lines.slice(heading.index + 1, next?.index ?? lines.length).join('\n').trim() };
  });
}

function withoutCode(content) {
  return content.replace(/^\s{0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s{0,3}\1\s*$/gm, '');
}

function merchantReference(rules) {
  const section = sections(rules).find(item => item.level === 2 && /^Shared Stripe merchant(?:\s|$)/i.test(item.title));
  const content = withoutCode(section?.content ?? '');
  const defaults = content.split(/\n\s*\n/).filter(paragraph => /\bdefault\b/i.test(paragraph));
  const authority = defaults.length ? defaults.join('\n\n') : content;
  const accounts = [...new Set(authority.match(/\bacct_[A-Za-z0-9_]+\b/g) ?? [])];
  const nameMatch = authority.match(/\bmerchant\s+\*\*([^*\r\n]{1,100})\*\*/i)
    ?? authority.match(/\bmerchant\s+`([^`\r\n]{1,100})`/i)
    ?? authority.replace(/[`*]/g, '').match(/\bmerchant\s+([^\r\n]{1,100}?)\s*,?\s+account\s+acct_/i);
  const name = nameMatch?.[1]?.trim() ?? null;
  const resolved = accounts.length === 1 && !!name && !name.includes('[REDACTED');
  return {
    status: resolved ? 'resolved' : 'unresolved', name: resolved ? name : null,
    account_id: resolved ? accounts[0] : null, source_doc_path: RULES,
    reference_excerpt: content.slice(0, 1200),
  };
}

function recentDecisions(content) {
  const ordered = sections(content);
  const finalSection = ordered.filter(section => section.level === 2).at(-1);
  // Prefer an explicit summary within the final checkpoint. An older decisions
  // section must not conceal newer appended level-two updates.
  const explicit = ordered.filter(section => (!finalSection || section.index >= finalSection.index)
    && /\b(?:recent decisions|latest decisions|current decisions|recent changes)\b/i.test(section.title)).at(-1);
  return (explicit ?? finalSection)?.content.slice(0, 1600) ?? '';
}

export function makeEntryContext({
  pool, docsRoot = '/opt/swadebase/docs',
  receiptPath = '/opt/sssbrain-ops/incident-guardian/knowledge-sync.json',
  readAutomation = inspectAutomation, now = () => new Date(),
} = {}) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('A read-only metadata pool is required.');
  let inspectionCache;
  let inspectionPending;

  async function source(docPath, internal = false) {
    if (!approved(docPath, internal)) {
      throw Object.assign(new Error('Bible path is not approved.'), { code: 'invalid_bible_path', status: 400 });
    }
    let handle;
    try {
      const root = await realpath(docsRoot);
      const canonical = await realpath(path.join(root, docPath));
      if (!contained(root, canonical) || !approved(path.relative(root, canonical), internal)) throw unavailable();
      handle = await open(canonical, OPEN_FLAGS);
      // Linux descriptor resolution closes the parent-directory symlink race:
      // validate the opened inode's path before reading any of its contents.
      const opened = await realpath(`/proc/self/fd/${handle.fd}`);
      if (opened !== canonical || !contained(root, opened)) throw unavailable();
      const { bytes, updated_at } = await bounded(handle, MAX_DOCUMENT);
      const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return { doc_path: docPath, doc_sha: createHash('sha256').update(bytes).digest('hex'), updated_at, content: redact(raw) };
    } catch {
      throw unavailable();
    } finally {
      await handle?.close().catch(() => {});
    }
  }

  async function indexed(documents) {
    try {
      const result = await pool.query(
        'select doc_path,doc_sha,updated_at from sssbrain.swadebase_docs where doc_path=any($1::text[])',
        [documents.map(document => document.doc_path)],
      );
      const rows = new Map(result.rows.map(row => [row.doc_path, row]));
      return documents.map(document => ({
        ...document,
        index_status: !rows.has(document.doc_path) ? 'missing'
          : rows.get(document.doc_path).doc_sha === document.doc_sha ? 'current' : 'stale',
      }));
    } catch {
      return documents.map(document => ({ ...document, index_status: 'unavailable' }));
    }
  }

  async function receipt(at) {
    let handle;
    try {
      handle = await open(receiptPath, OPEN_FLAGS);
      const { bytes } = await bounded(handle, MAX_RECEIPT);
      const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!value || typeof value !== 'object' || Array.isArray(value)
          || typeof value.time_utc !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(value.time_utc)
          || !Number.isFinite(Date.parse(value.time_utc))) return { reason: 'receipt_invalid' };
      if (value.status !== 'ok') return { reason: 'receipt_failed' };
      const age = at - Date.parse(value.time_utc);
      if (age < -60_000) return { reason: 'receipt_future' };
      if (age > 12 * 60_000) return { reason: 'receipt_stale' };
      return { last_success_at: new Date(value.time_utc).toISOString() };
    } catch (error) {
      return { reason: error?.code === 'ENOENT' ? 'receipt_missing' : 'receipt_invalid' };
    } finally {
      await handle?.close().catch(() => {});
    }
  }

  async function inspection(at) {
    if (inspectionCache && at < inspectionCache.expires && at >= inspectionCache.observed) return inspectionCache.value;
    if (!inspectionPending) {
      inspectionPending = Promise.resolve().then(() => readAutomation()).catch(() => null)
        .then(value => {
          inspectionCache = { value, observed: at, expires: at + 10_000 };
          return value;
        }).finally(() => { inspectionPending = null; });
    }
    return inspectionPending;
  }

  async function readBible(docPath) {
    const [document] = await indexed([await source(docPath)]);
    return { ...document, source: 'live_file', reference_boundary: BOUNDARY };
  }

  // Internal knowledge use only, after its existing ecosystem:read guard.
  async function readReference(docPath) {
    const [document] = await indexed([await source(docPath, true)]);
    return { ...document, source: 'live_file', reference_boundary: BOUNDARY };
  }

  async function check(actor) {
    const checked = new Date(now());
    const at = checked.getTime();
    if (!Number.isFinite(at)) throw unavailable();
    // Mandatory live reads finish successfully before any entry context returns.
    const live = await Promise.all([source(BIBLE), source(RULES, true)]);
    const [documents, sync, system] = await Promise.all([indexed(live), receipt(at), inspection(at)]);
    const dropIns = Array.isArray(system?.service?.DropInPaths) ? system.service.DropInPaths
      : typeof system?.service?.DropInPaths === 'string' ? system.service.DropInPaths.split(/\s+/) : [];
    const timerActive = system?.timer?.LoadState === 'loaded' && system?.timer?.ActiveState === 'active';
    const hookLoaded = system?.service?.LoadState === 'loaded' && dropIns.some(value =>
      typeof value === 'string' && /\/sssbrain-guardian\.service\.d\/guardian-knowledge-index\.conf$/.test(value));
    const reasons = [];
    if (!system) reasons.push('automation_inspection_unavailable');
    if (!timerActive) reasons.push('timer_not_active');
    if (!hookLoaded) reasons.push('index_hook_not_loaded');
    if (sync.reason) reasons.push(sync.reason);
    if (documents.some(document => document.index_status !== 'current')) reasons.push('index_not_current');
    const automation = {
      status: reasons.length ? 'degraded' : 'healthy', reasons,
      timer_active: timerActive, hook_loaded: hookLoaded,
      last_success_at: sync.last_success_at ?? null,
    };
    const compact = {
      version: 1, checked_at: checked.toISOString(),
      status: reasons.length ? 'ready_live_reference' : 'ready',
      automation: { status: automation.status }, reference_boundary: BOUNDARY,
    };
    if (!Array.isArray(actor?.scopes) || !actor.scopes.includes('ecosystem:read')) return compact;
    return {
      ...compact, documents: documents.map(({ content, ...metadata }) => metadata), automation,
      recent_decisions: recentDecisions(documents[0].content),
      stripe_default: merchantReference(documents[1].content),
    };
  }

  return { check, readBible, readReference };
}
