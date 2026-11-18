#!/bin/bash
# SWADE migration kit - moves one Lovable project into its own SWADEBASE schema with a count-and-hash gate.
#   kit.sh open                         open the intake door, print a one-time token
#   kit.sh close                        close the intake door
#   kit.sh status <app>                 staged tables/rows, missing chunks, hash check vs the source manifest
#   kit.sh tmpuser <app> <url> <anon>   create a throwaway reader account on the source project, print its id
#   kit.sh fetch <app>                  download every source file (resumable), run in background
#   kit.sh upload <app>                 push files into SWADEBASE storage with remapped user ids
#   kit.sh verify <app>                 final gate: live rows vs source rows, files vs source files
PSQL="docker exec -i supabase-db psql -U postgres -At"
cmd=$1; app=$2; W=/root/migrations/$app; SRC=lovable-$app
case "$cmd" in
open)
  $PSQL -q < /root/migrations/resinglab/01_staging.sql
  T=$(openssl rand -hex 24); $PSQL -q -c "truncate migration_staging.token; insert into migration_staging.token values ('$T')"
  echo "TOKEN=$T" ;;
close)
  $PSQL -q -c "drop function if exists public.migration_ingest(text,text,text,int,jsonb); truncate migration_staging.token; notify pgrst, 'reload schema';"; echo closed ;;
status)
  $PSQL <<EOF
select 'data_tables='||count(distinct tbl) filter (where tbl not like '\_\_%')||' rows='||coalesce(sum(row_count) filter (where tbl not like '\_\_%'),0)||' ddl_parts='||count(distinct tbl) filter (where tbl like '\_\_ddl%') from migration_staging.inbox where source='$SRC';
with m as (select e->>'t' t, (e->>'chunk')::int c, (e->>'n')::int n from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.source='$SRC' and i.tbl='__manifest')
select 'manifest_chunks='||count(*)||' manifest_rows='||coalesce(sum(n),0)||' missing_chunks='||count(*) filter (where i.id is null) from m left join migration_staging.inbox i on i.source='$SRC' and i.tbl=m.t and i.chunk=m.c;
with m as (select e->>'t' t, (e->>'chunk')::int c from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.source='$SRC' and i.tbl='__manifest')
select 'MISSING '||string_agg(distinct m.t, ',') from m left join migration_staging.inbox i on i.source='$SRC' and i.tbl=m.t and i.chunk=m.c where i.id is null having count(*)>0;
with src as (select e->>'t' t, e->>'h' h from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.source='$SRC' and i.tbl='__rowhashes'),
dst as (select i.tbl t, md5(coalesce(string_agg(md5(r::text), '' order by md5(r::text)), '')) h from migration_staging.inbox i left join lateral jsonb_array_elements(i.payload) r on true where i.source='$SRC' and i.tbl not like '\_\_%' group by i.tbl)
select 'hash_tables='||count(*)||' match='||count(*) filter (where s.h=d.h)||' mismatch='||coalesce(string_agg(s.t, ',') filter (where s.h is distinct from d.h),'none') from src s left join dst d using (t);
EOF
  ;;
tmpuser)
  mkdir -p $W; cd $W; umask 077
  P=$(openssl rand -hex 20); E="migration-$(openssl rand -hex 4)@swadesoul.com"
  printf 'SRC_URL=%s\nSRC_ANON=%s\nSRC_EMAIL=%s\nSRC_PASS=%s\n' "$3" "$4" "$E" "$P" > .src.env
  curl -s -m 20 -X POST "$3/auth/v1/signup" -H "apikey: $4" -H 'content-type: application/json' -d "{\"email\":\"$E\",\"password\":\"$P\"}" \
   | python3 -c 'import sys,json;d=json.load(sys.stdin);u=d.get("user",d);print("TMPUSER",u.get("id"),u.get("email"),d.get("msg") or d.get("error_description") or "")' ;;
fetch)
  cd $W; set -a; . ./.src.env; set +a
  JWT=$(curl -s -m 20 -X POST "$SRC_URL/auth/v1/token?grant_type=password" -H "apikey: $SRC_ANON" -H 'content-type: application/json' -d "{\"email\":\"$SRC_EMAIL\",\"password\":\"$SRC_PASS\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))')
  [ -z "$JWT" ] && { echo "LOGIN FAILED" > fetch.log; exit 1; }
  $PSQL -F $'\t' -c "select o->>'bucket_id', o->>'name', coalesce(o->'metadata'->>'size','0') from migration_staging.inbox i, jsonb_array_elements(i.payload) o where i.source='$SRC' and i.tbl='storage.objects' and o->'metadata' is not null and o->>'metadata'<>'null'" > objects.tsv
  ok=0; fail=0; : > fetch.log
  while IFS=$'\t' read -r b n sz; do
    out="files/$b/$n"; mkdir -p "$(dirname "$out")"
    if [ -f "$out" ] && [ "$(stat -c %s "$out")" = "$sz" ]; then ok=$((ok+1)); continue; fi
    enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$n")
    curl -s -f -m 900 -o "$out" "$SRC_URL/storage/v1/object/authenticated/$b/$enc" -H "apikey: $SRC_ANON" -H "Authorization: Bearer $JWT"
    if [ -f "$out" ] && [ "$(stat -c %s "$out")" = "$sz" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "FAIL $b/$n" >> fetch.log; fi
  done < objects.tsv
  echo "FETCH DONE ok=$ok fail=$fail" >> fetch.log ;;
upload)
  cd $W
  KEY=$(docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SUPABASE_SERVICE_ROLE_KEY=' | cut -d= -f2-)
  API=http://127.0.0.1:18000/storage/v1; : > upload.log
  $PSQL -F $'\t' -c "select b->>'id', b->>'public' from migration_staging.inbox i, jsonb_array_elements(i.payload) b where i.source='$SRC' and i.tbl='storage.buckets'" | while IFS=$'\t' read -r id pub; do
    curl -s -m 20 -X POST "$API/bucket" -H "Authorization: Bearer $KEY" -H "apikey: $KEY" -H 'content-type: application/json' -d "{\"id\":\"$id\",\"name\":\"$id\",\"public\":$pub}" >> upload.log; echo " <- bucket $id" >> upload.log
  done
  $PSQL -F $'\t' -c "select o->>'bucket_id', o->>'name', coalesce(o->'metadata'->>'mimetype','application/octet-stream') from migration_staging.inbox i, jsonb_array_elements(i.payload) o where i.source='$SRC' and i.tbl='storage.objects' and o->'metadata' is not null and o->>'metadata'<>'null'" > objects3.tsv
  SED=$(python3 -c "import json;print(';'.join('s/%s/%s/g'%(a,b) for a,b in json.load(open('idmap.json')).items()))" 2>/dev/null)
  ok=0; fail=0
  while IFS=$'\t' read -r b n mt; do
    dest="$n"; [ -n "$SED" ] && dest=$(echo "$n" | sed "$SED")
    enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$dest")
    code=$(curl -s -m 900 -o /tmp/up.$app.out -w '%{http_code}' -X POST "$API/object/$b/$enc" -H "Authorization: Bearer $KEY" -H "apikey: $KEY" -H "content-type: $mt" -H 'x-upsert: true' --data-binary "@files/$b/$n")
    if [ "$code" = "200" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "FAIL $code $b/$dest $(cut -c1-100 /tmp/up.$app.out)" >> upload.log; fi
  done < objects3.tsv
  echo "UPLOAD DONE ok=$ok fail=$fail" >> upload.log ;;
verify)
  $PSQL <<EOF
with src as (select replace(tbl,'public.','') t, sum(row_count) n from migration_staging.inbox where source='$SRC' and tbl like 'public.%' group by 1),
dst as (select c.relname t, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', '$app', c.relname), false, true, '')))[1]::text::bigint n
        from pg_class c where c.relkind='r' and c.relnamespace=(select oid from pg_namespace where nspname='$app'))
select 'GATE tables='||count(*)||' source_rows='||sum(s.n)||' live_rows='||coalesce(sum(d.n),0)||' short='||count(*) filter (where coalesce(d.n,-1) < s.n)||' -> '||coalesce(string_agg(s.t||'('||coalesce(d.n::text,'missing')||'/'||s.n||')', ',') filter (where coalesce(d.n,-1) < s.n),'all tables complete') from src s left join dst d using (t);
select 'USERS source='||(select coalesce(sum(row_count),0) from migration_staging.inbox where source='$SRC' and tbl='auth.users')||' present_by_email='||(select count(*) from migration_staging.inbox i, jsonb_array_elements(i.payload) e where i.source='$SRC' and i.tbl='auth.users' and exists (select 1 from auth.users u where lower(u.email)=lower(e->>'email')));
select 'FILES source='||(select count(*) from migration_staging.inbox i, jsonb_array_elements(i.payload) o where i.source='$SRC' and i.tbl='storage.objects' and o->>'metadata'<>'null');
EOF
  [ -f $W/fetch.log ] && tail -1 $W/fetch.log; [ -f $W/upload.log ] && tail -1 $W/upload.log ;;
*) echo "unknown command" ;;
esac
