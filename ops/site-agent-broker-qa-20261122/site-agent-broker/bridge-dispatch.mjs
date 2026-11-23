import { verifySiteAgentToken } from "./bridge-auth.mjs";
import { authorizeAgentOperation } from "./policy.mjs";

/**
 * Execute-side authorization, never call from untrusted browser code.
 * loadState is a trusted SWADEBASE DB lookup of CURRENT grants and switches.
 * It must fail if stale, disabled or unavailable; do not rely on token claims alone.
 */
export async function authorizeLiveSiteDispatch({
  key, token, expectedSiteId, expectedTenantId, engine,
  replayCache, loadState, now = Date.now()
} = {}) {
  if (typeof loadState !== "function") throw Error("trusted_site_state_required");
  const claims = await verifySiteAgentToken({
    key,token,expectedSiteId,expectedTenantId,engine,replayCache,now
  });
  const state = await loadState({
    siteId: claims.siteId, tenantId: claims.tenantId, userId: claims.userId,
    agent: claims.agent, capability: claims.capability, operation: claims.operation, engine: claims.engine
  });
  if (!state || !state.actor || !state.site || !state.grant || !state.ready || !state.entitlement) throw Error("live_site_state_unavailable");
  if (state.actor.userId !== claims.userId || state.actor.tenantId !== claims.tenantId || state.site.siteId !== claims.siteId) throw Error("identity_changed");
  if (state.site.engine !== "hybrid" && state.site.engine !== claims.engine) throw Error("engine_revoked");
  const decision = authorizeAgentOperation({
    actor: state.actor, site: state.site, agent: claims.agent, capability: claims.capability,
    operation: claims.operation, grant: state.grant, ready: state.ready,
    entitlement: state.entitlement, now
  });
  if (!decision.allowed) throw Error("live_scope_denied:" + decision.reason);
  if (claims.mode === "reversible_write") {
    if (claims.capability !== "site_write" || state.grant.rollbackRef !== claims.rollbackRef
      || state.grant.ownerApproved !== true) throw Error("live_rollback_approval_denied");
  }
  if (claims.mode === "read" && claims.capability === "site_write") throw Error("read_only_token");
  return Object.freeze({
    siteId: claims.siteId, tenantId: claims.tenantId,
    agent: claims.agent, capability: claims.capability, operation: claims.operation,
    engine: claims.engine, mode: claims.mode, userId: claims.userId,
    ...(claims.rollbackRef ? { rollbackRef: claims.rollbackRef } : {})
  });
}

/**
 * Actual production replay cache must use atomic PostgreSQL insert.
 * Staging memory cache cannot cover multiple worker replicas.
 */
export function createPostgresReplayCache({ pool, siteId, tenantId } = {}) {
  if (!pool || typeof pool.query !== "function" || typeof siteId !== "string" || typeof tenantId !== "string") throw Error("postgres_replay_store_required");
  return {
    async consume(nonce, expiresAt) {
      if (!/^[a-f0-9]{32}$/.test(nonce) || !Number.isSafeInteger(expiresAt)) throw Error("invalid_replay_entry");
      // DB NOW() provides one authoritative clock; expired entries cannot be inserted.
      const response = await pool.query(
        `insert into swadebase_ops.site_agent_token_nonces(site_id,tenant_id,nonce,expires_at)
         select $1,$2,$3,to_timestamp($4::double precision / 1000)
         where to_timestamp($4::double precision / 1000) > now()
         on conflict (site_id,tenant_id,nonce) do nothing returning nonce`,
        [siteId,tenantId,nonce,expiresAt]
      );
      return response.rowCount === 1;
    }
  };
}
