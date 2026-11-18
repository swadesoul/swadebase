-- Fold re-send chunk plans (__manifest_patch) into each app's manifest, oldest first.
do $$
declare p record; base jsonb; tabs text[];
begin
  for p in select id, source, payload from migration_staging.inbox where tbl='__manifest_patch' order by received_at, id loop
    select array_agg(distinct e->>'t') into tabs from jsonb_array_elements(p.payload) e;
    select payload into base from migration_staging.inbox where source=p.source and tbl='__manifest' and chunk=0;
    if base is null then base := '[]'::jsonb; end if;
    select coalesce(jsonb_agg(e), '[]'::jsonb) into base from jsonb_array_elements(base) e where not ((e->>'t') = any(tabs));
    base := base || p.payload;
    insert into migration_staging.inbox(source, tbl, chunk, row_count, payload) values (p.source, '__manifest', 0, jsonb_array_length(base), base)
      on conflict (source, tbl, chunk) do update set payload = excluded.payload, row_count = excluded.row_count;
    delete from migration_staging.inbox where id = p.id;
  end loop;
end $$;
