-- SWADE Music model registry + durable training jobs
-- Keeps exact model revisions/B2 locations and training lifecycle in SWADEBASE.

begin;

create table if not exists public.music_model_registry (
  id uuid primary key default gen_random_uuid(),
  engine text not null,
  model_role text not null
    check (model_role in ('generation','training_base','embedding','vocoder','fallback')),
  provider text not null default 'self_hosted',
  repo_id text not null,
  revision text not null,
  b2_prefix text not null,
  training_capable boolean not null default false,
  commercial_status text not null default 'review_required'
    check (commercial_status in ('approved','review_required','restricted','blocked')),
  license_name text,
  license_source_url text,
  attribution_text text,
  model_size_bytes bigint,
  min_vram_gb numeric,
  recommended_vram_gb numeric,
  status text not null default 'archived'
    check (status in ('archiving','archived','testing','approved','deprecated','blocked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(repo_id, revision, model_role)
);

create index if not exists idx_music_model_registry_engine
  on public.music_model_registry(engine, status);
create index if not exists idx_music_model_registry_revision
  on public.music_model_registry(repo_id, revision);

create table if not exists public.music_training_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  dataset_id uuid not null references public.music_training_datasets(id) on delete restrict,
  model_registry_id uuid not null references public.music_model_registry(id) on delete restrict,
  adapter_kind text not null
    check (adapter_kind in ('artist','label','genre','house_style','voice')),
  requested_adapter_name text not null,
  status text not null default 'queued'
    check (status in ('queued','preparing','training','evaluating','ready','failed','cancelled')),
  gpu_backend text,
  gpu_job_id text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  training_config jsonb not null default '{}'::jsonb,
  dataset_manifest_b2_key text,
  result_adapter_b2_key text,
  result_adapter_sha256 text,
  metrics jsonb not null default '{}'::jsonb,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_music_training_jobs_owner
  on public.music_training_jobs(owner_user_id, created_at desc);
create index if not exists idx_music_training_jobs_status
  on public.music_training_jobs(status, queued_at);
create index if not exists idx_music_training_jobs_dataset
  on public.music_training_jobs(dataset_id);

alter table public.music_model_registry enable row level security;
alter table public.music_training_jobs enable row level security;

revoke all on public.music_model_registry from anon;
revoke all on public.music_training_jobs from anon;

grant select on public.music_model_registry to authenticated;
grant select, insert on public.music_training_jobs to authenticated;

grant all on public.music_model_registry to service_role;
grant all on public.music_training_jobs to service_role;

drop policy if exists music_model_registry_authenticated_read on public.music_model_registry;
create policy music_model_registry_authenticated_read
on public.music_model_registry for select to authenticated
using (true);

drop policy if exists music_training_jobs_owner_select on public.music_training_jobs;
create policy music_training_jobs_owner_select
on public.music_training_jobs for select to authenticated
using ((select auth.uid()) = owner_user_id);

drop policy if exists music_training_jobs_owner_insert on public.music_training_jobs;
create policy music_training_jobs_owner_insert
on public.music_training_jobs for insert to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1
    from public.music_training_datasets d
    where d.id = dataset_id
      and d.owner_user_id = (select auth.uid())
      and d.status = 'approved'
  )
  and exists (
    select 1
    from public.music_model_registry m
    where m.id = model_registry_id
      and m.training_capable is true
      and m.status in ('archived','testing','approved')
      and m.commercial_status <> 'blocked'
  )
);

commit;
