// Scoped ImagineSwade bridge. Provider credentials remain on SWADEBASE.
Deno.serve(async(request:Request)=>{
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
 const raw=await request.text();if(raw.length>500000)return reply({error:'Request too large'},413);
 const b=JSON.parse(raw);const key=Deno.env.get('SUPABASE_ANON_KEY');if(!key)return reply({error:'Backend unavailable'},503);
 const r=await fetch('https://swadebase.cloud/rest/v1/rpc/imagineswade_workspace',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_token:b.token,p_actor:b.actor,p_action:b.action,p_body:b.body??{}}),signal:AbortSignal.timeout(15000)});
 const result=await r.json();return reply(r.ok?result:{error:result.message??'Workspace unavailable'},r.status);
 }catch{return reply({error:'Workspace unavailable'},503)}
});
