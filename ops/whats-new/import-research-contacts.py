#!/usr/bin/env python3
"""Import owner-authorized public research into the existing SSSBrain CRM. Never sends mail."""
import argparse,json,hashlib,re,subprocess,uuid,datetime
from pathlib import Path
from urllib.parse import urlsplit
EMAIL=re.compile(r'^[A-Za-z0-9.!#$%&*+/=?^_{}|~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
def sql(query):
 r=subprocess.run(['docker','exec','-i','supabase-db','psql','-U','postgres','-X','-At','-v','ON_ERROR_STOP=1'],input=query,text=True,capture_output=True,timeout=30)
 if r.returncode:raise RuntimeError('Contact import database operation failed: '+next((line for line in r.stderr.splitlines() if 'ERROR:' in line),'unknown')[:250])
 return r.stdout.strip()
def literal(value):return "'"+str(value).replace("'","''")+"'"
def normalized(row):
 return {re.sub(r'[^a-z0-9]+','_',str(k).strip().lower()).strip('_'):v for k,v in row.items()}
def first(row,*keys):
 for key in keys:
  value=str(row.get(key) or '').strip()
  if value and value.lower() not in ('not publicly verified','n/a','unknown','none'):return value
 return ''
def prepare(row,kind):
 r=normalized(row)
 company=first(r,'business_name','current_investor_firm','company','organization','company_name','investor_name','name')
 person=first(r,'current_contact_person','contact_person','representative','representative_name','owner_representative','contact_name')
 email=first(r,'public_business_email','business_email','public_email','email')
 if email and not EMAIL.fullmatch(email):email=''
 if not company:return None
 sources=[first(r,key) for key in ('primary_source_url','contact_source_url','proof_of_ownership_source','ownership_source','proof_of_operation_source','operation_source','official_website','website','source_url')]
 sources=[s for s in sources if s.startswith(('https://','http://'))][:12]
 if not sources:return None
 source_info={'record_type':'research_contact','kind':kind,'imported_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'verification_date':first(r,'verification_date','verified_at','research_date') or None,'verification_state':'source_record_not_independently_reverified','do_not_cold_pitch':first(r,'do_not_cold_pitch') or 'unknown','outreach_approval':'required','source_record':r,'evidence_urls':sources}
 name=person or company
 identity=email.lower() if email else company.casefold()+'|'+(urlsplit(first(r,'official_website','website') or sources[0]).hostname or '').lower()
 return {'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'swade-research-contact:'+identity)),'name':name[:200],'company':company[:240],'role':first(r,'title','representative_title','role')[:160] or None,'email':email.lower() or None,'phone':first(r,'public_phone','public_company_phone','phone','business_phone')[:100] or None,'relationship_type':kind,'what_they_care_about':first(r,'best_fit_use_case','opportunity_brief','international_business_opportunity_brief','recommended_next_action','products_services')[:2000] or None,'notes':json.dumps(source_info,ensure_ascii=False)}
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--file',required=True);parser.add_argument('--source',required=True);parser.add_argument('--kind',choices=['business_research','investor_research','enterprise_lead'],required=True);args=parser.parse_args()
 path=Path(args.file).resolve()
 if not path.is_file() or path.stat().st_size>4000000:raise SystemExit('Use an existing structured JSON batch under 4 MB.')
 payload=json.loads(path.read_text());records=payload.get('records') if isinstance(payload,dict) else payload
 if not isinstance(records,list) or len(records)>500:raise SystemExit('Use a JSON records array of at most 500 rows.')
 clean=[c for r in records if isinstance(r,dict) and (c:=prepare(r,args.kind))]
 digest=hashlib.sha256(path.read_bytes()).hexdigest();source=args.source[:160]
 for c in clean:
  info=json.loads(c['notes']);info['source']=source;info['batch_sha']=digest;c['notes']=json.dumps(info,ensure_ascii=False)
 data=literal(json.dumps(clean,ensure_ascii=False));counts=sql(f"""
 BEGIN;
 SET LOCAL lock_timeout='5s';
 SET LOCAL statement_timeout='20s';
 SELECT pg_advisory_xact_lock(hashtext('owner-research-contact-import'));
 DO $block$ BEGIN IF NOT EXISTS(SELECT 1 FROM auth.users u JOIN public.user_roles r ON r.user_id=u.id WHERE u.email='swadesoul@gmail.com' AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<now()) AND r.role IN ('super_admin','master_super_admin')) THEN RAISE EXCEPTION 'Owner verification required'; END IF; END $block$;
 WITH actor AS (SELECT id FROM auth.users WHERE email='swadesoul@gmail.com'),
 incoming AS (SELECT * FROM jsonb_to_recordset({data}::jsonb) AS r(id uuid,name text,company text,role text,email text,phone text,relationship_type text,what_they_care_about text,notes text)),
 added AS (
 INSERT INTO sssbrain.brain_crm_contacts(id,user_id,name,company,role,email,phone,relationship_type,what_they_care_about,notes)
 SELECT i.id,a.id,i.name,i.company,i.role,i.email,i.phone,i.relationship_type,i.what_they_care_about,i.notes FROM incoming i CROSS JOIN actor a
 WHERE NOT EXISTS(SELECT 1 FROM sssbrain.brain_crm_contacts c WHERE c.user_id=a.id AND (c.id=i.id OR (i.email IS NOT NULL AND lower(c.email)=lower(i.email))))
 ON CONFLICT(id) DO NOTHING RETURNING id)
 SELECT json_build_object('inserted',count(*)) FROM added;
 INSERT INTO swadebase_ops.advisor_events(action,target,detail) VALUES('research_contacts_imported',{literal(digest)},jsonb_build_object('source',{literal(source)},'accepted_records',{len(clean)},'submitted_records',{len(records)},'sending',false));
 COMMIT;
 """)
 result=next((json.loads(line) for line in counts.splitlines() if line.startswith('{')),{'inserted':0})
 print(json.dumps({'status':'completed','source':source,'submitted':len(records),'accepted':len(clean),'skipped_missing_identity_or_evidence':len(records)-len(clean),'inserted':result['inserted'],'duplicates':len(clean)-result['inserted'],'batch_sha':digest,'mail_sent':False}))
if __name__=='__main__':main()
