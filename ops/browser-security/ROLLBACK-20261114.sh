#!/bin/bash
# Emergency browser-only rollback. Run as root after inspecting live owner sessions.
set -euo pipefail
ACTIVE=swade-browser-desktop
OLD=swade-browser-desktop-before-sandbox-20261114
FAILED=swade-browser-desktop-sandbox-rollback-20261114
docker inspect "$OLD" >/dev/null
docker inspect "$ACTIVE" >/dev/null
if docker inspect "$FAILED" >/dev/null 2>&1; then echo "Rollback target already exists"; exit 1; fi
systemctl stop swade-browser-workspace
systemctl stop swade-browser-desktop
docker rename "$ACTIVE" "$FAILED"
docker rename "$OLD" "$ACTIVE"
systemctl start swade-browser-desktop
systemctl start swade-browser-workspace
for i in $(seq 1 20); do
 if curl --fail --silent --max-time 3 http://127.0.0.1:18865/health >/dev/null &&
    curl --fail --silent --max-time 3 http://127.0.0.1:18868/ >/dev/null; then
   echo "PREVIOUS_BROWSER_RESTORED"; exit 0
 fi
 sleep 1
done
echo "Manual intervention required after attempted rollback" >&2
exit 2
