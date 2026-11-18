-- SWADEBASE chat archive: Big Mamma (Grok Bot), ChatGPT, Claude conversation history.
-- Namespace: chat_archive. Owner/service access only (RLS on, no policies => anon/authenticated see nothing).
-- Idempotent: safe to re-run.
begin;
create schema if not exists chat_archive;
revoke all on schema chat_archive from public, anon, authenticated;

create table if not exists chat_archive.conversations (
  id            uuid primary key default gen_random_uuid(),
  assistant     text not null check (assistant in ('big_mamma','chatgpt','claude','other')),
  source        text not null,               -- grokbot_session | grokbot_daily_summary | chatgpt_export | claude_export | manual
  external_id   text not null,               -- id from the source (export conversation id, session id, daily file name)
  title         text not null default '',
  started_at    timestamptz,
  updated_at    timestamptz,
  model         text,
  message_count integer not null default 0,
  summary       text,
  meta          jsonb not null default '{}'::jsonb,
  ingested_at   timestamptz not null default now(),
  last_ingest_at timestamptz not null default now(),
  unique (assistant, external_id)
);

create table if not exists chat_archive.messages (
  id              bigserial primary key,
  conversation_id uuid not null references chat_archive.conversations(id) on delete cascade,
  external_id     text not null,             -- source message id, or sha256 of role|time|content
  seq             integer not null,          -- order inside the visible conversation
  role            text not null check (role in ('user','assistant','system','tool','summary')),
  author          text,
  content         text not null,             -- secrets already redacted before insert
  created_at      timestamptz,
  content_hash    text not null,
  redactions      integer not null default 0,
  meta            jsonb not null default '{}'::jsonb,
  search          tsvector generated always as (to_tsvector('english', coalesce(content,''))) stored,
  unique (conversation_id, external_id)
);
create index if not exists chat_messages_conv_seq on chat_archive.messages (conversation_id, seq);
create index if not exists chat_messages_created on chat_archive.messages (created_at desc);
create index if not exists chat_messages_search on chat_archive.messages using gin (search);
create index if not exists chat_conv_assistant_time on chat_archive.conversations (assistant, started_at desc);

create table if not exists chat_archive.ingest_runs (
  id            bigserial primary key,
  assistant     text not null,
  source_file   text,
  file_sha256   text,
  conversations integer not null default 0,
  new_messages  integer not null default 0,
  redactions    integer not null default 0,
  status        text not null default 'ok',
  error         text,
  ran_at        timestamptz not null default now()
);

alter table chat_archive.conversations enable row level security;
alter table chat_archive.messages      enable row level security;
alter table chat_archive.ingest_runs   enable row level security;
revoke all on all tables in schema chat_archive from public, anon, authenticated;

-- Upsert one conversation with its messages. Returns number of NEW messages inserted (dedup on external_id).
create or replace function chat_archive.ingest_conversation(p jsonb) returns integer
language plpgsql as $$
declare cid uuid; n integer := 0; m jsonb;
begin
  insert into chat_archive.conversations as c (assistant, source, external_id, title, started_at, updated_at, model, summary, meta)
  values (p->>'assistant', p->>'source', p->>'external_id', coalesce(p->>'title',''),
          (p->>'started_at')::timestamptz, (p->>'updated_at')::timestamptz, p->>'model', p->>'summary', coalesce(p->'meta','{}'::jsonb))
  on conflict (assistant, external_id) do update
    set title = excluded.title,
        updated_at = greatest(c.updated_at, excluded.updated_at),
        started_at = least(c.started_at, excluded.started_at),
        model = coalesce(excluded.model, c.model),
        summary = coalesce(excluded.summary, c.summary),
        meta = c.meta || excluded.meta,
        last_ingest_at = now()
  returning id into cid;

  if coalesce((p->>'replace_messages')::boolean, false) then
    delete from chat_archive.messages where conversation_id = cid;
  end if;

  for m in select * from jsonb_array_elements(coalesce(p->'messages','[]'::jsonb)) loop
    insert into chat_archive.messages (conversation_id, external_id, seq, role, author, content, created_at, content_hash, redactions, meta)
    values (cid, m->>'external_id', (m->>'seq')::int, m->>'role', m->>'author', m->>'content',
            (m->>'created_at')::timestamptz, m->>'content_hash', coalesce((m->>'redactions')::int,0), coalesce(m->'meta','{}'::jsonb))
    on conflict (conversation_id, external_id) do nothing;
    if found then n := n + 1; end if;
  end loop;

  update chat_archive.conversations set message_count = (select count(*) from chat_archive.messages where conversation_id = cid) where id = cid;
  return n;
end $$;

-- Browsing views
create or replace view chat_archive.v_conversations as
select c.id, c.assistant, c.title,
       (c.started_at at time zone 'America/Chicago') as started_ct,
       (c.updated_at at time zone 'America/Chicago') as updated_ct,
       c.message_count, c.source, c.model, c.external_id,
       (select left(m.content, 200) from chat_archive.messages m where m.conversation_id=c.id and m.role='user' order by m.seq limit 1) as first_user_message
from chat_archive.conversations c;

create or replace view chat_archive.v_timeline as
select (m.created_at at time zone 'America/Chicago') as at_ct, c.assistant, c.title, m.role, m.content, c.id as conversation_id, m.seq
from chat_archive.messages m join chat_archive.conversations c on c.id = m.conversation_id;

-- Keyword search helper: select * from chat_archive.search('omniroute');
create or replace function chat_archive.search(q text, max_rows int default 50)
returns table(at_ct timestamp, assistant text, title text, role text, snippet text, conversation_id uuid)
language sql stable as $$
  select (m.created_at at time zone 'America/Chicago'), c.assistant, c.title, m.role,
         ts_headline('english', m.content, websearch_to_tsquery('english', q), 'MaxWords=40,MinWords=15'),
         c.id
  from chat_archive.messages m join chat_archive.conversations c on c.id = m.conversation_id
  where m.search @@ websearch_to_tsquery('english', q)
  order by m.created_at desc nulls last limit max_rows
$$;
revoke all on all functions in schema chat_archive from public, anon, authenticated;
commit;
