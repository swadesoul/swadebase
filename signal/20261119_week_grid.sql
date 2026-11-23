-- Maestro Radio week grid (2026-11-19, Swade): one weekly format for all seven days, with a show and a music
-- playlist plugged into each time slot. Sunday is Gospel Day. The grid is the source of truth; week_grid_sync.py
-- writes it into the station engine's playlist schedules (and reads it back).
begin;

create table if not exists maestroradio.station_week_settings (
  station_id uuid primary key references maestroradio.stations(id) on delete cascade,
  clock text not null default 'maestro-hour',
  clock_notes text not null default 'Every hour follows the Maestro hour clock: talk breaks of 5 minutes max, music sets of 3-4 songs, ad breaks at :21 and :51.',
  ad_minutes int[] not null default '{21,51}',
  apply_mode text not null default 'auto' check (apply_mode in ('auto','manual')),
  pending_sync boolean not null default true,
  last_sync_at timestamptz, last_sync_result jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists maestroradio.station_week_grid (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references maestroradio.stations(id) on delete cascade,
  day smallint not null check (day between 1 and 7),               -- 1 = Monday ... 7 = Sunday (same as the engine)
  start_hm smallint not null check (start_hm between 0 and 2359 and start_hm % 100 < 60),
  end_hm smallint not null check (end_hm between 1 and 2400 and end_hm % 100 < 60),
  label text not null check (length(label) between 1 and 80),
  music_playlist_id int,                                           -- engine playlist id
  fallback_playlist_id int,                                        -- used while the music playlist is below min_songs
  min_songs int not null default 40 check (min_songs between 1 and 2000),
  show_slug text,                                                  -- e.g. morning-mix (episode airs here once produced)
  show_edition text,                                               -- e.g. weekly, sunday
  talk_tone text not null default 'standard' check (talk_tone in ('standard','spiritual','party','late-night','chill')),
  notes text not null default '',
  updated_at timestamptz not null default now(), updated_by uuid,
  check (end_hm > start_hm)
);
create index if not exists station_week_grid_lookup on maestroradio.station_week_grid (station_id, day, start_hm);

-- engine playlists mirrored for the editor's dropdowns (written by week_grid_sync.py)
create table if not exists maestroradio.station_engine_playlists (
  station_id uuid not null references maestroradio.stations(id) on delete cascade,
  engine_id int not null, name text not null, type text, num_songs int, is_enabled boolean, managed_by_grid boolean not null default false,
  synced_at timestamptz not null default now(),
  primary key (station_id, engine_id)
);

alter table maestroradio.station_week_settings enable row level security;
alter table maestroradio.station_week_grid enable row level security;
alter table maestroradio.station_engine_playlists enable row level security;
-- the public schedule is readable by anyone; writes go through the week-grid function (service role)
drop policy if exists week_grid_read on maestroradio.station_week_grid;
create policy week_grid_read on maestroradio.station_week_grid for select using (true);
grant select on maestroradio.station_week_grid to anon, authenticated;
grant all on maestroradio.station_week_settings, maestroradio.station_week_grid, maestroradio.station_engine_playlists to service_role;

-- slot that is on air at a Central-time moment (used by the DJ break writer for tone)
create or replace function maestroradio.week_slot_at(p_station uuid, p_day int, p_hm int)
returns maestroradio.station_week_grid language sql stable as $$
  select * from maestroradio.station_week_grid
  where station_id = p_station and day = p_day and start_hm <= p_hm and end_hm > p_hm
  order by start_hm desc limit 1
$$;
grant execute on function maestroradio.week_slot_at(uuid,int,int) to service_role;
commit;
