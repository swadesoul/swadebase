import io,json,sys,unittest,uuid
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).parent/'server/maestro-factory'))
import artist_office as o
SID='11111111-1111-4111-8111-111111111111';CID='22222222-2222-4222-8222-222222222222'
class Fake:
 def __init__(self):self.tables={'artist_sites':[{'id':SID,'owner_user_id':'owner','status':'live','published_revision':1,'path':'artist/fixture','display_name':'PRIVATE DRAFT'}],'artist_site_revisions':[{'site_id':SID,'revision':1,'record':{'display_name':'Approved Artist','bio':'Approved bio'}}],'artist_office_profiles':[],'artist_campaigns':[],'artist_office_activity':[]}
 def uid(self,s):return str(uuid.UUID(str(s)))
 def db(self,table,method='GET',data=None,filters=None,**kw):
  rows=self.tables[table]
  def matches(r):
   for k,v in (filters or {}).items():
    if v.startswith('eq.') and str(r.get(k)).lower()!=v[3:].lower():return False
    if v.startswith('in.(') and r.get(k) not in v[4:-1].split(','):return False
   return True
  selected=[r for r in rows if matches(r)]
  if method=='GET':return selected
  if method=='PATCH':
   for r in selected:r.update(data)
   return selected
  if method=='POST':
   if kw.get('upsert'):
    keys=['site_id'] if table=='artist_office_profiles' else ['campaign_id','fan_user_id','kind','day']
    prior=next((r for r in rows if all(r[k]==data[k] for k in keys)),None)
    if prior:prior.update(data);return [prior]
   row={**data}
   if table=='artist_campaigns':row.update(id=CID,created_at='2026-11-13',office_active=False)
   rows.append(row);return [row]
class Handler:
 def __init__(self,body,auth='owner'):
  raw=json.dumps(body).encode();self.rfile=io.BytesIO(raw);self.headers={'Content-Length':str(len(raw)),'Authorization':auth};self.result=None
 def respond(self,status,data):self.result=(status,data);return self.result
class Tests(unittest.TestCase):
 def setUp(self):self.f=Fake();o._RECENT.clear();self.identity=patch.object(o,'identity',side_effect=lambda f,a:{'id':a,'superadmin':a=='founder'});self.identity.start()
 def tearDown(self):self.identity.stop()
 def call(self,action,actor='owner',**body):return o.handle(Handler({'action':action,**body},actor),'POST',self.f)
 def draft(self):
  with patch.object(o.requests,'post',side_effect=o.requests.ConnectionError):return self.call('draft',site_id=SID,prompt='my campaign')[1]['campaign']
 def activate(self):
  c=self.draft();return self.call('approve',campaign_id=c['id'],confirm_public=True)[1]['campaign']
 def test_owner_and_admin_boundaries(self):
  self.assertEqual(self.call('load',actor='other',site_id=SID)[0],403)
  self.assertEqual(self.call('load',actor='founder',site_id=SID)[0],200)
  self.assertEqual(self.call('roster',actor='other')[1]['artists'],[])
 def test_published_facts_only_and_free_fallback(self):
  c=self.draft();self.assertIn('Approved Artist',c['assets']['headline']);self.assertNotIn('PRIVATE DRAFT',json.dumps(c));self.assertEqual(c['assets']['engine'],'template');self.assertFalse(c['assets']['radio_time_confirmed'])
 def test_unpublished_not_draftable(self):
  self.f.tables['artist_sites'][0]['status']='draft';self.assertEqual(self.call('draft',site_id=SID)[0],409)
 def test_private_until_confirmed(self):
  c=self.draft();self.assertEqual(self.call('approve',campaign_id=c['id'])[0],400);self.assertEqual(self.call('public',token='x'*24)[0],404)
 def test_cross_owner_campaign_mutations(self):
  c=self.draft()
  for action in ['approve','pause','edit']:self.assertEqual(self.call(action,actor='other',campaign_id=c['id'],confirm_public=True)[0],403)
 def test_pause_hides_and_blocks_fan_writes(self):
  c=self.activate();self.assertEqual(self.call('public',token=c['share_token'])[0],200);self.call('pause',campaign_id=CID);self.assertEqual(self.call('public',token=c['share_token'])[0],404);self.assertEqual(self.call('fan-response',actor='fan',token=c['share_token'],kind='arrival')[0],404)
 def test_active_copy_requires_pause(self):
  self.activate();self.assertEqual(self.call('edit',campaign_id=CID,headline='Changed',share_text='Changed')[0],409)
 def test_unique_real_fan_participation(self):
  c=self.activate();token=c['share_token']
  self.assertEqual(self.call('fan-response',token=token,kind='arrival')[0],409)
  for _ in range(2):self.assertEqual(self.call('fan-response',actor='fan',token=token,kind='arrival')[0],200)
  for _ in range(2):self.assertEqual(self.call('fan-response',actor='fan',token=token,kind='response',answer='Great music')[0],200)
  self.assertEqual(len(self.f.tables['artist_office_activity']),2)
  m=self.call('load',site_id=SID)[1]['metrics'][CID];self.assertEqual(m['arrivals'],1);self.assertEqual(m['responses'],1)
 def test_consent_separate_from_voice_and_revocable(self):
  status,data=self.call('profile',site_id=SID,story_opt_in=True,voice_consent=True,story_notes='Approved idea');self.assertEqual(status,200);self.assertFalse(data['profile']['voice_consent'])
  self.call('profile',site_id=SID,story_opt_in=False);self.assertFalse(self.f.tables['artist_office_profiles'][0]['story_opt_in'])
 def test_rate_limit_and_invalid_goal(self):
  self.assertEqual(self.call('draft',site_id=SID,goal='buy-followers')[0],400)
  o._RECENT.clear()
  for _ in range(3):self.draft()
  self.assertEqual(self.call('draft',site_id=SID)[0],429)
 def test_hidden_artist_revokes_existing_link(self):
  c=self.activate();self.f.tables['artist_sites'][0]['status']='hidden';self.assertEqual(self.call('public',token=c['share_token'])[0],404)
 def test_bad_inputs_are_controlled(self):
  self.assertEqual(self.call('load',site_id='bad')[0],400);self.assertEqual(self.call('public',token='../../secret')[0],404)
if __name__=='__main__':unittest.main()
