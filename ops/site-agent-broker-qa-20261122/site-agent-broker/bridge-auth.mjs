import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { authorizeAgentOperation, ENGINES, CAPABILITIES } from "./policy.mjs";

const ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const NONCE = /^[a-f0-9]{32}$/;
const MODES = Object.freeze(["read", "reversible_write"]);
const MAX_AGE_MS = 60_000;
const encoded = x => Buffer.from(JSON.stringify(x)).toString("base64url");
const decode = x => {
  if (typeof x !== "string" || x.length > 5000 || !/^[A-Za-z0-9_-]+$/.test(x)) throw Error("invalid_token");
  let result; try { result = JSON.parse(Buffer.from(x, "base64url").toString("utf8")); }
  catch { throw Error("invalid_token"); }
  return result;
};
const mac = (key, value) => createHmac("sha256", key).update(value).digest("base64url");
const keyCheck = key => {
  if (!Buffer.isBuffer(key) || key.length < 32) throw Error("secure_signing_key_required");
};
const fixedEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The issuer is an authenticated server only; never expose the key to React. */
export function issueSiteAgentToken({ key, actor, site, agent, capability, operation, engine, grant, entitlement, ready, mode = "read", ttlMs = 30_000, now = Date.now() }) {
  keyCheck(key);
  if (!MODES.includes(mode) || !Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > MAX_AGE_MS) throw Error("invalid_token_scope");
  if (!ENGINES.includes(engine) || (site.engine !== "hybrid" && site.engine !== engine)) throw Error("engine_denied");
  if (!CAPABILITIES.includes(capability)) throw Error("capability_denied");
  const p = authorizeAgentOperation({ actor, site, agent, capability, operation, grant, ready, entitlement, now });
  if (!p.allowed) throw Error("scope_denied:" + p.reason);
  if (!ID.test(site.siteId) || !ID.test(actor.tenantId) || !ID.test(agent) || typeof actor.userId !== "string" || actor.userId.length > 128) throw Error("invalid_identity");
  if (mode === "reversible_write" && (capability !== "site_write" || grant.ownerApproved !== true || !grant.rollbackRef)) throw Error("write_approval_and_rollback_required");
  if (mode === "read" && capability === "site_write") throw Error("mode_mismatch");
  const token = { v: 1, iss: "swadebase-site-agent-broker", siteId: site.siteId, tenantId: actor.tenantId, userId: actor.userId, agent, capability, operation, engine, mode, nonce: randomBytes(16).toString("hex"), iat: now, exp: now + ttlMs, ...(mode === "reversible_write" ? { rollbackRef: grant.rollbackRef } : {}) };
  const body = encoded(token);
  return body + "." + mac(key, body);
}

/** Receiver pins its site+tenant identity and enforces one-time requests. */
export function verifySiteAgentToken({ key, token, expectedSiteId, expectedTenantId, engine, now = Date.now(), replayCache }) {
  keyCheck(key);
  if (typeof token !== "string" || token.length > 7000) throw Error("invalid_token");
  const parts = token.split(".");
  if (parts.length !== 2 || !fixedEqual(mac(key, parts[0]), parts[1])) throw Error("invalid_signature");
  const claims = decode(parts[0]);
  if (claims.v !== 1 || claims.iss !== "swadebase-site-agent-broker" || !NONCE.test(claims.nonce)) throw Error("invalid_claims");
  if (!ID.test(claims.siteId) || !ID.test(claims.tenantId) || !ID.test(claims.agent) || !CAPABILITIES.includes(claims.capability) || typeof claims.operation !== "string" || claims.operation.length > 80) throw Error("invalid_claims");
  if (claims.siteId !== expectedSiteId || claims.tenantId !== expectedTenantId || claims.engine !== engine) throw Error("scope_mismatch");
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) || claims.exp - claims.iat > MAX_AGE_MS || claims.exp <= now || claims.iat > now + 5000) throw Error("expired_or_invalid_token");
  if (!MODES.includes(claims.mode) || claims.mode === "reversible_write" && (claims.capability !== "site_write" || typeof claims.rollbackRef !== "string" || !claims.rollbackRef)) throw Error("invalid_mode");
  // Production replayCache must be shared across replicas (PostgreSQL / atomic insert).
  if (!replayCache || typeof replayCache.consume !== "function") throw Error("durable_replay_store_required");
  return Promise.resolve(replayCache.consume(claims.nonce, claims.exp)).then(consumed => {
    if (consumed !== true) throw Error("replayed_token");
    return Object.freeze(claims);
  });
}

export function memoryReplayCache({ now = Date.now } = {}) {
  const seen = new Map();
  return { consume: async (nonce, exp) => {
    for (const [k, until] of seen) if (until <= now()) seen.delete(k);
    if (seen.has(nonce)) return false;
    seen.set(nonce, exp);
    return true;
  } };
}
