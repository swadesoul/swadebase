-- Service-only rights-filtered training manifest for Hostinger control plane.
-- Browser/external clients may request training by dataset id, but cannot supply
-- or override the actual training asset list.

create or replace function public.music_training_dataset_manifest_service(
  p_dataset_id uuid,
  p_owner_user_id uuid
)
returns jsonb
language plpgsql
security definer
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

  if dataset_row.owner_user_id <> p_owner_user_id then
    raise exception 'training dataset owner mismatch';
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
    and a.owner_user_id = p_owner_user_id
    and a.rights_class = 'training_allowed'
    and a.ai_training_permission is true
    and a.revoked_at is null
    and (a.training_expires_at is null or a.training_expires_at > now())
    and a.training_scope = dataset_row.scope
    and c.owner_user_id = p_owner_user_id
    and c.status = 'active'
    and c.commercial_use_allowed is true
    and c.scope = dataset_row.scope
    and (c.expires_at is null or c.expires_at > now());

  return result;
end;
$$;

revoke all on function public.music_training_dataset_manifest_service(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.music_training_dataset_manifest_service(uuid,uuid)
  to service_role;
