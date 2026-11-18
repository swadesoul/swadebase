-- SWADEBASE shared AI/voice/media cost ledger (founder rule: unknown costs block paid execution).
-- Every project records each provider call here; balances = recorded credit minus ledger spend.
-- Read by the Ecosystem MCP (swade_cost_report) so SSS Brain can answer cost questions.
BEGIN;

CREATE TABLE IF NOT EXISTS swadebase_ops.ai_provider_accounts (
  provider text PRIMARY KEY,
  display_name text NOT NULL,
  billing text NOT NULL CHECK (billing IN ('prepaid','postpaid','subscription','self_hosted')),
  hard_stop_usd numeric(12,4) NOT NULL DEFAULT 0,
  low_balance_usd numeric(12,4) NOT NULL DEFAULT 5,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swadebase_ops.ai_rate_cards (
  provider text NOT NULL REFERENCES swadebase_ops.ai_provider_accounts(provider),
  model text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('input_token','output_token','image','character','audio_second','gpu_second','participant_minute','request')),
  usd_per_unit numeric(20,12) NOT NULL CHECK (usd_per_unit >= 0),
  source_url text,
  verified_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (provider, model, unit)
);

CREATE TABLE IF NOT EXISTS swadebase_ops.ai_credit_topups (
  id bigserial PRIMARY KEY,
  provider text NOT NULL REFERENCES swadebase_ops.ai_provider_accounts(provider),
  amount_usd numeric(12,4) NOT NULL,
  kind text NOT NULL DEFAULT 'topup' CHECK (kind IN ('opening_balance','topup','correction','reconcile')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swadebase_ops.ai_usage_ledger (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  project text NOT NULL,
  feature text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  user_id uuid,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  units jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_usd numeric(14,6) NOT NULL DEFAULT 0,
  priced boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','blocked')),
  request_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS ai_usage_ledger_time_idx ON swadebase_ops.ai_usage_ledger (occurred_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_ledger_project_idx ON swadebase_ops.ai_usage_ledger (project, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_ledger_provider_idx ON swadebase_ops.ai_usage_ledger (provider, occurred_at DESC);

CREATE OR REPLACE FUNCTION swadebase_ops.ai_record_usage(
  p_project text, p_feature text, p_provider text, p_model text, p_user uuid,
  p_input_tokens integer DEFAULT 0, p_output_tokens integer DEFAULT 0,
  p_units jsonb DEFAULT '{}'::jsonb, p_status text DEFAULT 'ok',
  p_request_id text DEFAULT NULL, p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (ledger_id bigint, cost_usd numeric, priced boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = swadebase_ops, pg_temp AS $$
DECLARE
  v_cost numeric := 0; v_priced boolean := true; v_price numeric; k text; v numeric;
  v_units jsonb := coalesce(p_units, '{}'::jsonb)
    || jsonb_strip_nulls(jsonb_build_object('input_token', nullif(p_input_tokens,0), 'output_token', nullif(p_output_tokens,0)));
  v_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_provider_accounts a WHERE a.provider = p_provider) THEN
    INSERT INTO ai_provider_accounts(provider, display_name, billing, notes)
    VALUES (p_provider, p_provider, 'prepaid', 'auto-added by ledger; set billing and balance') ON CONFLICT DO NOTHING;
  END IF;
  FOR k, v IN SELECT e.key, (e.value)::numeric FROM jsonb_each_text(v_units) e LOOP
    SELECT r.usd_per_unit INTO v_price FROM ai_rate_cards r
     WHERE r.provider = p_provider AND r.model = p_model AND r.unit = k AND r.active;
    IF v_price IS NULL THEN
      SELECT r.usd_per_unit INTO v_price FROM ai_rate_cards r
       WHERE r.provider = p_provider AND r.model = '*' AND r.unit = k AND r.active;
    END IF;
    IF v_price IS NULL THEN v_priced := false; ELSE v_cost := v_cost + v * v_price; END IF;
    v_price := NULL;
  END LOOP;
  INSERT INTO ai_usage_ledger(project, feature, provider, model, user_id, input_tokens, output_tokens, units, cost_usd, priced, status, request_id, meta)
  VALUES (p_project, p_feature, p_provider, p_model, p_user, coalesce(p_input_tokens,0), coalesce(p_output_tokens,0),
          coalesce(p_units,'{}'::jsonb), round(v_cost, 6), v_priced, coalesce(p_status,'ok'), p_request_id, coalesce(p_meta,'{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN QUERY SELECT v_id, round(v_cost, 6), v_priced;
END $$;

CREATE OR REPLACE VIEW swadebase_ops.ai_provider_balances AS
SELECT a.provider, a.display_name, a.billing, a.hard_stop_usd, a.low_balance_usd,
       coalesce(t.credit, 0) AS credit_usd,
       coalesce(s.spent, 0) AS spent_usd,
       CASE WHEN a.billing = 'prepaid' THEN coalesce(t.credit, 0) - coalesce(s.spent, 0) END AS balance_usd,
       coalesce(s.mtd, 0) AS month_to_date_usd,
       coalesce(s.d30, 0) AS last_30_days_usd,
       coalesce(s.unpriced, 0) AS unpriced_calls,
       coalesce(t.has_opening, false) AS opening_balance_recorded,
       s.last_used_at
FROM swadebase_ops.ai_provider_accounts a
LEFT JOIN (SELECT provider, sum(amount_usd) credit, bool_or(kind = 'opening_balance') has_opening
           FROM swadebase_ops.ai_credit_topups GROUP BY provider) t USING (provider)
LEFT JOIN (SELECT provider, sum(cost_usd) spent,
                  sum(cost_usd) FILTER (WHERE occurred_at >= date_trunc('month', now())) mtd,
                  sum(cost_usd) FILTER (WHERE occurred_at >= now() - interval '30 days') d30,
                  count(*) FILTER (WHERE NOT priced) unpriced, max(occurred_at) last_used_at
           FROM swadebase_ops.ai_usage_ledger GROUP BY provider) s USING (provider);

CREATE OR REPLACE FUNCTION swadebase_ops.ai_can_spend(p_provider text, p_estimate_usd numeric DEFAULT 0)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = swadebase_ops, pg_temp AS $$
  SELECT CASE
    WHEN b.provider IS NULL THEN false
    WHEN b.billing IN ('self_hosted','subscription','postpaid') THEN true
    WHEN NOT b.opening_balance_recorded THEN false
    ELSE b.balance_usd - coalesce(p_estimate_usd, 0) >= b.hard_stop_usd
  END
  FROM (SELECT 1) one LEFT JOIN ai_provider_balances b ON b.provider = p_provider;
$$;

REVOKE ALL ON swadebase_ops.ai_provider_accounts, swadebase_ops.ai_rate_cards, swadebase_ops.ai_credit_topups, swadebase_ops.ai_usage_ledger FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION swadebase_ops.ai_record_usage(text,text,text,text,uuid,integer,integer,jsonb,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION swadebase_ops.ai_can_spend(text,numeric) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA swadebase_ops TO service_role, swadebase_adapters;
GRANT ALL ON swadebase_ops.ai_provider_accounts, swadebase_ops.ai_rate_cards, swadebase_ops.ai_credit_topups, swadebase_ops.ai_usage_ledger TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA swadebase_ops TO service_role;
GRANT EXECUTE ON FUNCTION swadebase_ops.ai_record_usage(text,text,text,text,uuid,integer,integer,jsonb,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION swadebase_ops.ai_can_spend(text,numeric) TO service_role;
GRANT SELECT ON swadebase_ops.ai_provider_accounts, swadebase_ops.ai_rate_cards, swadebase_ops.ai_credit_topups,
                swadebase_ops.ai_usage_ledger, swadebase_ops.ai_provider_balances TO swadebase_adapters;

INSERT INTO swadebase_ops.ai_provider_accounts(provider, display_name, billing, hard_stop_usd, low_balance_usd, notes) VALUES
 ('qwencloud','Alibaba QwenCloud (Model Studio intl)','prepaid',1,5,'Primary low-cost text LLM (qwen-flash)'),
 ('anthropic','Anthropic Claude API','prepaid',1,5,'Backup text LLM (claude-haiku-5-5)'),
 ('openai','OpenAI API','prepaid',1,5,'Last-resort text, optional images, founder-only GPT Live'),
 ('replicate','Replicate','prepaid',1,3,'Images (flux-schnell)'),
 ('runpod','RunPod serverless','prepaid',10,49,'Voice Studio cloned/designed voices; policy minimum $49'),
 ('elevenlabs','ElevenLabs','subscription',0,0,'Legacy fallback only'),
 ('livekit_cloud','LiveKit Cloud','postpaid',0,0,'Backup for self-hosted LiveKit'),
 ('swade_voice','SWADE Voice Studio (Kokoro CPU)','self_hosted',0,0,'$0 marginal; server is prepaid hosting'),
 ('ollama','Local Ollama','self_hosted',0,0,'$0 marginal'),
 ('livekit_self','Self-hosted LiveKit','self_hosted',0,0,'$0 marginal; bandwidth included in hosting')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO swadebase_ops.ai_rate_cards(provider, model, unit, usd_per_unit, source_url, verified_at) VALUES
 ('qwencloud','qwen-flash','input_token', 0.05/1e6,'https://opencode.ai/data/alibaba/qwen-flash.md','2026-10-28'),
 ('qwencloud','qwen-flash','output_token',0.40/1e6,'https://opencode.ai/data/alibaba/qwen-flash.md','2026-10-28'),
 ('anthropic','claude-haiku-5-5','input_token', 0.10/1e6,'https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html','2026-10-23'),
 ('anthropic','claude-haiku-5-5','output_token',0.50/1e6,'https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html','2026-10-23'),
 ('openai','gpt-4o-mini','input_token', 0.15/1e6,'OpenAI list price (founder-confirmed 2026-10-27)','2026-10-27'),
 ('openai','gpt-4o-mini','output_token',0.60/1e6,'OpenAI list price (founder-confirmed 2026-10-27)','2026-10-27'),
 ('openai','gpt-4.1-mini','input_token', 0.40/1e6,'OpenAI list price (unverified)',NULL),
 ('openai','gpt-4.1-mini','output_token',1.60/1e6,'OpenAI list price (unverified)',NULL),
 ('replicate','black-forest-labs/flux-schnell','image',0.003,'Replicate list price (unverified)',NULL),
 ('runpod','*','gpu_second',0.69/3600,'/opt/swade-voice-service/service.py est rate','2026-10-23'),
 ('livekit_cloud','*','participant_minute',0.0005,'https://livekit.com/pricing.md','2026-10-23'),
 ('swade_voice','*','character',0,'self-hosted','2026-10-28'),
 ('swade_voice','*','audio_second',0,'self-hosted','2026-10-28'),
 ('ollama','*','input_token',0,'self-hosted','2026-10-28'),
 ('ollama','*','output_token',0,'self-hosted','2026-10-28'),
 ('livekit_self','*','participant_minute',0,'self-hosted','2026-10-28')
ON CONFLICT (provider, model, unit) DO NOTHING;

CREATE OR REPLACE FUNCTION teachvirt.record_ai_usage(
  p_feature text, p_provider text, p_model text, p_user uuid,
  p_input_tokens integer DEFAULT 0, p_output_tokens integer DEFAULT 0,
  p_units jsonb DEFAULT '{}'::jsonb, p_status text DEFAULT 'ok', p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS numeric LANGUAGE sql SECURITY DEFINER SET search_path = swadebase_ops, pg_temp AS $$
  SELECT r.cost_usd FROM swadebase_ops.ai_record_usage('teachvirt', p_feature, p_provider, p_model, p_user,
    p_input_tokens, p_output_tokens, p_units, p_status, NULL, p_meta) r;
$$;
CREATE OR REPLACE FUNCTION teachvirt.ai_can_spend(p_provider text, p_estimate_usd numeric DEFAULT 0)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = swadebase_ops, pg_temp AS $$
  SELECT swadebase_ops.ai_can_spend(p_provider, p_estimate_usd);
$$;
REVOKE ALL ON FUNCTION teachvirt.record_ai_usage(text,text,text,uuid,integer,integer,jsonb,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION teachvirt.ai_can_spend(text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION teachvirt.record_ai_usage(text,text,text,uuid,integer,integer,jsonb,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION teachvirt.ai_can_spend(text,numeric) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
