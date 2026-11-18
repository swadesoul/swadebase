-- Uncle Rich Fund (2026-11-17): Uncle Rich's "investment" asks are donations to GroundLift's Pass the Cup (VSSN administers funds).
-- We only count donate-button clicks; amounts/donors live with VSSN/Givebutter. Optional charity-reported totals for on-air mentions.
create table if not exists maestroradio.uncle_rich_fund_clicks (
  id bigserial primary key, placement text not null, created_at timestamptz not null default now());
create table if not exists maestroradio.uncle_rich_fund_totals (
  id bigserial primary key, as_of date not null, donors int, amount_usd numeric(12,2), source text not null default 'VSSN report',
  note text, created_at timestamptz not null default now());
comment on table maestroradio.uncle_rich_fund_totals is 'Only figures VSSN shares with us. Hosts may cite the latest row on air. Never invent totals.';
alter table maestroradio.uncle_rich_fund_clicks enable row level security;
alter table maestroradio.uncle_rich_fund_totals enable row level security;
grant select, insert on maestroradio.uncle_rich_fund_clicks to service_role;
grant usage, select on sequence maestroradio.uncle_rich_fund_clicks_id_seq to service_role;
grant select, insert, update on maestroradio.uncle_rich_fund_totals to service_role;
grant usage, select on sequence maestroradio.uncle_rich_fund_totals_id_seq to service_role;
