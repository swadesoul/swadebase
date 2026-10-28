-- Quota-based subscriptions and non-USD credit accounts (2026-10-28).
BEGIN;
ALTER TABLE swadebase_ops.ai_provider_accounts
  ADD COLUMN IF NOT EXISTS quota_amount numeric,
  ADD COLUMN IF NOT EXISTS quota_unit text,
  ADD COLUMN IF NOT EXISTS quota_remaining_pct numeric,
  ADD COLUMN IF NOT EXISTS quota_resets_at timestamptz,
  ADD COLUMN IF NOT EXISTS quota_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS backend_use_allowed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS usage_terms text;

INSERT INTO swadebase_ops.ai_provider_accounts(provider, display_name, billing, notes) VALUES
 ('qwencloud_token_plan','QwenCloud Token Plan ($18/mo)','subscription','Plan key QWENCLOUD_TOKEN_PLAN_API_KEY; base https://token-plan.maas.qwencloudapi.com/compatible-mode/v1'),
 ('kie_ai','KIE.ai','prepaid','Balance is in KIE credits, not USD')
ON CONFLICT (provider) DO NOTHING;

UPDATE swadebase_ops.ai_provider_accounts SET
  quota_amount = 45000, quota_unit = 'credits (token-based)', quota_remaining_pct = 89.1,
  quota_resets_at = '2026-11-15 10:00:00-05', quota_checked_at = now(),
  backend_use_allowed = false,
  usage_terms = 'QwenCloud Token Plan terms: interactive AI programming tools and OpenClaw-type agents only; not for automated scripts or application backends (risk of suspension/key ban). No pay-as-you-go fallback when credits run out.',
  updated_at = now()
WHERE provider = 'qwencloud_token_plan';

UPDATE swadebase_ops.ai_provider_accounts SET
  display_name = 'Alibaba Model Studio (pay-as-you-go)',
  notes = 'Key QWENCLOUD_API_KEY on dashscope-intl compatible-mode; backend use allowed; balance not yet reported', updated_at = now()
WHERE provider = 'qwencloud';

UPDATE swadebase_ops.ai_provider_accounts SET
  quota_amount = 9334, quota_unit = 'KIE credits', quota_remaining_pct = NULL,
  quota_checked_at = '2026-10-27', usage_terms = 'Credit-to-USD rate not yet verified; paid calls stay blocked until a rate card exists.', updated_at = now()
WHERE provider = 'kie_ai';

-- Subscriptions are only spendable when backend use is allowed and quota remains.
CREATE OR REPLACE FUNCTION swadebase_ops.ai_can_spend(p_provider text, p_estimate_usd numeric DEFAULT 0)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = swadebase_ops, pg_temp AS $$
  SELECT CASE
    WHEN b.provider IS NULL THEN false
    WHEN NOT a.backend_use_allowed THEN false
    WHEN b.billing = 'subscription' AND a.quota_remaining_pct IS NOT NULL AND a.quota_remaining_pct <= 0 THEN false
    WHEN b.billing IN ('self_hosted','subscription','postpaid') THEN true
    WHEN NOT b.opening_balance_recorded THEN false
    ELSE b.balance_usd - coalesce(p_estimate_usd, 0) >= b.hard_stop_usd
  END
  FROM (SELECT 1) one
  LEFT JOIN ai_provider_balances b ON b.provider = p_provider
  LEFT JOIN ai_provider_accounts a ON a.provider = p_provider;
$$;
COMMIT;
SELECT provider, billing, quota_amount, quota_unit, quota_remaining_pct, quota_resets_at, backend_use_allowed,
       swadebase_ops.ai_can_spend(provider, 0.05) can_spend
FROM swadebase_ops.ai_provider_accounts WHERE provider IN ('qwencloud','qwencloud_token_plan','kie_ai','anthropic') ORDER BY 1;
