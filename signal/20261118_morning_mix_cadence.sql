-- Morning Mix schedule rule (Swade, 2026-11-18): weekly now; every other day at 500+ consistent listeners; daily at 1,000+.
create table if not exists maestroradio.morning_mix_config (
  id int primary key default 1 check (id = 1),
  cadence text not null default 'weekly' check (cadence in ('weekly','every_other_day','daily')),
  premiere_weekday int not null default 1,          -- 1 = Monday: new episode premieres 8 AM, replays daily 8 AM + 11 PM
  every_other_day_threshold int not null default 500,
  daily_threshold int not null default 1000,
  consistent_weeks int not null default 4,
  founder_email text not null default 'swadesoul@gmail.com',
  notified_stages text[] not null default '{}',
  updated_at timestamptz not null default now());
insert into maestroradio.morning_mix_config(id) values (1) on conflict do nothing;
create table if not exists maestroradio.morning_mix_audience (
  id bigserial primary key, airing_date date not null, slot text not null check (slot in ('live','replay')),
  unique_listeners int not null, sampled_at timestamptz not null default now());
create table if not exists maestroradio.morning_mix_audience_weeks (
  week_start date primary key, airings int not null, avg_peak_listeners int not null, created_at timestamptz not null default now());
alter table maestroradio.morning_mix_config enable row level security;
alter table maestroradio.morning_mix_audience enable row level security;
alter table maestroradio.morning_mix_audience_weeks enable row level security;
grant select, insert, update on maestroradio.morning_mix_config, maestroradio.morning_mix_audience, maestroradio.morning_mix_audience_weeks to service_role;
grant usage, select on sequence maestroradio.morning_mix_audience_id_seq to service_role;
