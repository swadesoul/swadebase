-- Swade Video Router: Comfy Cloud adapter (2026-11-23).
-- Adds provider 'comfy' and two Comfy Cloud routes (Wan 2.2 14B, official 4-step template).
-- Price is an estimate: ~11 Comfy credits per 5 s clip (comfy.org pricing) at $3.49/736.39 per credit = ~$0.0104/s;
-- set to $0.011 per video-second. The poller records real cost from GPU seconds when Comfy reports them.
begin;
alter table swade_media.routes drop constraint routes_provider_check;
alter table swade_media.routes add constraint routes_provider_check
  check (provider = any (array['replicate','qwen','kie','runpod','comfy']));

insert into swade_media.routes
  (job_type, tier, provider, model, fixed_input, input_fields, required_inputs, prompt_required, duration_param, aspect_param,
   price_unit, price_usd, default_duration_s, min_duration_s, max_duration_s, output_kind, has_audio, enabled, priority, notes)
values
  ('comfy_wan22_i2v', 'default', 'comfy', 'wan22-i2v-14b-4step', '{}', '{first_frame}', '{first_frame}', true, 'duration', 'aspect_ratio',
   'per_second', 0.011, 5, 2, 8, 'video', false, true, 10,
   'Comfy Cloud (Creator plan, 3 concurrent): Wan 2.2 14B image-to-video, 4-step lightx2v, 832x480/480x832/640x640 @16fps. ~11 credits per 5 s.'),
  ('comfy_wan22_t2v', 'default', 'comfy', 'wan22-t2v-14b-4step', '{}', '{}', '{}', true, 'duration', 'aspect_ratio',
   'per_second', 0.011, 5, 2, 8, 'video', false, true, 10,
   'Comfy Cloud (Creator plan, 3 concurrent): Wan 2.2 14B text-to-video, 4-step lightx2v, 832x480/480x832/640x640 @16fps. ~11 credits per 5 s.')
on conflict (job_type, tier, model) do nothing;
commit;
