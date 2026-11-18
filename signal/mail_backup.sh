#!/bin/bash
# Nightly Mailcow backup -> Backblaze (swadebase/mail-backups/), 14 days kept in Backblaze, only the newest kept on the server.
set -euo pipefail
export MAILCOW_BACKUP_LOCATION=/opt/mail-backups
mkdir -p "$MAILCOW_BACKUP_LOCATION"
cd /opt/mailcow-dockerized
THREADS=2 ./helper-scripts/backup_and_restore.sh backup all --delete-days 1 >/dev/null
LATEST=$(ls -1dt "$MAILCOW_BACKUP_LOCATION"/mailcow-* | head -1)
ARCHIVE="/opt/mail-backups/$(basename "$LATEST").tar"
tar -cf "$ARCHIVE" -C "$MAILCOW_BACKUP_LOCATION" "$(basename "$LATEST")"
python3 - "$ARCHIVE" <<'EOF'
import re, sys, os, datetime, boto3
F = open('/opt/swadebase/docker/functions.env').read()
e = {k: v.strip().strip('"') for k, v in re.findall(r'^(BACKBLAZE_[A-Z_]+)=(.*)$', F, re.M)}
s3 = boto3.client('s3', endpoint_url=f"https://s3.{e['BACKBLAZE_REGION']}.backblazeb2.com", region_name=e['BACKBLAZE_REGION'],
                  aws_access_key_id=e['BACKBLAZE_KEY_ID'], aws_secret_access_key=e['BACKBLAZE_APPLICATION_KEY'])
b, path = e['BACKBLAZE_BUCKET_NAME'], sys.argv[1]
key = 'swadebase/mail-backups/' + os.path.basename(path)
s3.upload_file(path, b, key)
cut = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=14)
for o in s3.list_objects_v2(Bucket=b, Prefix='swadebase/mail-backups/').get('Contents', []):
    if o['LastModified'] < cut: s3.delete_object(Bucket=b, Key=o['Key'])
print('uploaded', key, os.path.getsize(path) // 1024, 'KB')
EOF
rm -f "$ARCHIVE"
