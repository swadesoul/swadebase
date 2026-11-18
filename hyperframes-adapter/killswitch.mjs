// SWADE adapter kill switch helper (Contract v1 amendment §8). Zero dependencies, Node 18+.
//   import { createKillSwitch } from './killswitch.mjs';
//   const ks = createKillSwitch({ adapterId: 'swadebase-hyperframes' });
//   const gate = await ks.check(); if (!gate.enabled) return reply503(gate.reason);
// Fails closed: no token, unknown adapter, a "disabled" answer, or an unreachable registry with no
// recent "enabled" answer all return enabled:false. Answers are cached for ttlMs (default 30 s).
export function createKillSwitch({
  adapterId,
  url = process.env.ADAPTER_REGISTRY_URL || 'http://127.0.0.1:18795',
  token = process.env.ADAPTER_CHECK_TOKEN,
  ttlMs = 30_000,
  graceMs = 120_000,   // how long a previous "enabled" answer may be reused if the registry is unreachable
  timeoutMs = 1500,
} = {}) {
  if (!adapterId) throw new Error('adapterId required');
  let cache = null; // { enabled, reason, at }
  async function fetchState() {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(`${url}/api/adapters/${encodeURIComponent(adapterId)}/enabled`, { headers: { authorization: `Bearer ${token}` }, signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      if (r.status === 404) return { enabled: false, reason: 'adapter not registered (fail closed)' };
      if (!r.ok || !j.ok) throw new Error(`registry ${r.status}`);
      return { enabled: j.data.enabled === true, reason: j.data.reason || null };
    } finally { clearTimeout(t); }
  }
  return {
    async check() {
      const now = Date.now();
      if (!token) return { enabled: false, reason: 'ADAPTER_CHECK_TOKEN not configured (fail closed)', source: 'config' };
      if (cache && now - cache.at < ttlMs) return { ...cache, source: 'cache' };
      try { const s = await fetchState(); cache = { ...s, at: now }; return { ...s, source: 'registry' }; }
      catch (e) {
        if (cache && cache.enabled && now - cache.at < graceMs) return { ...cache, source: 'stale' };
        return { enabled: false, reason: 'kill-switch registry unreachable (fail closed)', source: 'error' };
      }
    },
    /** Contract v1 error body for a refused request (HTTP 503, code "disabled"). */
    disabledBody(reason) {
      return { ok: false, error: { code: 'disabled', message: `Adapter ${adapterId} is switched off${reason ? ': ' + reason : ''}`, retryable: false }, error_code: 'disabled' };
    },
    reset() { cache = null; },
  };
}
