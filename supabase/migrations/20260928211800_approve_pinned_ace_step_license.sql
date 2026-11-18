-- Commercial license review for the exact pinned ACE-Step revisions.
-- Verified against official ACE-Step Hugging Face model cards on 2026-09-28.
-- Model cards identify the weights as MIT; source includes Apache-2.0 components.
-- Keep license/notice files with redistributed packages and re-review on revision changes.

update public.music_model_registry
set
  commercial_status = 'approved',
  license_name = 'MIT',
  license_source_url = case
    when repo_id = 'ACE-Step/acestep-v15-base'
      then 'https://huggingface.co/ACE-Step/acestep-v15-base/tree/e432212fec32b8965a14ffa57ae653438d6abd14'
    else 'https://huggingface.co/ACE-Step/Ace-Step1.5/tree/19671f406d603126926c1b7e2adc169acbcade22'
  end,
  attribution_text = 'ACE-Step 1.5. Preserve applicable MIT and Apache-2.0 copyright/license notices when redistributing model or source packages.',
  metadata = metadata || jsonb_build_object(
    'license_reviewed_at', '2026-09-28T21:18:00Z',
    'license_review_scope', 'pinned weights + pinned trainer source',
    'weight_license', 'MIT',
    'source_component_license', 'Apache-2.0 where marked',
    'commercial_use_note', 'Model license technically permits commercial use; output rights still depend on user-provided inputs, voice consent, music rights and applicable law.'
  ),
  updated_at = now()
where engine = 'ace_step_15'
  and (
    (repo_id = 'ACE-Step/Ace-Step1.5'
      and revision = '19671f406d603126926c1b7e2adc169acbcade22')
    or
    (repo_id = 'ACE-Step/acestep-v15-base'
      and revision = 'e432212fec32b8965a14ffa57ae653438d6abd14')
  );
