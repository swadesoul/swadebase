import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VoiceSession} from './voice-session.mjs';
const deferred = () => {let resolve; const promise = new Promise(r => resolve=r); return {promise,resolve};};
function fixture(overrides={}) {
 const events=[],released=[],played=[];
 const session=new VoiceSession({transcribe:async()=> 'hello',synthesize:async()=> 'audio',play:async a=>played.push(a),release:a=>released.push(a),onState:s=>events.push(s),...overrides});
 return {session,events,released,played};
}
test('normal pipeline completes and releases audio once',async()=>{const f=fixture();assert.equal((await f.session.run('input')).status,'completed');assert.deepEqual(f.released,['audio']);assert.equal(f.events.at(-1),'idle');});
test('stop during transcription cannot synthesize or play a late reply',async()=>{const d=deferred();let calls=0;const f=fixture({transcribe:()=>d.promise,synthesize:async()=>{calls++;return 'audio'}});const run=f.session.run('input');f.session.stop();d.resolve('late');assert.equal((await run).status,'cancelled');assert.equal(calls,0);assert.deepEqual(f.played,[]);});
test('late synthesis is released without playing',async()=>{const d=deferred();const f=fixture({synthesize:()=>d.promise});const run=f.session.run('input');await Promise.resolve();f.session.stop();d.resolve('late-audio');assert.equal((await run).status,'cancelled');assert.deepEqual(f.played,[]);assert.deepEqual(f.released,['late-audio']);});
test('starting a new recording suppresses the older result',async()=>{const old=deferred();const f=fixture({transcribe:x=>x==='old'?old.promise:Promise.resolve('new')});const first=f.session.run('old');const second=await f.session.run('new');old.resolve('old');assert.equal(second.status,'completed');assert.equal((await first).status,'cancelled');assert.equal(f.played.length,1);});
test('playback rejection recovers and releases once',async()=>{const f=fixture({play:async()=>{throw Error('Playback blocked')}});assert.equal((await f.session.run('input')).status,'error');assert.equal(f.events.at(-1),'error');assert.deepEqual(f.released,['audio']);});
test('dispose suppresses pending work and rejects reuse',async()=>{const d=deferred();const f=fixture({transcribe:()=>d.promise});const run=f.session.run('input');f.session.dispose();d.resolve('late');assert.equal((await run).status,'cancelled');assert.deepEqual(f.played,[]);await assert.rejects(()=>f.session.run('again'),/disposed/);});
test('stop aborts the signal supplied to each provider',async()=>{let signal;const d=deferred();const f=fixture({transcribe:(x,o)=>{signal=o.signal;return d.promise}});const run=f.session.run('input');assert.equal(signal.aborted,false);f.session.stop();assert.equal(signal.aborted,true);d.resolve('late');await run;});
test('repeated stop releases active audio only once',async()=>{const d=deferred();const f=fixture({play:()=>d.promise});const run=f.session.run('input');await Promise.resolve();await Promise.resolve();f.session.stop();f.session.stop();d.resolve();assert.equal((await run).status,'cancelled');assert.deepEqual(f.released,['audio']);});
