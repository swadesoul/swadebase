#!/bin/bash
# SWADEBASE restore test (RK-009). Pulls the newest Backblaze backup, decrypts it, restores it into a throwaway
# container of the same Postgres image, compares table counts and key row counts with live, then removes everything.
# Never touches the live database. Writes /var/lib/swadebase-backup/last-restore-test.
set -euo pipefail
umask 077
STATE=/var/lib/swadebase-backup; PASS=/opt/swade-secrets/backup-passphrase
WORK=$(mktemp -d /var/backups/swadebase-restoretest.XXXX); NAME=swadebase-restore-test
log(){ echo "$(date -u +%FT%TZ) $*"; }
cleanup(){ docker rm -f $NAME >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
set -a; . /opt/swade-secrets/b2.env; set +a
export RCLONE_CONFIG_SWB2_TYPE=b2 RCLONE_CONFIG_SWB2_ACCOUNT="$B2_KEY_ID" RCLONE_CONFIG_SWB2_KEY="$B2_APP_KEY"
DEST="swb2:$B2_BUCKET_NAME/swadesoul/backups/swadebase/daily"
LATEST=$(rclone lsf "$DEST" --dirs-only | sort | tail -1)
log "testing backup $LATEST"
rclone copy "$DEST/$LATEST" "$WORK" --include "db-all.sql.zst.gpg" --include SHA256SUMS
( cd "$WORK" && grep db-all SHA256SUMS | sha256sum -c - )
IMG=$(docker inspect -f '{{.Config.Image}}' supabase-db)
docker run -d --name $NAME --memory 2g -e POSTGRES_PASSWORD=restoretest -e POSTGRES_HOST_AUTH_METHOD=trust "$IMG" >/dev/null
for i in $(seq 1 60); do docker exec $NAME pg_isready -U postgres >/dev/null 2>&1 && break; sleep 2; done
sleep 5
# The image pre-creates an older auth schema; drop it IN THE THROWAWAY CONTAINER so the dump recreates it exactly.
docker exec $NAME psql -U supabase_admin -d postgres -qc "DROP SCHEMA IF EXISTS auth CASCADE;" >/dev/null 2>&1 || true
gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$PASS" -d "$WORK/db-all.sql.zst.gpg" | zstd -dq \
  | docker exec -i $NAME psql -U supabase_admin -d postgres -q -v ON_ERROR_STOP=0 >"$WORK/restore.log" 2>&1 || true
Q="select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema')"
LIVE_T=$(docker exec supabase-db psql -U supabase_admin -d postgres -tAc "$Q")
REST_T=$(docker exec $NAME psql -U supabase_admin -d postgres -tAc "$Q")
U="select count(*) from auth.users"
LIVE_U=$(docker exec supabase-db psql -U supabase_admin -d postgres -tAc "$U")
REST_U=$(docker exec $NAME psql -U supabase_admin -d postgres -tAc "$U" 2>/dev/null || echo ERR)
S="select count(*) from sssbrain.ecosystem_sites"
LIVE_S=$(docker exec supabase-db psql -U supabase_admin -d postgres -tAc "$S" 2>/dev/null || echo NA)
REST_S=$(docker exec $NAME psql -U supabase_admin -d postgres -tAc "$S" 2>/dev/null || echo ERR)
ERRS=$(grep -c "ERROR" "$WORK/restore.log" || true)
RESULT="backup=$LATEST tables live=$LIVE_T restored=$REST_T | auth.users live=$LIVE_U restored=$REST_U | ecosystem_sites live=$LIVE_S restored=$REST_S | restore_errors=$ERRS"
log "$RESULT"
if [ "$REST_U" = "$LIVE_U" ] && [ "$REST_T" -ge $((LIVE_T*95/100)) ]; then V=PASS; else V=FAIL; fi
echo "$(date -u +%FT%TZ) $V $RESULT" > "$STATE/last-restore-test"
log "verdict: $V"
grep "ERROR" "$WORK/restore.log" | sort | uniq -c | sort -rn | head -8 || true
[ "$V" = PASS ]
