#!/bin/bash
set -euo pipefail
OLD=swade-browser-desktop
BACKUP=swade-browser-desktop-before-sandbox-20261114
CANDIDATE=swade-browser-desktop-sandbox-candidate-20261114
FAILED=swade-browser-desktop-failed-sandbox-20261114
IMAGE=swade-secure-browser:ubuntu-sandbox-20261114
POLICY=/opt/swadebase/ops/browser-security/playwright-seccomp_profile.json
CONFIG=/var/lib/swade-browser/desktop
BRIDGE_SECRET=/opt/swade-secrets/browser-bridge.key
ARCHIVE=/opt/swadebase/backups/swade-secure-browser-20261114/desktop-20261114.tar.gpg
BACKUP_KEY=/opt/swade-secrets/swade-secure-browser-backup-20261114.key
test -s "$ARCHIVE" && test -s "$BACKUP_KEY" && test -s "$POLICY"
grep -q 'chatgpt-secure-browser-cutover-20261113' /opt/swadebase/docs/DEPLOY_LOCK.md
docker inspect "$OLD" >/dev/null
! docker inspect "$BACKUP" >/dev/null 2>&1
! docker inspect "$CANDIDATE" >/dev/null 2>&1
! docker inspect "$FAILED" >/dev/null 2>&1
test -d "$CONFIG"
CUTOVER=0
rollback() {
  local original_exit=$?
  trap - ERR
  echo "CANDIDATE_FAILED_ROLLBACK_START"
  set +e
  if [ "$CUTOVER" -eq 1 ]; then
    systemctl stop swade-browser-workspace
    systemctl stop swade-browser-desktop
    docker inspect "$OLD" >/dev/null 2>&1 && docker rename "$OLD" "$FAILED"
    docker rename "$BACKUP" "$OLD"
    systemctl start swade-browser-desktop
    systemctl start swade-browser-workspace
  fi
  echo "ROLLBACK_COMPLETE_WITH_EXIT=$original_exit"
  exit "${original_exit:-1}"
}
trap rollback ERR
echo "CREATING_SANDBOXED_CANDIDATE"
docker create --name "$CANDIDATE" \
  --network swade-browser-private --memory 4g --cpus 2 --shm-size 1g --pids-limit 512 \
  --security-opt no-new-privileges:true --security-opt "seccomp=$POLICY" \
  --cap-drop NET_RAW \
  -p 127.0.0.1:18866:18866 -p 127.0.0.1:18867:9223 -p 127.0.0.1:18868:3000 \
  -v "$CONFIG:/config" -v "$BRIDGE_SECRET:/run/secrets/browser_bridge:ro" \
  -e PUID=992 -e PGID=982 -e TZ=America/Chicago \
  -e TITLE='SWADE Secure Browser' \
  -e SELKIES_ENABLE_SHARING=false -e SELKIES_FILE_TRANSFERS= \
  -e SELKIES_CLIPBOARD_ENABLED=false -e SELKIES_FRAMERATE=8-24 \
  -e SELKIES_MANUAL_RESOLUTION=true -e SELKIES_MANUAL_WIDTH=1280 \
  -e SELKIES_MANUAL_HEIGHT=900 -e SELKIES_ENABLE_RESIZE=false \
  -e SELKIES_USE_CSS_SCALING=true "$IMAGE" >/dev/null
echo "SWITCHING_BROWSER_CONTAINER"
systemctl stop swade-browser-desktop
docker rename "$OLD" "$BACKUP"
CUTOVER=1
docker rename "$CANDIDATE" "$OLD"
systemctl start swade-browser-desktop
for i in $(seq 1 20); do
  if curl --fail --silent --max-time 2 http://127.0.0.1:18868/ >/dev/null && \
     curl --fail --silent --max-time 2 -H "Authorization: Bearer $(cat "$BRIDGE_SECRET")" http://127.0.0.1:18866/status >/dev/null; then
    echo "WEBTOP_AND_BRIDGE_READY"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "WEBTOP_OR_BRIDGE_UNHEALTHY"
    false
  fi
  sleep 1
done
systemctl restart swade-browser-workspace
for i in $(seq 1 20); do
  if curl --fail --silent --max-time 3 http://127.0.0.1:18865/health >/dev/null; then
    echo "CONTROLLER_READY"
    break
  fi
  if [ "$i" -eq 20 ]; then echo "CONTROLLER_NOT_READY"; false; fi
  sleep 1
done
if [ "$(curl -ksS -o /dev/null -w '%{http_code}' https://browser.swadebase.cloud/)" != '401' ]; then
  echo "ANONYMOUS_DESKTOP_ACCESS_NOT_DENIED"; false
fi
SMOKE_PROFILE=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
if [ -d "$CONFIG/profiles/$SMOKE_PROFILE" ]; then echo "SYNTHETIC_PROFILE_CONFLICT"; false; fi
docker exec "$OLD" sh -c 'key=$(cat /run/secrets/browser_bridge); curl -fsS --max-time 8 -X POST -H "Authorization: Bearer $key" -H "Content-Type: application/json" --data "{\"profile\":\"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",\"url\":\"https://example.com\"}" http://127.0.0.1:18866/open >/dev/null'
sleep 2
SMOKE_OUTPUT=$(timeout 20 docker run --rm --network "container:$OLD" --user pwuser --cap-drop NET_RAW --security-opt no-new-privileges:true --memory 512m --pids-limit 70 -v /opt/swadebase-staging/secure-browser-20261114/graphical-sandbox-status.mjs:/tmp/graphical-sandbox-status.mjs:ro --entrypoint node mcr.microsoft.com/playwright:v1.64.1-noble /tmp/graphical-sandbox-status.mjs)
printf '%s\n' "$SMOKE_OUTPUT" | grep -q 'GRAPHICAL_PAGE_RENDER_PASS'
printf '%s\n' "$SMOKE_OUTPUT" | grep -q 'You are adequately sandboxed.'
echo "LIVE_GRAPHICAL_RENDER_AND_CHROMIUM_SANDBOX_VERIFIED"
docker exec "$OLD" sh -c 'key=$(cat /run/secrets/browser_bridge); curl -fsS --max-time 8 -X POST -H "Authorization: Bearer $key" -H "Content-Type: application/json" --data "{}" http://127.0.0.1:18866/stop >/dev/null'
if [ -d "$CONFIG/profiles/$SMOKE_PROFILE" ]; then rm -rf -- "$CONFIG/profiles/$SMOKE_PROFILE"; fi
echo "SWITCH_COMPLETE_SECURE_BROWSER_LIVE"
trap - ERR
