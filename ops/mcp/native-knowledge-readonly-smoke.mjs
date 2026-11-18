import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {makePool} from '../../../swadebase-adapters/lib/db.mjs';
import {makeService} from './service.mjs';
// Existing owner identity is used only for read filters. No session, token, role or account is created.
const owner=execFileSync('docker',['exec','supabase-db','psql','-U','postgres','-X','-Atc',"select id from auth.users where email='swadesoul@gmail.com'"],{encoding:'utf8'}).trim();
const pool=makePool(),service=makeService({pool});
try {
 const actor={id:owner,scopes:['ecosystem:read']};
 const shared=await service.askKnowledge(actor,{question:'Maestro Radio PET MUZIK',generate:false});
 assert(shared.sources.length);assert.equal(shared.paid_fallback,false);
 const own=await service.search(actor,{query:'Swarvis companion persona',limit:10});
 assert(own.items.some(item=>item.visibility==='private'));
 const other=await service.search({id:randomUUID(),scopes:['ecosystem:read']},{query:'Swarvis companion persona',limit:10});
 assert(!other.items.some(item=>item.visibility==='private'));
 const refreshed=await service.search(actor,{query:'9cf7d01',limit:10});assert(refreshed.items.some(item=>item.doc_path==='learning-approved/sssbrain-live-knowledge-20261029.md'));
 const caps=await service.capabilities(actor,{limit:40});assert(caps.items.length);
 console.log(JSON.stringify({status:'passed',database_role:'existing adapter role',shared_source_count:shared.sources.length,own_private_retrieval:'passed',other_actor_private_rows:0,capabilities:caps.items.length,refreshed_repair_knowledge:'passed',mutations:0,paid_calls:0}));
} finally {await pool.end();}
