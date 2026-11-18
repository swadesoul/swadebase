BEGIN;
CREATE TABLE IF NOT EXISTS public.imagineswade_members(actor text PRIMARY KEY,email text NOT NULL,exempt boolean NOT NULL DEFAULT false,free_videos integer NOT NULL DEFAULT 0 CHECK(free_videos>=0),created_at timestamptz DEFAULT now(),last_seen timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.imagineswade_assets(id uuid PRIMARY KEY,actor text NOT NULL,project_id uuid NOT NULL,name text NOT NULL,mime text NOT NULL,bytes bigint NOT NULL CHECK(bytes BETWEEN 1 AND 52428800),role text NOT NULL,state text NOT NULL DEFAULT 'pending',created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.imagineswade_jobs(id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),actor text NOT NULL,project_id uuid NOT NULL,request_id uuid NOT NULL,snapshot jsonb NOT NULL,snapshot_hash text NOT NULL,status text NOT NULL DEFAULT 'queued',stage text NOT NULL DEFAULT 'Waiting for CPU assembly',error text,output_asset_id uuid,created_at timestamptz DEFAULT now(),started_at timestamptz,finished_at timestamptz,heartbeat_at timestamptz,elapsed_seconds numeric,cost_usd numeric,UNIQUE(actor,request_id));
CREATE TABLE IF NOT EXISTS public.imagineswade_messages(id uuid PRIMARY KEY,actor text NOT NULL,sender text NOT NULL,body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.imagineswade_admin_events(id uuid PRIMARY KEY,admin_actor text NOT NULL,target_actor text,action text NOT NULL,detail jsonb NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.imagineswade_workers(hash text PRIMARY KEY,enabled boolean NOT NULL DEFAULT true);
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['imagineswade_members','imagineswade_assets','imagineswade_jobs','imagineswade_messages','imagineswade_admin_events','imagineswade_workers'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);END LOOP;END $$;
CREATE OR REPLACE FUNCTION public.imagineswade_v2(p_token text,p_actor text,p_action text,p_body jsonb DEFAULT '{}',p_email text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE is_admin boolean;target text;pid uuid;aid uuid;j public.imagineswade_jobs;s jsonb;line jsonb;c jsonb;doc jsonb;payload jsonb;cnt int;
BEGIN
IF p_token IS NULL OR NOT EXISTS(SELECT 1 FROM public.imagineswade_tokens WHERE enabled AND hash=encode(extensions.digest(p_token,'sha256'),'hex')) THEN RAISE EXCEPTION USING ERRCODE='PT401',MESSAGE='Unauthorized'; END IF;
IF p_actor IS NULL OR p_actor !~ '^[a-f0-9]{64}$' OR length(p_email)>254 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid identity'; END IF;
is_admin:=lower(p_email) IN ('swadesoul@gmail.com','officialabagale@gmail.com');
INSERT INTO public.imagineswade_members(actor,email,exempt) VALUES(p_actor,lower(p_email),is_admin) ON CONFLICT(actor) DO UPDATE SET email=excluded.email,exempt=CASE WHEN is_admin THEN true ELSE public.imagineswade_members.exempt END,last_seen=now();
IF p_action='workspace' THEN
 RETURN jsonb_build_object('assets',coalesce((SELECT jsonb_agg(to_jsonb(a)-'actor') FROM public.imagineswade_assets a WHERE actor=p_actor AND state='ready'),'[]'),'jobs',coalesce((SELECT jsonb_agg(to_jsonb(q)-'actor'-'snapshot') FROM (SELECT * FROM public.imagineswade_jobs WHERE actor=p_actor ORDER BY created_at DESC LIMIT 100)q),'[]'),'messages',coalesce((SELECT jsonb_agg(to_jsonb(m)-'actor' ORDER BY created_at) FROM public.imagineswade_messages m WHERE actor=p_actor),'[]'),'member',(SELECT to_jsonb(m)-'actor' FROM public.imagineswade_members m WHERE actor=p_actor),'founder',is_admin,'billing',jsonb_build_object('state','pricing_required','merchant','acct_1SizGm43OPTHaIwn','balance_cents',null),'voices',coalesce((SELECT jsonb_agg(jsonb_build_object('id',v.id,'label',v.display_name,'locked',v.voice_lock,'status',v.status)) FROM sssbrain.voice_identities v WHERE (is_admin OR EXISTS(SELECT 1 FROM sssbrain.voice_identity_permissions vp WHERE vp.voice_identity_id=v.id AND vp.app='imagineswade' AND vp.can_generate)) AND v.status='active'),'[]'));
END IF;
IF p_action='asset_begin' THEN
 pid:=(p_body->>'projectId')::uuid;aid:=(p_body->>'id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.imagineswade_projects WHERE actor=p_actor AND id=pid) THEN RAISE EXCEPTION USING ERRCODE='PT404',MESSAGE='Save this production before uploading';END IF;
 IF coalesce(p_body->>'mime','') NOT IN ('video/mp4','video/webm','video/quicktime','image/png','image/jpeg','image/webp','audio/wav','audio/mpeg','audio/mp4','audio/webm') OR length(coalesce(p_body->>'name','')) NOT BETWEEN 1 AND 200 OR coalesce(p_body->>'role','') NOT IN ('reference','start','end','clip','character','dialogue','music') OR (p_body->>'bytes')::bigint NOT BETWEEN 1 AND 52428800 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Unsupported file or file exceeds 50 MB';END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor,1));
 IF (SELECT coalesce(sum(bytes),0) FROM public.imagineswade_assets WHERE actor=p_actor)>1073741824 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Workspace storage quota reached';END IF;
 INSERT INTO public.imagineswade_assets(id,actor,project_id,name,mime,bytes,role) VALUES(aid,p_actor,pid,p_body->>'name',p_body->>'mime',(p_body->>'bytes')::bigint,p_body->>'role');
 RETURN jsonb_build_object('asset',(SELECT to_jsonb(a)-'actor' FROM public.imagineswade_assets a WHERE id=aid));
END IF;
IF p_action IN ('asset_ready','asset_get') THEN
 aid:=(p_body->>'id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=aid AND actor=p_actor) THEN RAISE EXCEPTION USING ERRCODE='PT404',MESSAGE='Asset not found';END IF;
 IF p_action='asset_ready' THEN UPDATE public.imagineswade_assets SET state='ready' WHERE id=aid AND actor=p_actor;END IF;
 RETURN jsonb_build_object('asset',(SELECT to_jsonb(a)-'actor' FROM public.imagineswade_assets a WHERE id=aid AND actor=p_actor));
END IF;
IF p_action='assemble' THEN
 pid:=(p_body->>'projectId')::uuid;
 SELECT body INTO doc FROM public.imagineswade_projects WHERE actor=p_actor AND id=pid;
 IF doc IS NULL OR (SELECT revision FROM public.imagineswade_projects WHERE actor=p_actor AND id=pid)<>(p_body->>'revision')::int THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Save your current edit before exporting';END IF;
 IF (SELECT coalesce(sum((value->>'duration')::numeric),0) FROM jsonb_array_elements(doc->'shots'))>900 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='This export supports up to 15 minutes';END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(doc->'shots') LOOP
  IF NOT EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=(s->>'clipAssetId')::uuid AND actor=p_actor AND project_id=pid AND state='ready' AND (mime LIKE 'video/%' OR mime LIKE 'image/%')) THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Every scene needs an owned finished clip or image';END IF;
  IF coalesce(s->>'transition','cut') NOT IN ('cut','fade','dissolve') OR coalesce((s->>'trimIn')::numeric,0) NOT BETWEEN 0 AND 3600 OR coalesce((s->>'transitionSeconds')::numeric,0.5) NOT BETWEEN 0 AND 2 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid edit range';END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(coalesce(s->'dialogue','[]')) LOOP
   SELECT value INTO c FROM jsonb_array_elements(coalesce(doc->'characters','[]')) WHERE value->>'id'=line->>'characterId';
   IF c IS NULL OR coalesce(c->>'voiceId','')='' OR c->>'revision' IS DISTINCT FROM line->>'voiceRevision' OR (line->>'delivery'='onscreen' AND NOT coalesce(s->'castIds','[]') ? (c->>'id')) THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Character or voice continuity needs approval';END IF;
   IF NOT EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=(line->>'audioAssetId')::uuid AND actor=p_actor AND project_id=pid AND state='ready' AND mime LIKE 'audio/%') THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Every dialogue line needs approved owned audio';END IF;
  END LOOP;
 END LOOP;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor,2));
 SELECT * INTO j FROM public.imagineswade_jobs WHERE actor=p_actor AND request_id=(p_body->>'requestId')::uuid;
 IF j.id IS NOT NULL THEN RETURN jsonb_build_object('job',to_jsonb(j)-'snapshot'-'actor');END IF;
 IF (SELECT count(*) FROM public.imagineswade_jobs WHERE actor=p_actor AND status IN ('queued','running'))>=2 OR (SELECT count(*) FROM public.imagineswade_jobs WHERE actor=p_actor AND created_at>now()-interval '24 hours')>=20 THEN RAISE EXCEPTION USING ERRCODE='PT429',MESSAGE='Export limit reached. Wait for your current exports';END IF;
 INSERT INTO public.imagineswade_jobs(actor,project_id,request_id,snapshot,snapshot_hash) VALUES(p_actor,pid,(p_body->>'requestId')::uuid,doc,encode(extensions.digest(doc::text,'sha256'),'hex')) RETURNING * INTO j;
 INSERT INTO public.imagineswade_audit(actor,action,project_id) VALUES(p_actor,CASE WHEN is_admin THEN 'assemble_founder_exempt_0' ELSE 'assemble_cpu_preview_0' END,pid);
 RETURN jsonb_build_object('job',to_jsonb(j)-'snapshot'-'actor');
END IF;
IF p_action='cancel' THEN
 UPDATE public.imagineswade_jobs SET status='cancelled',stage='Cancelled',finished_at=now() WHERE id=(p_body->>'id')::uuid AND actor=p_actor AND status IN ('queued','running');RETURN '{"ok":true}';
END IF;
IF p_action LIKE 'admin_%' THEN
 IF NOT is_admin THEN RAISE EXCEPTION USING ERRCODE='PT403',MESSAGE='Superadmin required';END IF;
 IF p_action='admin_overview' THEN RETURN jsonb_build_object('users',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY created_at DESC) FROM public.imagineswade_members m),'[]'),'projects',coalesce((SELECT jsonb_agg(jsonb_build_object('actor',actor,'id',id,'title',body->>'title','revision',revision,'updated_at',updated_at)) FROM public.imagineswade_projects),'[]'),'jobs',coalesce((SELECT jsonb_agg(to_jsonb(q)-'snapshot') FROM (SELECT * FROM public.imagineswade_jobs ORDER BY created_at DESC LIMIT 200)q),'[]'),'storage_bytes',(SELECT coalesce(sum(bytes),0) FROM public.imagineswade_assets WHERE state='ready'),'events',coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (SELECT * FROM public.imagineswade_admin_events ORDER BY created_at DESC LIMIT 200)q),'[]'));END IF;
 target:=p_body->>'actor';IF NOT EXISTS(SELECT 1 FROM public.imagineswade_members WHERE actor=target) THEN RAISE EXCEPTION USING ERRCODE='PT404',MESSAGE='User not found';END IF;
 IF p_action='admin_view' THEN
 INSERT INTO public.imagineswade_admin_events VALUES((p_body->>'requestId')::uuid,p_actor,target,'read_only_support_view','{}',now()) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('projects',coalesce((SELECT jsonb_agg(body||jsonb_build_object('revision',revision)) FROM public.imagineswade_projects WHERE actor=target),'[]'));
 END IF;
 INSERT INTO public.imagineswade_admin_events(id,admin_actor,target_actor,action,detail) VALUES((p_body->>'requestId')::uuid,p_actor,target,p_action,p_body-'body') ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS cnt=ROW_COUNT;IF cnt=0 THEN RETURN '{"ok":true,"duplicate":true}';END IF;
 IF p_action='admin_exempt' THEN UPDATE public.imagineswade_members SET exempt=(p_body->>'exempt')::boolean WHERE actor=target;
 ELSIF p_action='admin_gift' THEN IF (p_body->>'count')::int NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid grant';END IF;UPDATE public.imagineswade_members SET free_videos=free_videos+(p_body->>'count')::int WHERE actor=target;
 ELSIF p_action='admin_message' THEN INSERT INTO public.imagineswade_messages(id,actor,sender,body) VALUES((p_body->>'requestId')::uuid,target,'ImagineSwade Studio',p_body->>'body');
 ELSE RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Unknown admin action';END IF;
 RETURN '{"ok":true}';
END IF;
IF p_action='save' THEN
 IF jsonb_typeof(coalesce(p_body->'characters','[]'))<>'array' OR jsonb_array_length(coalesce(p_body->'characters','[]'))>100 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid character sheets';END IF;
END IF;
RETURN public.imagineswade_workspace(p_token,p_actor,p_action,p_body);
END;$$;
REVOKE ALL ON FUNCTION public.imagineswade_v2(text,text,text,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imagineswade_v2(text,text,text,jsonb,text) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.imagineswade_worker(p_token text,p_action text,p_body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.imagineswade_jobs;aid uuid;a public.imagineswade_assets;
BEGIN
IF NOT EXISTS(SELECT 1 FROM public.imagineswade_workers WHERE enabled AND hash=encode(extensions.digest(p_token,'sha256'),'hex')) THEN RAISE EXCEPTION USING ERRCODE='PT401',MESSAGE='Unauthorized';END IF;
IF p_action='claim' THEN
 UPDATE public.imagineswade_jobs SET status='failed',stage='Worker interrupted; retry export',error='CPU worker lease expired',finished_at=now() WHERE status='running' AND heartbeat_at<now()-interval '20 minutes';
 SELECT * INTO j FROM public.imagineswade_jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF j.id IS NULL THEN RETURN '{"job":null}';END IF;
 UPDATE public.imagineswade_jobs SET status='running',stage='Preparing owned media',started_at=now(),heartbeat_at=now() WHERE id=j.id RETURNING * INTO j;
 RETURN jsonb_build_object('job',to_jsonb(j),'assets',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.imagineswade_assets x WHERE actor=j.actor AND project_id=j.project_id AND state='ready'),'[]'));
END IF;
SELECT * INTO j FROM public.imagineswade_jobs WHERE id=(p_body->>'jobId')::uuid;
IF j.id IS NULL THEN RAISE EXCEPTION 'Job not found';END IF;
IF p_action='status' THEN RETURN jsonb_build_object('status',j.status);END IF;
IF j.status<>'running' THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Job no longer running';END IF;
IF p_action='stage' THEN UPDATE public.imagineswade_jobs SET stage=left(p_body->>'stage',200),heartbeat_at=now() WHERE id=j.id;
ELSIF p_action='output' THEN
 aid:=(p_body->>'assetId')::uuid;
 INSERT INTO public.imagineswade_assets(id,actor,project_id,name,mime,bytes,role) VALUES(aid,j.actor,j.project_id,'Master export.mp4','video/mp4',(p_body->>'bytes')::bigint,'clip') ON CONFLICT(id) DO NOTHING;
 RETURN jsonb_build_object('asset',(SELECT to_jsonb(x) FROM public.imagineswade_assets x WHERE id=aid AND actor=j.actor));
ELSIF p_action='complete' THEN
 aid:=(p_body->>'assetId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=aid AND actor=j.actor AND project_id=j.project_id AND state='pending') THEN RAISE EXCEPTION 'Output missing';END IF;
 UPDATE public.imagineswade_assets SET state='ready' WHERE id=aid;
 UPDATE public.imagineswade_jobs SET status='complete',stage='Master ready',output_asset_id=aid,finished_at=now(),elapsed_seconds=extract(epoch FROM now()-started_at) WHERE id=j.id;
INSERT INTO swadebase_ops.ai_usage_ledger(project,feature,provider,model,units,cost_usd,priced,status,request_id,meta) VALUES('imagineswade','assembly','hostinger-cpu','ffmpeg',jsonb_build_object('seconds',extract(epoch FROM now()-j.started_at)),0,false,'ok',j.id::text,jsonb_build_object('actor',j.actor,'project_id',j.project_id,'snapshot_hash',j.snapshot_hash));
ELSIF p_action='fail' THEN UPDATE public.imagineswade_jobs SET status='failed',stage='Export failed',error=left(p_body->>'error',1000),finished_at=now() WHERE id=j.id;
ELSE RAISE EXCEPTION 'Unknown worker action';END IF;
RETURN '{"ok":true}';END;$$;
REVOKE ALL ON FUNCTION public.imagineswade_worker(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imagineswade_worker(text,text,jsonb) TO anon;
DO $patch$ DECLARE src text; BEGIN SELECT pg_get_functiondef('public.imagineswade_workspace(text,text,text,jsonb)'::regprocedure) INTO src; src:=replace(src, $$coalesce(s->>'duration','') !~ '^(3|5|8|10|15|30)$'$$, $$CASE WHEN jsonb_typeof(s->'duration')='number' THEN (s->>'duration')::numeric NOT BETWEEN 0.25 AND 30 ELSE true END$$); EXECUTE src; END $patch$;
COMMIT;
