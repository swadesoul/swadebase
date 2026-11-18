import {readFile,writeFile,readdir} from 'node:fs/promises';
const root='/opt/swadebase/docs/releases';
const report=JSON.parse(await readFile(root+'/lovable-wip-reports-20261116.json','utf8'));
const dir='/opt/swadebase/docs/site-bibles';
const files=(await readdir(dir)).filter(f=>f.endsWith('_Master_Site_Bible.md')&&!f.includes('.bak'));
const bibles=await Promise.all(files.map(async name=>({name,body:(await readFile(dir+'/'+name,'utf8')).toLowerCase()})));
const normalize=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const known={resinglab:'ReSingLab_Master_Site_Bible.md',videosaywhat:'VideoSayWhat_Master_Site_Bible.md',seedleaker:'SEEDLEAKER_Master_Site_Bible.md',swideo:'SWIDEO_Master_Site_Bible.md',maestroradio:'Maestro_Radio_Master_Site_Bible.md',sssbrain:'SSSBRAIN_Master_Site_Bible.md',swadesoul:'SwadeSoul_com_Master_Site_Bible.md',pinhub:'PinHub_Master_Site_Bible.md',brainworld:'Brainiak_Master_Site_Bible.md',divynecreatives:'Divyne_Creatives_Master_Site_Bible.md',publiswade:'PubliSwade_Master_Site_Bible.md',oathloom:'OATHLOOM_Master_Site_Bible.md',assetmachine:'Asset_Machine_Master_Site_Bible.md',swosting:'SWOSTing_Master_Site_Bible.md',blacktales:'Black_Tales_Master_Site_Bible.md'};
let exact=0,named=0;
for(const p of report.projects){
 const id=p.id.toLowerCase(), name=normalize(p.display_name);
 const matches=bibles.filter(b=>b.body.includes(id));
 const canonical=known[name]||null;
 const namedMatch=canonical?bibles.find(b=>b.name.toLowerCase()===canonical.toLowerCase()):null;
 const docs=[...new Set([...matches.map(x=>x.name),...(namedMatch?[namedMatch.name]:[])])];
 const evidence=matches.length?'exact_project_id_in_site_bible':namedMatch?'name_to_site_bible_only':'not_established';
 if(matches.length)exact++;if(namedMatch)named++;
 const observation={evidence,site_bibles:docs,project_id_found_in_bible:matches.length>0,canonical_url:null,backend_migrated:'unverified',live_site:'unverified',unique_features:'not inspected',needs_reconciliation:matches.length||namedMatch?['Compare source commit and runtime with matched Site Bible','Verify current domain HTTPS, auth, data and integration','Check migration receipts and feature parity']:['Locate exact source repository and deployment record','Compare functional capabilities with SWADEBASE','Verify whether site exists or is only a Lovable preview']};
 p.reconciliation=observation;
 if(matches.length){p.report.evidence.push('Exact Lovable project ID referenced in '+matches.map(x=>x.name).join(', '));}
 else if(namedMatch){p.report.evidence.push('Existing Site Bible matched by project name only: '+namedMatch.name+' (not migration proof)');}
}
report.reconciled_at=new Date().toISOString();report.reconciliation_summary={exact_project_id_bible_matches:exact,name_to_bible_matches:named,unverified_live_and_migration:report.projects.length};report.limitations.push('Exact Lovable project IDs in Site Bibles establish documented linkage, not active migration or production parity.');
await writeFile(root+'/lovable-wip-reports-20261116.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.reconciliation_summary));
