-- Catalog video for ABAGALE and BLACKTALES.
-- Isolated from the Motion Studio render queue and from music tables.
-- This file is not applied to production by the change that adds it.
-- 4K playback and billing stay impossible until a later migration: checks reject
-- any status other than unconfigured, any playback window, and any quota number.

begin;

create table if not exists public.catalog_video_series (
  id uuid primary key default gen_random_uuid(),
  tenant text not null check (tenant in ('abagale', 'blacktales')),
  creator_user_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  source_master_asset_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_video_assets (
  id uuid primary key default gen_random_uuid(),
  tenant text not null check (tenant in ('abagale', 'blacktales')),
  creator_user_id uuid not null,
  series_id uuid references public.catalog_video_series(id) on delete restrict,
  episode_order int check (episode_order is null or episode_order > 0),
  episode_title text check (episode_title is null or char_length(episode_title) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200),
  source_type text not null check (source_type in ('original', 'youtube_embed')),
  youtube_id text,
  rights_web boolean not null,
  rights_roku boolean not null,
  idempotency_key text,
  master_key text,
  sha256 text,
  bytes bigint check (bytes is null or bytes > 0),
  declared_bytes bigint,
  upload_id text,
  duration_probe_sec numeric,
  duration_decision text check (duration_decision is null or duration_decision in ('accepted', 'needs_episode_submission', 'unreadable')),
  width int,
  height int,
  rotation int,
  video_codec text,
  pix_fmt text,
  audio_codec text,
  has_audio boolean not null default false,
  native_4k boolean not null default false,
  status text not null default 'reserved' check (status in (
    'reserved', 'uploading', 'uploaded', 'duration_accepted', 'needs_episode_submission',
    'queued', 'encoding', 'ready', 'embed_only', 'failed'
  )),
  hls_prefix text,
  poster_key text,
  ladder jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_type = 'youtube_embed' and youtube_id is not null and rights_roku = false and master_key is null and hls_prefix is null)
    or
    (source_type = 'original' and youtube_id is null)
  ),
  check (episode_order is null or series_id is not null),
  check (hls_prefix is null or position('/4k/' in hls_prefix) = 0),
  check (master_key is null or position('/4k/' in master_key) = 0)
);

alter table public.catalog_video_series
  drop constraint if exists catalog_video_series_source_fk;
alter table public.catalog_video_series
  add constraint catalog_video_series_source_fk
  foreign key (source_master_asset_id) references public.catalog_video_assets(id) on delete restrict;

create unique index if not exists uq_catalog_video_assets_idem
  on public.catalog_video_assets (creator_user_id, tenant, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists uq_catalog_video_episode_order
  on public.catalog_video_assets (series_id, episode_order)
  where episode_order is not null;

create index if not exists idx_catalog_video_assets_owner
  on public.catalog_video_assets (creator_user_id, tenant, created_at desc);

create index if not exists idx_catalog_video_assets_series
  on public.catalog_video_assets (series_id, episode_order);

create table if not exists public.catalog_video_jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.catalog_video_assets(id) on delete restrict,
  creator_user_id uuid not null,
  kind text not null check (kind in ('probe', 'package')),
  preset_id text not null default 'h264_abr_1080',
  source_sha256 text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  attempts int not null default 0,
  max_attempts int not null default 2,
  worker_id text,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz
);

create unique index if not exists uq_catalog_video_jobs_active
  on public.catalog_video_jobs (asset_id, kind, preset_id, source_sha256)
  where status in ('queued', 'running');

create index if not exists idx_catalog_video_jobs_queue
  on public.catalog_video_jobs (status, queued_at);

-- Quote rows only. Checks make an "active" subscription or a quota impossible in this migration.
create table if not exists public.catalog_video_entitlements (
  id uuid primary key default gen_random_uuid(),
  tenant text not null check (tenant in ('abagale', 'blacktales')),
  creator_user_id uuid not null,
  plan_code text not null default 'four_k_annual' check (plan_code = 'four_k_annual'),
  price_quote_cents int not null default 10000 check (price_quote_cents = 10000),
  currency text not null default 'USD' check (currency = 'USD'),
  billing_status text not null default 'unconfigured' check (billing_status = 'unconfigured'),
  four_k_playback_until timestamptz check (four_k_playback_until is null),
  quota_minutes int check (quota_minutes is null),
  quota_bytes bigint check (quota_bytes is null),
  quota_egress_bytes bigint check (quota_egress_bytes is null),
  created_at timestamptz not null default now(),
  unique (creator_user_id, tenant)
);

alter table public.catalog_video_series enable row level security;
alter table public.catalog_video_assets enable row level security;
alter table public.catalog_video_jobs enable row level security;
alter table public.catalog_video_entitlements enable row level security;

revoke all on public.catalog_video_series from public, anon;
revoke all on public.catalog_video_assets from public, anon;
revoke all on public.catalog_video_jobs from public, anon;
revoke all on public.catalog_video_entitlements from public, anon;

grant select on public.catalog_video_series to authenticated;
grant select on public.catalog_video_assets to authenticated;
grant select on public.catalog_video_jobs to authenticated;
grant select on public.catalog_video_entitlements to authenticated;
grant all on public.catalog_video_series to service_role;
grant all on public.catalog_video_assets to service_role;
grant all on public.catalog_video_jobs to service_role;
grant all on public.catalog_video_entitlements to service_role;

drop policy if exists catalog_video_series_owner_select on public.catalog_video_series;
create policy catalog_video_series_owner_select on public.catalog_video_series
  for select to authenticated using ((select auth.uid()) = creator_user_id);

drop policy if exists catalog_video_assets_owner_select on public.catalog_video_assets;
create policy catalog_video_assets_owner_select on public.catalog_video_assets
  for select to authenticated using ((select auth.uid()) = creator_user_id);

drop policy if exists catalog_video_jobs_owner_select on public.catalog_video_jobs;
create policy catalog_video_jobs_owner_select on public.catalog_video_jobs
  for select to authenticated using ((select auth.uid()) = creator_user_id);

drop policy if exists catalog_video_entitlements_owner_select on public.catalog_video_entitlements;
create policy catalog_video_entitlements_owner_select on public.catalog_video_entitlements
  for select to authenticated using ((select auth.uid()) = creator_user_id);

create or replace function public.claim_catalog_video_job(p_worker_id text, p_max_running int default 1)
returns public.catalog_video_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.catalog_video_jobs;
  running int;
begin
  -- This stage hard-caps the catalog worker at one running job.
  p_max_running := 1;

  update public.catalog_video_jobs
     set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         error_message = coalesce(error_message, 'worker heartbeat lost'),
         completed_at = case when attempts >= max_attempts then now() else null end
   where status = 'running'
     and heartbeat_at < now() - interval '10 minutes';

  select count(*) into running from public.catalog_video_jobs where status = 'running';
  if running >= p_max_running then
    return null;
  end if;

  select * into j from public.catalog_video_jobs
   where status = 'queued'
   order by queued_at
   limit 1
   for update skip locked;
  if not found then
    return null;
  end if;

  update public.catalog_video_jobs
     set status = 'running',
         worker_id = p_worker_id,
         attempts = attempts + 1,
         started_at = coalesce(started_at, now()),
         heartbeat_at = now()
   where id = j.id
   returning * into j;
  return j;
end $$;

revoke all on function public.claim_catalog_video_job(text, int) from public, anon, authenticated;
grant execute on function public.claim_catalog_video_job(text, int) to service_role;

comment on table public.catalog_video_entitlements is
  'Quote only: $100/year per creator. billing_status cannot leave unconfigured in this migration. Quotas are unset. 4K is not entitled.';

commit;
