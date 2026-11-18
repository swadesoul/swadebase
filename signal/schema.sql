-- Maestro Artist Signal: schema in maestroradio. Additive only; safe to re-run.
begin;
set local search_path = maestroradio, public;

create table if not exists maestroradio.artist_signal_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 60),
  display_name text not null check (length(display_name) between 1 and 120),
  artwork_url text,
  biography text check (biography is null or length(biography) <= 4000),
  genre text,
  social_links jsonb not null default '{}'::jsonb,
  artist_type text not null default 'human' check (artist_type in ('human','si','hybrid')),
  disclosure text,                      -- creator / producer / label / backstory for SI and hybrid artists
  consent_at timestamptz,               -- artist opted in; required before a profile can go active
  active boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signal_active_needs_consent check (not active or consent_at is not null),
  constraint signal_si_needs_disclosure check (artist_type = 'human' or not active or coalesce(length(disclosure),0) > 0)
);

create table if not exists maestroradio.artist_signal_tracks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references maestroradio.artist_signal_profiles(id) on delete cascade,
  song_id uuid references maestroradio.songs(id) on delete set null,
  title text not null,
  match_artist text not null,           -- normalized artist text as the station broadcasts it
  match_title text not null,            -- normalized title text as the station broadcasts it
  station_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (match_artist, match_title)
);

create table if not exists maestroradio.artist_signal_airplays (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references maestroradio.artist_signal_profiles(id) on delete cascade,
  track_id uuid references maestroradio.artist_signal_tracks(id) on delete set null,
  station_id uuid not null references maestroradio.stations(id) on delete cascade,
  scheduled_at timestamptz,
  actual_started_at timestamptz,
  actual_ended_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('tentative','scheduled','rescheduled','canceled','playing','played','missed')),
  schedule_source text not null default 'manual'
    check (schedule_source in ('manual','schedule_block','now_playing','webhook')),
  external_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, external_event_id)
);

create table if not exists maestroradio.artist_signal_follows (
  id uuid primary key default gen_random_uuid(),
  fan_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references maestroradio.artist_signal_profiles(id) on delete cascade,
  source text,                          -- share link / QR campaign code the fan arrived from
  created_at timestamptz not null default now(),
  unique (fan_id, profile_id)
);

-- Private: no client grants. Only the artist-signal function (service role) reads or writes it.
create table if not exists maestroradio.artist_signal_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  fan_id uuid not null references auth.users(id) on delete cascade,
  device_label text,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  enabled boolean not null default true,
  failure_count int not null default 0,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists maestroradio.artist_signal_preferences (
  id uuid primary key default gen_random_uuid(),
  fan_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references maestroradio.artist_signal_profiles(id) on delete cascade, -- null = defaults for all artists
  advance_minutes int not null default 5 check (advance_minutes in (0,5,15,30)),
  actual_playback_alerts boolean not null default true,
  quiet_start time,
  quiet_end time,
  timezone text not null default 'America/Chicago',
  station_ids uuid[] not null default '{}', -- empty = all stations
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (fan_id, profile_id)
);

create table if not exists maestroradio.artist_signal_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  airplay_id uuid not null references maestroradio.artist_signal_airplays(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references maestroradio.artist_signal_push_subscriptions(id) on delete cascade,
  notification_type text not null check (notification_type in ('advance','now_playing')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','canceled','skipped','expired')),
  attempts int not null default 0,
  last_error text,
  delivered_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (airplay_id, subscription_id, notification_type)
);

create table if not exists maestroradio.artist_signal_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  profile_id uuid,
  track_id uuid,
  station_id uuid,
  fan_id uuid,
  event_timestamp timestamptz not null default now(),
  event_metadata jsonb not null default '{}'::jsonb
);

-- Watcher state per station (where now-playing comes from, last thing seen, health).
create table if not exists maestroradio.artist_signal_station_sources (
  station_id uuid primary key references maestroradio.stations(id) on delete cascade,
  source_type text not null default 'icy' check (source_type in ('icy','azuracast_api','webhook')),
  source_url text,
  last_seen_text text,
  last_seen_at timestamptz,
  last_change_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  healthy boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Private server-side settings (VAPID keys, ingest token). No client grants.
create table if not exists maestroradio.artist_signal_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

create index if not exists asig_airplays_upcoming on maestroradio.artist_signal_airplays (scheduled_at) where status in ('tentative','scheduled','rescheduled');
create index if not exists asig_airplays_profile on maestroradio.artist_signal_airplays (profile_id, scheduled_at desc);
create index if not exists asig_airplays_playing on maestroradio.artist_signal_airplays (station_id) where status = 'playing';
create index if not exists asig_follows_profile on maestroradio.artist_signal_follows (profile_id);
create index if not exists asig_subs_fan on maestroradio.artist_signal_push_subscriptions (fan_id) where enabled;
create index if not exists asig_jobs_due on maestroradio.artist_signal_notification_jobs (scheduled_for) where status = 'pending';
create index if not exists asig_jobs_airplay on maestroradio.artist_signal_notification_jobs (airplay_id);
create index if not exists asig_events_profile_time on maestroradio.artist_signal_events (profile_id, event_timestamp desc);
create index if not exists asig_tracks_profile on maestroradio.artist_signal_tracks (profile_id);

-- updated_at
create or replace function maestroradio.asig_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['artist_signal_profiles','artist_signal_airplays','artist_signal_push_subscriptions','artist_signal_preferences','artist_signal_notification_jobs'] loop
    execute format('drop trigger if exists asig_touch on maestroradio.%I', t);
    execute format('create trigger asig_touch before update on maestroradio.%I for each row execute function maestroradio.asig_touch()', t);
  end loop;
end $$;

-- Row level security
alter table maestroradio.artist_signal_profiles enable row level security;
alter table maestroradio.artist_signal_tracks enable row level security;
alter table maestroradio.artist_signal_airplays enable row level security;
alter table maestroradio.artist_signal_follows enable row level security;
alter table maestroradio.artist_signal_push_subscriptions enable row level security;
alter table maestroradio.artist_signal_preferences enable row level security;
alter table maestroradio.artist_signal_notification_jobs enable row level security;
alter table maestroradio.artist_signal_events enable row level security;
alter table maestroradio.artist_signal_station_sources enable row level security;
alter table maestroradio.artist_signal_settings enable row level security;

revoke all on maestroradio.artist_signal_push_subscriptions, maestroradio.artist_signal_notification_jobs,
  maestroradio.artist_signal_events, maestroradio.artist_signal_station_sources, maestroradio.artist_signal_settings
  from anon, authenticated;
revoke all on maestroradio.artist_signal_profiles, maestroradio.artist_signal_tracks, maestroradio.artist_signal_airplays,
  maestroradio.artist_signal_follows, maestroradio.artist_signal_preferences from anon, authenticated;

grant select on maestroradio.artist_signal_profiles, maestroradio.artist_signal_tracks, maestroradio.artist_signal_airplays to anon, authenticated;
grant select, insert, delete on maestroradio.artist_signal_follows to authenticated;
grant select, insert, update, delete on maestroradio.artist_signal_preferences to authenticated;
grant all on maestroradio.artist_signal_profiles, maestroradio.artist_signal_tracks, maestroradio.artist_signal_airplays,
  maestroradio.artist_signal_follows, maestroradio.artist_signal_push_subscriptions, maestroradio.artist_signal_preferences,
  maestroradio.artist_signal_notification_jobs, maestroradio.artist_signal_events, maestroradio.artist_signal_station_sources,
  maestroradio.artist_signal_settings to service_role;

drop policy if exists asig_profiles_read on maestroradio.artist_signal_profiles;
create policy asig_profiles_read on maestroradio.artist_signal_profiles for select
  using (active or owner_user_id = auth.uid());

drop policy if exists asig_tracks_read on maestroradio.artist_signal_tracks;
create policy asig_tracks_read on maestroradio.artist_signal_tracks for select
  using (active and exists (select 1 from maestroradio.artist_signal_profiles p where p.id = profile_id and (p.active or p.owner_user_id = auth.uid())));

drop policy if exists asig_airplays_read on maestroradio.artist_signal_airplays;
create policy asig_airplays_read on maestroradio.artist_signal_airplays for select
  using (exists (select 1 from maestroradio.artist_signal_profiles p where p.id = profile_id and (p.active or p.owner_user_id = auth.uid())));

drop policy if exists asig_follows_own on maestroradio.artist_signal_follows;
create policy asig_follows_own on maestroradio.artist_signal_follows for all to authenticated
  using (fan_id = auth.uid()) with check (fan_id = auth.uid());

drop policy if exists asig_prefs_own on maestroradio.artist_signal_preferences;
create policy asig_prefs_own on maestroradio.artist_signal_preferences for all to authenticated
  using (fan_id = auth.uid()) with check (fan_id = auth.uid());

commit;
