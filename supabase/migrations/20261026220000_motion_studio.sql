-- SWADEBASE Motion Studio: style library, projects, render jobs, agent conversation log.
-- Source of truth: SWADEBASE. Media lives in Backblaze B2 under swadesoul/motion-studio/...
-- Created 2026-10-26

begin;

-- ───────────── Style library (seeded by 20261026220100_motion_styles_seed.sql) ─────────────
create table if not exists public.motion_styles (
  id text primary key,
  sort_order int not null default 0,
  name text not null,
  category text not null,
  atlas_ref int,
  spec jsonb not null,
  is_active boolean not null default true,
  -- Our own rendered motion sample per style (same short story for every style).
  sample_status text not null default 'none' check (sample_status in ('none','queued','rendering','ready','failed')),
  sample_video_b2_key text,
  sample_poster_b2_key text,
  sample_composition_b2_key text,
  sample_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_motion_styles_category on public.motion_styles(category, sort_order);

alter table public.motion_styles enable row level security;
revoke all on public.motion_styles from anon;
grant select on public.motion_styles to authenticated;
grant all on public.motion_styles to service_role;
drop policy if exists motion_styles_read on public.motion_styles;
create policy motion_styles_read on public.motion_styles
  for select to authenticated using (is_active);

-- ───────────── Projects ─────────────
create table if not exists public.motion_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  title text not null default 'Untitled motion',
  mode text not null default 'idea' check (mode in ('idea','audio','start_image')),
  format text not null default '16:9' check (format in ('16:9','9:16','1:1','4:5')),
  duration_sec numeric not null default 15 check (duration_sec between 3 and 600),
  fps int not null default 30 check (fps in (24,30,60)),
  quality text not null default 'standard' check (quality in ('draft','standard','high')),
  style_id text references public.motion_styles(id) on delete set null,
  style_pick text not null default 'user' check (style_pick in ('user','agent')),
  idea text,
  script text,
  property text,
  brand jsonb,
  audio_b2_key text,
  audio_features jsonb,
  captions jsonb,
  start_image_b2_key text,
  start_image_description text,
  status text not null default 'draft'
    check (status in ('draft','queued','composing','rendering','ready','failed','cancelled')),
  progress numeric not null default 0 check (progress between 0 and 100),
  composition_b2_key text,
  video_b2_key text,
  source_zip_b2_key text,
  poster_b2_key text,
  render_meta jsonb not null default '{}'::jsonb,
  agent_notes jsonb not null default '{}'::jsonb,
  cost jsonb not null default '{}'::jsonb,
  error_message text,
  source_app text not null default 'swadebase',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_motion_projects_owner on public.motion_projects(owner_user_id, created_at desc);
create index if not exists idx_motion_projects_status on public.motion_projects(status);

alter table public.motion_projects enable row level security;
revoke all on public.motion_projects from anon;
grant select, insert, update on public.motion_projects to authenticated;
grant all on public.motion_projects to service_role;

drop policy if exists motion_projects_owner_select on public.motion_projects;
create policy motion_projects_owner_select on public.motion_projects
  for select to authenticated using ((select auth.uid()) = owner_user_id);
drop policy if exists motion_projects_owner_insert on public.motion_projects;
create policy motion_projects_owner_insert on public.motion_projects
  for insert to authenticated with check ((select auth.uid()) = owner_user_id and status = 'draft');
-- Owners may edit drafts; render outputs are written only by the service role (worker).
drop policy if exists motion_projects_owner_update on public.motion_projects;
create policy motion_projects_owner_update on public.motion_projects
  for update to authenticated
  using ((select auth.uid()) = owner_user_id and status in ('draft','ready','failed','cancelled'))
  with check ((select auth.uid()) = owner_user_id and status in ('draft','ready','failed','cancelled'));

-- ───────────── Render jobs (durable queue, worker claims with SKIP LOCKED) ─────────────
create table if not exists public.motion_render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.motion_projects(id) on delete cascade,
  style_id text references public.motion_styles(id) on delete cascade,
  owner_user_id uuid not null,
  kind text not null default 'compose_render' check (kind in ('compose','render','compose_render','style_sample')),
  status text not null default 'queued'
    check (status in ('queued','running','done','failed','cancelled')),
  attempts int not null default 0,
  max_attempts int not null default 2,
  worker_id text,
  log text,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_motion_render_jobs_queue on public.motion_render_jobs(status, queued_at);
create index if not exists idx_motion_render_jobs_project on public.motion_render_jobs(project_id, queued_at desc);
-- One active job per project.
create unique index if not exists uq_motion_render_jobs_active
  on public.motion_render_jobs(project_id) where status in ('queued','running') and project_id is not null;
create unique index if not exists uq_motion_render_jobs_sample_active
  on public.motion_render_jobs(style_id) where status in ('queued','running') and kind = 'style_sample';
alter table public.motion_render_jobs drop constraint if exists motion_render_jobs_target_chk;
alter table public.motion_render_jobs add constraint motion_render_jobs_target_chk
  check ((kind = 'style_sample' and style_id is not null) or (kind <> 'style_sample' and project_id is not null));

alter table public.motion_render_jobs enable row level security;
revoke all on public.motion_render_jobs from anon;
grant select on public.motion_render_jobs to authenticated;
grant all on public.motion_render_jobs to service_role;
drop policy if exists motion_render_jobs_owner_select on public.motion_render_jobs;
create policy motion_render_jobs_owner_select on public.motion_render_jobs
  for select to authenticated using ((select auth.uid()) = owner_user_id);

create or replace function public.claim_motion_render_job(p_worker_id text)
returns public.motion_render_jobs
language plpgsql
security definer
set search_path = public
as $$
declare j public.motion_render_jobs;
begin
  -- Requeue jobs whose worker died (no heartbeat for 10 minutes).
  update public.motion_render_jobs
     set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         error_message = coalesce(error_message, 'worker heartbeat lost')
   where status = 'running' and heartbeat_at < now() - interval '10 minutes';

  select * into j from public.motion_render_jobs
   where status = 'queued'
   order by queued_at
   limit 1
   for update skip locked;
  if not found then return null; end if;

  update public.motion_render_jobs
     set status = 'running', worker_id = p_worker_id, attempts = attempts + 1,
         started_at = now(), heartbeat_at = now()
   where id = j.id
   returning * into j;
  return j;
end $$;
revoke all on function public.claim_motion_render_job(text) from public, anon, authenticated;
grant execute on function public.claim_motion_render_job(text) to service_role;

-- ───────────── Motion agent conversation log ─────────────
create table if not exists public.motion_agent_messages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  project_id uuid references public.motion_projects(id) on delete cascade,
  role text not null check (role in ('user','agent','system')),
  content text not null,
  data jsonb not null default '{}'::jsonb,
  channel text not null default 'motion-studio',
  created_at timestamptz not null default now()
);
create index if not exists idx_motion_agent_messages_owner on public.motion_agent_messages(owner_user_id, created_at desc);

alter table public.motion_agent_messages enable row level security;
revoke all on public.motion_agent_messages from anon;
grant select on public.motion_agent_messages to authenticated;
grant all on public.motion_agent_messages to service_role;
drop policy if exists motion_agent_messages_owner_select on public.motion_agent_messages;
create policy motion_agent_messages_owner_select on public.motion_agent_messages
  for select to authenticated using ((select auth.uid()) = owner_user_id);

-- updated_at maintenance
create or replace function public.motion_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_motion_projects_touch on public.motion_projects;
create trigger trg_motion_projects_touch before update on public.motion_projects
  for each row execute function public.motion_touch_updated_at();
drop trigger if exists trg_motion_styles_touch on public.motion_styles;
create trigger trg_motion_styles_touch before update on public.motion_styles
  for each row execute function public.motion_touch_updated_at();

commit;
