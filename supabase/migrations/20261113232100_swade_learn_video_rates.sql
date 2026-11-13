-- Rate cards for the SWADE Learn render job. ElevenLabs stays a subscription account,
-- matching bbc49e8c01. Together starts prepaid with no opening balance, so ai_can_spend
-- is false until a top-up is recorded. Prices are public list figures and are not invoice-verified.
-- Not applied to production by this PR.

begin;

insert into swadebase_ops.ai_provider_accounts(provider, display_name, billing, hard_stop_usd, low_balance_usd, notes) values
  ('together', 'Together', 'prepaid', 1, 5, 'Premium video. No opening balance until a top-up is recorded.'),
  ('remotion', 'Remotion CPU render', 'self_hosted', 0, 0, '$0 marginal'),
  ('hyperframes', 'HyperFrames CPU render', 'self_hosted', 0, 0, '$0 marginal')
on conflict (provider) do nothing;

insert into swadebase_ops.ai_rate_cards(provider, model, unit, usd_per_unit, source_url, verified_at) values
  ('elevenlabs', 'eleven_multilingual_v2', 'character', 0.0003, 'https://elevenlabs.io/pricing', null),
  ('together', 'Wan-AI/wan2.7-t2v', 'request', 0.10, 'https://www.together.ai/models/wan-27', null),
  ('remotion', '4.0.543', 'request', 0, 'self-hosted', now()),
  ('hyperframes', '0.8.206', 'request', 0, 'self-hosted', now()),
  ('swade_voice', 'hexgrad/Kokoro-82M', 'character', 0, 'self-hosted', now()),
  ('swade_voice', 'hexgrad/Kokoro-82M', 'audio_second', 0, 'self-hosted', now())
on conflict (provider, model, unit) do nothing;

commit;
