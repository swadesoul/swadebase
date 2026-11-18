BEGIN;
CREATE OR REPLACE FUNCTION swadebase_ops.pet_muzik_record_voice(p_user uuid,p_feature text,p_units jsonb,p_request text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swadebase_ops,pg_temp AS $$
DECLARE v_id bigint; v_model text; v_unit text; v_amount numeric;
BEGIN
 IF NOT EXISTS(select 1 from auth.users where id=p_user and lower(email)='swadesoul@gmail.com' and (email_confirmed_at is not null or confirmed_at is not null)) OR NOT swadebase_ops.is_super_admin(p_user) THEN RAISE EXCEPTION 'pet_voice_owner_only'; END IF;
 IF p_feature IS NULL OR p_request IS NULL OR p_feature NOT IN ('voice-follow-up','voice-intake','voice-connection-smoke-speech','voice-connection-smoke-stt') OR length(p_request)>100 OR length(p_request)<10 THEN RAISE EXCEPTION 'pet_voice_invalid'; END IF;
 v_unit:=CASE WHEN p_feature IN ('voice-follow-up','voice-connection-smoke-speech') THEN 'character' ELSE 'audio_second' END;
 v_model:=CASE WHEN v_unit='character' THEN 'kokoro-cpu' ELSE 'whisper-small.en-cpu' END;
 IF jsonb_typeof(p_units)<>'object' OR (select count(*) from jsonb_object_keys(p_units))<>1 OR NOT p_units?v_unit THEN RAISE EXCEPTION 'pet_voice_units'; END IF;
 v_amount:=(p_units->>v_unit)::numeric;
 IF v_amount<=0 OR v_amount>(CASE WHEN v_unit='character' THEN 600 ELSE 30.1 END) THEN RAISE EXCEPTION 'pet_voice_units'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('pet-muzik-voice:'||p_user::text,0));
 IF EXISTS(select 1 from ai_usage_ledger where project='pet-muzik' and request_id=p_request) THEN RAISE EXCEPTION 'pet_voice_duplicate'; END IF;
 IF (select count(*) from ai_usage_ledger where project='pet-muzik' and feature like 'voice-%' and user_id=p_user and occurred_at>now()-interval '1 hour')>=120 OR (select count(*) from ai_usage_ledger where project='pet-muzik' and feature like 'voice-%' and user_id=p_user and occurred_at>now()-interval '1 day')>=300 THEN RAISE EXCEPTION 'pet_voice_rate_limit'; END IF;
 IF NOT EXISTS(select 1 from ai_provider_accounts where provider='swade_voice' and billing='self_hosted' and backend_use_allowed) THEN RAISE EXCEPTION 'pet_voice_provider_hold'; END IF;
 SELECT ledger_id INTO v_id FROM swadebase_ops.ai_record_usage('pet-muzik',p_feature,'swade_voice',v_model,p_user,0,0,p_units,'blocked',p_request,'{"project_id":"appgprj_6ae11e774ba88191ba4898e90c08dea6","paid_fallback":false,"stored_audio":false,"pending":true}'::jsonb);
 RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION swadebase_ops.pet_muzik_finish_voice(p_id bigint,p_user uuid,p_request text,p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swadebase_ops,pg_temp AS $$
BEGIN
 IF p_status IS NULL OR p_status NOT IN ('ok','failed') THEN RAISE EXCEPTION 'pet_voice_status'; END IF;
 UPDATE ai_usage_ledger SET status=CASE WHEN p_status='ok' THEN 'ok' ELSE 'error' END,meta=meta||'{"pending":false}'::jsonb WHERE id=p_id AND project='pet-muzik' AND provider='swade_voice' AND feature IN ('voice-follow-up','voice-intake','voice-connection-smoke-speech','voice-connection-smoke-stt') AND user_id=p_user AND request_id=p_request AND status='blocked' AND meta->>'pending'='true';
 IF NOT FOUND THEN RAISE EXCEPTION 'pet_voice_receipt_missing'; END IF;
END $$;
REVOKE ALL ON FUNCTION swadebase_ops.pet_muzik_record_voice(uuid,text,jsonb,text),swadebase_ops.pet_muzik_finish_voice(bigint,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swadebase_ops.pet_muzik_record_voice(uuid,text,jsonb,text),swadebase_ops.pet_muzik_finish_voice(bigint,uuid,text,text) TO swadebase_adapters;
COMMIT;
