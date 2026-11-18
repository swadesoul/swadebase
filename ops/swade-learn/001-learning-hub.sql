-- SWADE Learn: collection metadata over the existing TeachVirt course engine.
-- No existing TeachVirt course, coach, enrollment, auth, storage, or payment writes.
-- Apply as the database owner. Insert a newly generated token SHA256 separately;
-- this file intentionally contains no credentials, instructor seeds, or media.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS teachvirt.learning_hub_records (
  hub_slug text NOT NULL DEFAULT 'swade-learn' CHECK (hub_slug = 'swade-learn'),
  kind text NOT NULL CHECK (kind IN ('instructors','subjects','courses','sites','media','productions')),
  id text NOT NULL CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$'),
  body jsonb NOT NULL CHECK (jsonb_typeof(body) = 'object' AND octet_length(body::text) <= 1048576),
  canonical_course_id uuid REFERENCES teachvirt.courses(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hub_slug, kind, id),
  CHECK (body ? 'id' AND jsonb_typeof(body->'id') = 'string' AND body->>'id' = id),
  CHECK (canonical_course_id IS NULL OR kind = 'courses')
);

CREATE TABLE IF NOT EXISTS teachvirt.learning_hub_tokens (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  hub_slug text NOT NULL DEFAULT 'swade-learn' CHECK (hub_slug = 'swade-learn'),
  label text NOT NULL DEFAULT 'SWADE Learn server',
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teachvirt.learning_hub_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachvirt.learning_hub_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON teachvirt.learning_hub_records, teachvirt.learning_hub_tokens FROM PUBLIC, anon, authenticated, service_role;

-- Public source fields only. Identity profiles, emails, system instructions,
-- generation prompts, source documents, and canonical lesson bodies are omitted.
-- Internal helper: no API role can call it directly.
CREATE OR REPLACE FUNCTION teachvirt.learning_hub_canonical()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
WITH canonical_courses AS (
  SELECT c.* FROM teachvirt.courses c
  JOIN teachvirt.coaches i ON i.id = c.coach_id
  WHERE c.status::text = 'published' AND i.status IN ('active','featured')
), subjects AS (
  SELECT DISTINCT coalesce(nullif(btrim(subject),''),'General') AS name FROM canonical_courses
), instructors AS (
  SELECT DISTINCT i.* FROM teachvirt.coaches i
  JOIN canonical_courses c ON c.coach_id = i.id
)
SELECT jsonb_build_object(
  'instructors', coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id','teachvirt:'||i.id::text,
    'name',coalesce(nullif(i.nickname,''),nullif(i.username,''),nullif(i.coach_title,''),'TeachVirt instructor'),
    'slug',coalesce(nullif(i.slug,''),nullif(i.username,''),'teachvirt-'||i.id::text),
    'title',coalesce(i.coach_title,i.headline,''), 'bio',coalesce(i.bio,''),
    'avatar_url',coalesce(i.avatar_url,''), 'cover_url',coalesce(i.cover_url,i.banner_url,''),
    'expertise',to_jsonb(coalesce(i.niches,ARRAY[]::text[])),
    'status','active', 'featured',coalesce(i.featured,false)
  ) ORDER BY i.id) FROM instructors i),'[]'::jsonb),
  'subjects', coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id','teachvirt-subject:'||md5(lower(s.name)),
    'name',s.name,
    'slug',trim(both '-' FROM regexp_replace(lower(s.name),'[^a-z0-9]+','-','g'))||'-'||left(md5(lower(s.name)),6),
    'description','Training from the TeachVirt library.', 'color','#E77837','icon','BookOpen'
  ) ORDER BY s.name) FROM subjects s),'[]'::jsonb),
  'courses', coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id','teachvirt:'||c.id::text,
    'slug',coalesce(nullif(c.slug,''),'teachvirt-'||c.id::text),
    'title',c.title, 'summary',coalesce(c.description,c.subtitle,''),
    'subject_id','teachvirt-subject:'||md5(lower(coalesce(nullif(btrim(c.subject),''),'General'))),
    'instructor_id','teachvirt:'||c.coach_id::text, 'cover_url',coalesce(c.thumbnail_url,''),
    'level',CASE lower(coalesce(c.skill_level,'')) WHEN 'beginner' THEN 'Beginner' WHEN 'intermediate' THEN 'Intermediate' WHEN 'advanced' THEN 'Advanced' ELSE 'All levels' END,
    'duration_minutes',coalesce(c.estimated_minutes,0), 'format','Course','status','published',
    'price_cents',CASE WHEN c.is_for_sale THEN coalesce(c.price_cents,0) ELSE 0 END,
    'currency',coalesce(c.currency,'usd'), 'product_slug','teachvirt',
    'outcomes','[]'::jsonb, 'lessons','[]'::jsonb, 'tags','["TeachVirt"]'::jsonb,
    'source_url','https://teachvirt.courses/course/'||c.id::text,
    'embed_url',CASE WHEN c.embed_enabled THEN 'https://teachvirt.courses/embed/course/'||c.id::text||'/player' ELSE '' END,
    'community_url','https://virtteach.study/school-community', 'updated_at',c.updated_at
  ) ORDER BY c.updated_at DESC,c.id) FROM canonical_courses c),'[]'::jsonb)
);
$fn$;
REVOKE ALL ON FUNCTION teachvirt.learning_hub_canonical() FROM PUBLIC, anon, authenticated, service_role;

-- The only public projection: allowed keys, rather than an arbitrary JSON body.
CREATE OR REPLACE FUNCTION teachvirt.learning_hub_public_record(p_kind text, p_body jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $fn$
DECLARE allowed text[]; projected jsonb;
BEGIN
  allowed := CASE p_kind
    WHEN 'instructors' THEN ARRAY['id','name','slug','title','bio','avatar_url','cover_url','expertise','status','featured']
    WHEN 'subjects' THEN ARRAY['id','name','slug','description','color','icon']
    WHEN 'courses' THEN ARRAY['id','slug','title','summary','subject_id','instructor_id','cover_url','level','duration_minutes','format','status','price_cents','currency','product_slug','outcomes','lessons','tags','source_url','embed_url','community_url','updated_at']
    WHEN 'sites' THEN ARRAY['id','name','slug','origin','enabled','description']
    ELSE ARRAY[]::text[] END;
  SELECT coalesce(jsonb_object_agg(k,v),'{}'::jsonb) INTO projected
  FROM jsonb_each(p_body) AS e(k,v) WHERE k = ANY(allowed);
  IF p_kind = 'courses' THEN
    projected := jsonb_set(projected,'{lessons}',coalesce((
      SELECT jsonb_agg((SELECT jsonb_object_agg(k,v) FROM jsonb_each(lesson) AS e(k,v)
        WHERE k = ANY(ARRAY['id','title','body','video_url','resource_url','duration_minutes','position','preview'])))
      FROM jsonb_array_elements(coalesce(p_body->'lessons','[]'::jsonb)) AS l(lesson)
      WHERE coalesce((p_body->>'price_cents')::numeric,0) = 0 OR lesson->>'preview' = 'true'
    ),'[]'::jsonb));
  END IF;
  RETURN projected;
END;
$fn$;
REVOKE ALL ON FUNCTION teachvirt.learning_hub_public_record(text,jsonb) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION teachvirt.learning_hub_snapshot(p_private boolean)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE result jsonb; canonical jsonb;
BEGIN
  canonical := teachvirt.learning_hub_canonical();
  WITH source_rows AS (
    SELECT kind, item->>'id' AS id, item AS body, false AS local
    FROM jsonb_each(canonical) AS g(kind,items)
    CROSS JOIN LATERAL jsonb_array_elements(items) AS a(item)
    UNION ALL
    SELECT kind,id,body,true FROM teachvirt.learning_hub_records WHERE hub_slug = 'swade-learn'
  ), merged AS (
    SELECT DISTINCT ON (kind,id) kind,id,body FROM source_rows ORDER BY kind,id,local DESC
  ), visible AS (
    SELECT kind,id,CASE WHEN p_private THEN body ELSE teachvirt.learning_hub_public_record(kind,body) END AS body
    FROM merged r WHERE p_private OR (
      (kind = 'instructors' AND body->>'status' = 'active') OR kind = 'subjects' OR
      (kind = 'sites' AND body->>'enabled' = 'true') OR
      (kind = 'courses' AND body->>'status' = 'published'
        AND EXISTS(SELECT 1 FROM merged i WHERE i.kind='instructors' AND i.id=r.body->>'instructor_id' AND i.body->>'status'='active')
        AND EXISTS(SELECT 1 FROM merged s WHERE s.kind='subjects' AND s.id=r.body->>'subject_id'))
    )
  )
  SELECT jsonb_build_object(
    'instructors',coalesce((SELECT jsonb_agg(body ORDER BY body->>'name',id) FROM visible WHERE kind='instructors'),'[]'::jsonb),
    'subjects',coalesce((SELECT jsonb_agg(body ORDER BY body->>'name',id) FROM visible WHERE kind='subjects'),'[]'::jsonb),
    'courses',coalesce((SELECT jsonb_agg(body ORDER BY body->>'updated_at' DESC NULLS LAST,id) FROM visible WHERE kind='courses'),'[]'::jsonb),
    'sites',coalesce((SELECT jsonb_agg(body ORDER BY body->>'name',id) FROM visible WHERE kind='sites'),'[]'::jsonb),
    'source','swadebase',
    'updated_at',greatest(coalesce((SELECT max(updated_at) FROM teachvirt.learning_hub_records WHERE hub_slug='swade-learn'),'-infinity'::timestamptz),coalesce((SELECT max(updated_at) FROM teachvirt.courses WHERE status::text='published'),now()))
  ) || CASE WHEN p_private THEN jsonb_build_object(
    'media',coalesce((SELECT jsonb_agg(body ORDER BY id) FROM visible WHERE kind='media'),'[]'::jsonb),
    'productions',coalesce((SELECT jsonb_agg(body ORDER BY id) FROM visible WHERE kind='productions'),'[]'::jsonb),
    'connection',jsonb_build_object('status','connected','message','Connected to SWADEBASE. Course delivery uses TeachVirt.')
  ) ELSE '{}'::jsonb END INTO result;
  RETURN result;
END;
$fn$;
REVOKE ALL ON FUNCTION teachvirt.learning_hub_snapshot(boolean) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION teachvirt.learning_hub_catalog()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT teachvirt.learning_hub_snapshot(false);
$fn$;
REVOKE ALL ON FUNCTION teachvirt.learning_hub_catalog() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION teachvirt.learning_hub_catalog() TO anon, authenticated;

CREATE OR REPLACE FUNCTION teachvirt.learning_hub_admin(
  p_token text, p_action text, p_kind text DEFAULT NULL, p_body jsonb DEFAULT NULL, p_id text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  item_id text; item jsonb; old_item jsonb; ref_key text; ref_kind text; ref_id text;
  canonical jsonb; all_records jsonb; canonical_id uuid; field text; value jsonb; lesson jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 OR length(p_token) > 512 OR NOT EXISTS (
    SELECT 1 FROM teachvirt.learning_hub_tokens t
    WHERE t.hub_slug='swade-learn' AND t.enabled
      AND (t.expires_at IS NULL OR t.expires_at > now())
      AND t.token_hash = encode(extensions.digest(p_token,'sha256'),'hex')
  ) THEN RAISE EXCEPTION USING ERRCODE='PT401',MESSAGE='Unauthorized'; END IF;

  IF p_action = 'authorize' THEN RETURN jsonb_build_object('authorized',true); END IF;
  IF p_action = 'list' THEN RETURN teachvirt.learning_hub_snapshot(true); END IF;
  IF p_action IS NULL OR p_action NOT IN ('save','delete') THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Action must be authorize, list, save, or delete';
  END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('instructors','subjects','courses','sites','media','productions') THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid record kind';
  END IF;
  -- Serializes JSON-reference validation and mutation; no canonical table locks.
  PERFORM pg_catalog.pg_advisory_xact_lock(871425618::bigint);
  item_id := coalesce(nullif(p_id,''),nullif(p_body->>'id',''),gen_random_uuid()::text);
  IF item_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$' THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid record id';
  END IF;
  SELECT body INTO old_item FROM teachvirt.learning_hub_records WHERE hub_slug='swade-learn' AND kind=p_kind AND id=item_id;

  IF p_action = 'delete' THEN
    IF p_id IS NULL OR p_id = '' THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='id is required'; END IF;
    IF item_id LIKE 'teachvirt:%' OR item_id LIKE 'teachvirt-subject:%' THEN
      RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Canonical TeachVirt entries cannot be deleted here. Archive their hub metadata instead.';
    END IF;
    IF old_item IS NULL THEN RAISE EXCEPTION USING ERRCODE='PT404',MESSAGE='Record not found'; END IF;
    IF EXISTS (
      SELECT 1 FROM teachvirt.learning_hub_records r WHERE r.hub_slug='swade-learn'
      AND NOT (r.kind=p_kind AND r.id=item_id)
      AND (jsonb_path_exists(r.body,'$.** ? (@ == $reference)',jsonb_build_object('reference',item_id))
        OR (p_kind='media' AND coalesce(old_item->>'url','')<>''
          AND jsonb_path_exists(r.body,'$.** ? (@ == $reference)',jsonb_build_object('reference',old_item->>'url'))))
    ) THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='This record is still referenced. Update its references before deleting it.'; END IF;
    DELETE FROM teachvirt.learning_hub_records WHERE hub_slug='swade-learn' AND kind=p_kind AND id=item_id;
    RETURN jsonb_build_object('ok',true,'id',item_id,'kind',p_kind);
  END IF;

  IF p_body IS NULL OR jsonb_typeof(p_body)<>'object' OR octet_length(p_body::text)>1048576 THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Body must be a JSON object no larger than 1 MB';
  END IF;
  IF p_body ? 'id' AND p_body->>'id' IS DISTINCT FROM item_id THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Body id does not match record id';
  END IF;
  item := CASE p_kind
    WHEN 'instructors' THEN '{"title":"","bio":"","avatar_url":"","cover_url":"","expertise":[],"status":"draft","featured":false}'::jsonb
    WHEN 'subjects' THEN '{"description":"","color":"#E77837","icon":"BookOpen"}'::jsonb
    WHEN 'courses' THEN '{"summary":"","subject_id":"","instructor_id":"","cover_url":"","level":"Beginner","duration_minutes":0,"format":"Mini class","status":"draft","price_cents":0,"currency":"usd","product_slug":"","outcomes":[],"lessons":[],"tags":[],"source_url":"","embed_url":"","community_url":""}'::jsonb
    WHEN 'sites' THEN '{"enabled":false,"description":""}'::jsonb
    WHEN 'media' THEN '{"alt_text":"","size_bytes":0}'::jsonb
    ELSE '{"status":"draft"}'::jsonb END || p_body || jsonb_build_object('id',item_id,'updated_at',now());

  IF p_kind IN ('instructors','subjects','sites','media') AND coalesce(btrim(item->>'name'),'')='' THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Name is required';
  END IF;
  IF p_kind IN ('instructors','subjects','courses','sites') AND coalesce(item->>'slug','') !~ '^[a-z0-9][a-z0-9_-]{0,127}$' THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='A lowercase URL-safe slug is required';
  END IF;
  IF p_kind IN ('instructors','subjects','courses','sites') AND EXISTS (
    SELECT 1 FROM teachvirt.learning_hub_records r WHERE r.hub_slug='swade-learn' AND r.kind=p_kind AND r.id<>item_id AND r.body->>'slug'=item->>'slug'
  ) THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Slug already exists'; END IF;
  FOREACH field IN ARRAY CASE p_kind
    WHEN 'instructors' THEN ARRAY['name','slug','title','bio','avatar_url','cover_url','status']
    WHEN 'subjects' THEN ARRAY['name','slug','description','color','icon']
    WHEN 'courses' THEN ARRAY['slug','title','summary','subject_id','instructor_id','cover_url','level','format','status','currency','product_slug','source_url','embed_url','community_url']
    WHEN 'sites' THEN ARRAY['name','slug','origin','description']
    WHEN 'media' THEN ARRAY['name','url','mime_type','alt_text']
    ELSE ARRAY[]::text[] END LOOP
    IF jsonb_typeof(item->field) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Expected text field: '||field;
    END IF;
  END LOOP;
  IF p_kind='instructors' THEN
    IF coalesce(item->>'status','') NOT IN ('active','draft','archived') OR jsonb_typeof(item->'featured')<>'boolean' THEN
      RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid instructor status or featured flag';
    END IF;
  END IF;
  IF p_kind='sites' AND (jsonb_typeof(item->'enabled')<>'boolean' OR coalesce(item->>'origin','') !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?/?$') THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='A site needs an HTTPS origin and boolean enabled flag';
  END IF;
  IF p_kind='courses' THEN
    IF coalesce(btrim(item->>'title'),'')='' OR coalesce(item->>'status','') NOT IN ('draft','published','archived')
      OR coalesce(item->>'level','') NOT IN ('Beginner','Intermediate','Advanced','All levels')
      OR coalesce(item->>'format','') NOT IN ('Mini class','Course','Training')
      OR coalesce(item->>'price_cents','') !~ '^[0-9]{1,9}$'
      OR coalesce(item->>'duration_minutes','') !~ '^[0-9]{1,6}$'
      OR coalesce(item->>'currency','') !~ '^[A-Za-z]{3}$' THEN
      RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid course title, status, level, format, price, duration, or currency';
    END IF;
    item := item || jsonb_build_object('price_cents',(item->>'price_cents')::integer,'duration_minutes',(item->>'duration_minutes')::integer,'currency',lower(item->>'currency'));
  END IF;
  IF p_kind='media' AND (coalesce(item->>'url','')='' OR coalesce(item->>'mime_type','')='' OR coalesce(item->>'size_bytes','') !~ '^[0-9]{1,12}$') THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Media needs a URL, MIME type, and nonnegative size';
  END IF;
  IF p_kind='media' THEN
    item := item || jsonb_build_object('size_bytes',(item->>'size_bytes')::bigint,'created_at',coalesce(old_item->'created_at',to_jsonb(now())));
  END IF;

  -- Explicit string arrays and lesson structure avoid unsafe or inconsistent JSON.
  FOREACH field IN ARRAY CASE WHEN p_kind='instructors' THEN ARRAY['expertise'] WHEN p_kind='courses' THEN ARRAY['outcomes','tags'] ELSE ARRAY[]::text[] END LOOP
    IF jsonb_typeof(item->field) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Expected string array: '||field; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(item->field) x WHERE jsonb_typeof(x)<>'string') THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Expected string array: '||field; END IF;
  END LOOP;
  IF p_kind='courses' THEN
    IF jsonb_typeof(item->'lessons') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Lessons must be an array'; END IF;
    FOR lesson IN SELECT l FROM jsonb_array_elements(item->'lessons') AS a(l) LOOP
      IF jsonb_typeof(lesson)<>'object' OR coalesce(lesson->>'id','')='' OR coalesce(lesson->>'title','')=''
        OR jsonb_typeof(lesson->'body') IS DISTINCT FROM 'string'
        OR coalesce(lesson->>'duration_minutes','') !~ '^[0-9]{1,6}$'
        OR coalesce(lesson->>'position','') !~ '^[0-9]{1,6}$'
        OR (lesson ? 'preview' AND jsonb_typeof(lesson->'preview')<>'boolean') THEN
        RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid lesson fields';
      END IF;
    END LOOP;
    item := jsonb_set(item,'{lessons}',coalesce((SELECT jsonb_agg(l||jsonb_build_object('duration_minutes',(l->>'duration_minutes')::integer,'position',(l->>'position')::integer)) FROM jsonb_array_elements(item->'lessons') AS a(l)),'[]'::jsonb));
  END IF;
  -- Reject executable URLs in every nested *_url/url field. Relative first-party
  -- assets are allowed; scheme-relative URLs and backslashes are not.
  FOR value IN SELECT jsonb_path_query(item,'$.**') LOOP
    IF jsonb_typeof(value)='object' THEN
      FOR field,ref_id IN SELECT k,v#>>'{}' FROM jsonb_each(value) AS e(k,v) WHERE k='url' OR k LIKE '%\_url' ESCAPE '\' LOOP
        IF ref_id IS NOT NULL AND ref_id<>'' AND (ref_id !~ '^(https://[^[:space:]]+|/[^/][^[:space:]]*)$' OR position(chr(92) IN ref_id)>0) THEN
          RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='URLs must be HTTPS or first-party relative paths';
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  all_records := teachvirt.learning_hub_snapshot(true);
  FOREACH ref_key IN ARRAY ARRAY['instructor_id','subject_id','course_id','site_id','media_id'] LOOP
    ref_id := item->>ref_key;
    ref_kind := CASE ref_key WHEN 'instructor_id' THEN 'instructors' WHEN 'subject_id' THEN 'subjects' WHEN 'course_id' THEN 'courses' WHEN 'site_id' THEN 'sites' ELSE 'media' END;
    IF coalesce(ref_id,'')<>'' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(all_records->ref_kind,'[]'::jsonb)) r WHERE r->>'id'=ref_id) THEN
      RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Referenced record does not exist: '||ref_key;
    END IF;
  END LOOP;
  IF p_kind='courses' AND item->>'status'='published' AND (
    coalesce(item->>'subject_id','')='' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(all_records->'instructors') r WHERE r->>'id'=item->>'instructor_id' AND r->>'status'='active')
  ) THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Publishing requires a subject and an active instructor'; END IF;

  IF p_kind='courses' AND item_id ~ '^teachvirt:[0-9a-fA-F-]{36}$' THEN
    canonical_id := substring(item_id FROM 11)::uuid;
  ELSIF p_kind='courses' AND coalesce(item->>'canonical_course_id','')<>'' THEN
    BEGIN canonical_id := (item->>'canonical_course_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid canonical course id'; END;
  END IF;
  IF canonical_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM teachvirt.courses WHERE id=canonical_id) THEN
    RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Canonical TeachVirt course does not exist';
  END IF;
  IF octet_length(item::text)>1048576 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Normalized body exceeds 1 MB'; END IF;
  INSERT INTO teachvirt.learning_hub_records(hub_slug,kind,id,body,canonical_course_id)
  VALUES('swade-learn',p_kind,item_id,item,canonical_id)
  ON CONFLICT(hub_slug,kind,id) DO UPDATE SET body=excluded.body,canonical_course_id=excluded.canonical_course_id,updated_at=now();
  RETURN jsonb_build_object('ok',true,'id',item_id,'kind',p_kind,'record',item);
END;
$fn$;
REVOKE ALL ON FUNCTION teachvirt.learning_hub_admin(text,text,text,jsonb,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION teachvirt.learning_hub_admin(text,text,text,jsonb,text) TO anon, authenticated;

-- PostgREST listens for this transaction-commit notification; no restart is needed.
NOTIFY pgrst, 'reload schema';
COMMIT;
