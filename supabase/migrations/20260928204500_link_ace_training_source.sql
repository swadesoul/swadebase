-- Attach the pinned ACE-Step trainer source archive to both registered ACE models.

update public.music_model_registry
set metadata = metadata || jsonb_build_object(
  'source_repo', 'https://github.com/ace-step/ACE-Step-1.5',
  'source_commit', 'ca1e85fe9430179831e6bc6be790c332190a3866',
  'source_b2_key', 'models/music/ace-step-1.5/source/ca1e85fe9430179831e6bc6be790c332190a3866/ACE-Step-1.5.tar.gz',
  'source_sha256', '75d2de86fdcbf3a9681e7c4ea5ea7af5fb393f3485193f374dde542f77348ec8',
  'source_bytes', 8437752
),
updated_at = now()
where engine = 'ace_step_15'
  and revision in (
    '19671f406d603126926c1b7e2adc169acbcade22',
    'e432212fec32b8965a14ffa57ae653438d6abd14'
  );
