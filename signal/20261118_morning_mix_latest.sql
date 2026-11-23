-- Morning Mix page "Latest show" + archive (2026-11-18). Episodes appear only once status='aired' (never rejected/pulled).
alter table maestroradio.morning_mix_episodes
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists aired_at timestamptz,
  add column if not exists talk_audio_url text,      -- public, talk-only version (music not included: broadcast rights don't cover downloads)
  add column if not exists duration_s integer,
  add column if not exists song_list jsonb not null default '[]'::jsonb,  -- [{title, artist, at}]
  add column if not exists segments jsonb not null default '[]'::jsonb;   -- [{name, start_s}] chapter markers for the player
-- Public bucket for episode audio (talk-only mp3s).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('morning-mix', 'morning-mix', true, 209715200, array['audio/mpeg','audio/mp4','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, allowed_mime_types = excluded.allowed_mime_types;
