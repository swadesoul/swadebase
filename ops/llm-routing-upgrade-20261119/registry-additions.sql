-- Existing SWADEBASE model registry extension. Candidate records remain disabled until installed and benchmarked.
BEGIN;
SET LOCAL lock_timeout='5s';
INSERT INTO swadesoul.ai_model_registry(provider,model_name,model_role,context_window,supports_text,supports_image_input,supports_audio,supports_tool_calling,supports_json,cost_tier,latency_tier,priority,is_enabled)
VALUES
('ollama','qwen3.5:9b','chat',32768,true,true,false,true,true,'self-hosted','fast',5,false),
('ollama','qwen3.5:9b','reasoning',32768,true,true,false,true,true,'self-hosted','balanced',5,false),
('ollama','qwen3.5:9b','growth_strategy',32768,true,true,false,true,true,'self-hosted','balanced',5,false),
('ollama','gemma4:12b','vision',32768,true,true,true,false,true,'self-hosted','balanced',5,false),
('ollama','gemma4:12b','visual_analysis',32768,true,true,true,false,true,'self-hosted','balanced',5,false),
('ollama','gemma4:12b','chat',32768,true,true,true,false,true,'self-hosted','balanced',15,false),
('ollama','granite4.2:8b-q4_K_M','code',32768,true,false,false,true,true,'self-hosted','balanced',5,false),
('ollama','granite4.2:8b-q4_K_M','reasoning',32768,true,false,false,true,true,'self-hosted','balanced',15,false),
('ollama','ministral-3:8b','fast',32768,true,true,false,true,true,'self-hosted','fast',5,false),
('ollama','ministral-3:8b','social_post',32768,true,true,false,true,true,'self-hosted','fast',5,false),
('ollama','qwen3:4b','chat',8192,true,false,false,false,true,'self-hosted','fast',30,true),
('ollama','qwen3:4b','fast',8192,true,false,false,false,true,'self-hosted','fast',30,true)
ON CONFLICT(provider,model_name,model_role) DO UPDATE SET
 context_window=EXCLUDED.context_window,
 supports_text=EXCLUDED.supports_text,
 supports_image_input=EXCLUDED.supports_image_input,
 supports_audio=EXCLUDED.supports_audio,
 supports_tool_calling=EXCLUDED.supports_tool_calling,
 supports_json=EXCLUDED.supports_json,
 cost_tier=EXCLUDED.cost_tier,
 latency_tier=EXCLUDED.latency_tier,
 priority=EXCLUDED.priority;
-- Deliberately do NOT enable candidate models, disable old routes, or modify customer preferences until benchmark.
COMMIT;
