#!/bin/bash
# Final gate for every app schema: live rows vs source rows, users present, files stored vs files at source.
docker exec -i supabase-db psql -U postgres -At <<'EOF'
with apps as (select distinct replace(source,'lovable-','') app, source from migration_staging.inbox where source like 'lovable-%'),
src as (select source, replace(tbl,'public.','') t, sum(row_count) n from migration_staging.inbox where tbl like 'public.%' group by 1,2),
live as (select n.nspname app, c.relname t,
           (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::bigint n
         from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in (select app from apps)),
t as (select a.app, count(*) tables, sum(s.n) src_rows, sum(coalesce(l.n,0)) live_rows, count(*) filter (where coalesce(l.n,-1) < s.n) short
      from apps a join src s using (source) left join live l on l.app=a.app and l.t=s.t group by a.app),
u as (select a.app, count(*) src_users, count(*) filter (where exists (select 1 from auth.users x where lower(x.email)=lower(e->>'email'))) present
      from apps a join migration_staging.inbox i on i.source=a.source and i.tbl='auth.users', jsonb_array_elements(i.payload) e
      where e->>'email' not like 'migration-%@swadesoul.com' group by a.app),
f as (select a.app, count(*) src_files from apps a join migration_staging.inbox i on i.source=a.source and i.tbl='storage.objects', jsonb_array_elements(i.payload) o where o->>'metadata'<>'null' group by a.app)
select rpad(t.app,17)||' | '||case when t.short=0 and t.live_rows>0 then 'LOADED ' when t.live_rows=0 then 'STAGED ' else 'PARTIAL' end
  ||' | tables '||lpad(t.tables::text,3)||' | rows '||lpad(t.live_rows::text,6)||'/'||rpad(t.src_rows::text,6)
  ||' | users '||coalesce(u.present,0)||'/'||coalesce(u.src_users,0)||' | source files '||coalesce(f.src_files,0)
from t left join u using (app) left join f using (app) order by 1;
select 'TOTAL storage objects='||count(*)||' size='||pg_size_pretty(sum((metadata->>'size')::bigint)) from storage.objects;
select 'TOTAL users='||count(*) from auth.users;
EOF
for a in /root/migrations/*/; do n=$(basename $a); [ -f $a/upload.log ] && echo "files $n: $(tail -1 $a/upload.log)"; done
