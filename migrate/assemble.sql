-- Reassemble oversized chunks that arrived as text slices.
with pc as (select source, replace(tbl,'__partcount.','') t, chunk k, (payload->0->>'parts')::int parts, (payload->0->>'len')::int len, (payload->0->>'n')::int n from migration_staging.inbox where tbl like '\_\_partcount.%'),
pa as (select i.source, replace(i.tbl,'__part.','') t, i.chunk/1000 k, count(*) got, string_agg(i.payload->>0, '' order by i.chunk) txt from migration_staging.inbox i where i.tbl like '\_\_part.%' group by 1,2,3),
ok as (select pc.source, pc.t, pc.k, pc.n, pa.txt from pc join pa using (source, t, k) where pa.got = pc.parts and length(pa.txt) = pc.len)
insert into migration_staging.inbox(source, tbl, chunk, row_count, payload)
select source, t, k, n, txt::jsonb from ok
on conflict (source, tbl, chunk) do update set payload = excluded.payload, row_count = excluded.row_count, received_at = now();
select 'assembled='||count(*) from migration_staging.inbox i where exists (select 1 from migration_staging.inbox p where p.source=i.source and p.tbl='__partcount.'||i.tbl and p.chunk=i.chunk);
