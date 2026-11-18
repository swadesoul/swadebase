BEGIN;
ALTER TABLE public.imagineswade_assets ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.imagineswade_voice(p_token text,p_actor text,p_email text,p_action text,p_body jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE doc jsonb;s jsonb;l jsonb;c jsonb;aid uuid;pid uuid;
BEGIN
PERFORM public.imagineswade_v2(p_token,p_actor,'workspace','{}',p_email);
pid:=(p_body->>'projectId')::uuid;aid:=(p_body->>'assetId')::uuid;
SELECT body INTO doc FROM public.imagineswade_projects WHERE id=pid AND actor=p_actor;
IF doc IS NULL THEN RAISE EXCEPTION USING ERRCODE='PT404',MESSAGE='Production not found';END IF;
SELECT value INTO s FROM jsonb_array_elements(doc->'shots') WHERE value->>'id'=p_body->>'sceneId';
SELECT value INTO l FROM jsonb_array_elements(coalesce(s->'dialogue','[]')) WHERE value->>'id'=p_body->>'lineId';
SELECT value INTO c FROM jsonb_array_elements(coalesce(doc->'characters','[]')) WHERE value->>'id'=l->>'characterId';
IF c IS NULL OR coalesce(c->>'voiceId','')='' OR length(coalesce(l->>'text','')) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION USING ERRCODE='PT400',MESSAGE='Save a character, voice and dialogue line first';END IF;
IF p_action='prepare' THEN
 IF EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=aid) THEN
  IF NOT EXISTS(SELECT 1 FROM public.imagineswade_assets WHERE id=aid AND actor=p_actor AND project_id=pid AND metadata->>'lineId'=l->>'id') THEN RAISE EXCEPTION USING ERRCODE='PT409',MESSAGE='Voice request conflict';END IF;
  RETURN jsonb_build_object('asset',(SELECT to_jsonb(a) FROM public.imagineswade_assets a WHERE id=aid),'line',l,'character',c);
 END IF;
 IF (SELECT count(*) FROM public.imagineswade_assets WHERE actor=p_actor AND metadata->>'engine'='kokoro' AND created_at>now()-interval '24 hours')>=100 THEN RAISE EXCEPTION USING ERRCODE='PT429',MESSAGE='Daily CPU speech safety limit reached';END IF;
 INSERT INTO public.imagineswade_assets(id,actor,project_id,name,mime,bytes,role,metadata) VALUES(aid,p_actor,pid,left((c->>'name')||' · '||(l->>'text'),100)||'.wav','audio/wav',1,'dialogue',jsonb_build_object('engine','kokoro','lineId',l->>'id','sceneId',s->>'id','characterId',c->>'id','characterRevision',c->'revision','voiceId',c->>'voiceId','text_sha256',encode(extensions.digest(l->>'text','sha256'),'hex')));
 RETURN jsonb_build_object('asset',(SELECT to_jsonb(a) FROM public.imagineswade_assets a WHERE id=aid),'line',l,'character',c);
ELSIF p_action='complete' THEN
 UPDATE public.imagineswade_assets a SET bytes=(p_body->>'bytes')::bigint,state='ready' WHERE id=aid AND actor=p_actor AND project_id=pid AND metadata->>'lineId'=l->>'id' RETURNING to_jsonb(a) INTO doc;
 RETURN jsonb_build_object('asset',doc-'actor');
ELSE RAISE EXCEPTION 'Invalid voice action';END IF;
END;$$;
REVOKE ALL ON FUNCTION public.imagineswade_voice(text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imagineswade_voice(text,text,text,text,jsonb) TO anon;
COMMIT;
