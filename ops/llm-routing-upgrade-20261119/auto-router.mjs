/** SWADEBASE task-aware LLM selection contract. Read-only; never starts GPU, installs models or spends provider credits. */
const TASKS=Object.freeze({
 conversation:{primary:'chat',features:['text']},voice:{primary:'fast',features:['text'],latency:true},
 code:{primary:'code',features:['text','tools']},business:{primary:'growth_strategy',features:['text','tools']},
 reasoning:{primary:'reasoning',features:['text']},creative:{primary:'chat',features:['text']},
 vision:{primary:'vision',features:['image']},visual_analysis:{primary:'visual_analysis',features:['image']},
 social:{primary:'social_post',features:['text']}
});
export const MODEL_CATALOG=Object.freeze([
 {id:'qwen3.5:9b',label:'Qwen3.5 9B',provider:'ollama',status:'candidate',task:['conversation','business','reasoning','creative','code'],features:['text','image','tools','json'],weightGB:7.6},
 {id:'gemma4:12b',label:'Gemma 4 12B',provider:'ollama',status:'candidate',task:['vision','visual_analysis','creative'],features:['text','image','audio','json'],weightGB:8.0},
 {id:'granite4.2:8b-q4_K_M',label:'Granite 4.2 8B',provider:'ollama',status:'candidate',task:['business','code','reasoning'],features:['text','tools','json'],weightGB:5.35},
 {id:'ministral-3:8b',label:'Ministral 3 8B',provider:'ollama',status:'candidate',task:['conversation','voice','social'],features:['text','image','tools','json'],weightGB:6.0}
]);
export function selectModel({task='conversation',manual='auto',models=[],available=new Set(),allowPaid=false,voiceInteractive=false}={}){
 if(!TASKS[task])return {status:'error',reason:'Unsupported task'};
 const isAvailable=x=>available.has(x.model_name)&&x.is_enabled===true;
 const matches=x=>x.model_role===TASKS[task].primary;
 if(manual!=='auto'){
  const target=models.find(x=>x.model_name===manual);
  if(!target)return {status:'unavailable',reason:'This model is not registered',requested:manual};
  if(!isAvailable(target))return {status:'unavailable',reason:'Model not installed, unhealthy, or not enabled',requested:manual};
  if(target.provider!=='ollama'&&!allowPaid)return {status:'approval_required',reason:'External paid provider not authorized',requested:manual};
  return {status:'selected',model:target.model_name,provider:target.provider,reason:'Manual selection',task};
 }
 const primary=models.filter(x=>matches(x)&&isAvailable(x)&&(allowPaid||x.provider==='ollama'));
 // Avoid choosing a provider based only on its model name: task capability fields must match.
 const usable=primary.filter(x=>TASKS[task].features.every(f=>f==='text'?x.supports_text:f==='image'?x.supports_image_input:f==='tools'?x.supports_tool_calling:true));
 usable.sort((a,b)=>{
  const ap=a.cost_tier==='self-hosted'?0:1,bp=b.cost_tier==='self-hosted'?0:1;
  if(ap!==bp)return ap-bp;
  const af=voiceInteractive&&a.latency_tier==='fast'?-1:0,bf=voiceInteractive&&b.latency_tier==='fast'?-1:0;
  if(af!==bf)return af-bf;
  return (a.priority||99)-(b.priority||99);
 });
 if(usable.length){const chosen=usable[0];return{status:'selected',model:chosen.model_name,provider:chosen.provider,task,reason:'Healthy installed '+chosen.model_role+' model; cost and latency aware'}}
 // Cross-role local fallback only for text that does not require tools, audio, or vision.
 if(TASKS[task].features.length===1&&TASKS[task].features[0]==='text'){
  const fallback=models.filter(x=>x.provider==='ollama'&&x.model_role==='chat'&&isAvailable(x)&&x.supports_text);
  fallback.sort((a,b)=>(a.priority||99)-(b.priority||99));
  if(fallback.length)return{status:'selected',model:fallback[0].model_name,provider:'ollama',task,reason:'Healthy local text fallback, with reduced task specialization'};
 }
 return {status:'unavailable',reason:'No healthy, installed, enabled and authorized model can meet this task',task};
}
export function classifyTask(text='',meta={}){
 // Explicit structured feature metadata takes precedence over speculative text classification.
 const requested=meta.task;
 if(requested&&TASKS[requested])return requested;
 if(meta.image_input===true)return 'visual_analysis';
 if(meta.interactive_voice===true)return 'voice';
 const s=String(text).slice(0,1600).toLowerCase();
 if(/\b(debug|stack trace|typescript|javascript|code review|function|write code|unit test)\b/.test(s))return 'code';
 if(/\b(photo|image|screenshot|what do you see|picture|visual)\b/.test(s))return 'vision';
 if(/\b(revenue|business plan|customer acquisition|profit|market strategy|pricing strategy)\b/.test(s))return 'business';
 if(/\b(compare|analyze the evidence|reason through|tradeoffs)\b/.test(s))return 'reasoning';
 if(/\b(instagram post|social caption|tiktok post|newsletter headline)\b/.test(s))return 'social';
 return 'conversation';
}
