-- Morning Mix depth: host life storylines with real places, paid sponsor placements inside storylines,
-- and listener sign-ups for show reminders. Extends morning_mix_arcs (no duplicate storyline table) and
-- links placements to the existing sponsor_accounts / sponsor_campaigns system.
begin;

alter table maestroradio.morning_mix_arcs
  add column if not exists host text,               -- Barnabas | Surrinda | Pa-Tony | Uncle Rich | crew
  add column if not exists place_name text,         -- real place mentioned in the beat (restaurant, venue, park)
  add column if not exists place_city text,         -- Texas city (or other) for local color
  add column if not exists placement_id uuid;       -- paid storyline placement woven into this beat, if any

-- Paid storyline placements: a business pays to become part of a host's story ("I stopped by ___ after practice").
create table if not exists maestroradio.storyline_placements (
  id             uuid primary key default gen_random_uuid(),
  sponsor_id     uuid references maestroradio.sponsor_accounts(id) on delete set null,
  campaign_id    uuid references maestroradio.sponsor_campaigns(id) on delete set null,
  business_name  text not null,
  product        text,                              -- what gets mentioned (a dish, a store, a service)
  city           text,
  host           text,                              -- preferred host/storyline, or null = best fit
  arc_key        text,                              -- target storyline, or null = MANDY picks the best fit
  mentions       integer not null default 1,        -- how many on-air story beats are bought
  mentions_used  integer not null default 0,
  price_usd      numeric(10,2),
  talking_points text,                              -- facts the business wants mentioned (verified, no claims we cannot back up)
  status         text not null default 'pending' check (status in ('pending','active','completed','paused','rejected')),
  starts_on      date, ends_on date,
  disclosure     text not null default 'Sponsored storyline mention',
  created_at     timestamptz not null default now()
);

-- Listener sign-ups: reminders by email and/or text, plus calendar. SMS needs explicit consent (logged).
create table if not exists maestroradio.morning_mix_subscribers (
  id               uuid primary key default gen_random_uuid(),
  email            text,
  phone            text,
  name             text,
  want_email       boolean not null default false,
  want_sms         boolean not null default false,
  sms_consent_at   timestamptz,                     -- when they ticked the SMS consent box
  sms_consent_text text,                            -- exact wording they agreed to
  remind_live      boolean not null default true,   -- 8 AM show
  remind_replay    boolean not null default false,  -- 11 PM replay
  timezone         text not null default 'America/Chicago',
  zip              text,
  token            text not null default encode(gen_random_bytes(18), 'hex'),  -- unsubscribe / manage link
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  source           text default 'morning-mix-page',
  created_at       timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create unique index if not exists mm_subs_email on maestroradio.morning_mix_subscribers (lower(email)) where email is not null;
create unique index if not exists mm_subs_phone on maestroradio.morning_mix_subscribers (phone) where phone is not null;

alter table maestroradio.storyline_placements enable row level security;
alter table maestroradio.morning_mix_subscribers enable row level security;

-- Seed the three launch life storylines (beats spaced over weeks; real places get filled in per city/sponsor).
insert into maestroradio.morning_mix_arcs (arc_key, arc_title, beat_no, beat, teaches, carrier, not_before, host) values
('back-porch-sauce','Barnabas'' Back Porch Sauce',1,'Barnabas brings batch #1 of his barbecue sauce. Crew tastes it on air. Verdict: "tastes like a Sunday regret." He swears batch #2 will be different.',null,'group_chat','2026-11-18','Barnabas'),
('back-porch-sauce','Barnabas'' Back Porch Sauce',2,'Batch #2 after "researching" at a real Texas barbecue spot over the weekend. Listeners start voting on the sauce name.',null,'group_chat','2026-11-24','Barnabas'),
('back-porch-sauce','Barnabas'' Back Porch Sauce',3,'Jada (his 10-year-old) secretly fixes the recipe. It is finally good. He tries to take credit; the crew finds out.',null,'real_talk','2026-12-08','Barnabas'),
('smooth-hours','Smooth Hours candles',1,'Surrinda reveals she has been making candles in her kitchen at night. First scent: "Sunday Morning Grits." Crew roasts the name.',null,'group_chat','2026-11-19','Surrinda'),
('smooth-hours','Smooth Hours candles',2,'Her candle TikTok goes semi-viral; orders pile up; she needs a website and asks Uncle Rich for advice (crosses his tech storyline).','Small business + social selling','uncle_rich','2026-12-02','Surrinda'),
('smooth-hours','Smooth Hours candles',3,'First one-star review ("smelled like my uncle''s truck"). Real Talk on handling criticism.',null,'real_talk','2026-12-16','Surrinda'),
('pump-and-dump-app','Pa-Tony''s gas station bathroom app',1,'Pa-Tony announces his first app idea: rating Texas gas station bathrooms. Barnabas: "Finally, tech that matters." Buc-ee''s is declared the gold standard.','What it takes to build an app','tech_aisle','2026-11-20','Pa-Tony'),
('pump-and-dump-app','Pa-Tony''s gas station bathroom app',2,'He builds the first version with an AI app builder; crew tests it live and finds bugs (one bathroom rated "spiritual experience").','AI app builders, testing, bugs','group_chat','2026-12-03','Pa-Tony'),
('pump-and-dump-app','Pa-Tony''s gas station bathroom app',3,'His chemistry-teacher mom leaves the first review: grammar corrections. Listeners start submitting real bathroom ratings from across Texas.',null,'group_chat','2026-12-17','Pa-Tony')
on conflict (arc_key, beat_no) do nothing;
commit;
