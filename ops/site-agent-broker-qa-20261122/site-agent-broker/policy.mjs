export const CAPABILITIES = Object.freeze(['voice','chat','computer','vault','api','phone','email','ssh','billing','site_read','site_write','memory','design','video','schedule']);
export const ENGINES = Object.freeze(['mausbot','rakazo','hybrid']);
const NAME=/^[a-z0-9][a-z0-9_-]{0,127}$/;
const deny=(reason)=>({allowed:false,reason});
const isString=(x)=>typeof x==='string'&&x.length>0;
export function validateSiteConfig(config){
 if(!config||typeof config!=='object'||!isString(config.siteId)||!NAME.test(config.siteId)||!isString(config.origin))throw Error('invalid_site');
 let u;try{u=new URL(config.origin);}catch{throw Error('invalid_site_origin');}
 if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('invalid_site_origin');
 if(!ENGINES.includes(config.engine))throw Error('invalid_engine');
 if(!Array.isArray(config.agents)||config.agents.some(a=>!NAME.test(a)))throw Error('invalid_agent');
 if(!config.features||typeof config.features!=='object'||Array.isArray(config.features)||Object.keys(config.features).some(k=>!CAPABILITIES.includes(k)||typeof config.features[k]!=='boolean'))throw Error('invalid_features');
 return Object.freeze({...config,origin:u.origin});
}
export function authorizeAgentOperation({actor,site,agent,capability,operation,grant,ready,entitlement,now=Date.now()}={}){
 if(!actor?.verified||!isString(actor.tenantId)||!isString(actor.userId))return deny('verified_identity_required');
 if(!site||site.tenantId!==actor.tenantId)return deny('tenant_scope_denied');
 if(!site.enabled)return deny('site_disabled');
 if(!site.agents?.includes(agent)||!site.agentEnabled?.[agent])return deny('agent_disabled');
 if(!CAPABILITIES.includes(capability)||site.features?.[capability]!==true)return deny('capability_disabled');
 if(!entitlement?.active||!entitlement.capabilities?.includes(capability))return deny('plan_not_entitled');
 if(!ready?.verified||!ready.capabilities?.includes(capability))return deny('runtime_not_verified');
 if(!grant||grant.siteId!==site.siteId||grant.tenantId!==actor.tenantId||grant.agent!==agent||grant.capability!==capability)return deny('scoped_grant_required');
 if(!grant.actions?.includes(operation))return deny('operation_not_granted');
 if(!Number.isFinite(grant.expiry)||grant.expiry<=now)return deny('grant_expired');
 if(['site_write','ssh','billing','phone','vault','api','computer'].includes(capability)&&!grant.ownerApproved)return deny('owner_approval_required');
 if(capability==='billing'&&(!Number.isFinite(grant.costCeilingUsd)||grant.costCeilingUsd<0))return deny('budget_required');
 return {allowed:true,reason:'scoped_grant_verified'};
}
export function admission({site,actor,capability,agent,engine,operation,grant,ready,entitlement,now}){
 if(!site||engine!==site.engine&&site.engine!=='hybrid')return deny('wrong_engine');
 return authorizeAgentOperation({actor,site,capability,agent,operation,grant,ready,entitlement,now});
}
