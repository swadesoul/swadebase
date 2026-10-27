#!/usr/bin/env python3
"""Incremental, local-only indexing of approved operator references. No model training."""
from pathlib import Path
import hashlib,json,subprocess,datetime,re,sys
ROOT=Path('/opt/swadebase/docs')
STATE=Path('/opt/sssbrain-ops/incident-guardian/knowledge-sync.json')
def sql(q):
 r=subprocess.run(['docker','exec','-i','supabase-db','psql','-U','postgres','-X','-At','-v','ON_ERROR_STOP=1'],input=q,capture_output=True,text=True,timeout=30)
 if r.returncode:raise RuntimeError('knowledge_index_database_error')
 return r.stdout

def lit(s):return "'"+str(s).replace("'","''")+"'"
def chunks(text,maximum=2800):
 result=[];current=''
 for paragraph in text.split('\n\n'):
  for i in range(0,max(1,len(paragraph)),maximum):
   part=paragraph[i:i+maximum]
   if len(current)+len(part)+2>maximum and current:result.append(current);current=''
   current+=(('\n\n' if current else '')+part)
 if current:result.append(current)
 return result

def run():
 sources=[ROOT/'STANDING_RULES.md']+sorted((ROOT/'site-bibles').glob('*.md'))+sorted((ROOT/'learning-approved').glob('*.md'))
 paths={str(p.relative_to(ROOT)) for p in sources if p.is_file() and not p.is_symlink()}
 previous=json.loads(sql("SELECT coalesce(json_agg(row_to_json(d)),'[]') FROM (SELECT doc_path,doc_sha,source FROM sssbrain.swadebase_docs)d;").strip())
 old={x['doc_path']:x for x in previous};updated=0;skipped=[]
 statements=['BEGIN;','SET LOCAL lock_timeout=\'5s\';','SET LOCAL statement_timeout=\'20s\';',"SELECT pg_advisory_xact_lock(hashtext('knowledge-reference-sync-v1')); "]
 for p in sources:
  if not p.is_file() or p.is_symlink() or p.stat().st_size>250000:continue
  path=str(p.relative_to(ROOT));text=p.read_text();digest=hashlib.sha256(text.encode()).hexdigest()
  if old.get(path,{}).get('doc_sha')==digest:continue
  if re.search(r'\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',text):
   skipped.append(path)
   statements.append('DELETE FROM sssbrain.swadebase_docs WHERE doc_path='+lit(path)+';')
   continue
  title=next((l.lstrip('# ').strip() for l in text.splitlines() if l.startswith('# ')),p.stem)
  parts=chunks(text);link='swadebase://knowledge/'+path
  statements.append('INSERT INTO sssbrain.swadebase_docs(doc_path,source,title,link,doc_sha,byte_size,chunk_count,embedded_chunks) VALUES('+','.join([lit(path),lit('swadebase_docs'),lit(title),lit(link),lit(digest),str(len(text.encode())),str(len(parts)),'0'])+") ON CONFLICT(doc_path) DO UPDATE SET source=excluded.source,title=excluded.title,link=excluded.link,doc_sha=excluded.doc_sha,byte_size=excluded.byte_size,chunk_count=excluded.chunk_count,embedded_chunks=0,updated_at=now();")
  statements.append('DELETE FROM sssbrain.swadebase_knowledge_chunks WHERE doc_path='+lit(path)+';')
  for n,part in enumerate(parts):
   heading=next((l.lstrip('# ').strip() for l in part.splitlines() if l.startswith('#')),title)
   statements.append('INSERT INTO sssbrain.swadebase_knowledge_chunks(doc_path,chunk_index,source,doc_title,heading,content,link,doc_sha) VALUES('+','.join([lit(path),str(n),lit('swadebase_docs'),lit(title),lit(heading),lit(part),lit(link),lit(digest)])+');')
  updated+=1
 for path,v in old.items():
  if v['source']=='swadebase_docs' and (path.startswith('site-bibles/') or path.startswith('learning-approved/') or path=='STANDING_RULES.md') and path not in paths:statements.append('DELETE FROM sssbrain.swadebase_docs WHERE doc_path='+lit(path)+';')
 statements.append('COMMIT;');sql('\n'.join(statements))
 report={'time_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'ok','sources_considered':len(paths),'documents_updated':updated,'quarantined_paths':skipped,'paid_calls':0,'embeddings_generated':0,'model_training':False,'customer_collection_enabled':False}
 STATE.write_text(json.dumps(report,indent=2));print(json.dumps(report));return report
if __name__=='__main__':
 try:run()
 except Exception:
  report={'time_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'failed','reason':'Indexing failed; inspect the scoped service and source files. Existing Guardian review is independent.'}
  try:STATE.write_text(json.dumps(report))
  except OSError:pass
  print(json.dumps(report));sys.exit(0)
