do $$
declare r record; n bigint; per int; k int; rows jsonb; g int; sl int; len int; txt text; partno int;
  tok text := '__TOKEN__'; src text := 'lovable-__APP__'; pick text := '__ONLY__';
  url text := 'https://swadebase.cloud/rest/v1/rpc/migration_ingest';
  hdr jsonb := '{"content-type":"application/json","apikey":"sb_publishable_PpVJ7vNoNMtdUQcKC9WUG9_zggpMc46"}';
  man jsonb := '[]'::jsonb; j jsonb;
begin
  -- pick = ''            : everything
  -- pick = 'ddl'         : schema description only
  -- pick = 'a.b,c.d'     : only those tables (resend)
  if pick <> 'ddl' then
  for r in select n2.nspname s, c.relname t, pg_total_relation_size(c.oid) sz from pg_class c join pg_namespace n2 on n2.oid=c.relnamespace
           where c.relkind='r' and (n2.nspname='public' or (n2.nspname='auth' and c.relname in ('users','identities')) or (n2.nspname='storage' and c.relname in ('buckets','objects'))) loop
    if pick <> '' and not ((r.s||'.'||r.t) = any(string_to_array(pick, ','))) then continue; end if;
    execute format('select count(*) from %I.%I', r.s, r.t) into n;
    per := case when n = 0 then 1 else greatest(1, least(300, (30000.0 / greatest(r.sz::numeric / n, 1.0))::int)) end;
    k := 0;
    loop
      execute format('select coalesce(jsonb_agg(j), ''[]''::jsonb) from (select to_jsonb(x) j from %I.%I x order by x.ctid offset %s limit %s) q', r.s, r.t, k*per, per) into rows;
      txt := rows::text;
      if length(txt) > 80000 then
        -- oversized chunk: ship it as text slices, the receiver reassembles (requests over ~1 MB do not get through)
        partno := 0;
        while partno*40000 < length(txt) loop
          perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__part.'||r.s||'.'||r.t,'p_chunk',k*1000+partno,'p_rows',jsonb_build_array(substr(txt, partno*40000+1, 40000))), headers := hdr, timeout_milliseconds := 60000);
          partno := partno + 1;
        end loop;
        perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__partcount.'||r.s||'.'||r.t,'p_chunk',k,'p_rows',jsonb_build_array(jsonb_build_object('parts',partno,'len',length(txt),'n',jsonb_array_length(rows)))), headers := hdr, timeout_milliseconds := 60000);
      else
        perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table',r.s||'.'||r.t,'p_chunk',k,'p_rows',rows), headers := hdr, timeout_milliseconds := 60000);
      end if;
      man := man || jsonb_build_object('t', r.s||'.'||r.t, 'chunk', k, 'n', jsonb_array_length(rows));
      k := k + 1;
      exit when k*per >= n;
    end loop;
  end loop;
  end if;
  if pick <> '' and pick <> 'ddl' then
    -- resend: publish this table's chunk plan so the receiver can drop stale chunks
    perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__manifest_patch','p_chunk',(extract(epoch from clock_timestamp())::bigint % 2000000000)::int,'p_rows',man), headers := hdr, timeout_milliseconds := 60000);
    return;
  end if;
  if pick = '' then
    perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__manifest','p_chunk',0,'p_rows',man), headers := hdr, timeout_milliseconds := 60000);
    select jsonb_agg(jsonb_build_object('t',t,'h',h)) into j from (
      select n2.nspname||'.'||c.relname as t,
        (xpath('/row/h/text()', query_to_xml(format('select md5(coalesce(string_agg(md5(to_jsonb(x)::text), '''' order by md5(to_jsonb(x)::text)),'''')) as h from %I.%I x', n2.nspname, c.relname), false, true, '')))[1]::text as h
      from pg_class c join pg_namespace n2 on n2.oid=c.relnamespace
      where c.relkind='r' and (n2.nspname='public' or (n2.nspname='auth' and c.relname in ('users','identities')) or (n2.nspname='storage' and c.relname in ('buckets','objects')))) q;
    perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__rowhashes','p_chunk',0,'p_rows',j), headers := hdr, timeout_milliseconds := 60000);
  end if;
  for r in
    select 'enums' kind, 150 slice, (select coalesce(jsonb_agg(jsonb_build_object('name',t.typname,'labels',(select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid=t.oid))),'[]'::jsonb) from pg_type t join pg_namespace n2 on n2.oid=t.typnamespace where n2.nspname='public' and t.typtype='e') body
    union all select 'sequences', 150, (select coalesce(jsonb_agg(jsonb_build_object('name',sequencename,'last',last_value,'inc',increment_by)),'[]'::jsonb) from pg_sequences where schemaname='public')
    union all select 'constraints', 150, (select coalesce(jsonb_agg(jsonb_build_object('t',c.relname,'name',k2.conname,'type',k2.contype,'def',pg_get_constraintdef(k2.oid))),'[]'::jsonb) from pg_constraint k2 join pg_class c on c.oid=k2.conrelid join pg_namespace n2 on n2.oid=c.relnamespace where n2.nspname='public')
    union all select 'indexes', 150, (select coalesce(jsonb_agg(jsonb_build_object('t',tablename,'name',indexname,'def',indexdef)),'[]'::jsonb) from pg_indexes where schemaname='public')
    union all select 'policies', 100, (select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from pg_policies p where schemaname in ('public','storage'))
    union all select 'rls', 500, (select coalesce(jsonb_agg(jsonb_build_object('t',c.relname,'rls',c.relrowsecurity)),'[]'::jsonb) from pg_class c join pg_namespace n2 on n2.oid=c.relnamespace where n2.nspname='public' and c.relkind='r')
    union all select 'triggers', 100, (select coalesce(jsonb_agg(jsonb_build_object('schema',n2.nspname,'t',c.relname,'name',tg.tgname,'def',pg_get_triggerdef(tg.oid))),'[]'::jsonb) from pg_trigger tg join pg_class c on c.oid=tg.tgrelid join pg_namespace n2 on n2.oid=c.relnamespace where not tg.tgisinternal and n2.nspname in ('public','auth'))
    union all select 'views', 20, (select coalesce(jsonb_agg(jsonb_build_object('name',viewname,'def',definition)),'[]'::jsonb) from pg_views where schemaname='public')
    union all select 'grants', 400, (select coalesce(jsonb_agg(jsonb_build_object('t',table_name,'grantee',grantee,'priv',privilege_type)),'[]'::jsonb) from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated'))
    union all select 'functions', 5, (select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'def',pg_get_functiondef(p.oid))),'[]'::jsonb) from pg_proc p join pg_namespace n2 on n2.oid=p.pronamespace where n2.nspname='public' and p.prokind='f')
    union all select 'columns', 250, (select coalesce(jsonb_agg(jsonb_build_object('t',c.relname,'c',a.attname,'pos',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated)),'[]'::jsonb) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n2 on n2.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n2.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped)
  loop
    len := jsonb_array_length(r.body); g := 0;
    loop
      select coalesce(jsonb_agg(e order by o), '[]'::jsonb) into j from jsonb_array_elements(r.body) with ordinality x(e, o) where o > g*r.slice and o <= (g+1)*r.slice;
      perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__ddl.'||r.kind,'p_chunk',g,'p_rows',j), headers := hdr, timeout_milliseconds := 60000);
      g := g + 1;
      exit when g*r.slice >= len;
    end loop;
    perform net.http_post(url := url, body := jsonb_build_object('p_token',tok,'p_source',src,'p_table','__ddlcount.'||r.kind,'p_chunk',0,'p_rows',jsonb_build_array(jsonb_build_object('n',len,'chunks',g))), headers := hdr, timeout_milliseconds := 60000);
  end loop;
end $$;
