-- Jump It or Stomp It (2026-11-19, Swade). Free uploads (Artist Discovery) get a 30-day public vote.
-- >= jump_threshold % Jumps with >= min_votes -> Hot Artists playlist + DJ announcement (top of month = Hot Artist of the Month).
-- Below -> stomped: 3 plays a month. Too few votes -> one more 30-day run. Listeners: one vote per song, signed in.
-- Every 20 votes a listener picks a reward: a free song download or a radio shout-out.
create table if not exists maestroradio.jos_settings (
  id int primary key default 1 check (id = 1), enabled boolean not null default true,
  min_votes int not null default 25, jump_threshold numeric not null default 50, run_days int not null default 30,
  stomped_plays_per_month int not null default 3, reward_every int not null default 20,
  air_times text[] not null default '{10:00,13:00,16:00,19:00}', clip_seconds int not null default 45, clip_start_seconds int not null default 30,
  updated_at timestamptz not null default now());
insert into maestroradio.jos_settings(id) values (1) on conflict do nothing;
create table if not exists maestroradio.jos_entries (   -- one per Discovery song in the running
  enrollment_id uuid primary key references maestroradio.discovery_enrollments(id) on delete cascade,
  clip_url text, host_take jsonb not null default '{}', round int not null default 1,
  opens_at timestamptz not null default now(), closes_at timestamptz,
  verdict text check (verdict in ('hot','stomped','extended')), jump_pct numeric, total_votes int, decided_at timestamptz,
  hot_of_month text, created_at timestamptz not null default now());
create table if not exists maestroradio.jos_votes (
  id bigserial primary key, enrollment_id uuid not null references maestroradio.jos_entries(enrollment_id) on delete cascade,
  user_id uuid not null, vote text not null check (vote in ('jump','stomp')), created_at timestamptz not null default now(),
  unique (enrollment_id, user_id));
create index if not exists jos_votes_user on maestroradio.jos_votes(user_id, created_at desc);
create table if not exists maestroradio.jos_rewards (
  id bigserial primary key, user_id uuid not null, milestone int not null, choice text check (choice in ('download','shoutout')),
  detail jsonb not null default '{}', status text not null default 'unclaimed' check (status in ('unclaimed','claimed','fulfilled')),
  created_at timestamptz not null default now(), claimed_at timestamptz, unique (user_id, milestone));
create or replace view maestroradio.jos_tally as
select e.enrollment_id, count(v.*)::int total_votes, count(v.*) filter (where v.vote='jump')::int jumps,
       count(v.*) filter (where v.vote='stomp')::int stomps,
       case when count(v.*)=0 then null else round(100.0*count(v.*) filter (where v.vote='jump')/count(v.*),1) end jump_pct
from maestroradio.jos_entries e left join maestroradio.jos_votes v on v.enrollment_id=e.enrollment_id group by e.enrollment_id;
alter table maestroradio.jos_settings enable row level security; alter table maestroradio.jos_entries enable row level security;
alter table maestroradio.jos_votes enable row level security; alter table maestroradio.jos_rewards enable row level security;
grant select, insert, update on maestroradio.jos_settings, maestroradio.jos_entries, maestroradio.jos_votes, maestroradio.jos_rewards to service_role;
grant select on maestroradio.jos_tally to service_role;
grant usage, select on sequence maestroradio.jos_votes_id_seq, maestroradio.jos_rewards_id_seq to service_role;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jump-or-stomp','jump-or-stomp', true, 20971520, array['audio/mpeg','image/png','image/webp'])
on conflict (id) do update set public = true;
