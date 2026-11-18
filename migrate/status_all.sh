#!/bin/bash
# One line per staged app. READY means: every chunk arrived, every table hash matches the source, schema description complete.
docker exec -i supabase-db psql -U postgres -At <<'EOF'
with apps as (select distinct source from migration_staging.inbox where source like 'lovable-%' and source <> 'lovable-resinglab'),
m as (select i.source, e->>'t' t, (e->>'chunk')::int c, (e->>'n')::int n from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.tbl='__manifest'),
miss as (select m.source, count(*) chunks, sum(m.n) rows, count(*) filter (where i.id is null) missing, string_agg(distinct m.t, ',') filter (where i.id is null) missing_tables
         from m left join migration_staging.inbox i on i.source=m.source and i.tbl=m.t and i.chunk=m.c group by m.source),
h as (select i.source, e->>'t' t, e->>'h' h from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.tbl='__rowhashes'),
d as (select i.source, i.tbl t, md5(coalesce(string_agg(md5(r::text), '' order by md5(r::text)), '')) h from migration_staging.inbox i left join lateral jsonb_array_elements(i.payload) r on true where i.tbl not like '\_\_%' group by 1,2),
hm as (select h.source, count(*) tables, count(*) filter (where h.h is distinct from d.h) bad, string_agg(h.t, ',') filter (where h.h is distinct from d.h) bad_tables from h left join d using (source, t) group by 1),
dc as (select i.source, replace(i.tbl,'__ddlcount.','') kind, (i.payload->0->>'n')::int n from migration_staging.inbox i where i.tbl like '\_\_ddlcount.%'),
dg as (select source, replace(tbl,'__ddl.','') kind, sum(row_count) n from migration_staging.inbox where tbl like '\_\_ddl.%' group by 1,2),
ddl as (select dc.source, count(*) kinds, count(*) filter (where coalesce(dg.n,0) = dc.n) ok from dc left join dg using (source, kind) group by 1)
select replace(a.source,'lovable-','')||' | '||case when coalesce(miss.missing,1)=0 and coalesce(hm.bad,1)=0 and coalesce(ddl.ok,0)=11 then 'READY' else 'WAIT ' end
  ||' rows='||coalesce(miss.rows,0)||' chunks='||coalesce(miss.chunks,0)||' missing='||coalesce(miss.missing::text,'no-manifest')
  ||' hash_bad='||coalesce(hm.bad::text,'no-hashes')||'/'||coalesce(hm.tables,0)||' ddl='||coalesce(ddl.ok,0)||'/11'
  ||coalesce(' | resend: '||left(coalesce(miss.missing_tables, hm.bad_tables),400),'')
from apps a left join miss using (source) left join hm using (source) left join ddl using (source) order by 1;
EOF
