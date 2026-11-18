import test from 'node:test';import assert from 'node:assert/strict';import {routeExistingOutcome} from './brainiak-operator.mjs';
test('Brainiak bridge uses verified user token server-side, no paid fallback or execution claims',async()=>{
 let seen;const out=await routeExistingOutcome('Create a school anthem',{operatorAccessToken:'fixture'},async(u,o)=>{seen={u,o};return {ok:true,json:async()=>({data:{summary:'Prepare an anthem',steps:[{name:'ReSing Lab',purpose:'Music',bible_state:'missing_bible'}]}})}});
 assert.equal(out.mode,'ecosystem_plan');assert.match(out.text,/Production has not started/);assert(!out.text.includes('fixture'));assert.equal(seen.o.headers.authorization,'Bearer fixture');assert.match(seen.u,/127.0.0.1/);
 assert.equal(await routeExistingOutcome('Hello',{},()=>{throw Error('unexpected')}),null);
 assert.equal(await routeExistingOutcome('Create a team anthem',{operatorAccessToken:'customer'},async()=>({status:403})),null);
});

