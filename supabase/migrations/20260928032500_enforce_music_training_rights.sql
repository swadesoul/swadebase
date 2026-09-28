-- Enforce rights eligibility at the database boundary.
-- A training dataset can only contain an owner-matched asset with an active,
-- scope-matched commercial training consent.

create or replace function public.enforce_music_training_asset_rights()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  asset_row public.music_memory_assets%rowtype;
  dataset_row public.music_training_datasets%rowtype;
  consent_row public.music_training_consents%rowtype;
begin
  select * into asset_row
  from public.music_memory_assets
  where id = new.asset_id;

  if not found then
    raise exception 'music asset not found';
  end if;

  select * into dataset_row
  from public.music_training_datasets
  where id = new.dataset_id;

  if not found then
    raise exception 'music training dataset not found';
  end if;

  if asset_row.owner_user_id <> dataset_row.owner_user_id then
    raise exception 'asset and dataset owners do not match';
  end if;

  if asset_row.revoked_at is not null
     or asset_row.rights_class <> 'training_allowed'
     or asset_row.ai_training_permission is not true then
    raise exception 'asset is not authorized for AI training';
  end if;

  if asset_row.training_scope = 'none'
     or asset_row.training_scope <> dataset_row.scope then
    raise exception 'asset training scope does not match dataset scope';
  end if;

  if asset_row.training_expires_at is not null
     and asset_row.training_expires_at <= now() then
    raise exception 'asset training authorization has expired';
  end if;

  if new.consent_id is null then
    raise exception 'an active training consent is required';
  end if;

  select * into consent_row
  from public.music_training_consents
  where id = new.consent_id
    and asset_id = new.asset_id
    and owner_user_id = dataset_row.owner_user_id;

  if not found then
    raise exception 'matching training consent not found';
  end if;

  if consent_row.status <> 'active'
     or consent_row.scope <> dataset_row.scope
     or consent_row.commercial_use_allowed is not true then
    raise exception 'training consent is not active for this dataset scope';
  end if;

  if consent_row.expires_at is not null
     and consent_row.expires_at <= now() then
    raise exception 'training consent has expired';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_music_training_asset_rights() from public, anon, authenticated;
grant execute on function public.enforce_music_training_asset_rights() to service_role;

drop trigger if exists enforce_music_training_asset_rights
  on public.music_training_dataset_assets;

create trigger enforce_music_training_asset_rights
before insert or update
on public.music_training_dataset_assets
for each row execute function public.enforce_music_training_asset_rights();
