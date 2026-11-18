import test from 'node:test';import assert from 'node:assert/strict';
import {eventInput,draftInput,sendInput,digest,draftBody,senderStatus} from './whats-new-core.mjs';
test('updates require site/process/title, valid state and bounded descriptions',()=>{
 assert.equal(eventInput({site:'SWADEBASE',process:'Memory',title:'Bible update',description:'Verified documentation'}).release_state,'internal');
 assert.throws(()=>eventInput({site:'SWADEBASE',process:'Memory',title:'Update',description:'Details',release_state:'delivered'}));
 assert.throws(()=>eventInput({site:'',process:'Memory',title:'Update',description:'Details'}));
});
test('send requires specific recipient, confirmation, id and approved content reference',()=>{
 const b={recipient:'Editor@Example.com',confirm:true,request_id:'12345678-1234-4123-8123-123456789abc',digest:'a'.repeat(64)};
 assert.equal(sendInput(b).recipient,'editor@example.com');
 for(const patch of [{confirm:false},{recipient:'a@example.com,b@example.com'},{recipient:'a@example.com\nBcc: b@example.com'},{request_id:'bad'},{digest:'stale'}])assert.throws(()=>sendInput({...b,...patch}));
});
test('edits and approval state change the content fingerprint',()=>{
 const d={id:1,title:'Release',body:'Approved public summary',status:'draft'};
 assert.notEqual(digest(d),digest({...d,status:'approved_by_swade'}));assert.notEqual(digest(d),digest({...d,body:'Changed text'}));
});
test('press generation uses public summary only and configured sender exposes no key',()=>{
 const text=draftBody('Title','Verified public detail','2026-10-25T12:00:00Z');assert(text.includes('Verified public detail'));assert(!text.includes('internal description'));
 assert.equal(senderStatus({}).configured,false);const s=senderStatus({RESEND_API_KEY:'secret-value'});assert.equal(s.configured,true);assert(!JSON.stringify(s).includes('secret-value'));
 assert.throws(()=>draftInput({title:'OK',body:'short'}));
});
