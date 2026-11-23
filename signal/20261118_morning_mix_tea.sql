-- Morning Mix tea (gossip/news) collected from outlet feeds (2026-11-18). Weekly show uses the last 7 days.
create table if not exists maestroradio.morning_mix_tea (
  id bigserial primary key, url_hash text unique not null, title text not null, url text not null, source text not null,
  feed text not null, genre text not null, kind text not null check (kind in ('news','gossip','viral')),
  summary text, published_at timestamptz not null, fingerprint text[] not null default '{}',
  used_in_episode uuid references maestroradio.morning_mix_episodes(id) on delete set null, blocked boolean not null default false,
  created_at timestamptz not null default now());
create index if not exists morning_mix_tea_pub on maestroradio.morning_mix_tea(published_at desc);
alter table maestroradio.morning_mix_tea enable row level security;
grant select, insert, update on maestroradio.morning_mix_tea to service_role;
grant usage, select on sequence maestroradio.morning_mix_tea_id_seq to service_role;
-- Weekly ranking: stories carried by more separate outlets rank higher (WorldStar alone never counts as confirmed).
create or replace view maestroradio.morning_mix_tea_week as
select t.*, (select count(distinct t2.source) from maestroradio.morning_mix_tea t2
             where t2.published_at > now() - interval '7 days' and t2.kind <> 'viral' and not t2.blocked
               and cardinality(array(select unnest(t.fingerprint) intersect select unnest(t2.fingerprint))) >= 3) as outlets
from maestroradio.morning_mix_tea t where t.published_at > now() - interval '7 days' and not t.blocked;
grant select on maestroradio.morning_mix_tea_week to service_role;
