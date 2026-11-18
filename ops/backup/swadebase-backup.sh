#!/bin/bash
# SWADEBASE nightly off-server backup (RK-009). Created 2026-10-29 by Claude, approved by Harold.
# Full Postgres dump + key configs -> zstd -> GPG AES256 (passphrase /opt/swade-secrets/backup-passphrase) -> Backblaze B2.
# Keeps 14 daily copies + a monthly copy on the 1st. Writes /var/lib/swadebase-backup/last-success on success.
set -euo pipefail
umask 077
TS=$(date -u +%Y%m%dT%H%M%SZ); DAY=$(date -u +%Y-%m-%d)
WORK=/var/backups/swadebase/$TS
STATE=/var/lib/swadebase-backup
PASS=/opt/swade-secrets/backup-passphrase
mkdir -p "$WORK" "$STATE"
log(){ echo "$(date -u +%FT%TZ) $*"; }
set -a; . /opt/swade-secrets/b2.env; set +a
export RCLONE_CONFIG_SWB2_TYPE=b2 RCLONE_CONFIG_SWB2_ACCOUNT="$B2_KEY_ID" RCLONE_CONFIG_SWB2_KEY="$B2_APP_KEY"
DEST="swb2:$B2_BUCKET_NAME/swadesoul/backups/swadebase"
ENC=(gpg --batch --yes --pinentry-mode loopback --passphrase-file "$PASS" --symmetric --cipher-algo AES256)

log "dumping database"
docker exec supabase-db pg_dumpall -U supabase_admin --no-role-passwords 2>"$WORK/dump.err" \
  | zstd -q -T2 -10 | "${ENC[@]}" -o "$WORK/db-all.sql.zst.gpg"
[ -s "$WORK/dump.err" ] && { log "pg_dumpall stderr:"; cat "$WORK/dump.err"; }
rm -f "$WORK/dump.err"
SZ=$(gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$PASS" -d "$WORK/db-all.sql.zst.gpg" | zstd -dq | wc -c)
[ "$SZ" -gt 1000000 ] || { log "dump too small ($SZ bytes), aborting"; exit 2; }
log "dump ok: $SZ bytes uncompressed"

log "archiving configs"
tar czf - -C / etc/nginx etc/crowdsec etc/letsencrypt opt/swadebase/docs opt/swade-secrets opt/swosting 2>/dev/null \
  | "${ENC[@]}" -o "$WORK/config.tgz.gpg"
( cd "$WORK" && sha256sum * > SHA256SUMS )

log "uploading to Backblaze"
rclone copy "$WORK" "$DEST/daily/$DAY" --transfers 2
rclone check "$WORK" "$DEST/daily/$DAY" --one-way --size-only
if [ "$(date -u +%d)" = "01" ]; then rclone copy "$WORK" "$DEST/monthly/$DAY" --transfers 2; fi
rclone delete "$DEST/daily" --min-age 15d 2>/dev/null || log "retention cleanup skipped (key may lack delete permission)"

echo "$TS $(du -sh "$WORK" | cut -f1) $DEST/daily/$DAY" > "$STATE/last-success"
find /var/backups/swadebase -mindepth 1 -maxdepth 1 -mtime +2 -exec rm -rf {} +
log "done: $(cat "$STATE/last-success")"
