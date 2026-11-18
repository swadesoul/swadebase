-- Music Mogul game state (maestroradio). Additive.
begin;
create table if not exists maestroradio.mogul_players (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) <= 40),
  city text check (city is null or length(city) <= 60),
  path text not null default 'lover' check (path in ('lover','musician','pro')),
  artist_profile_id uuid references maestroradio.artist_signal_profiles(id) on delete set null,
  xp int not null default 0 check (xp between 0 and 10000000),
  rep int not null default 70 check (rep between 0 and 100),
  chapter int not null default 0,
  avoided int not null default 0,
  caused int not null default 0,
  listen_seconds int not null default 0,
  promo_code text unique default substr(md5(gen_random_uuid()::text), 1, 8),
  rewarded_follows int not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists maestroradio.mogul_milestones (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (length(key) <= 60),
  text text not null check (length(text) <= 200),
  chapter int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);
create table if not exists maestroradio.mogul_saved_songs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) <= 200),
  artist text not null check (length(artist) <= 200),
  art_url text check (art_url is null or length(art_url) <= 500),
  saved_at timestamptz not null default now(),
  unique (user_id, artist, title)
);
create index if not exists mogul_milestones_user on maestroradio.mogul_milestones (user_id, created_at desc);

alter table maestroradio.mogul_players enable row level security;
alter table maestroradio.mogul_milestones enable row level security;
alter table maestroradio.mogul_saved_songs enable row level security;
revoke all on maestroradio.mogul_players, maestroradio.mogul_milestones, maestroradio.mogul_saved_songs from anon, authenticated;
grant select, insert, update on maestroradio.mogul_players to authenticated;
grant select, insert on maestroradio.mogul_milestones to authenticated;
grant select, insert, delete on maestroradio.mogul_saved_songs to authenticated;
grant all on maestroradio.mogul_players, maestroradio.mogul_milestones, maestroradio.mogul_saved_songs to service_role;

drop policy if exists mogul_players_own on maestroradio.mogul_players;
create policy mogul_players_own on maestroradio.mogul_players for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists mogul_milestones_own on maestroradio.mogul_milestones;
create policy mogul_milestones_own on maestroradio.mogul_milestones for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists mogul_saved_own on maestroradio.mogul_saved_songs;
create policy mogul_saved_own on maestroradio.mogul_saved_songs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- players can't hand themselves promo rewards or change their code; only the claim function does that
create or replace function maestroradio.mogul_guard() returns trigger language plpgsql as $$
begin
  if current_setting('maestroradio.mogul_claim', true) is distinct from 'on' then
    new.rewarded_follows := coalesce(old.rewarded_follows, 0);
    new.promo_code := coalesce(old.promo_code, new.promo_code);
  end if;
  if tg_op = 'UPDATE' then
    -- xp can grow at most 1000 per save (normal play earns far less); never drops below what it was
    new.xp := least(greatest(new.xp, old.xp), old.xp + 1000);
  else
    new.xp := least(new.xp, 1000);
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists mogul_guard on maestroradio.mogul_players;
create trigger mogul_guard before insert or update on maestroradio.mogul_players for each row execute function maestroradio.mogul_guard();

-- Promo credit: count real Artist Signal follows that came through the player's share link (source = 'mm-<code>')
create or replace function maestroradio.mogul_claim_promo() returns json
language plpgsql security definer set search_path = maestroradio, public as $$
declare p maestroradio.mogul_players; total int; fresh int; views int;
begin
  select * into p from maestroradio.mogul_players where user_id = auth.uid();
  if not found then return json_build_object('error', 'no player'); end if;
  select count(*) into total from maestroradio.artist_signal_follows where source = 'mm-' || p.promo_code and fan_id <> p.user_id;
  select count(*) into views from maestroradio.artist_signal_events where event_type = 'page_view' and event_metadata->>'src' = 'mm-' || p.promo_code;
  fresh := greatest(total - p.rewarded_follows, 0);
  if fresh > 0 then
    perform set_config('maestroradio.mogul_claim', 'on', true);
    update maestroradio.mogul_players set rewarded_follows = total, xp = xp + least(fresh * 50, 1000) where user_id = p.user_id;
    insert into maestroradio.mogul_milestones (user_id, key, text, chapter)
      values (p.user_id, 'promo-' || total, 'Your link brought in ' || total || ' real follower' || case when total = 1 then '' else 's' end, p.chapter)
      on conflict do nothing;
  end if;
  return json_build_object('follows', total, 'new_follows', fresh, 'xp_awarded', least(fresh * 50, 1000), 'page_views', views, 'code', p.promo_code);
end $$;
revoke all on function maestroradio.mogul_claim_promo() from public, anon;
grant execute on function maestroradio.mogul_claim_promo() to authenticated;
commit;
