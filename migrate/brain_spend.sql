-- SSS Brain spend ledger: one row per paid AI call or live session, across every ecosystem app.
create table if not exists brain.ai_spend (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  app text not null,                 -- resinglab, sssbrain, dnafront ...
  provider text not null,            -- openai, runpod, suno, elevenlabs ...
  model text,
  kind text not null,                -- live_session, tts, chat, transcribe, gpu, music
  session_id text,                   -- groups the rows of one working session
  label text,                        -- human name: "Sermon: Love thy brother"
  user_id uuid,
  quantity numeric not null default 0,
  unit text not null default 'minute',
  cost_usd numeric(12,6) not null default 0,
  estimated boolean not null default true,  -- true until reconciled against the provider's bill
  meta jsonb not null default '{}'::jsonb
);
create index if not exists ai_spend_created_idx on brain.ai_spend (created_at desc);
create index if not exists ai_spend_session_idx on brain.ai_spend (session_id);
alter table brain.ai_spend enable row level security;
revoke all on brain.ai_spend from anon, authenticated;

create or replace function public.brain_spend_summary()
returns jsonb language plpgsql security definer set search_path = brain, public as $$
declare r jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not brain.is_founder() then
    raise exception 'Founder access required';
  end if;
  select jsonb_build_object(
    'today',  coalesce(sum(cost_usd) filter (where created_at >= date_trunc('day', now())), 0),
    'week',   coalesce(sum(cost_usd) filter (where created_at >= date_trunc('week', now())), 0),
    'month',  coalesce(sum(cost_usd) filter (where created_at >= date_trunc('month', now())), 0),
    'year',   coalesce(sum(cost_usd) filter (where created_at >= date_trunc('year', now())), 0),
    'total',  coalesce(sum(cost_usd), 0),
    'estimated_share', coalesce(sum(cost_usd) filter (where estimated), 0)
  ) into r from brain.ai_spend;
  return r || jsonb_build_object(
    'by_provider_month', (select coalesce(jsonb_object_agg(provider, c), '{}'::jsonb) from
       (select provider, sum(cost_usd) c from brain.ai_spend where created_at >= date_trunc('month', now()) group by 1) x),
    'by_app_month', (select coalesce(jsonb_object_agg(app, c), '{}'::jsonb) from
       (select app, sum(cost_usd) c from brain.ai_spend where created_at >= date_trunc('month', now()) group by 1) x),
    'recent_sessions', (select coalesce(jsonb_agg(s), '[]'::jsonb) from
       (select coalesce(session_id, id::text) session_id, max(label) label, max(app) app, min(created_at) started_at,
               sum(cost_usd) cost_usd, count(*) calls
        from brain.ai_spend group by 1 order by min(created_at) desc limit 25) s));
end $$;
revoke all on function public.brain_spend_summary() from public, anon;
grant execute on function public.brain_spend_summary() to authenticated, service_role;
