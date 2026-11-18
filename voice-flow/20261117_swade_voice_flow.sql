-- Universal Swade Voice Flow: one "how we talk" core for every voice in SWADEBASE
-- (Maestro DJs, agents, Swarvis, call bots). Model-agnostic: works with whatever OmniRoute picks.
-- Additive only. Versioned: activate a new version without touching any app.
begin;

create table if not exists public.swade_voice_flow (
  version    integer primary key,
  body       text not null,
  active     boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);
create unique index if not exists swade_voice_flow_one_active on public.swade_voice_flow (active) where active;
alter table public.swade_voice_flow enable row level security;

-- Assemble the full speaking prompt: universal core + the character's own overlay
-- (persona, catchphrases, role). Apps build the overlay from their own data.
create or replace function public.swade_voice_flow_prompt(p_overlay text default '')
returns text language sql stable security definer set search_path = public as $$
  select body || case when coalesce(p_overlay, '') <> ''
                      then E'\n\n# Who you are\n' || p_overlay else '' end
  from public.swade_voice_flow where active
$$;

revoke all on function public.swade_voice_flow_prompt(text) from public, anon, authenticated;
grant execute on function public.swade_voice_flow_prompt(text) to service_role;

commit;
