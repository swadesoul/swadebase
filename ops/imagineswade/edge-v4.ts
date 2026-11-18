import {loadB2Config,presignB2Url} from './b2.ts';
const BASE='https://swadebase.cloud';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const objectKey=(a:{actor:string;project_id:string;id:string})=>`imagineswade/${a.actor}/${a.project_id}/${a.id}`;
Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
 const key=Deno.env.get('SUPABASE_ANON_KEY');if(!key)return reply({error:'Backend unavailable'},503);
 async function rpc(name:string,p:unknown){const r=await fetch(`${BASE}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key!,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(p),signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Object.assign(new Error(d.message??'Workspace unavailable'),{status:r.status});return d;}
 const isUpload=request.headers.get('x-imagine-action')==='upload';
 if(isUpload){
  const token=request.headers.get('x-imagine-token'),actor=request.headers.get('x-imagine-actor')??'',email=request.headers.get('x-imagine-email')??'';
  const q=new URL(request.url).searchParams;const mime=request.headers.get('content-type')?.split(';')[0]??'';
  const bytes=Number(request.headers.get('content-length'));if(!bytes||bytes>52428800)return reply({error:'Maximum file size is 50 MB'},413);
  const b={id:q.get('id'),projectId:q.get('project'),name:q.get('name'),role:q.get('role'),bytes,mime};
  const a=await rpc('imagineswade_v2',{p_token:token,p_actor:actor,p_email:email,p_action:'asset_begin',p_body:b});
  const config=loadB2Config();const data=await request.arrayBuffer();if(data.byteLength!==bytes)return reply({error:'Upload size changed'},400);
  const url=await presignB2Url({config,method:'PUT',objectKey:objectKey({...a.asset,actor}),contentType:mime,expiresInSeconds:300});
  const put=await fetch(url,{method:'PUT',headers:{'Content-Type':mime},body:data,signal:AbortSignal.timeout(120000)});if(!put.ok)return reply({error:'Media could not be stored. Retry upload.'},503);
  return reply(await rpc('imagineswade_v2',{p_token:token,p_actor:actor,p_email:email,p_action:'asset_ready',p_body:{id:b.id}}));
 }
 const raw=await request.text();if(raw.length>500000)return reply({error:'Request too large'},413);const b=JSON.parse(raw);
 if(b.action==='worker'){
  const d=await rpc('imagineswade_worker',{p_token:b.token,p_action:b.operation,p_body:b.body??{}});
  const config=loadB2Config();
  if(b.operation==='claim'&&d.job){for(const a of d.assets??[])a.url=await presignB2Url({config,method:'GET',objectKey:objectKey(a),expiresInSeconds:300});}
  if(b.operation==='output'&&d.asset)d.url=await presignB2Url({config,method:'PUT',objectKey:objectKey(d.asset),contentType:'video/mp4',expiresInSeconds:300});
  return reply(d);
 }

 if(b.action==='voice_generate'){
  const v=await rpc('imagineswade_voice',{p_token:b.token,p_actor:b.actor,p_email:b.email??'',p_action:'prepare',p_body:b.body});
  if(v.asset.state==='ready')return reply({asset:v.asset});
  const voiceToken=Deno.env.get('VOICE_SERVICE_TOKEN');if(!voiceToken)return reply({error:'Voice Studio connection unavailable'},503);
  const vr=await fetch('http://172.16.0.1:8790/v1/voices',{headers:{Authorization:`Bearer ${voiceToken}`},signal:AbortSignal.timeout(10000)});if(!vr.ok)return reply({error:'Voice Studio unavailable'},503);const voices=await vr.json();
  const voice=voices.find((x:{id:string;kind:string})=>x.id===v.character.voiceId);
  if(!voice||voice.kind!=='kokoro')return reply({error:'This voice needs an approved GPU budget. Choose a CPU Voice Studio preset or upload approved audio.'},409);
  const speech=await fetch('http://172.16.0.1:8790/v1/speak',{method:'POST',headers:{Authorization:`Bearer ${voiceToken}`,'Content-Type':'application/json'},body:JSON.stringify({text:v.line.text,voice:voice.id,engine:'kokoro',format:'wav'}),signal:AbortSignal.timeout(90000)});
  if(!speech.ok)return reply({error:'Voice Studio could not render this line'},503);
  const data=await speech.arrayBuffer();if(data.byteLength<44||data.byteLength>52428800)return reply({error:'Voice output size invalid'},503);
  const url=await presignB2Url({config:loadB2Config(),method:'PUT',objectKey:objectKey(v.asset),contentType:'audio/wav',expiresInSeconds:300});
  const put=await fetch(url,{method:'PUT',headers:{'Content-Type':'audio/wav'},body:data});if(!put.ok)return reply({error:'Voice output could not be saved'},503);
  return reply(await rpc('imagineswade_voice',{p_token:b.token,p_actor:b.actor,p_email:b.email??'',p_action:'complete',p_body:{...b.body,bytes:data.byteLength}}));
 }
 const d=await rpc('imagineswade_v2',{p_token:b.token,p_actor:b.actor,p_action:b.action,p_body:b.body??{},p_email:b.email??''});
 if(b.action==='workspace'){
  try{const voiceToken=Deno.env.get('VOICE_SERVICE_TOKEN');if(voiceToken){const r=await fetch('http://172.16.0.1:8790/v1/voices',{headers:{Authorization:`Bearer ${voiceToken}`},signal:AbortSignal.timeout(5000)});if(r.ok){const voices=await r.json();d.voices=voices.filter((v:{kind:string})=>v.kind==='kokoro'||d.founder).map((v:{id:string;name:string;kind:string})=>({id:v.id,label:v.name+(v.kind==='kokoro'?' · CPU':' · GPU budget required'),locked:true,status:'active',kind:v.kind}));}}}catch{d.voice_status='unavailable';}
 }
 if(b.action==='asset_get'){
const a=d.asset;if(a?.state!=='ready')return reply({error:'Asset is not ready'},404);d.url=await presignB2Url({config:loadB2Config(),method:'GET',objectKey:objectKey({...a,actor:b.actor}),expiresInSeconds:300});}
 return reply(d);
 }catch(e){return reply({error:e instanceof Error?e.message:'Workspace unavailable'},Number((e as {status?:number}).status)||503)}
});
