--
-- PostgreSQL database dump
--

\restrict dZyrlbPWHyJAwWJOaghRKKhgnyqpJJof8IbVkb7GVD8Tceaz9Md98PvloR7kWS3

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: ai_model_registry; Type: TABLE DATA; Schema: swadesoul; Owner: postgres
--

INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('9d1fae93-b1cc-4c8c-8892-97fd09ed3813', 'ollama', 'gpt-oss:120b-cloud', 'reasoning', 128000, true, false, false, true, true, 'medium', 'medium', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('f4f1fc06-c981-4f8e-83b5-954dedf77773', 'ollama', 'gpt-oss:120b-cloud', 'chat', 128000, true, false, false, true, true, 'medium', 'medium', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('5c8ca3bf-f353-42c9-93b9-59f68a61f7a2', 'ollama', 'gpt-oss:120b-cloud', 'growth_strategy', 128000, true, false, false, true, true, 'medium', 'medium', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('2068ed49-e946-459a-96c9-0e1c4f70bfab', 'ollama', 'gpt-oss:20b-cloud', 'fast', 32000, true, false, false, true, true, 'low', 'fast', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('13821c42-3ab8-47e4-acb0-2a9b0a5420fe', 'ollama', 'gpt-oss:20b-cloud', 'social_post', 32000, true, false, false, true, true, 'low', 'fast', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('7a457770-78cf-4cbd-9326-fda10a6ac646', 'ollama', 'qwen3-vl:235b-cloud', 'vision', 128000, true, true, false, false, true, 'high', 'slow', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('c2c94bea-80c4-44a8-bd00-d37317b91bda', 'ollama', 'qwen3-vl:235b-cloud', 'visual_analysis', 128000, true, true, false, false, true, 'high', 'slow', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('3275fd13-ce70-43b2-8c86-040a4f08a6c1', 'ollama', 'qwen2.5-coder:32b', 'code', 32000, true, false, false, true, true, 'medium', 'medium', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('85b08c85-6d42-4dfb-bfa4-26a812aea36a', 'ollama', 'bge-m3', 'embedding', 8192, true, false, false, false, true, 'low', 'fast', 10, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('e944421f-ce22-403c-95fa-953efe32e079', 'openai', 'gpt-4o', 'chat', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('99da5ae1-db53-4d81-a642-80482e079f9b', 'openai', 'gpt-4o', 'reasoning', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('520ba4c4-a1df-4afe-a6e1-9e3ac8fb3d99', 'openai', 'gpt-4o', 'vision', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('8d4c3833-f355-4889-9fd7-635f42c0ee48', 'openai', 'gpt-4o', 'visual_analysis', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('b85306c1-f0d6-4a00-9799-58aeff160504', 'openai', 'gpt-4o', 'growth_strategy', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('debac713-0674-49aa-af65-12d833c732e3', 'openai', 'gpt-4o', 'social_post', 128000, true, true, false, true, true, 'medium', 'medium', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('e8c37d6f-520b-4445-8ed5-4f1cb9b074c0', 'openai', 'gpt-4o-mini', 'fast', 128000, true, true, false, true, true, 'low', 'fast', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('2d0e9109-5f0e-4133-8c0d-17a52004f34d', 'openai', 'gpt-4o-mini', 'code', 128000, true, true, false, true, true, 'low', 'fast', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('9d427e16-0a22-47c0-8900-3f10d6689690', 'openai', 'text-embedding-3-small', 'embedding', 8192, true, false, false, false, true, 'low', 'fast', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('927f1580-3e89-409b-9074-7baf724a53af', 'openai', 'gpt-image-1', 'image', 0, true, false, false, false, true, 'high', 'slow', 50, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');
INSERT INTO swadesoul.ai_model_registry (id, provider, model_name, model_role, context_window, supports_text, supports_image_input, supports_audio, supports_tool_calling, supports_json, cost_tier, latency_tier, priority, is_enabled, created_at, updated_at) VALUES ('001ab7e4-6567-463c-84c9-faa6592b65c3', 'replicate', 'black-forest-labs/flux-2-pro', 'image', 0, true, false, false, false, true, 'high', 'slow', 20, true, '2026-05-20 00:37:46.65001+00', '2026-05-20 00:37:46.65001+00');


--
-- PostgreSQL database dump complete
--

\unrestrict dZyrlbPWHyJAwWJOaghRKKhgnyqpJJof8IbVkb7GVD8Tceaz9Md98PvloR7kWS3

