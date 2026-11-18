-- Maestro Morning Mix: episodes (approved unless rejected) + Uncle Rich's continuous storyline.
begin;

create table if not exists maestroradio.morning_mix_episodes (
  id            uuid primary key default gen_random_uuid(),
  air_date      date not null unique,
  episode_no    integer not null unique,
  status        text not null default 'scripting'
                check (status in ('scripting','rendering','ready','rejected','rebuilding','aired','pulled')),
  hosts         text[] not null default array['Barnabas','Surrinda','Pa-Tony'],
  topics        jsonb not null default '{}'::jsonb,   -- group_chat, fact_or_cap, real_talk, headlines
  script        jsonb,                                -- segments -> lines [{speaker, text, cue}]
  audio_path    text,                                 -- B2 key of the mixed show body
  wraps         jsonb not null default '{}'::jsonb,   -- morning / late_night / weekend / neutral B2 keys
  reject_note   text,
  rejected_segments text[] not null default '{}',
  version       integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per Uncle Rich call. The latest row is his "previously on" memory for the next call.
create table if not exists maestroradio.uncle_rich_ledger (
  id                uuid primary key default gen_random_uuid(),
  episode_id        uuid references maestroradio.morning_mix_episodes(id) on delete set null,
  call_no           integer not null unique,
  location          text not null,          -- where he is calling from
  product           text not null,          -- what he is trying today
  pledge_usd        integer not null default 40000,
  last_return       text,                   -- how the previous product "did"
  story_beat        text,                   -- what happened on this leg of the trip
  next_destination  text,                   -- where he says he is headed (sets up the next call)
  running_gag       text,                   -- callbacks: the Branson timeshare, the glow socks...
  sponsored_by      text,                   -- set only for paid product integrations
  created_at        timestamptz not null default now()
);

alter table maestroradio.morning_mix_episodes enable row level security;
alter table maestroradio.uncle_rich_ledger enable row level security;

-- Seed Uncle Rich's backstory so call #1 already has history to reference.
insert into maestroradio.uncle_rich_ledger (call_no, location, product, pledge_usd, last_return, story_beat, next_destination, running_gag)
values (0, 'Branson, Missouri', 'Glow-in-the-dark socks', 25000, null,
        'Backstory: retired from Maestro, cashed his pension, bought a timeshare in Branson with his sock money.',
        'Lisbon, Portugal', 'The Branson timeshare he keeps trying to sell to the crew')
on conflict (call_no) do nothing;
commit;
