-- Remove outdated cloud-first defaults ONLY where an existing local model has been verified available.
BEGIN;
SET LOCAL lock_timeout='5s';
INSERT INTO swadesoul.ai_model_registry(provider,model_name,model_role,context_window,supports_text,supports_image_input,supports_audio,supports_tool_calling,supports_json,cost_tier,latency_tier,priority,is_enabled)
VALUES('ollama','qwen3:4b','social_post',8192,true,false,false,false,true,'self-hosted','fast',30,true)
ON CONFLICT(provider,model_name,model_role) DO UPDATE SET is_enabled=true;
UPDATE swadesoul.ai_model_registry SET is_enabled=false,updated_at=now()
WHERE provider='ollama' AND
 ((model_name='gpt-oss:120b-cloud' AND model_role='chat') OR
  (model_name='gpt-oss:20b-cloud' AND model_role IN ('fast','social_post')));
-- Retain specialized legacy code/embedding/vision/reasoning routes until actual matching local replacements pass acceptance.
COMMIT;
