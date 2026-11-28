# SWADE Universal Promo — go-live and rollback

Mode lives in `swadebase_ops.adapters_registry.connections.promoMode` for `swade-universal-promo`. Missing or any value other than `offers` is treated as `sponsor`. The adapters process caches this for five seconds, so a mode change does **not** need a service restart.

Do not flip the mode until the founder says “promote.”

## Go live (after “promote”)

```bash
docker exec supabase-db psql -U postgres -c "update swadebase_ops.adapters_registry set connections = connections || jsonb_build_object('promoMode','offers'), updated_at = now() where id = 'swade-universal-promo' and enabled is true and status = 'live';"
```

Wait at least 5 seconds, then confirm:

```bash
curl -s 'https://swadebase.cloud/adapters/promo/config.json?site=resinglab' | python3 -c 'import sys,json; d=json.load(sys.stdin)["data"]; print(d.get("mode"), d.get("primaryUrl"))'
```

That should print `offers` and the ReSing Pro Stripe URL. Repeat for `maestroradio`, `videosaywhat`, and `blacktales`. `abagale` and `theleaguesound` must stay unbuyable (`offer.enabled` false, no live buy URL).

## Rollback (back to the current sponsor boxes)

```bash
docker exec supabase-db psql -U postgres -c "update swadebase_ops.adapters_registry set connections = connections || jsonb_build_object('promoMode','sponsor'), updated_at = now() where id = 'swade-universal-promo';"
```

Wait at least 5 seconds, then confirm `config.json?site=resinglab` has no `mode` field and `primaryLabel` is `Explore campaign options`.

## File rollback (if a code deploy needs to be undone)

Restore from the dated backup under `/opt/swadebase/backups/universal-promo-<timestamp>/`, then `systemctl restart swadebase-adapters`.
