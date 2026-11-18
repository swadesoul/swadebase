import {readFileSync} from 'node:fs';
import {actionDigest,fail} from './action-policy.mjs';
const DEFAULT_CONFIG={version:1,repositories:{sssbrain:{repo:'swadesoul/sssbrain',branch:'main',visibility:'private'},swadebase:{repo:'swadesoul/swadebase',branch:'master',visibility:'public'},ecosystem_hub:{repo:'swadesoul/swade-ecosystem-hub',branch:'main',visibility:'private'}},applications:{sssbrain:{repo:'swadesoul/sssbrain',uuid:'g1406wexcvceencavj1fuo0u'}}};
export function loadActionConfig(){try{return JSON.parse(readFileSync('/opt/swadebase-adapters/config/mcp-actions.json','utf8'));}catch(e){if(e.code==='ENOENT')return DEFAULT_CONFIG;throw fail('configuration_invalid','Action target configuration is invalid.',503);}}
export function makeActionProviders({env=process.env,config=loadActionConfig(),fetchImpl=fetch}={}){
 const ghToken=()=>env.GITHUB_TOKEN||env.GH_TOKEN;
 const sender=()=>env.CLIENT_DOCS_FROM||'Swade Soul <swade@publiswade.site>';
 const repo=key=>{const r=config.repositories?.[key];if(!r||!/^swadesoul\/[A-Za-z0-9_.-]+$/.test(r.repo)||!r.branch)throw fail('target_not_registered','This repository has no approved target mapping.');return r;};
 const app=key=>{const a=config.applications?.[key];if(!a||!/^[A-Za-z0-9]{8,80}$/.test(a.uuid)||!/^swadesoul\/[A-Za-z0-9_.-]+$/.test(a.repo))throw fail('target_not_registered','This website has no approved deployment mapping.');return a;};
 async function request(url,{method='GET',headers={},data,form=false}={}){
  let response;try{response=await fetchImpl(url,{method,headers:{...headers,...(data?{'content-type':form?'application/x-www-form-urlencoded':'application/json'}:{})},body:data?(form?new URLSearchParams(data).toString():JSON.stringify(data)):undefined,redirect:'error',signal:AbortSignal.timeout(25000)});}catch{throw fail('provider_outcome_unknown','Provider connection failed. Inspect this receipt before another attempt.',502);}
  const reader=response.body?.getReader();let length=0;const chunks=[];if(reader){try{for(;;){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>1048576)throw fail('provider_outcome_unknown','Provider response exceeded its limit.',502);chunks.push(part.value);}}finally{await reader.cancel().catch(()=>{});}}
  const bytes=new Uint8Array(length);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
  let result;try{result=JSON.parse(new TextDecoder().decode(bytes)||'{}');}catch{throw fail('provider_outcome_unknown','Provider response could not be verified.',502);}
  if(!response.ok)throw Object.assign(fail(response.status>=500?'provider_outcome_unknown':'provider_rejected','The provider rejected or could not confirm the request (HTTP '+response.status+').',response.status>=500?502:409),{provider_status:response.status});
  return result;
 }
 const gh=(path,options={})=>{if(!ghToken())throw fail('setup_required','Connect the existing GitHub service credential before executing repository actions.',503);return request('https://api.github.com'+path,{...options,headers:{authorization:'Bearer '+ghToken(),accept:'application/vnd.github+json','user-agent':'swadebase-approved-mcp',...options.headers}});};
 function coolifyBase(){const u=new URL(env.COOLIFY_API_URL||'https://unconfigured.invalid');if(u.username||u.password||u.search||u.hash||!env.COOLIFY_API_TOKEN||u.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(u.hostname))throw fail('setup_required','Connect the trusted Coolify API with a scoped service token.',503);return u.href.replace(/\/$/,'');}
 const cf=(path,options={})=>request(coolifyBase()+path,{...options,headers:{authorization:'Bearer '+env.COOLIFY_API_TOKEN,...options.headers}});
 const stripe=(path,options={})=>{if(!env.STRIPE_SECRET_KEY)throw fail('setup_required','The existing Stripe service is unavailable.',503);return request('https://api.stripe.com/v1'+path,{...options,form:options.method==='POST',headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY,'stripe-version':'2026-08-26.dahlia',...options.headers}});};
 function ready(operation,input={}){
  if(['repair_code','merge_pull_request','publish_release'].includes(operation)){repo(input.repository||Object.keys(config.repositories||{})[0]);if(!ghToken())throw fail('setup_required','GitHub authentication is not connected to the MCP runtime.',503);}
  if(operation==='deploy_website'){app(input.application);coolifyBase();}
  if(operation==='send_email'&&!env.RESEND_API_KEY)throw fail('setup_required','Existing outbound email is not configured.',503);
  if(operation==='payment_transfer'&&!env.STRIPE_SECRET_KEY)throw fail('setup_required','Existing Stripe authentication is not configured.',503);
 }
 function capabilities(){return ['repair_code','merge_pull_request','deploy_website','send_email','publish_release','delete_draft','payment_transfer'].map(operation=>{try{if(operation==='deploy_website'&&!Object.keys(config.applications||{}).length)throw fail('target_not_registered','No deployment target is mapped.');ready(operation,operation==='deploy_website'?{application:Object.keys(config.applications)[0]}:{});return {operation,configured:true,owner_approval_required:true,payment_rules_required:operation==='payment_transfer'};}catch(e){return {operation,configured:false,reason:e.code,detail:e.message,owner_approval_required:true};}});}
 async function context(operation,input){
  if(['repair_code','merge_pull_request','publish_release'].includes(operation)){const r=repo(input.repository);let visibility=r.visibility||'unverified';if(ghToken()){const meta=await gh('/repos/'+r.repo);if(typeof meta.private!=='boolean')throw fail('repository_visibility_unverified','Repository visibility could not be verified.');visibility=meta.private?'private':'public';}return {repository:r,visibility,config_version:config.version};}
  if(operation==='deploy_website')return {application:app(input.application),config_version:config.version,pins_exact_commit:true};
  if(operation==='send_email')return {from:sender(),reply_to:env.CLIENT_DOCS_REPLY_TO||'swadesoul@gmail.com'};
  if(operation==='payment_transfer')return {provider:'stripe_connect_transfer',settlement:'Stripe balance to connected account; not a card purchase or bank payout'};
  return {deletion_mode:'archive_owned_wiki_draft'};
 }
 async function gitEntry(repository,tree,path){const parts=path.split('/');if(parts.length>12)throw fail('invalid_input','Repository path is too deeply nested.',400);let entry;for(let i=0;i<parts.length;i++){const t=await gh(`/repos/${repository}/git/trees/${tree}`);entry=t.tree?.find(x=>x.path===parts[i]);if(!entry)throw fail('not_found','Repository file not found.',404);if(i<parts.length-1){if(entry.type!=='tree')throw fail('invalid_input','Path is not an ordinary repository file.');tree=entry.sha;}}return entry;}
 async function execute(operation,input,{id,context:approvedContext,paymentRules}={}){
  ready(operation,input);if(actionDigest(await context(operation,input))!==actionDigest(approvedContext))throw fail('stale_configuration','The action target or sender changed; review a fresh proposal.');
  if(operation==='repair_code'){
   const r=repo(input.repository),base='/repos/'+r.repo;const head=await gh(base+'/git/ref/heads/'+encodeURIComponent(r.branch));if(head.object?.sha!==input.base_commit)throw fail('stale_code','The repository changed since this patch was prepared.');
   const commit=await gh(base+'/git/commits/'+input.base_commit),entry=await gitEntry(r.repo,commit.tree.sha,input.path);if(entry.sha!==input.expected_blob_sha||entry.type!=='blob'||!['100644','100755'].includes(entry.mode))throw fail('stale_code','The exact source file or file type changed.');
   const tree=await gh(base+'/git/trees',{method:'POST',data:{base_tree:commit.tree.sha,tree:[{path:input.path,mode:entry.mode,type:'blob',content:input.content}]}});
   const created=await gh(base+'/git/commits',{method:'POST',data:{message:input.summary,tree:tree.sha,parents:[input.base_commit]}}),branch='mcp/repair-'+id;
   await gh(base+'/git/refs',{method:'POST',data:{ref:'refs/heads/'+branch,sha:created.sha}});
   const pr=await gh(base+'/pulls',{method:'POST',data:{title:input.summary,head:branch,base:r.branch,draft:true,body:'Exact owner-approved patch from SWADEBASE action '+id+'. Tests and production verification remain required before merge/deploy.'}});
   return {stage:'prepared_patch',provider_id:String(pr.number),url:pr.html_url,commit:created.sha,verification:'Draft repair PR created; tests and live repair are not verified.'};
  }
  if(operation==='merge_pull_request'){
   const r=repo(input.repository),base='/repos/'+r.repo,pr=await gh(base+'/pulls/'+input.pull_number);if(pr.head?.sha!==input.head_commit||pr.base?.ref!==r.branch||pr.draft||pr.merged)throw fail('stale_code','The PR head, target or review state changed.');
   const [checks,status]=await Promise.all([gh(base+'/commits/'+input.head_commit+'/check-runs?per_page=100'),gh(base+'/commits/'+input.head_commit+'/status')]);
   if(checks.total_count>100||status.total_count>100)throw fail('checks_unverified','Too many checks to verify in a bounded call.');
   const runs=checks.check_runs||[],statuses=status.statuses||[];if(!runs.length&&!statuses.length||runs.some(c=>c.status!=='completed'||c.conclusion!=='success')||statuses.some(s=>s.state!=='success'))throw fail('checks_unverified','All recorded PR checks must pass before merge.');
   const m=await gh(base+'/pulls/'+input.pull_number+'/merge',{method:'PUT',data:{sha:input.head_commit,merge_method:'merge'}});if(!m.merged)throw fail('provider_rejected','GitHub did not confirm the merge.');return {stage:'merged',commit:m.sha,verification:'GitHub confirmed this exact PR merge; deployment remains separate.'};
  }
  if(operation==='deploy_website'){
   const a=app(input.application),path='/applications/'+a.uuid,current=await cf(path);const normalized=String(current.git_repository||'').replace(/^https:\/\/github.com\//,'').replace(/\.git$/,'');if(normalized!==a.repo)throw fail('stale_configuration','Coolify application repository does not match the approved mapping.');
   await cf(path,{method:'PATCH',data:{git_commit_sha:input.commit}});const pinned=await cf(path);if(pinned.git_commit_sha!==input.commit)throw fail('provider_outcome_unknown','Release pin was not verified; do not repeat deployment blindly.');
   const d=await cf('/deploy',{method:'POST',data:{uuid:a.uuid,force:false}}),job=d.deployments?.find(x=>x.resource_uuid===a.uuid);if(!job?.deployment_uuid)throw fail('provider_outcome_unknown','Deployment acceptance could not be verified.');return {stage:'accepted',provider_id:job.deployment_uuid,commit:input.commit,verification:'Deployment queued with an exact commit pin; live health is not yet verified.'};
  }
  if(operation==='send_email'){
   const d=await request('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'idempotency-key':'mcp-'+id},data:{from:approvedContext.from,to:[input.to],reply_to:approvedContext.reply_to,subject:input.subject,text:input.text}});if(!d.id)throw fail('provider_outcome_unknown','Email acceptance could not be verified.');return {stage:'accepted',provider_id:d.id,verification:'Provider accepted the approved email; inbox delivery remains unverified.'};
  }
  if(operation==='publish_release'){
   const r=repo(input.repository),base='/repos/'+r.repo;
   await gh(base+'/git/commits/'+input.commit);
   let tag;try{tag=await gh(base+'/git/ref/tags/'+encodeURIComponent(input.tag));}catch(e){if(e.provider_status!==404)throw e;}
   if(tag){let object=tag.object;for(let n=0;object?.type==='tag'&&n<4;n++)object=(await gh(base+'/git/tags/'+object.sha)).object;if(object?.type!=='commit'||object.sha!==input.commit)throw fail('stale_code','The release tag points to a different commit.');}
   else await gh(base+'/git/refs',{method:'POST',data:{ref:'refs/tags/'+input.tag,sha:input.commit}});
   const d=await gh(base+'/releases',{method:'POST',data:{tag_name:input.tag,target_commitish:input.commit,name:input.title,body:input.notes,draft:false,prerelease:false}});if(!d.id||d.draft)throw fail('provider_outcome_unknown','Release publication could not be verified.');return {stage:'published',provider_id:String(d.id),url:d.html_url,verification:'GitHub confirmed the approved repository release publication.'};
  }
  if(operation==='payment_transfer'){
   if(!paymentRules)throw fail('payment_rules_required','Owner-approved rules are required.');
   const [account,balance,destination]=await Promise.all([stripe('/account'),stripe('/balance'),stripe('/accounts/'+input.destination)]);
   if(account.id!==paymentRules.source_account||typeof balance.livemode!=='boolean'||balance.livemode!==(paymentRules.mode==='live')||destination.id!==input.destination||destination.capabilities?.transfers!=='active')throw fail('payment_not_allowed','Source account, live/test mode or verified payee does not match approved rules.');
   const available=(balance.available||[]).filter(v=>v.currency===input.currency).reduce((sum,v)=>sum+v.amount,0);if(available<input.amount_minor)throw fail('insufficient_balance','Available provider balance cannot cover this payment.');
   const d=await stripe('/transfers',{method:'POST',headers:{'idempotency-key':'mcp-payment-'+id},data:{amount:String(input.amount_minor),currency:input.currency,destination:input.destination,description:input.purpose,'metadata[swade_action_id]':id,'metadata[payment_reference]':input.reference}});
   if(!d.id||d.amount!==input.amount_minor||d.currency!==input.currency||d.destination!==input.destination||typeof d.livemode!=='boolean'||d.livemode!==(paymentRules.mode==='live'))throw fail('provider_outcome_unknown','The payment receipt did not match the approved payment.');return {stage:'transferred',provider_id:d.id,amount_minor:d.amount,currency:d.currency,destination:d.destination,verification:'Stripe confirmed the connected-account transfer; external bank settlement is not asserted.'};
  }
  throw fail('unsupported_operation','This operation uses the existing actor-scoped store.');
 }
 async function readCode(input){const r=repo(input.repository);if(!/^[a-f0-9]{40}$/.test(input.commit||''))throw fail('invalid_input','An exact source commit is required.',400);const path=input.path.split('/').map(encodeURIComponent).join('/');const d=await gh(`/repos/${r.repo}/contents/${path}?ref=${input.commit}`);if(d.type!=='file'||d.size>32000||d.encoding!=='base64')throw fail('invalid_input','Only ordinary source files up to 32 KB can be read.',400);const content=Buffer.from(d.content,'base64').toString('utf8');return {repository:r.repo,commit:input.commit,path:input.path,blob_sha:d.sha,content};}
 async function repositoryStatus({repository}){const r=repo(repository),head=await gh('/repos/'+r.repo+'/git/ref/heads/'+encodeURIComponent(r.branch));return {repository:r.repo,key:repository,branch:r.branch,commit:head.object?.sha};}
 async function verifyPaymentRules(rules){const [a,b,...payees]=await Promise.all([stripe('/account'),stripe('/balance'),...rules.payees.map(p=>stripe('/accounts/'+p.account))]);if(a.id!==rules.source_account||typeof b.livemode!=='boolean'||b.livemode!==(rules.mode==='live')||payees.some((p,i)=>p.id!==rules.payees[i].account||p.capabilities?.transfers!=='active'))throw fail('payment_not_allowed','Verify the source account, account mode and connected-account payees before enabling these rules.');}
 async function paymentAccount(){const [a,b]=await Promise.all([stripe('/account'),stripe('/balance')]);return {account_id:a.id,display_name:a.business_profile?.name||a.settings?.dashboard?.display_name||null,mode:b.livemode?'live':'test'};}
 const targets=()=>({repositories:Object.entries(config.repositories||{}).map(([key,r])=>({key,repository:r.repo,branch:r.branch})),applications:Object.entries(config.applications||{}).map(([key,a])=>({key,repository:a.repo}))});
 return {ready,capabilities,targets,context,execute,readCode,repositoryStatus,paymentAccount,verifyPaymentRules};
}
