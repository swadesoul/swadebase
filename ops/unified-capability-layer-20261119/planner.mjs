/** Read-only intent-to-capability planner. All actions require later authenticated SWADEBASE execution. */
import {CAPABILITIES,PROVIDERS,RELEASE_RULES} from './capabilities.mjs';
import {classifyTask,selectModel} from '../llm-routing-upgrade-20261119/auto-router.mjs';
const ID=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const APPROVAL_RISKS=new Set(['regulated','protected','sensitive']);
const KNOWN=new Set(Object.keys(CAPABILITIES));
const ACTION=/\b(send|publish|purchase|deploy|apply|transfer|file|submit|delete|subscribe|charge|invite|email|buy|book|call)\b/i;
const INTENTS=[
 [/\b(video|movie|film|trailer|commercial|ad spot|clip|animation|episode)\b/i,'video_generation'],
 [/\b(music|song|beat|soundtrack|instrumental|composition|remix)\b/i,'music_generation'],
 [/\b(narrat|narration|voiceover|speak aloud|voice recording|read aloud)\b/i,'voice_synthesis'],
 [/\b(speech.to.speech|talk to agent|voice conversation)\b/i,'voice_conversation'],
 [/\b(meeting notes|meeting summary|meeting transcript)\b/i,'meeting_intelligence'],
 [/\b(search console|search rankings|seo|site visibility|search engine)\b/i,'seo'],
 [/\b(law|legal|contract|case research|court|regulation)\b/i,'legal_research'],
 [/\b(bond|tokenization|real.world asset|due diligence)\b/i,'asset_due_diligence'],
 [/\b(spreadsheet|powerpoint|word document|office document|excel)\b/i,'office_documents'],
 [/\b(notation|sheet music|music score|music staff|midi score)\b/i,'music_notation'],
 [/\b(notion|knowledge workspace|wiki|knowledge base)\b/i,'knowledge_workspaces'],
 [/\b(screenshot|image analysis|analyze image|look at this image)\b/i,'visual_analysis'],
 [/\b(business plan|revenue|pricing strategy|sales funnel|profit)\b/i,'business'],
 [/\b(code|debug|fix bug|typescript|software development)\b/i,'code']
];
function dedupe(xs){return [...new Set(xs)]}
export function detectCapabilities(text='',explicit=[]){
 const safe=String(text).slice(0,2500);
 const desired=dedupe(explicit.filter(x=>typeof x==='string'&&KNOWN.has(x)));
 if(desired.length)return desired.slice(0,8);
 return dedupe(INTENTS.filter(([re])=>re.test(safe)).map(([,id])=>id)).slice(0,8).length
   ?dedupe(INTENTS.filter(([re])=>re.test(safe)).map(([,id])=>id)).slice(0,8)
   :['conversation'];
}
function chooseProvider(capability,{allowExternalCredits=false}={}){
 const info=CAPABILITIES[capability];
 const choices=info.tools.map(id=>({id,...PROVIDERS[id]})).filter(p=>!!p.name);
 const chosen=choices.find(p=>p.status==='verified_hosting'||p.status==='verified_storage'||(p.status==='registered_live'&&p.cost!=='gpu_metered'));
 const usable=chosen&&!['credits','metered_or_licensed','gpu_metered','licensed'].includes(chosen.cost)?chosen:null;
 const status=usable?'candidate_requires_runtime_health':choices.some(p=>p.status==='reference_only')?'licensed_not_connected':'not_verified_ready';
 return {preferred:usable?.id||null,status,alternatives:choices.map(({id,name,status,cost})=>({id,name,status,cost,requires_cost_approval:['credits','metered_or_licensed','gpu_metered','licensed'].includes(cost)&&!allowExternalCredits})),reason:usable?'Existing adapter candidate; actual job health and customer permission still required':'Do not claim capability is connected or start a paid provider'};
}
export function buildPlan({userId,tenantId,projectId,request='',capabilities=[],modelMode='auto',models=[],availableModels=new Set(),allowExternalCredits=false,attachments=[],providerConsent=false}={}){
 for(const [field,val] of [['userId',userId],['tenantId',tenantId],['projectId',projectId]])
  if(typeof val!=='string'||!ID.test(val))return {status:'invalid_context',error:`Valid ${field} is required; cannot plan against an unscoped customer`};
 if(modelMode!=='auto'&&!RELEASE_RULES.userFacingModelChoices.includes(modelMode))return {status:'invalid_model',error:'Unknown model option'};
 const requested=String(request).slice(0,2500);
 const caps=detectCapabilities(requested,capabilities);
 const permissionsSensitive=ACTION.test(requested)||caps.some(c=>APPROVAL_RISKS.has(CAPABILITIES[c].risk));
 const stages=caps.map(capability=>{
  const spec=CAPABILITIES[capability];
  const adapter=chooseProvider(capability,{allowExternalCredits});
  const model=selectModel({task:spec.modelTask,manual:modelMode,models,available:availableModels,allowPaid:false});
  return {capability,category:spec.category,requested_input_type:attachments.length?'text+attachment':'text',model,adapter,approval_required:permissionsSensitive||spec.risk==='medium'||spec.risk==='protected',status:'planned_only'};
 });
 const uncertainty=caps.includes('knowledge_workspaces')&&/\bnotation\b/i.test(requested)?'Clarify whether Notion knowledge or music notation is intended':null;
 return {status:'prepared_not_executed',tenantId,projectId,userId,route_mode:modelMode,stages,workspace:{storage:'backblaze-b2',prefix:`projects/${encodeURIComponent(tenantId)}/${encodeURIComponent(projectId)}/`,access:'server_verified_per_tenant'},safeguards:{ownerApprovalBeforeProtectedActions:true,ownerApprovalBeforePaidCredits:true,externalCreditsAuthorized:false,providerConsent:providerConsent===true,isolatedWorkspaces:true,queueAndGPUReservationBeforeRunning:true,noUnverifiedProviderAutostart:true},requestedActionWouldNeedApproval:permissionsSensitive,clarification:uncertainty,delivery:'This is a plan, not completed work'};
}
