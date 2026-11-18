"""Idempotent hub seeds and bounded integration checks. Run on SWADEBASE.
Reads only the dedicated learning-hub credential; never prints credentials.
"""
import json
import uuid
import urllib.request
import urllib.error
from pathlib import Path

BASE = 'https://swadebase.cloud'
KEY = json.load(urllib.request.urlopen(BASE + '/auth-config.json'))['publicKey']
TOKEN = dict(line.split('=', 1) for line in Path('/opt/swadebase/secrets/swade-learn.env').read_text().splitlines() if '=' in line)['SWADE_LEARN_TOKEN']

def request(path, body=None, method=None):
    headers = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Accept-Profile': 'teachvirt', 'Content-Profile': 'teachvirt', 'Content-Type': 'application/json'}
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)

def admin(action, kind=None, item=None, record_id=None, token=TOKEN):
    return request('/rest/v1/rpc/learning_hub_admin', {'p_token': token, 'p_action': action, 'p_kind': kind, 'p_body': item, 'p_id': record_id})

def saved(kind, item):
    status, response = admin('save', kind, item, item.get('id'))
    assert status == 200, (kind, status, response.get('message'))
    return response['record']

def verify(condition, name):
    if not condition:
        raise AssertionError(name)
    print('PASS ' + name, flush=True)

status, current = admin('list')
verify(status == 200, 'dedicated credential lists hub records')
seed = json.loads(Path('/opt/swadebase/ops/swade-learn/seed.json').read_text())
inserted = 0
for kind in ['instructors', 'subjects', 'courses', 'sites']:
    existing = {item['id'] for item in current.get(kind, [])}
    for item in seed.get(kind, []):
        if item['id'] not in existing:
            saved(kind, item)
            inserted += 1
print('Seed records added: ' + str(inserted), flush=True)

status, public = request('/rest/v1/rpc/learning_hub_catalog', {})
verify(status == 200 and public['source'] == 'swadebase', 'anonymous catalog reads shared records')
verify(not any(item['id'] == 'swarvis-agent-intake-draft' for item in public['courses']), 'draft episode excluded from public catalog')
verify('media' not in public and 'productions' not in public, 'private media library and production packs excluded')
verify(any(item['id'] == 'swarvis-first-content-pack' for item in public['courses']), 'published Swarvis guide appears')
verify(sum(item['id'].startswith('teachvirt:') for item in public['courses']) == 10, 'ten existing canonical courses remain available')
status, _ = admin('list', token='invalid-' + '0' * 48)
verify(status == 401, 'invalid credential denied')
for path in ['/rest/v1/learning_hub_tokens?select=token_hash&limit=1', '/rest/v1/learning_hub_records?select=id&limit=1', '/rest/v1/rpc/learning_hub_snapshot']:
    status, _ = request(path, {'p_private': True} if path.endswith('snapshot') else None)
    verify(status >= 400, 'direct private access denied: ' + path.split('?')[0])

prefix = 'verification-' + uuid.uuid4().hex[:12]
instructor_id, subject_id, course_id, production_id = [prefix + '-' + part for part in ['instructor', 'subject', 'course', 'production']]
try:
    saved('instructors', {'id': instructor_id, 'name': 'Studio verification', 'slug': instructor_id, 'status': 'active'})
    saved('subjects', {'id': subject_id, 'name': 'Studio verification', 'slug': subject_id})
    course = {'id': course_id, 'slug': course_id, 'title': 'Studio verification', 'subject_id': subject_id, 'instructor_id': instructor_id, 'status': 'draft', 'price_cents': 100,
      'source_url': next(item['source_url'] for item in public['courses'] if item['id'].startswith('teachvirt:')),
      'lessons': [{'id':'preview','title':'Preview','body':'Approved preview','duration_minutes':1,'position':0,'preview':True},
      {'id':'private','title':'Private lesson','body':'PRIVATE_VERIFICATION_SENTINEL','duration_minutes':1,'position':1,'preview':False}]}
    saved('courses', course)
    status, data = admin('list')
    verify(any(item['id'] == course_id for item in data['courses']), 'saved class survives separate read')
    status, data = request('/rest/v1/rpc/learning_hub_catalog', {})
    verify(not any(item['id'] == course_id for item in data['courses']), 'new draft hidden')
    course['status'] = 'published'
    saved('courses', course)
    status, data = request('/rest/v1/rpc/learning_hub_catalog', {})
    published = next(item for item in data['courses'] if item['id'] == course_id)
    verify(len(published['lessons']) == 1 and 'PRIVATE_VERIFICATION_SENTINEL' not in json.dumps(data), 'paid guide exposes preview only')
    status, _ = admin('delete', 'subjects', record_id=subject_id)
    verify(status == 409, 'referenced subject deletion denied')
    saved('productions', {'id':production_id,'title':'Studio verification','instructor_id':instructor_id,'course_id':course_id,'draft':{'script':'PRIVATE_PRODUCTION_SENTINEL'}})
    status, data = admin('list')
    verify(any(item['id'] == production_id for item in data['productions']), 'production draft persists')
    status, data = request('/rest/v1/rpc/learning_hub_catalog', {})
    verify('PRIVATE_PRODUCTION_SENTINEL' not in json.dumps(data), 'saved production remains private')
    status, _ = admin('save', 'subjects', {'name':'Unsafe link','slug':prefix+'-bad','url':'javascript:alert(1)'})
    verify(status == 400, 'unsafe link rejected')
finally:
    for kind, record_id in [('productions', production_id), ('courses', course_id), ('instructors', instructor_id), ('subjects', subject_id)]:
        status, _ = admin('delete', kind, record_id=record_id)
        if status not in [200, 404]:
            print('Cleanup requires attention: ' + kind + ' ' + record_id, flush=True)
print('INTEGRATION_CHECKS_COMPLETE', flush=True)
