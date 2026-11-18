import {readFile,writeFile} from 'node:fs/promises';
const path='/opt/swadebase/docs/releases/lovable-wip-reports-20261116.json';
const doc=JSON.parse(await readFile(path,'utf8'));
const known={swadesoulpro:'https://swadesoul.com/',swideo:'https://swideo.com/',teachvirt:'https://teachvirt.courses/',pinhub:'https://pinhub.live/',seedleaker:'https://seedleaker.com/',haroldwhaleycom:'https://haroldwhaley.com/'};
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
let checks=0;
for(const p of doc.projects){const url=known[norm(p.display_name)];if(!url)continue;let code=0,reason='unknown';
try{const res=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(7000)});code=res.status;reason=res.ok?'Public homepage responds; does not establish authenticated workflows or migration':'Public homepage request returned non-2xx';}catch(e){reason='Public homepage check failed';}
p.reconciliation.public_url_check={url,http_status:code,checked_at:new Date().toISOString(),meaning:reason};p.reconciliation.live_site=code===200?'Public homepage HTTP 200 (not certified)':'Not verified';checks++;
}
doc.reconciliation_summary.public_homepage_checks=checks;await writeFile(path,JSON.stringify(doc,null,2));console.log('Public homepage probes:',checks);
