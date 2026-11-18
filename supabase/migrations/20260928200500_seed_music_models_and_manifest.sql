-- Seed archived music models and provide a rights-filtered training manifest.

begin;

insert into public.music_model_registry (
  engine, model_role, provider, repo_id, revision, b2_prefix,
  training_capable, commercial_status, license_source_url,
  model_size_bytes, status, metadata
)
values
(
  'minimax_music3',
  'generation',
  'self_hosted',
  'MiniMaxAI/MiniMax-Music3',
  'fbdf52fbaaca799592917417eb05f1899f1255ec',
  'models/music/minimax-music3/fbdf52fbaaca799592917417eb05f1899f1255ec',
  false,
  'review_required',
  'https://huggingface.co/MiniMaxAI/MiniMax-Music3',
  57353416486,
  'archived',
  '{"vault_verified":true,"archive_file_count":90}'::jsonb
),
(
  'ace_step_15',
  'generation',
  'self_hosted',
  'ACE-Step/Ace-Step1.5',
  '19671f406d603126926c1b7e2adc169acbcade22',
  'models/music/ace-step-1.5/main/19671f406d603126926c1b7e2adc169acbcade22',
  false,
  'review_required',
  'https://huggingface.co/ACE-Step/Ace-Step1.5',
  10092114700,
  'archived',
  '{"vault_verified":true,"archive_file_count":30,"variant":"main_turbo_bundle"}'::jsonb
),
(
  'ace_step_15',
  'training_base',
  'self_hosted',
  'ACE-Step/acestep-v15-base',
  'e432212fec32b8965a14ffa57ae653438d6abd14',
  'models/music/ace-step-1.5/base/e432212fec32b8965a14ffa57ae653438d6abd14',
  true,
  'review_required',
  'https://huggingface.co/ACE-Step/acestep-v15-base',
  4791795718,
  'archived',
  '{"vault_verified":true,"archive_file_count":10,"preferred_for_lora":true}'::jsonb
)
on conflict (repo_id, revision, model_role)
do update set
  engine = excluded.engine,
  b2_prefix = excluded.b2_prefix,
  training_capable = excluded.training_capable,
  license_source_url = excluded.license_source_url,
  model_size_bytes = excluded.model_size_bytes,
  status = excluded.status,
  metadata = public.music_model_registry.metadata || excluded.metadata,
  updated_at = now();

create or replace function public.music_training_dataset_manifest(p_dataset_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  dataset_row public.music_training_datasets%rowtype;
  result jsonb;
begin
  select * into dataset_row
  from public.music_training_datasets
  where id = p_dataset_id;

  if not found then
    raise exception 'training dataset not found';
  end if;

  if dataset_row.owner_user_id <> (select auth.uid()) then
    raise exception 'training dataset not accessible';
  end if;

  if dataset_row.status <> 'approved' then
    raise exception 'training dataset must be approved before export';
  end if;

  select jsonb_build_object(
    'dataset_id', dataset_row.id,
    'owner_user_id', dataset_row.owner_user_id,
    'name', dataset_row.name,
    'adapter_kind', dataset_row.adapter_kind,
    'scope', dataset_row.scope,
    'base_engine', dataset_row.base_engine,
    'base_model', dataset_row.base_model,
    'base_revision', dataset_row.base_revision,
    'assets', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'asset_id', a.id,
          'sound_identity_id', a.sound_identity_id,
          'title', a.title,
          'artist', a.artist,
          'genre', a.genre,
          'subgenre', a.subgenre,
          'mood', a.mood,
          'language', a.language,
          'bpm', a.bpm,
          'musical_key', a.musical_key,
          'time_signature', a.time_signature,
          'structure', a.structure,
          'master_b2_key', a.master_b2_key,
          'lyrics_b2_key', a.lyrics_b2_key,
          'stems', a.stems,
          'sha256', a.sha256,
          'consent_id', c.id,
          'consent_version', c.consent_version,
          'consent_scope', c.scope
        )
        order by a.created_at
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.music_training_dataset_assets da
  join public.music_memory_assets a on a.id = da.asset_id
  join public.music_training_consents c on c.id = da.consent_id
  where da.dataset_id = dataset_row.id
    and a.rights_class = 'training_allowed'
    and a.ai_training_permission is true
    and a.revoked_at is null
    and (a.training_expires_at is null or a.training_expires_at > now())
    and c.status = 'active'
    and c.commercial_use_allowed is true
    and c.scope = dataset_row.scope
    and (c.expires_at is null or c.expires_at > now());

  return result;
end;
$$;

revoke all on function public.music_training_dataset_manifest(uuid) from public, anon;
grant execute on function public.music_training_dataset_manifest(uuid) to authenticated, service_role;

commit;
