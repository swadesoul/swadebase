-- AI DJ studios + live DJ accounts (maestroradio). Additive only.
begin;
alter table maestroradio.stations add column if not exists azuracast_station_id int, add column if not exists azuracast_shortcode text;
update maestroradio.stations set azuracast_station_id = 1, azuracast_shortcode = 'maestro_radio' where slug = 'maestro-radio';

alter table maestroradio.ai_djs
  add column if not exists slug text unique,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists station_id uuid references maestroradio.stations(id) on delete set null,
  add column if not exists tier text not null default 'medium',
  add column if not exists zip_code text,
  add column if not exists timezone text not null default 'America/Chicago',
  add column if not exists persona_brief text,
  add column if not exists humor int not null default 5,
  add column if not exists energy int not null default 6,
  add column if not exists chattiness int not null default 4,
  add column if not exists break_every_songs int not null default 3,
  add column if not exists auto_mode boolean not null default false,
  add column if not exists daily_auto_segments int not null default 0,
  add column if not exists disclosure text not null default 'AI-voiced DJ (SI). Scripts are written from live station data.',
  add column if not exists azuracast_playlist_id int,
  add column if not exists status text not null default 'draft';
do $$ begin
  alter table maestroradio.ai_djs add constraint ai_djs_tier_chk check (tier in ('low','medium','high'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table maestroradio.ai_djs add constraint ai_djs_sliders_chk check (humor between 0 and 10 and energy between 0 and 10 and chattiness between 0 and 10 and break_every_songs between 1 and 20 and daily_auto_segments between 0 and 500);
exception when duplicate_object then null; end $$;

-- private: which Voice Studio voice each DJ uses (server-only)
create table if not exists maestroradio.ai_dj_voice (
  dj_id uuid primary key references maestroradio.ai_djs(id) on delete cascade,
  voice_profile_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists maestroradio.ai_dj_shows (
  id uuid primary key default gen_random_uuid(),
  dj_id uuid not null references maestroradio.ai_djs(id) on delete cascade,
  station_id uuid references maestroradio.stations(id) on delete cascade,
  title text not null,
  days int[] not null default '{0,1,2,3,4,5,6}',
  start_time time not null default '00:00',
  end_time time not null default '23:59',
  segment_types text[] not null default '{backsell,intro,station_id}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists maestroradio.ai_dj_segments (
  id uuid primary key default gen_random_uuid(),
  dj_id uuid not null references maestroradio.ai_djs(id) on delete cascade,
  show_id uuid references maestroradio.ai_dj_shows(id) on delete set null,
  segment_type text not null check (segment_type in ('backsell','intro','station_id','artist_spotlight','artist_signal','shoutout','sponsor','custom')),
  script text not null,
  facts jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','rendering','queued','aired','rejected','failed')),
  auto boolean not null default false,
  azuracast_path text,
  azuracast_media_id int,
  azuracast_song_id text,
  audio_bytes int,
  error text,
  created_by uuid,
  approved_by uuid,
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  aired_at timestamptz
);
create index if not exists ai_dj_segments_dj on maestroradio.ai_dj_segments (dj_id, created_at desc);
create index if not exists ai_dj_segments_queued on maestroradio.ai_dj_segments (status) where status in ('queued','rendering');

create table if not exists maestroradio.ai_dj_shoutouts (
  id uuid primary key default gen_random_uuid(),
  dj_id uuid not null references maestroradio.ai_djs(id) on delete cascade,
  from_user uuid references auth.users(id) on delete set null,
  from_name text not null check (length(from_name) between 1 and 40),
  message text not null check (length(message) between 1 and 200),
  status text not null default 'pending' check (status in ('pending','approved','used','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists maestroradio.live_dj_accounts (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references maestroradio.stations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  streamer_username text not null,
  azuracast_streamer_id int,
  enforce_schedule boolean not null default false,
  schedule jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','disabled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (station_id, streamer_username)
);

alter table maestroradio.ai_dj_voice enable row level security;
alter table maestroradio.ai_dj_shows enable row level security;
alter table maestroradio.ai_dj_segments enable row level security;
alter table maestroradio.ai_dj_shoutouts enable row level security;
alter table maestroradio.live_dj_accounts enable row level security;
revoke all on maestroradio.ai_dj_voice, maestroradio.ai_dj_shows, maestroradio.ai_dj_segments, maestroradio.ai_dj_shoutouts, maestroradio.live_dj_accounts from anon, authenticated;
grant all on maestroradio.ai_dj_voice, maestroradio.ai_dj_shows, maestroradio.ai_dj_segments, maestroradio.ai_dj_shoutouts, maestroradio.live_dj_accounts, maestroradio.ai_djs to service_role;
commit;
