-- Swade Video Router: Comfy template layer + long_video (2026-11-23).
-- comfy_templates holds official Comfy-Org workflow templates converted to API format by
-- /opt/swadebase/comfy-templates/convert.py, with bindings (param -> [[node, input], ...]) the router fills per job.
begin;
create table if not exists swade_media.comfy_templates (
  slug          text primary key,
  family        text not null,                 -- e.g. ltx25: the router picks <family>_i2v when a start image is sent, else <family>_t2v
  source_repo   text not null default 'Comfy-Org/workflow_templates',
  source_path   text not null,
  source_sha    text not null,                 -- upstream commit the workflow was converted from
  workflow      jsonb not null,
  bindings      jsonb not null,
  defaults      jsonb not null default '{}',
  output_kind   text not null default 'video' check (output_kind in ('video','image')),
  has_audio     boolean not null default false,
  enabled       boolean not null default true,
  synced_at     timestamptz not null default now(),
  notes         text
);
alter table swade_media.comfy_templates enable row level security;  -- service role only (router runs as postgres)

-- long_video: default 15 s, up to 30 s. One job type, five switchable engines (tier).
-- default = LTX-2.5 22B distilled on Comfy Cloud (cheapest; 2-20 s until the 30 s join is proven); others via Kie.
insert into swade_media.routes
  (job_type, tier, provider, model, fixed_input, input_fields, required_inputs, prompt_required, duration_param, aspect_param,
   price_unit, price_usd, default_duration_s, min_duration_s, max_duration_s, output_kind, has_audio, enabled, priority, notes)
values
  ('long_video','default','comfy','tpl:ltx25','{}','{first_frame}','{}',true,'duration','aspect_ratio',
   'per_second',0.015,15,2,20,'video',true,true,10,
   'LTX-2.5 (Aug 2026) on Comfy Cloud, official Comfy template, 720p two-stage with synced audio. Price is an estimate until the first real run; poller records GPU-time cost.'),
  ('long_video','wan3','kie','wan/3-0-video','{"audio": false, "resolution": "480P"}','{first_frame}','{}',true,'duration','aspect_ratio',
   'per_second',0.04,15,2,30,'video',false,true,10,'Wan 3.0 480p via Kie: the proven 30 s engine.'),
  ('long_video','kling','kie','kling-3.0/video','{"mode": "std", "sound": false, "multi_shots": false}','{first_frame}','{}',true,'duration','aspect_ratio',
   'per_second',0.07,15,3,15,'video',false,true,10,'Kling 3.0 std via Kie: max 15 s.'),
  ('long_video','seedance','kie','bytedance/seedance-2-5','{"resolution": "480p", "generate_audio": false}','{first_frame}','{}',true,'duration','aspect_ratio',
   'per_second',0.14,15,4,30,'video',false,true,10,'Seedance 2.5 480p via Kie.'),
  ('long_video','wan3_hd','kie','wan/3-0-video','{"audio": false, "resolution": "1080P"}','{first_frame}','{}',true,'duration','aspect_ratio',
   'per_second',0.16,15,2,30,'video',false,true,10,'Wan 3.0 1080p via Kie: top quality.')
on conflict (job_type, tier, model) do nothing;
commit;
