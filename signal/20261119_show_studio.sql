-- Swade Show Studio adapter (2026-11-19, Swade: "reusable for any system in SWADEBASE... plugged into SSS Brain/Brainiak/
-- Black Tales/Swoney and more"). One producer engine; each site gets its own show row (cast, voices, sources, clock,
-- music bed, cadence, budget, review rule). The Maestro Morning Mix is show #1 and keeps its existing tables.
create schema if not exists showstudio;
create table if not exists showstudio.shows (
  id text primary key,                                  -- e.g. 'maestro-morning-mix', 'blacktales-podcast', 'swoney-money-minute'
  owner_site text not null,                             -- maestroradio | blacktales | swoney | sssbrain | brainiak | ...
  title text not null,
  status text not null default 'draft' check (status in ('draft','live','paused')),
  cadence text not null default 'weekly' check (cadence in ('daily','every_other_day','weekly','on_demand')),
  premiere jsonb not null default '{}',                 -- {"weekday":1,"time":"08:00","tz":"America/Chicago","replays":["08:00","23:00"]}
  cast_members jsonb not null default '[]',             -- [{"slug":"barnabas","name":"Barnabas","role":"main host","elevenlabs_voice_id":"...","clone_profile_id":"...","style":"..."}]
  voice_engine text not null default 'elevenlabs_dialogue' check (voice_engine in ('elevenlabs_dialogue','swadebase_clone')),
  elevenlabs_model text not null default 'eleven_v4',
  monthly_char_budget int not null default 50000,
  min_reserve int not null default 25000,
  sources jsonb not null default '{}',                  -- {"tea":"maestroradio.morning_mix_tea_week","podcasts":[...],"news_rules":"balanced"}
  clock jsonb not null default '[]',                    -- segment plan: [{"at":":00","type":"open"},{"at":":05","type":"music","songs":3},...]
  brand jsonb not null default '{}',                    -- {"theme_b2":"...","bed_b2":"...","bed_lufs":-30}
  rules text,                                           -- show-specific writing rules (tone, comedy, fact rules)
  review jsonb not null default '{"mode":"approve_unless_rejected"}',
  publish jsonb not null default '{}',                  -- where finished episodes go: station playlist, page API, podcast feed, email list
  agent_id text,                                        -- SWAGENTS producer agent (e.g. 'morning-mix' = MANDY)
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table showstudio.shows enable row level security;
grant usage on schema showstudio to service_role;
grant select, insert, update on showstudio.shows to service_role;

insert into showstudio.shows (id, owner_site, title, status, cadence, premiere, cast_members, voice_engine, elevenlabs_model, monthly_char_budget, min_reserve, sources, brand, rules, publish, agent_id)
select 'maestro-morning-mix', 'maestroradio', 'The Maestro Morning Mix', 'draft', c.cadence,
  '{"weekday":1,"time":"08:00","tz":"America/Chicago","replays":["08:00","23:00"]}',
  (select jsonb_agg(jsonb_build_object('slug',v.slug,'name',v.display_name,'role',v.role,'elevenlabs_voice_id',v.elevenlabs_voice_id,'clone_profile_id',v.voice_profile_id) order by v.slug) from maestroradio.morning_mix_voices v),
  c.episode_voice_engine, c.elevenlabs_model, c.elevenlabs_monthly_char_budget, c.elevenlabs_min_reserve,
  '{"tea":"maestroradio.morning_mix_tea_week","storylines":"maestroradio.morning_mix_arcs","uncle_rich":"maestroradio.uncle_rich_ledger","news_rules":"balanced, Texas-wide"}',
  '{"theme_b2":"swadesoul/maestroradio/shows/morning-mix/theme/take2-full.mp3","bed_b2":"swadesoul/maestroradio/shows/morning-mix/bed/","bed_lufs":-30}',
  'Rules live in the SWAGENTS agent morning-mix (MANDY) and the Show Bible.',
  '{"page_api":"morning-mix","episodes_table":"maestroradio.morning_mix_episodes","bucket":"morning-mix"}', 'morning-mix'
from maestroradio.morning_mix_config c where c.id = 1
on conflict (id) do nothing;

insert into swadebase_ops.adapters_registry (id, display_name, kind, module_slugs, what_it_is, purpose, connections, owner_site, status, evidence)
values ('swade-show-studio', 'Swade Show Studio', 'host_service', '{maestroradio,blacktales,swoney,sssbrain,brainiak}',
  'Reusable radio-show and podcast production engine: cast voices, sources (tea, news, podcasts), script writing with a fact-check pass, multi-voice rendering, music bed mixing, episode publishing, audience-based cadence and founder review.',
  'Plug a show into any SWADEBASE site (Maestro Radio, Black Tales, Swoney, SSS Brain, Brainiak and more) by adding one row in showstudio.shows instead of rebuilding a pipeline.',
  '{"voices":"ElevenLabs Text to Dialogue (one account, Coolify ELEVENLABS_API_KEY) + Swade Voice Service clones","music":"ReSing Lab music-api","storage":"Backblaze B2 + SWADEBASE storage","mail":"Postal via Mail Machine","agents":"SWAGENTS producer agents","first_show":"maestro-morning-mix"}',
  'maestroradio', 'in_progress', '{"/opt/swadebase/signal/20261119_show_studio.sql","showstudio.shows"}')
on conflict (id) do nothing;
