\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE audit_result(name text,passed boolean);
DO $$
DECLARE t text:=encode(extensions.gen_random_bytes(32),'hex'); a text:=repeat('a',64); b text:=repeat('b',64); fixture_id uuid:=gen_random_uuid(); payload jsonb; r jsonb; n int;
BEGIN
INSERT INTO public.imagineswade_tokens(hash) VALUES(encode(extensions.digest(t,'sha256'),'hex'));
payload:=jsonb_build_object('id',fixture_id,'title','Disposable audit fixture','description','Audit only','format','16:9','look','Cinematic','shots',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'title','Opening','prompt','An empty test stage','duration',5)));
r:=public.imagineswade_workspace(t,a,'save',payload);
INSERT INTO audit_result VALUES('save returns revision 1',r->'project'->>'revision'='1');
r:=public.imagineswade_workspace(t,a,'list');
INSERT INTO audit_result VALUES('saved project readable by its actor',exists(select 1 from jsonb_array_elements(r->'projects') x where x->>'id'=fixture_id::text));
r:=public.imagineswade_workspace(t,b,'list');
INSERT INTO audit_result VALUES('second actor cannot list first actor project',not exists(select 1 from jsonb_array_elements(r->'projects') x where x->>'id'=fixture_id::text));
BEGIN PERFORM public.imagineswade_workspace('invalid',a,'list'); INSERT INTO audit_result VALUES('invalid token denied',false); EXCEPTION WHEN SQLSTATE 'PT401' THEN INSERT INTO audit_result VALUES('invalid token denied',true); END;
BEGIN PERFORM public.imagineswade_workspace(t,'bad-actor','list'); INSERT INTO audit_result VALUES('invalid actor denied',false); EXCEPTION WHEN SQLSTATE 'PT400' THEN INSERT INTO audit_result VALUES('invalid actor denied',true); END;
BEGIN PERFORM public.imagineswade_workspace(t,a,'save',payload); INSERT INTO audit_result VALUES('stale revision denied',false); EXCEPTION WHEN SQLSTATE 'PT409' THEN INSERT INTO audit_result VALUES('stale revision denied',true); END;
r:=public.imagineswade_workspace(t,a,'save',payload||'{"revision":1}'::jsonb);
INSERT INTO audit_result VALUES('matching revision updates to 2',r->'project'->>'revision'='2');
INSERT INTO audit_result SELECT 'save audit records both mutations',count(*)=2 FROM public.imagineswade_audit WHERE project_id=fixture_id;
r:=public.imagineswade_workspace(t,a,'render');INSERT INTO audit_result VALUES('render explicitly blocked',r->>'code'='gpu_not_activated');
BEGIN PERFORM public.imagineswade_workspace(t,a,'upload');INSERT INTO audit_result VALUES('no media upload action exists',false);EXCEPTION WHEN SQLSTATE 'PT400' THEN INSERT INTO audit_result VALUES('no media upload action exists',true);END;
BEGIN PERFORM public.imagineswade_workspace(t,a,'save',(payload-'title')||jsonb_build_object('id',gen_random_uuid()));INSERT INTO audit_result VALUES('missing title denied',false);EXCEPTION WHEN SQLSTATE 'PT400' THEN INSERT INTO audit_result VALUES('missing title denied',true);END;
BEGIN PERFORM public.imagineswade_workspace(t,a,'save',payload||jsonb_build_object('id',gen_random_uuid(),'shots','[]'::jsonb));INSERT INTO audit_result VALUES('empty shot list denied',false);EXCEPTION WHEN SQLSTATE 'PT400' THEN INSERT INTO audit_result VALUES('empty shot list denied',true);END;
BEGIN PERFORM public.imagineswade_workspace(t,a,'save',payload||jsonb_build_object('id',gen_random_uuid(),'format','bad'));INSERT INTO audit_result VALUES('invalid aspect ratio denied',false);EXCEPTION WHEN SQLSTATE 'PT400' THEN INSERT INTO audit_result VALUES('invalid aspect ratio denied',true);END;
END $$;
INSERT INTO audit_result SELECT role||' direct project table access revoked',NOT has_table_privilege(role,'public.imagineswade_projects','SELECT,INSERT,UPDATE,DELETE') FROM unnest(ARRAY['anon','authenticated','service_role']) role;
TABLE audit_result;
SELECT count(*) AS checks,count(*) FILTER(WHERE passed) AS passed FROM audit_result;
ROLLBACK;
