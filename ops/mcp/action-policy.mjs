import {createHash} from 'node:crypto';
export const hasCredential=value=>/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|\b(?:sk-proj-|sk_live_|sk_test_|rk_live_|rk_test_|gh[pousr]_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i.test(String(value));
export const ACTION_SOURCE='swadebase-mcp-actions';
export const ACTION_APP='mcp_execution';
export const OPERATIONS=['repair_code','merge_pull_request','deploy_website','send_email','publish_release','delete_draft','payment_transfer'];
export const fail=(code,message,status=409)=>Object.assign(Error(message),{code,status});
export function canonical(value){if(value instanceof Date)return JSON.stringify(value.toISOString());if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export const actionDigest=value=>createHash('sha256').update(canonical(value)).digest('hex');
export const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text=(v,max,min=1)=>{if(typeof v!=='string'||v.length>max||v.trim().length<min)throw fail('invalid_input','Check required text fields.',400);return v;};
const sha=v=>{if(!/^[a-f0-9]{40}$/.test(v||''))throw fail('invalid_input','An exact Git commit or blob SHA is required.',400);return v;};
export function repositoryPath(v){text(v,240);if(v.startsWith('/')||v.includes('\\')||v.split('/').some(s=>!s||s==='.'||s==='..')||/(^|\/)(\.git|\.env[^/]*|node_modules|credentials|secrets)(\/|$)/i.test(v))throw fail('invalid_input','Choose an ordinary repository file, excluding credential paths.',400);return v;}
export function normalizeAction(operation,input){
 if(!OPERATIONS.includes(operation)||!input||typeof input!=='object'||Array.isArray(input))throw fail('invalid_input','Unknown operation or input.',400);
 if(JSON.stringify(input).length>48000||hasCredential(JSON.stringify(input)))throw fail('invalid_input','Remove credentials or reduce the request size.',400);
 const keys={repair_code:['repository','base_commit','path','expected_blob_sha','content','summary'],merge_pull_request:['repository','pull_number','head_commit'],deploy_website:['application','commit'],send_email:['to','subject','text'],publish_release:['repository','commit','tag','title','notes'],delete_draft:['draft_id','expected_digest'],payment_transfer:['destination','amount_minor','currency','purpose','reference','rules_digest']}[operation];
 if(Object.keys(input).some(k=>!keys.includes(k)))throw fail('invalid_input','Unexpected action field.',400);
 const o={...input};
 if('repository'in o){text(o.repository,80);if(!/^[a-z0-9_-]+$/i.test(o.repository))throw fail('invalid_input','Select a configured repository key.',400);}
 if(operation==='repair_code'){sha(o.base_commit);sha(o.expected_blob_sha);repositoryPath(o.path);text(o.content,32000,0);text(o.summary,240,3);}
 if(operation==='merge_pull_request'){if(!Number.isSafeInteger(o.pull_number)||o.pull_number<1)throw fail('invalid_input','Select a pull request.',400);sha(o.head_commit);}
 if(operation==='deploy_website'){text(o.application,80);if(!/^[a-z0-9_-]+$/i.test(o.application))throw fail('invalid_input','Select a configured application.',400);sha(o.commit);}
 if(operation==='send_email'){text(o.to,254);if(!/^[^\s@<>()",;:\\[\]]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(o.to))throw fail('invalid_input','Exactly one recipient is required.',400);o.to=o.to.toLowerCase();text(o.subject,240);if(/[\r\n]/.test(o.subject))throw fail('invalid_input','Subject must be one line.',400);text(o.text,20000);}
 if(operation==='publish_release'){sha(o.commit);text(o.tag,100);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(o.tag))throw fail('invalid_input','Choose a simple release tag.',400);text(o.title,240);text(o.notes,15000);}
 if(operation==='delete_draft'){if(!uuid(o.draft_id)||!/^[a-f0-9]{64}$/.test(o.expected_digest||''))throw fail('invalid_input','A draft ID and current content digest are required.',400);}
 if(operation==='payment_transfer'){if(!/^acct_[A-Za-z0-9]{8,80}$/.test(o.destination||''))throw fail('invalid_input','Use a verified Stripe connected-account payee.',400);if(!Number.isSafeInteger(o.amount_minor)||o.amount_minor<=0||o.amount_minor>1000000000)throw fail('invalid_input','Amount must be a bounded positive integer in minor units.',400);if(!['usd','eur','gbp'].includes(o.currency))throw fail('invalid_input','Supported rule currencies: usd, eur, gbp.',400);text(o.purpose,500,5);text(o.reference,120,3);o.reference=o.reference.trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(o.rules_digest||''))throw fail('payment_rules_required','Approve payment rules in the owner console before preparing a payment.');}
 return o;
}
export function normalizePaymentRules(value,now=Date.now()){
 const keys=['enabled','currency','max_payment_minor','daily_cap_minor','source_account','mode','payees','expires_at'];
 if(!value||typeof value!=='object'||Object.keys(value).some(k=>!keys.includes(k)))throw fail('invalid_input','Invalid payment rules.',400);
 const r=JSON.parse(JSON.stringify(value));
 if(typeof r.enabled!=='boolean'||!['usd','eur','gbp'].includes(r.currency)||!['test','live'].includes(r.mode)||!/^acct_[A-Za-z0-9]{8,80}$/.test(r.source_account||''))throw fail('invalid_input','Set the source account, mode and currency explicitly.',400);
 if(!Number.isSafeInteger(r.max_payment_minor)||!Number.isSafeInteger(r.daily_cap_minor)||r.max_payment_minor<0||r.daily_cap_minor<r.max_payment_minor||r.daily_cap_minor>1000000000)throw fail('invalid_input','Set explicit per-payment and daily caps in minor units.',400);
 if(!Array.isArray(r.payees)||r.payees.length>20||r.enabled&&!r.payees.length)throw fail('invalid_input','An enabled policy needs an explicit payee allowlist.',400);
 const seen=new Set();for(const p of r.payees){if(!p||Object.keys(p).some(k=>!['account','name'].includes(k))||!/^acct_[A-Za-z0-9]{8,80}$/.test(p.account||'')||seen.has(p.account))throw fail('invalid_input','Use unique verified payee accounts.',400);text(p.name,160,2);seen.add(p.account);}
 const exp=Date.parse(r.expires_at);if(!Number.isFinite(exp)||exp<=now||exp>now+30*86400000)throw fail('invalid_input','Payment rules must expire within 30 days.',400);
 return r;
}
export function checkPayment(input,policy,reservedMinor,now=Date.now()){
 if(!policy||!policy.enabled||Date.parse(policy.expires_at)<=now)throw fail('payment_rules_required','Current enabled owner-approved payment rules are required.');
 if(input.rules_digest!==actionDigest(policy))throw fail('stale_payment_rules','Payment rules changed; prepare and approve a fresh payment.');
 if(input.currency!==policy.currency||!policy.payees.some(p=>p.account===input.destination))throw fail('payment_not_allowed','Currency or payee is outside approved payment rules.');
 if(input.amount_minor>policy.max_payment_minor||reservedMinor+input.amount_minor>policy.daily_cap_minor)throw fail('payment_budget_exceeded','The approved payment or daily cap would be exceeded.');
}
export function assertExecution(row,actor,digest,now=Date.now()){
 if(row.actor!==actor.id||row.app_slug!==ACTION_APP||row.request?.source!==ACTION_SOURCE)throw fail('not_found','Action not found for this account.',404);
 if(row.request.digest!==digest||actionDigest(row.request.snapshot)!==digest)throw fail('stale_action','The approved action content changed.');
 if(row.status!=='approved'||row.approved_by!==actor.id||!row.approved_at)throw fail('approval_required','Approve this exact action in the signed-in owner console.');
 if(!Number.isFinite(Date.parse(row.request.expires_at))||Date.parse(row.request.expires_at)<=now||Date.parse(row.result?.approval_expires_at||'')<=now||!Number.isFinite(Date.parse(row.result?.approval_expires_at||'')))throw fail('approval_expired','Approval expired; prepare a fresh action.');
 if(row.result?.stage!=='approved')throw fail('already_claimed','This action has already been claimed; inspect its receipt before retrying.');
}
