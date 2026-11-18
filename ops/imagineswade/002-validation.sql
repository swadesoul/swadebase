BEGIN;
CREATE OR REPLACE FUNCTION public.imagineswade_workspace(p_token text,p_actor text,p_action text,p_body jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE pid uuid; doc jsonb; rev integer; saved jsonb;
BEGIN
IF p_token IS NULL OR NOT EXISTS(SELECT 1 FROM public.imagineswade_tokens WHERE enabled AND hash=encode(extensions.digest(p_token,'sha256'),'hex')) THEN RAISE EXCEPTION USING ERRCODE='PT401',MESSAGE='Unauthorized'; END IF;
IF p_actor IS NULL OR p_actor !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid actor'; END IF;
IF p_action='list' THEN RETURN jsonb_build_object('projects',coalesce((SELECT jsonb_agg(body||jsonb_build_object('id',id,'revision',revision,'updatedAt',updated_at) ORDER BY updated_at DESC) FROM public.imagineswade_projects WHERE actor=p_actor),'[]'::jsonb),'backend','swadebase','gpu',jsonb_build_object('connected',false,'target','RTX PRO 6000 Blackwell 96 GB','reason','GPU activation and approved cost cap required')); END IF;
IF p_action='render' THEN RETURN jsonb_build_object('error','GPU is not activated. Save your production brief first. No charge was made.','code','gpu_not_activated'); END IF;
IF p_action <> 'save' OR p_action IS NULL THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Unknown action'; END IF;
IF p_body IS NULL OR jsonb_typeof(p_body)<>'object' OR octet_length(p_body::text)>450000 OR length(coalesce(p_body->>'title','')) NOT BETWEEN 1 AND 120 OR jsonb_typeof(p_body->'shots') IS DISTINCT FROM 'array' OR jsonb_array_length(p_body->'shots')>60 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid project'; END IF;
IF coalesce(p_body->>'format','') NOT IN ('16:9','9:16','1:1') OR coalesce(p_body->>'look','') NOT IN ('Cinematic','35mm film','Documentary','Animation','Music video') OR jsonb_typeof(p_body->'description') IS DISTINCT FROM 'string' OR jsonb_array_length(p_body->'shots')<1 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_body->'shots') s WHERE jsonb_typeof(s->'title') IS DISTINCT FROM 'string' OR jsonb_typeof(s->'prompt') IS DISTINCT FROM 'string' OR length(s->>'title')>150 OR length(s->>'prompt')>10000 OR coalesce(s->>'duration','') !~ '^(3|5|8|10|15|30)$') THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Invalid scene fields'; END IF;
pid := (p_body->>'id')::uuid;
PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor,0));
SELECT revision INTO rev FROM public.imagineswade_projects WHERE actor=p_actor AND id=pid;
IF rev IS NOT NULL AND coalesce((p_body->>'revision')::int,0)<>rev THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Project changed. Reload before saving.'; END IF;
IF rev IS NULL AND (SELECT count(*) FROM public.imagineswade_projects WHERE actor=p_actor)>=100 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Workspace project limit reached'; END IF;
doc:=p_body-'revision'-'updatedAt';
INSERT INTO public.imagineswade_projects(actor,id,body) VALUES(p_actor,pid,doc) ON CONFLICT(actor,id) DO UPDATE SET body=excluded.body,revision=public.imagineswade_projects.revision+1,updated_at=now() RETURNING body||jsonb_build_object('revision',revision,'updatedAt',updated_at) INTO saved;
INSERT INTO public.imagineswade_audit(actor,action,project_id) VALUES(p_actor,'save',pid);
RETURN jsonb_build_object('project',saved);
END; $$;

COMMIT;
