import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const BASE='/adapters/mcp';
export const ORIGIN='https://swadebase.cloud';
export const RESOURCE=ORIGIN+BASE;
export const SCOPES=['ecosystem:read','operator:plan','tasks:write'];
export const MERCH_SCOPES=['merch:read','merch:report'];
export const SUPPORTED_SCOPES=[...SCOPES,...MERCH_SCOPES];
export const sha=s=>createHash('sha256').update(s).digest('hex');
export const opaque=()=>randomBytes(32).toString('base64url');
export const pkce=s=>createHash('sha256').update(s).digest('base64url');
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function scopeList(s){const a=String(s||'ecosystem:read operator:plan').split(/\s+/).filter(Boolean);if(!a.length||a.some(x=>!SUPPORTED_SCOPES.includes(x))||(a.includes('operator:plan')&&!a.includes('ecosystem:read'))||(a.includes('merch:report')&&!a.includes('merch:read'))||(a.includes('tasks:write')&&(!a.includes('operator:plan')||!a.includes('ecosystem:read'))))throw Error('invalid_scope');return [...new Set(a)];}
export function redirectUri(s){const u=new URL(s);if(u.username||u.password||u.hash||s.length>2000||!(u.protocol==='https:'||(u.protocol==='http:'&&['127.0.0.1','[::1]'].includes(u.hostname))))throw Error('invalid_redirect_uri');return s;}
export function requireScope(actor,scope){if(!actor?.scopes?.includes(scope))throw Object.assign(Error('Required permission: '+scope),{code:'forbidden',status:403});}
export const PROGRAMS=[
 {id:'brainiak',name:'Brainiak',role:'Personal and business workspaces, notes and tasks',terms:/\b(brainiak|brainiac)\b/i,adapters:[]},
 {id:'sssbrain',name:'SSS Brain',role:'Research, knowledge, tasks and ecosystem coordination',terms:/\b(brain|research|knowledge|task|plan|organize|organise|report|email|github)\b/i,adapters:[]},
 {id:'resinglab',name:'ReSing Lab',role:'Music and audio production',terms:/\b(song|music|anthem|mix|stems?|mastering|audio|instrumental|beat)\b/i,adapters:['resing-mix-worker','swade-music-gpu-adapter']},
 {id:'theleaguesound',name:'The League Sound',role:'School/team context and game-day music/announcements',terms:/\b(team|school|sport|basketball|football|volleyball|cheer|championship|game.day|athlete|league)\b/i,adapters:['swade-media-core','swade-voice-service']},
 {id:'videosaywhat',name:'VideoSayWhat / Audivid',role:'Transcription, remix, re-voice and audio-based video',terms:/\b(transcri\w*|caption|remix|re.voice|audivid|promo|video)\b/i,adapters:['swade-media-core','sssbrain-render-worker']},
 {id:'teachvirt',name:'TeachVirt',role:'Courses and instructional resources',terms:/\b(course|lesson|curriculum|workbook|quiz|teach)\b/i,adapters:[]},
 {id:'blacktales',name:'Black TALES',role:'Books, narrative film and audiobook production',terms:/\b(book|chapter|story|narrative|audiobook|film)\b/i,adapters:['book-voice','sssbrain-render-worker']},
 {id:'oathloom',name:'OATHLOOM',role:'Website builds and changes',terms:/\b(website|landing.page|web.app|oathloom|build.*site)\b/i,adapters:['rea-build']}
];
export function routePrograms(text){const found=PROGRAMS.filter(p=>p.terms.test(text));return found.length?found:[PROGRAMS.find(p=>p.id==='sssbrain')];}
export function safeProgram(id){if(!PROGRAMS.some(p=>p.id===id)&&id!=='swadebase')throw Error('Unknown program.');return id;}
export function cleanRequest(s){if(typeof s!=='string'||s.trim().length<3||s.length>4000)throw Object.assign(Error('Request must contain 3–4000 characters.'),{status:400});return s.trim();}
export function limiter(max,ms){const map=new Map();let nextSweep=0;return key=>{const now=Date.now();if(now>nextSweep){for(const [k,v]of map)if(v.until<now)map.delete(k);nextSweep=now+60000;}const old=map.get(key);if(!old||old.until<now){if(map.size>10000)return false;map.set(key,{n:1,until:now+ms});return true;}return ++old.n<=max;};}

