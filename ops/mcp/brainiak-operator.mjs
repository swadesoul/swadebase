// Server-only bridge; the user's token is verified by SWADEBASE and never given to a model.
export async function routeExistingOutcome(input,identity,fetchImpl=fetch){
 if(!identity?.operatorAccessToken||!/(?:create|make|build|prepare|produce|generate|route|plan|help|connect|organize|research|transcribe)/i.test(input)||!/(?:song|music|anthem|team|school|sport|video|course|book|website|github|gmail|ecosystem|resing|sss.?brain|league sound)/i.test(input))return null;
 const r=await fetchImpl('http://127.0.0.1:18795/adapters/operator/route',{method:'POST',headers:{host:'swadebase.cloud','content-type':'application/json',authorization:'Bearer '+identity.operatorAccessToken},body:JSON.stringify({request:input}),signal:AbortSignal.timeout(35000)});
 if(r.status===403)return null; // Ordinary customer workspace retains its existing behavior.
 if(!r.ok)return {text:'The ecosystem operator could not prepare this request right now. No production started. Try again shortly.',mode:'operator_unavailable'};
 const {data:d}=await r.json();
 return {text:d.status==='blocked'?'This request is blocked: '+d.reason:d.summary+'\n\n'+d.steps.map(s=>s.name+': '+s.purpose+' (Site Bible: '+s.bible_state+').').join('\n')+'\n\nThis is a prepared plan. Production has not started. Open the Ecosystem Operator in SWADEBASE to submit it to the existing coordinator.',mode:'ecosystem_plan'};
}

