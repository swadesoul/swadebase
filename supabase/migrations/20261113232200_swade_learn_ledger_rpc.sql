-- Public wrappers so the Motion Studio worker can use the shared cost ledger
-- with the service-role key. They do not grant the ledger to signed-in users.
-- Not applied to production by this PR.

begin;

create or replace function public.swade_learn_quote(
  p_provider text,
  p_model text,
  p_units jsonb default '{}'::jsonb,
  p_estimate_usd numeric default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = swadebase_ops, pg_temp
as $$
declare
  v_cost numeric := 0;
  v_priced boolean := true;
  v_price numeric;
  v_estimate numeric;
  k text;
  v numeric;
  b record;
begin
  if p_units is not null then
    for k, v in select e.key, e.value::numeric from jsonb_each_text(p_units) e loop
      if v is null or v = 0 then continue; end if;
      select r.usd_per_unit into v_price from ai_rate_cards r
        where r.provider = p_provider and r.model = p_model and r.unit = k and r.active;
      if v_price is null then
        select r.usd_per_unit into v_price from ai_rate_cards r
          where r.provider = p_provider and r.model = '*' and r.unit = k and r.active;
      end if;
      if v_price is null then v_priced := false; else v_cost := v_cost + (v * v_price); end if;
      v_price := null;
    end loop;
  end if;
  v_estimate := coalesce(p_estimate_usd, case when v_priced then round(v_cost, 6) else 0 end);
  select * into b from ai_provider_balances where provider = p_provider;
  return jsonb_build_object(
    'provider', b.provider,
    'billing', b.billing,
    'credit_usd', b.credit_usd,
    'spent_usd', b.spent_usd,
    'balance_usd', b.balance_usd,
    'hard_stop_usd', b.hard_stop_usd,
    'opening_balance_recorded', coalesce(b.opening_balance_recorded, false),
    'priced', v_priced,
    'estimate_usd', round(v_cost, 6),
    'ai_can_spend', swadebase_ops.ai_can_spend(p_provider, v_estimate)
  );
end $$;

create or replace function public.swade_learn_record_usage(
  p_project text,
  p_feature text,
  p_provider text,
  p_model text,
  p_user uuid default null,
  p_units jsonb default '{}'::jsonb,
  p_status text default 'ok',
  p_request_id text default null,
  p_meta jsonb default '{}'::jsonb
) returns table (ledger_id bigint, cost_usd numeric, priced boolean)
language sql
security definer
set search_path = swadebase_ops, pg_temp
as $$
  select r.ledger_id, r.cost_usd, r.priced
  from swadebase_ops.ai_record_usage(
    p_project, p_feature, p_provider, p_model, p_user,
    0, 0, coalesce(p_units, '{}'::jsonb), coalesce(p_status, 'ok'), p_request_id, coalesce(p_meta, '{}'::jsonb)
  ) r;
$$;

revoke all on function public.swade_learn_quote(text, text, jsonb, numeric) from public, anon, authenticated;
revoke all on function public.swade_learn_record_usage(text, text, text, text, uuid, jsonb, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.swade_learn_quote(text, text, jsonb, numeric) to service_role;
grant execute on function public.swade_learn_record_usage(text, text, text, text, uuid, jsonb, text, text, jsonb) to service_role;

commit;
