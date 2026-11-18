-- SSS Brain "everything produced" index.
-- One live view over every file any ecosystem site stores on SWADEBASE, so SSS Brain can pull it up
-- automatically: no per-site export, nothing to keep in sync. Founder-only.
create schema if not exists brain;

create table if not exists brain.bucket_app (
  bucket_id text primary key,
  app text not null,
  site text not null
);
insert into brain.bucket_app (bucket_id, app, site) values
  ('resinglab','resinglab','ReSing Lab'), ('record-covers','resinglab','ReSing Lab'),
  ('audio','jazzedivyne','Jazze Divyne'), ('covers','jazzedivyne','Jazze Divyne'),
  ('release-artwork','mydistribution','My Distribution'), ('release-audio','mydistribution','My Distribution'),
  ('audio-tracks','p78585c43','Music project 78585c43'), ('cover-art','p78585c43','Music project 78585c43'),
  ('admin-skills','publiswade','PubliSwade'), ('epk-audio','publiswade','PubliSwade'),
  ('press-audio','publiswade','PubliSwade'), ('press-media','publiswade','PubliSwade'), ('press-video','publiswade','PubliSwade'),
  ('asset-intake','ssworld','SwadeSoul World'), ('avatars','ssworld','SwadeSoul World'), ('media','ssworld','SwadeSoul World'),
  ('sceneworld','swideo','Swideo'), ('user-assets','swideo','Swideo'), ('vision-director','swideo','Swideo'),
  ('coach-avatars','teachvirt','TeachVirt'), ('course-covers','teachvirt','TeachVirt'), ('forge-images','teachvirt','TeachVirt'),
  ('audio-briefings','tokencsi','Token CSI'), ('verdict-posters','tokencsi','Token CSI'), ('whitepaper-uploads','tokencsi','Token CSI'),
  ('audivid-captures','videosaywhat','VideoSayWhat'), ('uploads','videosaywhat','VideoSayWhat'),
  ('admin-packages','yourown','YourOwn'),
  ('swadesoul-site','swadesoul','SwadeSoul.com')
on conflict (bucket_id) do nothing;

create or replace view brain.assets as
select o.id,
       o.bucket_id as bucket,
       o.name as path,
       regexp_replace(o.name, '^.*/', '') as file_name,
       coalesce(b.app, 'unassigned') as app,
       coalesce(b.site, o.bucket_id) as site,
       case split_part(coalesce(o.metadata->>'mimetype',''), '/', 1)
         when 'audio' then 'audio' when 'video' then 'video' when 'image' then 'image'
         else case when o.name ~* '\.(mp3|wav|m4a|flac|ogg)$' then 'audio'
                   when o.name ~* '\.(mp4|mov|webm|m4v)$' then 'video'
                   when o.name ~* '\.(png|jpe?g|webp|gif|svg)$' then 'image'
                   else 'document' end
       end as kind,
       o.metadata->>'mimetype' as mime,
       nullif(o.metadata->>'size','')::bigint as bytes,
       o.created_at,
       coalesce(g.title, regexp_replace(regexp_replace(o.name, '^.*/', ''), '\.[A-Za-z0-9]+$', '')) as title,
       g.generation_type as produced_as,
       bk.public as is_public
from storage.objects o
join storage.buckets bk on bk.id = o.bucket_id
left join brain.bucket_app b on b.bucket_id = o.bucket_id
left join resinglab.resinglab_generations g
       on o.bucket_id = 'resinglab' and (g.vault_url = o.name or g.metadata->>'storage_path' = o.name);

-- Founder lock: only the founder account (or the server itself) may read the index.
create or replace function brain.is_founder() returns boolean
language sql stable security definer set search_path to '' as $$
  select coalesce(auth.role() = 'service_role', false)
      or exists (select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = 'swadesoul@gmail.com'
                 and u.email_confirmed_at is not null);
$$;

create or replace function public.brain_search_assets(
  p_query text default null, p_app text default null, p_kind text default null,
  p_since timestamptz default null, p_limit integer default 50, p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare v_items jsonb; v_total bigint; v_q text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if not brain.is_founder() then raise exception 'Founder access required'; end if;
  p_limit := least(greatest(coalesce(p_limit, 50), 1), 200);
  select count(*) into v_total from brain.assets a
   where (p_app is null or a.app = p_app) and (p_kind is null or a.kind = p_kind)
     and (p_since is null or a.created_at >= p_since)
     and (v_q is null or a.title ilike '%' || v_q || '%' or a.path ilike '%' || v_q || '%' or a.site ilike '%' || v_q || '%');
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_items from (
    select a.id, a.site, a.app, a.kind, a.title, a.file_name, a.bucket, a.path, a.mime, a.bytes, a.created_at,
           a.produced_as, a.is_public
      from brain.assets a
     where (p_app is null or a.app = p_app) and (p_kind is null or a.kind = p_kind)
       and (p_since is null or a.created_at >= p_since)
       and (v_q is null or a.title ilike '%' || v_q || '%' or a.path ilike '%' || v_q || '%' or a.site ilike '%' || v_q || '%')
     order by a.created_at desc, a.id
     limit p_limit offset greatest(coalesce(p_offset, 0), 0)) x;
  return jsonb_build_object('total', v_total, 'items', v_items);
end $$;

create or replace function public.brain_assets_summary()
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not brain.is_founder() then raise exception 'Founder access required'; end if;
  return (select jsonb_build_object(
    'total', (select count(*) from brain.assets),
    'bytes', (select coalesce(sum(bytes), 0) from brain.assets),
    'by_site', (select coalesce(jsonb_agg(to_jsonb(s) order by s.files desc), '[]'::jsonb) from (
        select site, app, count(*) files, coalesce(sum(bytes), 0) bytes, max(created_at) latest,
               count(*) filter (where kind = 'audio') audio, count(*) filter (where kind = 'video') video,
               count(*) filter (where kind = 'image') image, count(*) filter (where kind = 'document') document
          from brain.assets group by site, app) s)));
end $$;

revoke all on function public.brain_search_assets(text, text, text, timestamptz, integer, integer) from public, anon;
revoke all on function public.brain_assets_summary() from public, anon;
grant execute on function public.brain_search_assets(text, text, text, timestamptz, integer, integer) to authenticated, service_role;
grant execute on function public.brain_assets_summary() to authenticated, service_role;
revoke all on schema brain from public, anon, authenticated;
notify pgrst, 'reload schema';
