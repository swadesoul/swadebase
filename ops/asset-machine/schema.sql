begin;
create table if not exists swadebase_ops.machine_members (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email)),
 user_id uuid unique, role text not null check(role in ('admin','reviewer','client')),
 active boolean not null default true, created_at timestamptz not null default now());
insert into swadebase_ops.machine_members(email,role) values ('danny@dannybyers.com','reviewer') on conflict(email) do nothing;
create table if not exists swadebase_ops.machine_sessions (
 id_hash text primary key, user_id uuid not null, email text not null, token_cipher text not null,
 csrf text not null, expires_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_cases (
 id uuid primary key default gen_random_uuid(), owner_id text not null, title text not null,
 asset_type text not null check(asset_type in ('instrument','wallet','contract','digital')),
 description text not null default '', fields jsonb not null default '{}',
 status text not null default 'intake' check(status in ('intake','evidence_needed','ready_for_review','under_review','review_complete','declined')),
 reviewer_id uuid references swadebase_ops.machine_members(id), engagement_accepted boolean not null default false,
 payment_status text not null default 'not_recorded' check(payment_status in ('not_recorded','recorded')),
 payment_reference text, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists machine_cases_owner_idx on swadebase_ops.machine_cases(owner_id);
create table if not exists swadebase_ops.machine_evidence (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references swadebase_ops.machine_cases(id),
 name text not null, mime text not null, bytes integer not null, sha256 text not null,
 storage_key text not null, extracted_text text not null default '', extraction_status text not null default 'pending',
 uploaded_by text not null, created_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_findings (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references swadebase_ops.machine_cases(id),
 kind text not null, title text not null, body text not null, source_url text, source_evidence_id uuid,
 scope text not null, created_by text not null, created_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_reviews (
 case_id uuid primary key references swadebase_ops.machine_cases(id), notes text not null default '',
 draft text not null default '', version integer not null default 0, approved_version integer,
 approved_hash text, approved_by text, approved_at timestamptz, released_at timestamptz,
 updated_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_reports (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references swadebase_ops.machine_cases(id),
 review_version integer not null, body text not null, sha256 text not null, approved_by text not null,
 created_at timestamptz not null default now(), unique(case_id,review_version));
create table if not exists swadebase_ops.machine_contacts (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references swadebase_ops.machine_cases(id),
 name text not null, firm text not null default '', email text not null default '', role text not null default '',
 interest text not null default '', source_url text not null default '', diligence text not null default '',
 brief text not null default '', version integer not null default 1, approved_version integer,
 created_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_messages (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references swadebase_ops.machine_cases(id),
 actor_id text not null, role text not null, body text not null, created_at timestamptz not null default now());
create table if not exists swadebase_ops.machine_events (
 id bigint generated always as identity primary key, case_id uuid references swadebase_ops.machine_cases(id),
 actor_id text not null, action text not null, details jsonb not null default '{}', created_at timestamptz not null default now());
grant select,insert,update on swadebase_ops.machine_members,swadebase_ops.machine_sessions,swadebase_ops.machine_cases,swadebase_ops.machine_evidence,swadebase_ops.machine_findings,swadebase_ops.machine_reviews,swadebase_ops.machine_reports,swadebase_ops.machine_contacts,swadebase_ops.machine_messages to swadebase_adapters;
grant delete on swadebase_ops.machine_sessions to swadebase_adapters;
grant select,insert on swadebase_ops.machine_events to swadebase_adapters;
grant usage,select on sequence swadebase_ops.machine_events_id_seq to swadebase_adapters;
-- No browser/PostgREST role receives table grants. All case access goes through authenticated server checks.
commit;
