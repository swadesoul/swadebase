-- Durable intake jobs for moving owner-controlled masters into SWADE Music Memory.

begin;

create table if not exists public.music_ingest_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  source_system text not null,
  source_track_id text not null,
  status text not null default 'queued'
    check (status in ('queued','downloading','archiving','registering','ready','failed','cancelled')),
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  rights_class text not null default 'reference_only'
    check (rights_class in ('training_allowed','reference_only','radio_only','blocked')),
  training_scope text not null default 'none'
    check (training_scope in ('none','private_artist','private_label','shared_model')),
  music_memory_asset_id uuid references public.music_memory_assets(id) on delete set null,
  b2_key text,
  sha256 text,
  bytes bigint,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, source_system, source_track_id)
);

create index if not exists idx_music_ingest_jobs_owner
  on public.music_ingest_jobs(owner_user_id, created_at desc);
create index if not exists idx_music_ingest_jobs_status
  on public.music_ingest_jobs(status, queued_at);

alter table public.music_ingest_jobs enable row level security;

revoke all on public.music_ingest_jobs from anon;
grant select on public.music_ingest_jobs to authenticated;
grant all on public.music_ingest_jobs to service_role;

drop policy if exists music_ingest_jobs_owner_select on public.music_ingest_jobs;
create policy music_ingest_jobs_owner_select
on public.music_ingest_jobs
for select to authenticated
using ((select auth.uid()) = owner_user_id);

commit;
