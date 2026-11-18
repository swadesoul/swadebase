import urllib.request,urllib.error,html.parser,json,concurrent.futures
from datetime import datetime, timezone
from pathlib import Path
class Meta(html.parser.HTMLParser):
 def __init__(self): super().__init__(); self.links=[];self.meta=[];self.title='';self.intitle=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='link':self.links.append(a)
  if tag=='meta':self.meta.append(a)
  if tag=='title':self.intitle=True
 def handle_endtag(self,tag):
  if tag=='title':self.intitle=False
 def handle_data(self,data):
  if self.intitle:self.title+=data
 def get(self,key):return next((x.get('content','') for x in self.meta if x.get('name')==key or x.get('property')==key),'')
 def icon(self):return next((x.get('href','') for x in self.links if 'icon' in x.get('rel','')),'')
ua={'User-Agent':'Mozilla/5.0 (compatible; SwadeBrandAudit/1.0)'}
items=json.load(open('/opt/swadebase/docs/branding-audit-20261029.json'))
urls=list(dict.fromkeys(x['url'] for x in items if x.get('url','').startswith('https://')))
urls += ['https://resinglab.com','https://stage-resinglab.swadebase.cloud','https://sonikyn.com','https://themaestroradio.com','https://brainiak.live','https://swosting.com']
urls=list(dict.fromkeys(urls))
def audit(url):
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers=ua),timeout=7)
  body=r.read(350000).decode('utf-8','ignore');p=Meta();p.feed(body)
  icon=p.icon();og=p.get('og:image');desc=p.get('description');canonical=next((x.get('href','') for x in p.links if x.get('rel')=='canonical'),'');
  reasons=[]
  if not icon:reasons.append('NO_ICON_LINK')
  if not og:reasons.append('NO_SOCIAL_IMAGE')
  if 'lovable.dev' in og or 'gpt-engineer' in og:reasons.append('BUILDER_SOCIAL_IMAGE')
  if not desc:reasons.append('NO_DESCRIPTION')
  if not canonical:reasons.append('NO_CANONICAL')
  return {'url':url,'final':r.url,'http':r.status,'title':p.title[:80],'icon':icon[:125],'og':og[:150],'reasons':reasons}
 except Exception as e:return {'url':url,'error':type(e).__name__+':'+str(e)[:85]}
with concurrent.futures.ThreadPoolExecutor(max_workers=15) as pool: results=list(pool.map(audit,urls))
dest=Path('/opt/swadebase/docs') / ('branding-audit-live-' + datetime.now(timezone.utc).strftime('%Y%m%d') + '.json')
with dest.open('w') as f:json.dump(results,f,indent=2)
print('REPORT',dest)
for a in results:
 if a.get('reasons') or a.get('error'):
  print(a['url'],'|',','.join(a.get('reasons',[])) or 'UNREACHABLE','|',a.get('icon','')[:55], '|',a.get('og','')[:65])
print('COUNT',len(results),'ISSUES',sum(bool(a.get('reasons')) for a in results),'UNREACHABLE',sum('error' in a for a in results))
