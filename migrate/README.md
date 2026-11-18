# SWADE migration kit and app routing (written 2026-10-04)

Locked-in rule: no hosted Supabase. Every site lives on SWADEBASE inside Hostinger, and a site never
leaves Lovable without its data. This folder is the tool that enforces that.

## How SWADEBASE is laid out

- One Postgres, one login system (auth.users), one storage service - shared by every site.
- **Each site owns one schema** named after it (`resinglab`, `seedleaker`, `tokencsi`, ...).
  `public` belongs to SSS Brain / the control plane. Sites were written as if they owned `public`,
  so their tables collide there (`profiles`, `projects`, `user_roles`). Never load a site into `public`.
- **Routing** (file: `/etc/nginx/conf.d/swade-app-schemas.conf`): nginx looks at the browser `Origin`
  and pins that site's REST calls to its schema. No site code change is needed.
- **Edge functions** (file: `/opt/swadebase/docker/volumes/functions/main/app-routes.json`): the functions
  router gives each app's functions an internal gateway (ports 18101+) that pins REST calls to the app schema.
- PostgREST must list every app schema: `PGRST_DB_SCHEMAS` in `/opt/swadebase/docker/.env`,
  then `cd /opt/swadebase/docker && docker compose up -d rest` (never restart it while a push is running).

## Moving one Lovable project (the gate)

1. `kit.sh open` - opens the intake door, prints a one-time token.
2. On the Lovable database run (two statements, via the Lovable query tool):
   - `select net.http_get('https://swadebase.cloud/migrate/push.sql') id;`
   - `do $o$ declare s text; begin select content into s from net._http_response where id = <id>;
      execute replace(replace(replace(s,'__TOKEN__','<token>'),'__APP__','<app>'),'__ONLY__',''); end $o$;`
   `__ONLY__` = '' sends everything, 'ddl' the schema description only, 'a.b,c.d' re-sends those tables.
3. `status_all.sh` - an app is READY only when every chunk arrived, every table's hash matches the
   source, and the schema description is complete. Re-send whatever it lists. Run `assemble.sql` first
   if large rows were sent in slices.
4. Files: `kit.sh tmpuser <app> <source url> <source anon key>`, confirm that user and add a temporary
   read policy for it on the source, `kit.sh fetch <app>`, then remove the policy and the user.
5. `kit_build.py <app>` - builds the schema, brings over users (matched by email, existing accounts
   reused, ids remapped), loads data, adds keys, security rules, triggers, grants.
6. `kit.sh upload <app>` - files into SWADEBASE storage.
7. `kit.sh verify <app>` - live rows vs source rows, users, files. Must show "all tables complete".
8. `kit_route.py <app> <lovable project id> <domain,domain> [function names]` - turns routing on.
9. `kit.sh close` when the session is finished.

The Lovable project is never modified except: the `pg_net` extension is enabled where missing, and a
throwaway reader account + read policy exist only while files are copied.

## Known limits (open work)

- Function names are global on the shared functions volume. Two apps with a function of the same name
  (`stripe-webhook`, `create-checkout`) overwrite each other. Needs per-app prefixes before more apps deploy functions.
- Storage buckets are global. Apps that reuse a bucket name share it.
- Native/mobile builds send no web Origin; they need `db: { schema: '<app>' }` in the Supabase client.
- Realtime subscriptions still name `public` in app code.
- Storage files sit on the VPS disk (nightly copy to Backblaze). Moving the storage backend to B2 is a separate step.

## Adapters

Standing rule (2026-10-28): anything from GitHub or built outside is wrapped as a SWADEBASE adapter
(own schema, routed under `/adapters/<name>/` through nginx, keys only on SWADEBASE, documented contract,
license recorded, pinned versions, per-site access, README). It builds on the approved
`/opt/swadebase/docs/SWADE_ADAPTER_CONTRACT_V1.md`.

- Rule and checklist: [`ADAPTER_RULE.md`](ADAPTER_RULE.md)
- `splat` adapter (photos -> walkable Gaussian splat scene), design only:
  [`adapters/gaussian-splat/DESIGN.md`](adapters/gaussian-splat/DESIGN.md)

## Backups

`/opt/swadebase/backups/nightly-backup.sh` runs 08:17 UTC: full database dump + storage, kept 14 days
locally and copied to Backblaze under `swadesoul/swadebase/backups/`.
