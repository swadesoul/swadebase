// Runs as the unprivileged desktop user, inside Webtop. No host control or secrets.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {timingSafeEqual} from 'node:crypto';
let child=null,relay=null,profile=null;
const secret=(await readFile('/run/secrets/browser_bridge','utf8')).trim();
const eq=v=>{const a=Buffer.from(v||''),b=Buffer.from(secret);return a.length===b.length&&timingSafeEqual(a,b);};
function killGroup(p,signal){try{process.kill(-p.pid,signal);}catch{}}
async function gracefulClose(){try{const version=await fetch('http://127.0.0.1:9222/json/version',{signal:AbortSignal.timeout(1000)}).then(r=>r.json());await new Promise(resolve=>{const ws=new WebSocket(version.webSocketDebuggerUrl);const timer=setTimeout(()=>{ws.close();resolve();},2500);ws.addEventListener('open',()=>ws.send(JSON.stringify({id:1,method:'Browser.close'})));for(const event of ['close','error'])ws.addEventListener(event,()=>{clearTimeout(timer);resolve();});});}catch{}}
async function waitExit(p,ms){if(p.exitCode!==null)return;await Promise.race([new Promise(r=>p.once('exit',r)),new Promise(r=>setTimeout(r,ms))]);}
async function stop(){if(relay){killGroup(relay,'SIGTERM');relay=null;}if(child){const p=child;child=null;await gracefulClose();await waitExit(p,3000);if(p.exitCode===null){killGroup(p,'SIGTERM');await waitExit(p,2000);}killGroup(p,'SIGKILL');}profile=null;}
http.createServer(async(req,res)=>{try{
 if(!eq(req.headers.authorization?.replace(/^Bearer /,''))){res.writeHead(401);return res.end();}
 if(req.method==='GET'&&req.url==='/status'){res.setHeader('content-type','application/json');return res.end(JSON.stringify({running:!!child,profile}));}
 if(req.method!=='POST'){res.writeHead(404);return res.end();}
 let raw='';for await(const c of req){raw+=c;if(raw.length>8192)throw Error('too_large');}const b=JSON.parse(raw||'{}');
 if(req.url==='/stop'){await stop();return res.end('{}');}
 if(req.url!=='/open'||!/^[a-f0-9]{32}$/.test(b.profile))throw Error('invalid_profile');
 const u=new URL(b.url);if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('invalid_url');
 await stop();profile=b.profile;const dir='/config/profiles/'+profile;await mkdir(dir,{recursive:true,mode:0o700});
 // The adapter is the sole browser owner. Clear stale process locks after container replacement.
 for(const name of ['SingletonLock','SingletonCookie','SingletonSocket'])await rm(dir+'/'+name,{force:true});
 // Disable browser password storage; persistent cookies remain private in this profile.
 await mkdir(dir+'/Default',{recursive:true});
 try{await readFile(dir+'/Default/Preferences');}catch{await writeFile(dir+'/Default/Preferences',JSON.stringify({credentials_enable_service:false,profile:{password_manager_enabled:false}}));}
 child=spawn('/usr/lib/chromium/chromium',['--disable-gpu','--renderer-process-limit=4','--no-first-run','--no-default-browser-check','--disable-background-networking','--password-store=basic','--remote-debugging-port=9222','--user-data-dir='+dir,u.href],{env:{...process.env,DISPLAY:':1'},stdio:'ignore',detached:true});
 const current=child;child.once('exit',()=>{if(child===current){child=null;profile=null;}});
 relay=spawn('/usr/bin/socat',['TCP-LISTEN:9223,fork,bind=0.0.0.0','TCP:127.0.0.1:9222'],{stdio:'ignore',detached:true});
 res.setHeader('content-type','application/json');res.end(JSON.stringify({running:true,profile}));
 }catch{res.writeHead(400);res.end('{"error":"operation_failed"}');}}).listen(18866,'0.0.0.0');
process.on('SIGTERM',async()=>{await stop();process.exit(0);});
