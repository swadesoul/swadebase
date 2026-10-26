import {test} from 'node:test';
import assert from 'node:assert/strict';
import route from './route.mjs';
function response(){return {headers:{},status:0,writeHead(status,headers){this.status=status;this.headers=headers},end(body){this.body=body}}}
const req=(method='GET',body={})=>({method,headers:{origin:'https://swadebase.cloud','content-type':'application/json'},async *[Symbol.asyncIterator](){yield JSON.stringify(body)}});
test('anonymous user cannot read jobs',async()=>{const r=response();await route({pool:{},auth:{}})(req(),r,new URL('https://swadebase.cloud/adapters/api/openhands'),null);assert.equal(r.status,401)});
test('owner mutations require CSRF',async()=>{const r=response();await route({pool:{},auth:{csrfOk:()=>false}})(req('POST'),r,new URL('https://swadebase.cloud/adapters/api/openhands'),{});assert.equal(r.status,403)});
test('cross-origin read is refused',async()=>{const r=response(),request=req();request.headers.origin='https://example.com';await route({pool:{},auth:{}})(request,r,new URL('https://swadebase.cloud/adapters/api/openhands'),{});assert.equal(r.status,403)});
test('queue requires explicit confirmation',async()=>{const r=response();await route({pool:{},auth:{csrfOk:()=>true}})(req('POST',{idempotency_key:crypto.randomUUID()}),r,new URL('https://swadebase.cloud/adapters/api/openhands'),{});assert.equal(r.status,400)});
test('paused registry blocks queued work',async()=>{const r=response();const pool={connect:async()=>({query:async sql=>({rows:sql.includes('select enabled')?[{enabled:false}]:[]}),release(){}})};await route({pool,auth:{csrfOk:()=>true}})(req('POST',{confirm:true,idempotency_key:crypto.randomUUID()}),r,new URL('https://swadebase.cloud/adapters/api/openhands'),{});assert.equal(r.status,503)});
test('unrelated routes remain untouched',async()=>{assert.equal(await route({pool:{},auth:{}})(req(),response(),new URL('https://swadebase.cloud/adapters/health'),null),false)});
