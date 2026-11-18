-- SWADEBASE section: musiceco (daily music ecosystem brief). Service-role only.
-- Idempotent: safe to re-run.
begin;
create schema if not exists musiceco;
revoke all on schema musiceco from public, anon, authenticated;
grant usage on schema musiceco to service_role;

create table if not exists musiceco.places (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,
  section text not null default 'places' check (section in ('places','potential_customers')),
  category text, name text not null, website text, description text, fit text, location text,
  email text, contact_page text, phone text, socials jsonb not null default '{}'::jsonb, address text,
  recommended_services text[] not null default '{}', recommended_reason text,
  first_seen date not null default current_date, last_seen date not null default current_date,
  source_urls text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists musiceco.contacts (
  id bigint generated always as identity primary key,
  place_id bigint references musiceco.places(id) on delete cascade,
  name text, title text, role text, email text, phone text, linkedin text,
  socials jsonb not null default '{}'::jsonb, address text, outlet text,
  first_captured_at timestamptz not null default now(), enriched_at timestamptz,
  source_urls text[] not null default '{}', do_not_contact boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index if not exists contacts_email_uq on musiceco.contacts (lower(email)) where email is not null;
create unique index if not exists contacts_linkedin_uq on musiceco.contacts (lower(linkedin)) where linkedin is not null;
create unique index if not exists contacts_name_place_uq on musiceco.contacts (place_id, lower(name)) where name is not null and email is null and linkedin is null;
create index if not exists contacts_place_idx on musiceco.contacts (place_id);

create table if not exists musiceco.brief_entries (
  brief_date date not null,
  place_id bigint not null references musiceco.places(id) on delete cascade,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (brief_date, place_id)
);
create table if not exists musiceco.outreach (
  id bigint generated always as identity primary key,
  contact_id bigint references musiceco.contacts(id) on delete set null,
  place_id bigint references musiceco.places(id) on delete set null,
  service_pitched text, subject text, body text,
  status text not null default 'drafted' check (status in ('drafted','approved','sent','replied','declined')),
  drafted_at timestamptz not null default now(), sent_at timestamptz, sent_by text
);
create index if not exists outreach_contact_idx on musiceco.outreach (contact_id);

do $$ declare t text; begin
  foreach t in array array['places','contacts','brief_entries','outreach'] loop
    execute format('alter table musiceco.%I enable row level security', t);
    execute format('revoke all on musiceco.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on musiceco.%I to service_role', t);
  end loop;
end $$;
grant usage, select on all sequences in schema musiceco to service_role;
alter default privileges in schema musiceco revoke all on tables from public, anon, authenticated;
alter default privileges in schema musiceco revoke execute on functions from public, anon, authenticated;

-- Loader: one call per brief. entries = JSON array, d = brief date. Returns counts.
create or replace function musiceco.load_brief(entries jsonb, d date)
returns jsonb language plpgsql security invoker set search_path = musiceco, pg_temp as $f$
declare
  e jsonb; k text; host text; pid bigint; ins boolean; cid bigint;
  n_places int := 0; n_new int := 0; n_pc int := 0; n_contacts_new int := 0; n_contacts int := 0;
  cname text; clink text; cemail text; svc text[];
begin
  for e in select * from jsonb_array_elements(entries) loop
    continue when coalesce(trim(e->>'name'),'') = '';
    host := lower(regexp_replace(coalesce(e->>'website',''), '^[a-z]+://', '', 'i'));
    host := regexp_replace(host, '^www\.', '');
    host := regexp_replace(host, '[?#].*$', '');
    host := regexp_replace(host, '/+$', '');
    if host <> '' then k := host;
    else k := lower(regexp_replace(trim(e->>'name') || '|' || coalesce(trim(e->>'location'),''), '\s+', ' ', 'g'));
    end if;
    svc := case when jsonb_typeof(e->'recommended_services') = 'array'
                then array(select jsonb_array_elements_text(e->'recommended_services')) else null end;
    insert into places as p (dedupe_key, section, category, name, website, description, fit, location, email,
        contact_page, phone, socials, address, recommended_services, recommended_reason, first_seen, last_seen, source_urls)
    values (k, coalesce(nullif(e->>'section',''),'places'), nullif(e->>'category',''), trim(e->>'name'),
        nullif(e->>'website',''), nullif(e->>'description',''), nullif(e->>'fit',''), nullif(e->>'location',''),
        nullif(e->>'email',''), nullif(e->>'contact_page',''), nullif(e->>'phone',''),
        case when jsonb_typeof(e->'socials')='object' then e->'socials' else '{}'::jsonb end,
        nullif(e->>'address',''), coalesce(svc,'{}'), nullif(e->>'recommended_reason',''), d, d,
        case when jsonb_typeof(e->'source_urls')='array' then array(select jsonb_array_elements_text(e->'source_urls')) else '{}' end)
    on conflict (dedupe_key) do update set
        section = excluded.section,
        category = coalesce(excluded.category, p.category), name = excluded.name,
        website = coalesce(excluded.website, p.website), description = coalesce(excluded.description, p.description),
        fit = coalesce(excluded.fit, p.fit), location = coalesce(excluded.location, p.location),
        email = coalesce(excluded.email, p.email), contact_page = coalesce(excluded.contact_page, p.contact_page),
        phone = coalesce(excluded.phone, p.phone), socials = p.socials || excluded.socials,
        address = coalesce(excluded.address, p.address),
        recommended_services = case when cardinality(excluded.recommended_services) > 0 then excluded.recommended_services else p.recommended_services end,
        recommended_reason = coalesce(excluded.recommended_reason, p.recommended_reason),
        first_seen = least(p.first_seen, excluded.first_seen), last_seen = greatest(p.last_seen, excluded.last_seen),
        source_urls = array(select distinct u from unnest(p.source_urls || excluded.source_urls) u),
        updated_at = now()
    returning id, (first_seen = d) into pid, ins;
    n_places := n_places + 1;
    if ins then n_new := n_new + 1; end if;
    if coalesce(e->>'section','places') = 'potential_customers' then n_pc := n_pc + 1; end if;
    insert into brief_entries (brief_date, place_id, is_new) values (d, pid, ins)
      on conflict (brief_date, place_id) do update set is_new = excluded.is_new;

    cname := nullif(trim(e->>'contact_person_name'),''); clink := nullif(trim(e->>'contact_person_linkedin'),'');
    cemail := nullif(trim(e->>'contact_person_email'),'');
    if cname is not null or clink is not null or cemail is not null then
      select id into cid from contacts c where
        (cemail is not null and lower(c.email) = lower(cemail)) or
        (clink is not null and lower(c.linkedin) = lower(clink)) or
        (cname is not null and c.place_id = pid and lower(c.name) = lower(cname))
        order by id limit 1;
      if cid is null then
        insert into contacts (place_id, name, title, email, phone, linkedin, outlet, source_urls)
        values (pid, cname, nullif(e->>'contact_person_title',''), cemail, nullif(e->>'contact_person_phone',''), clink,
                trim(e->>'name'),
                case when jsonb_typeof(e->'source_urls')='array' then array(select jsonb_array_elements_text(e->'source_urls')) else '{}' end);
        n_contacts_new := n_contacts_new + 1;
      else
        update contacts c set name = coalesce(c.name, cname), title = coalesce(nullif(e->>'contact_person_title',''), c.title),
          email = coalesce(c.email, cemail), linkedin = coalesce(c.linkedin, clink),
          phone = coalesce(c.phone, nullif(e->>'contact_person_phone','')), place_id = coalesce(c.place_id, pid),
          outlet = coalesce(c.outlet, trim(e->>'name')), updated_at = now()
        where c.id = cid;
      end if;
      n_contacts := n_contacts + 1;
    end if;
  end loop;
  return jsonb_build_object('brief_date', d, 'entries', n_places, 'new_places', n_new, 'potential_customers', n_pc,
                            'contacts_seen', n_contacts, 'contacts_new', n_contacts_new);
end $f$;
revoke all on function musiceco.load_brief(jsonb, date) from public, anon, authenticated;
grant execute on function musiceco.load_brief(jsonb, date) to service_role;
commit;
