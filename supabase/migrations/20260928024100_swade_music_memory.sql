-- SWADE Music Memory + rights-gated training registry
-- Source of truth: SWADEBASE
-- Created 2026-09-27

begin;

create table if not exists public.music_memory_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  sound_identity_id text,
  artist_id text,
  source_system text not null default 'resing',
  source_track_id text,
  master_b2_key text,
  ipfs_cid text,
  sha256 text,
  title text not null,
  artist text,
  album text,
  isrc text,
  upc text,
  writers jsonb not null default '[]'::jsonb,
  publishers jsonb not null default '[]'::jsonb,
  splits jsonb not null default '[]'::jsonb,
  master_rights jsonb not null default '{}'::jsonb,
  composition_rights jsonb not null default '{}'::jsonb,
  voice_rights jsonb not null default '{}'::jsonb,
  rights_class text not null default 'blocked'
    check (rights_class in ('training_allowed','reference_only','radio_only','blocked')),
  ai_training_permission boolean not null default false,
  training_scope text not null default 'none'
    check (training_scope in ('none','private_artist','private_label','shared_model')),
  training_expires_at timestamptz,
  commercial_generation_allowed boolean not null default false,
  derivative_generation_allowed boolean not null default false,
  genre text,
  subgenre text,
  mood text,
  instruments jsonb not null default '[]'::jsonb,
  language text,
  bpm numeric,
  musical_key text,
  time_signature text,
  structure jsonb not null default '[]'::jsonb,
  lyrics_b2_key text,
  stems jsonb not null default '{}'::jsonb,
  embedding_ids jsonb not null default '[]'::jsonb,
  quality_score numeric,
  source_provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_system, source_track_id)
);

create index if not exists idx_music_memory_assets_owner
  on public.music_memory_assets(owner_user_id);
create index if not exists idx_music_memory_assets_rights
  on public.music_memory_assets(rights_class, ai_training_permission);
create index if not exists idx_music_memory_assets_sound_identity
  on public.music_memory_assets(sound_identity_id);
create index if not exists idx_music_memory_assets_isrc
  on public.music_memory_assets(isrc) where isrc is not null;

create table if not exists public.music_training_consents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.music_memory_assets(id) on delete cascade,
  owner_user_id uuid not null,
  consent_version text not null,
  status text not null default 'active'
    check (status in ('active','revoked','expired')),
  scope text not null
    check (scope in ('private_artist','private_label','shared_model')),
  commercial_use_allowed boolean not null default false,
  derivative_generation_allowed boolean not null default false,
  voice_training_allowed boolean not null default false,
  evidence_hash text,
  evidence_b2_key text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_music_training_consents_asset
  on public.music_training_consents(asset_id);
create index if not exists idx_music_training_consents_owner
  on public.music_training_consents(owner_user_id);
create index if not exists idx_music_training_consents_status
  on public.music_training_consents(status);

create table if not exists public.music_training_datasets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  adapter_kind text not null default 'artist'
    check (adapter_kind in ('artist','label','genre','house_style','voice')),
  scope text not null default 'private_artist'
    check (scope in ('private_artist','private_label','shared_model')),
  status text not null default 'draft'
    check (status in ('draft','rights_review','approved','training','evaluating','ready','rejected','revoked')),
  base_engine text,
  base_model text,
  base_revision text,
  manifest_b2_key text,
  rights_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.music_training_dataset_assets (
  dataset_id uuid not null references public.music_training_datasets(id) on delete cascade,
  asset_id uuid not null references public.music_memory_assets(id) on delete restrict,
  consent_id uuid references public.music_training_consents(id) on delete restrict,
  included_at timestamptz not null default now(),
  primary key (dataset_id, asset_id)
);

create index if not exists idx_music_training_datasets_owner
  on public.music_training_datasets(owner_user_id);
create index if not exists idx_music_training_dataset_assets_asset
  on public.music_training_dataset_assets(asset_id);

create table if not exists public.music_model_adapters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  dataset_id uuid not null references public.music_training_datasets(id) on delete restrict,
  sound_identity_id text,
  engine text not null,
  base_model text not null,
  base_revision text,
  adapter_kind text not null,
  version text not null,
  b2_key text not null,
  sha256 text,
  status text not null default 'training'
    check (status in ('training','evaluating','ready','rejected','revoked','archived')),
  commercial_use_approved boolean not null default false,
  metrics jsonb not null default '{}'::jsonb,
  training_config jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  revoked_at timestamptz,
  unique(engine, base_model, version, owner_user_id)
);

create index if not exists idx_music_model_adapters_owner
  on public.music_model_adapters(owner_user_id);
create index if not exists idx_music_model_adapters_status
  on public.music_model_adapters(status);

create table if not exists public.music_generation_evaluations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  generation_id text not null,
  engine text,
  model text,
  model_revision text,
  adapter_ids jsonb not null default '[]'::jsonb,
  lyric_adherence numeric,
  structure_adherence numeric,
  voice_match numeric,
  audio_quality numeric,
  admin_rating numeric,
  listener_metrics jsonb not null default '{}'::jsonb,
  generation_seconds numeric,
  estimated_cost numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_music_generation_evaluations_owner
  on public.music_generation_evaluations(owner_user_id);
create index if not exists idx_music_generation_evaluations_generation
  on public.music_generation_evaluations(generation_id);

alter table public.music_memory_assets enable row level security;
alter table public.music_training_consents enable row level security;
alter table public.music_training_datasets enable row level security;
alter table public.music_training_dataset_assets enable row level security;
alter table public.music_model_adapters enable row level security;
alter table public.music_generation_evaluations enable row level security;

revoke all on public.music_memory_assets from anon;
revoke all on public.music_training_consents from anon;
revoke all on public.music_training_datasets from anon;
revoke all on public.music_training_dataset_assets from anon;
revoke all on public.music_model_adapters from anon;
revoke all on public.music_generation_evaluations from anon;

grant select, insert, update, delete on public.music_memory_assets to authenticated;
grant select, insert, update on public.music_training_consents to authenticated;
grant select, insert, update, delete on public.music_training_datasets to authenticated;
grant select, insert, update, delete on public.music_training_dataset_assets to authenticated;
grant select on public.music_model_adapters to authenticated;
grant select, insert, update, delete on public.music_generation_evaluations to authenticated;

grant all on public.music_memory_assets to service_role;
grant all on public.music_training_consents to service_role;
grant all on public.music_training_datasets to service_role;
grant all on public.music_training_dataset_assets to service_role;
grant all on public.music_model_adapters to service_role;
grant all on public.music_generation_evaluations to service_role;

drop policy if exists music_memory_assets_owner_select on public.music_memory_assets;
create policy music_memory_assets_owner_select on public.music_memory_assets
for select to authenticated using ((select auth.uid()) = owner_user_id);
drop policy if exists music_memory_assets_owner_insert on public.music_memory_assets;
create policy music_memory_assets_owner_insert on public.music_memory_assets
for insert to authenticated with check ((select auth.uid()) = owner_user_id);
drop policy if exists music_memory_assets_owner_update on public.music_memory_assets;
create policy music_memory_assets_owner_update on public.music_memory_assets
for update to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);
drop policy if exists music_memory_assets_owner_delete on public.music_memory_assets;
create policy music_memory_assets_owner_delete on public.music_memory_assets
for delete to authenticated using ((select auth.uid()) = owner_user_id);

drop policy if exists music_training_consents_owner_select on public.music_training_consents;
create policy music_training_consents_owner_select on public.music_training_consents
for select to authenticated using ((select auth.uid()) = owner_user_id);
drop policy if exists music_training_consents_owner_insert on public.music_training_consents;
create policy music_training_consents_owner_insert on public.music_training_consents
for insert to authenticated with check ((select auth.uid()) = owner_user_id);
drop policy if exists music_training_consents_owner_update on public.music_training_consents;
create policy music_training_consents_owner_update on public.music_training_consents
for update to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists music_training_datasets_owner_select on public.music_training_datasets;
create policy music_training_datasets_owner_select on public.music_training_datasets
for select to authenticated using ((select auth.uid()) = owner_user_id);
drop policy if exists music_training_datasets_owner_insert on public.music_training_datasets;
create policy music_training_datasets_owner_insert on public.music_training_datasets
for insert to authenticated with check ((select auth.uid()) = owner_user_id);
drop policy if exists music_training_datasets_owner_update on public.music_training_datasets;
create policy music_training_datasets_owner_update on public.music_training_datasets
for update to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);
drop policy if exists music_training_datasets_owner_delete on public.music_training_datasets;
create policy music_training_datasets_owner_delete on public.music_training_datasets
for delete to authenticated using ((select auth.uid()) = owner_user_id);

drop policy if exists music_training_dataset_assets_owner_all on public.music_training_dataset_assets;
create policy music_training_dataset_assets_owner_all on public.music_training_dataset_assets
for all to authenticated
using (exists (
  select 1 from public.music_training_datasets d
  where d.id = dataset_id and d.owner_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.music_training_datasets d
  where d.id = dataset_id and d.owner_user_id = (select auth.uid())
));

drop policy if exists music_model_adapters_owner_select on public.music_model_adapters;
create policy music_model_adapters_owner_select on public.music_model_adapters
for select to authenticated using ((select auth.uid()) = owner_user_id);

drop policy if exists music_generation_evaluations_owner_all on public.music_generation_evaluations;
create policy music_generation_evaluations_owner_all on public.music_generation_evaluations
for all to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

commit;
