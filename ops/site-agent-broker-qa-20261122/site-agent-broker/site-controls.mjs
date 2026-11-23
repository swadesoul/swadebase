// Site agent preferences live in SWADEBASE, not in each connected website.
export const SITE_CAPABILITIES = Object.freeze([
  "chat","voice","computer","vault","api","phone","email","ssh","billing",
  "site_read","site_write","memory","design","video","schedule"
]);
export const SITE_ENGINES = Object.freeze(["rakazo","mausbot","hybrid"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SITE_REF = /^[a-z0-9][a-z0-9_.:-]{0,127}$/i;
const AGENT_REF = /^[a-z][a-z0-9_-]{0,63}$/;
const fail = code => { throw Error(code); };
const plain = x => x && typeof x === "object" && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const flags = (input,keys,label) => {
  if (!plain(input) || Object.keys(input).some(x=>!keys.includes(x) || typeof input[x] !== "boolean")) fail("invalid_"+label);
  return Object.fromEntries(Object.keys(input).sort().map(k=>[k,input[k]]));
};
export function validateSiteControlPatch(patch,{allowedAgents=[],ready={verified:false,capabilities:[]}}={}) {
  if (!plain(patch) || Object.keys(patch).some(k=>!["enabled","engine","features","agentEnabled"].includes(k))) fail("invalid_control_patch");
  const result = {};
  if ("engine" in patch) { if (!SITE_ENGINES.includes(patch.engine)) fail("invalid_engine"); result.engine = patch.engine; }
  if ("enabled" in patch) { if (typeof patch.enabled !== "boolean") fail("invalid_enabled"); result.enabled = patch.enabled; }
  if ("features" in patch) result.features = flags(patch.features,SITE_CAPABILITIES,"features");
  if ("agentEnabled" in patch) result.agentEnabled = flags(patch.agentEnabled,allowedAgents,"agents");
  if ((patch.enabled === true || Object.values(result.features||{}).some(Boolean) || Object.values(result.agentEnabled||{}).some(Boolean)) && ready.verified !== true) fail("runtime_not_verified");
  if (Object.entries(result.features||{}).some(([capability,on])=>on && !ready.capabilities?.includes(capability))) fail("runtime_capability_unavailable");
  return result;
}
const defaultControl = () => ({engine:"rakazo",enabled:false,features:{},agentEnabled:{},version:0});
function mergeControl(current,patch) {
  return {...current,...patch,features:{...current.features,...(patch.features||{})},agentEnabled:{...current.agentEnabled,...(patch.agentEnabled||{})},version:current.version+1};
}
/**
 * store.actor() and store.scoped() are existing SWADEBASE authenticated,
 * tenant-scoped Developer Studio patterns. Site lookup reuses the canonical
 * mail_machine_registered_sites registry; no duplicate site table is created.
 */
export function createSiteControlStore({store,allowedAgents,engineHealth}={}) {
  if (!store || typeof store.actor!=="function" || typeof store.scoped!=="function"
      || typeof engineHealth!=="function" || typeof allowedAgents!=="function") fail("trusted_components_required");
  async function inSite(session,source,id,action) {
    const actor=await store.actor(session);
    if (!UUID.test(String(actor||"")) || !SITE_REF.test(source) || !SITE_REF.test(id)) fail("verified_site_owner_required");
    return store.scoped(actor,async db=>{
      await db.query("select set_config('app.user_id',$1,true)",[actor]);
      const found=(await db.query("select source,id,name,url from swadebase_ops.mail_machine_registered_sites()")).rows
        .find(row=>row.source===source && String(row.id)===id);
      if (!found) fail("site_not_registered_for_owner");
      return action({db,actor,site:found});
    });
  }
  async function get(session,source,id) {
    return inSite(session,source,id,async({db,actor,site})=>{
      const result=await db.query(
        "select engine,enabled,features,agent_enabled,version from swadebase_ops.site_agent_controls where owner_id=$1 and registered_source=$2 and registered_site_id=$3",
        [actor,source,id]);
      const row=result.rows[0];
      return {site:{id,name:site.name,url:site.url,source},control:row?{engine:row.engine,enabled:row.enabled,features:row.features,agentEnabled:row.agent_enabled,version:Number(row.version)}:defaultControl()};
    });
  }
  async function save(session,source,id,patch,expectedVersion) {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion<0) fail("version_required");
    return inSite(session,source,id,async({db,actor,site})=>{
      await db.query("select pg_advisory_xact_lock(hashtext($1))",[actor+":"+source+":"+id]);
      const rows=(await db.query(
        "select engine,enabled,features,agent_enabled,version from swadebase_ops.site_agent_controls where owner_id=$1 and registered_source=$2 and registered_site_id=$3 for update",
        [actor,source,id])).rows;
      const old=rows[0]?{engine:rows[0].engine,enabled:rows[0].enabled,features:rows[0].features,agentEnabled:rows[0].agent_enabled,version:Number(rows[0].version)}:defaultControl();
      if (old.version!==expectedVersion) fail("stale_site_controls");
      const engine=patch?.engine??old.engine;
      const ready=await engineHealth({site,engine,actor}).catch(()=>({verified:false,capabilities:[]}));
      const validated=validateSiteControlPatch(patch,{allowedAgents:await allowedAgents({site,actor}),ready});
      const next=mergeControl(old,validated);
      // Revocation remains possible even if a worker or its health check is down.
      // Only newly enabled capabilities require positive live runtime proof.
      const result=await db.query(
        `insert into swadebase_ops.site_agent_controls(owner_id,registered_source,registered_site_id,engine,enabled,features,agent_enabled,version)
         values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)
         on conflict(owner_id,registered_source,registered_site_id)
         do update set engine=excluded.engine, enabled=excluded.enabled,features=excluded.features,
           agent_enabled=excluded.agent_enabled,version=excluded.version,updated_at=now()
         where swadebase_ops.site_agent_controls.version=$9 returning version`,
        [actor,source,id,next.engine,next.enabled,JSON.stringify(next.features),JSON.stringify(next.agentEnabled),next.version,expectedVersion]);
      if (result.rowCount!==1) fail("stale_site_controls");
      return {site:{id,source},control:next};
    });
  }
  return {get,save};
}
