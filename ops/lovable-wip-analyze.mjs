import {readFile,writeFile} from 'node:fs/promises';
const root='/opt/swadebase/docs/releases';
const base=JSON.parse(await readFile(root+'/lovable-wip-inventory-20261116.json','utf8'));
const details=(await readFile(root+'/lovable-wip-detail-20261116.ndjson','utf8')).trim().split('\n').map(x=>JSON.parse(x));
const byId=new Map(details.map(x=>[x.id,x]));
const titleHints=[
 [/^resinglab\b/i,'ReSingLab'],[/^videosaywhat\b/i,'VideoSayWhat'],[/^oathloom\b/i,'OATHLOOM'],[/^sonikyn\b/i,'SONIKYN'],[/^swadesoul\.com\b/i,'SwadeSoul.com'],[/^cryptomail vault\b/i,'CryptoMail Vault'],[/^thefreq\b/i,'TheFreq'],[/^seedleaker\b/i,'SEEDLEAKER'],[/^haroldwhaley\.com\b/i,'HaroldWhaley.com'],[/^sterline wallet\b/i,'Sterline Wallet'],[/^the rwa factory\b/i,'RWA Factory']
];
const catalog=[
 {name:'ReSingLab',keys:['song','music','remix','vocal','audio generation','stems','lyrics'],role:'Music generation and remix workflows'},
 {name:'SWIDEO / ImagineSwade',keys:['video','movie','film','animation','video editor','storyboard'],role:'Video production and media editing'},
 {name:'VideoSayWhat',keys:['transcrip','caption','subtitle','speech-to-text'],role:'Transcription and captions'},
 {name:'SSS Brain / Brainiak / SWADE BOTS',keys:['agent','ai workflows','workflow','assistant','automation','bot'],role:'Shared AI workspaces, workers and automation'},
 {name:'SWADEBASE Identity / OnePass',keys:['identity','digital key','single sign','authentication','login','wallet identity'],role:'Identity and access services'},
 {name:'Asset Machine / PinHub',keys:['tokenization','asset','custody','verification','rwa','crypto'],role:'Asset and verification services'},
 {name:'SWOSTing / OATHLOOM',keys:['website','hosting','developer','app builder','site builder'],role:'Website creation and operations'},
 {name:'TeachVirt / SWADE Learn',keys:['learn','academy','course','classroom','education'],role:'Courses, credentials and education'},
 {name:'PubliSwade',keys:['publish','marketing','newsletters','social','campaign'],role:'Publishing and outreach'},
 {name:'SWADE Sign / Cochrane',keys:['legal','contract','terms','policy','law'],role:'Legal review and signing workflows'},
 {name:'Maestro Radio',keys:['radio','station','airplay','dj'],role:'Radio operations and music promotion'},
 {name:'MyDistribution',keys:['distribution','release','music distribution'],role:'Music distribution'},
 {name:'SWADE Mail / Mail Machine',keys:['email','inbox','mailbox'],role:'Email delivery and inboxes'}
];
const normalized=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const excludedNames=new Set(['MusicMogul','perk-nexus-solana','swadezperks','swadez-nft-orchestrator','syntax-soul-scribe','swadez-staking','nilfusion','dsyfur-cipher-verse','solarwealth-ecosystem','swadecall-connect','securetoken-sentinel','tokenwise-analytics','gwold-mining-adventure','karaoke-nft-revolution','vocal-vista-guide','tone-tuner','vocal-vista','capicoin-goldhaus'].map(normalized));
const likelyExisting=new Set(['swadesoulpro','swadesoul','resinglab','videosaywhat','maestroradio','sssbrain','swideo','teachvirt','divynecreatives','pinhub','oathloom','seedleaker','publiswade','abagaletv'].map(normalized));
const universal=['Identify source repository and exact commit; obtain consent before any source or data copy','Inspect actual pages, API/Edge functions, authentication, database, storage and external connections','Run existing SWADEBASE capability and Site Bible comparison; verify any proposed reuse','Prepare Hostinger/Coolify build and staged SWADEBASE backend parity check','Verify domain, HTTPS, SEO/favicons, real customer workflow, iPad Safari and rollback'];
const projects=base.projects.map(p=>{
 const detail=byId.get(p.id)||{};
 const description=(p.description||detail.description||'').trim();
 const inferred=(!p.name&&titleHints.find(([re])=>re.test(description))?.[1])||null;
 const name=p.name||inferred||'Unidentified Lovable project '+p.id.slice(0,8);
 const key=normalized(name);
 const isExcluded=excludedNames.has(key);
 const matches=catalog.map(c=>({name:c.name,role:c.role,hits:c.keys.filter(k=>(name+' '+description).toLowerCase().includes(k)).length})).filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits).slice(0,3);
 const category=isExcluded?'Excluded from migration':!p.name&&!inferred?'Needs identity resolution':likelyExisting.has(key)?'Existing product — reconcile':matches.length?'Feature Merge Candidates':'Work in Progress';
 const tasks=[...universal];
 if(!description)tasks.unshift('Recover original project brief, routes and feature descriptions; content unknown');
 if(matches.length)tasks.splice(2,0,'Compare proposed unique features with '+matches.map(x=>x.name).join(', ')+'; do not merge based on keywords alone');
 if(isExcluded)tasks.splice(0,tasks.length,'Excluded by founder screenshot; only verify exact project identity and preserve history as directed');
 const evidence=['Lovable workspace listing'+(detail.description?'; Lovable project detail text':'')];
 const report={id:p.id,title:name,name_source:p.name?'workspace listing':inferred?'description-derived candidate':'unresolved',description,classification:category,source_inspected:false,source_commit_verified:false,hosting_migration_verified:false,readiness:'not certified',potential_reuse:matches.map(x=>({system:x.name,role:x.role,evidence:'keyword similarity only; unverified capability overlap'})),tasks,effort:'Cannot estimate reliably until source and data audit',next_action:isExcluded?'Exclude from new migrations':!p.name&&!inferred?'Resolve identity from original Lovable project screenshot/URL':likelyExisting.has(key)?'Reconcile with existing deployment before any migration':matches.length?'Assess feature merge versus standalone site':'Preserve and run code audit',evidence,requires_founder_approval_for:['Public deployment','DNS cutover','Data migration','Delete or retire','Payment or spending'],last_reviewed:'2026-11-16',status:'metadata triage only'};
 return {...p,display_name:name,name_source:report.name_source,category,overlap_with:matches[0]?.name||null,overlap_question:matches[0]?'Check actual capabilities, not title similarity':'Requires feature inspection',recommendation:report.next_action,report};
});
const result={schema:'swadebase.web-family.wip-reports.v2',generated_at:new Date().toISOString(),source:'Lovable workspace metadata, Lovable project descriptions, existing SWADEBASE service catalog',projects,counts:projects.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{}),limitations:['No repositories were inspected by this metadata-only pass','Some unnamed projects lack descriptions and remain unidentified','Potential matches use keyword similarity, not audited code','Live production migration states are not established','Screenshot exclusions need exact identity check before action']};
await writeFile(root+'/lovable-wip-reports-20261116.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({count:projects.length,counts:result.counts,descriptionRecovered:projects.filter(p=>p.name_source==='description-derived candidate').length,reportPath:root+'/lovable-wip-reports-20261116.json'}));
