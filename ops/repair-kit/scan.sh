#!/bin/bash
# Repair Kit daily scan (read-only). Looks for the RK catalog problems (docs/learning-approved/repair-kit-known-failures.md)
# and writes docs/learning-approved/repair-kit-scan-latest.md for SSS Brain / CoS / Support Desk. Changes nothing.
set -u
OUT=/opt/swadebase/docs/learning-approved/repair-kit-scan-latest.md
TMP=$(mktemp); NOW=$(date -u +%s)
row(){ echo "| $1 | $2 | $3 |" >> "$TMP"; }
echo "# Repair Kit scan — $(TZ=America/Chicago date '+%Y-%m-%d %H:%M %Z')" > "$TMP"
echo "Read-only daily scan of swadesoul. Catalog: repair-kit-known-failures.md. Queue: repair-kit-fix-queue.md." >> "$TMP"
echo "" >> "$TMP"; echo "| Check | Result | Detail |" >> "$TMP"; echo "|---|---|---|" >> "$TMP"

# RK-009 backups
if [ -f /var/lib/swadebase-backup/last-success ]; then
  AGE=$(( (NOW - $(stat -c %Y /var/lib/swadebase-backup/last-success)) / 3600 ))
  [ $AGE -le 26 ] && row "RK-009 off-server backup" OK "last ${AGE}h ago: $(cut -d' ' -f1,2 /var/lib/swadebase-backup/last-success)" \
                  || row "RK-009 off-server backup" FAIL "last success ${AGE}h ago (run swadebase-backup.service)"
else row "RK-009 off-server backup" FAIL "no successful backup recorded"; fi
if [ -f /var/lib/swadebase-backup/last-restore-test ]; then
  RAGE=$(( (NOW - $(stat -c %Y /var/lib/swadebase-backup/last-restore-test)) / 86400 ))
  V=$(awk '{print $2}' /var/lib/swadebase-backup/last-restore-test)
  { [ "$V" = PASS ] && [ $RAGE -le 35 ]; } && row "RK-009 restore test" OK "PASS ${RAGE}d ago" || row "RK-009 restore test" WARN "$V, ${RAGE}d ago"
else row "RK-009 restore test" WARN "never run"; fi

# RK-004 memory pressure and stuck builds
SW=$(free | awk '/Swap/ {if ($2>0) printf "%d", $3*100/$2; else print 0}')
[ "$SW" -lt 80 ] && row "RK-004 swap" OK "${SW}%" || row "RK-004 swap" WARN "${SW}% used"
STUCK=$(ps -eo etimes,args --no-headers | awk '$1>3600' | grep -E "tsc|vite build|next build|npm run build|bun run build|typecheck" | grep -v grep | wc -l)
[ "$STUCK" -eq 0 ] && row "RK-004 stuck builds" OK "none over 60 min" || row "RK-004 stuck builds" WARN "$STUCK build process(es) older than 60 min"

# Disk
DU=$(df / | awk 'NR==2 {gsub("%","",$5); print $5}')
[ "$DU" -lt 80 ] && row "Disk /" OK "${DU}% used" || row "Disk /" WARN "${DU}% used"

# Certificates
SOON=$(for c in /etc/letsencrypt/live/*/cert.pem; do e=$(date -d "$(openssl x509 -enddate -noout -in $c | cut -d= -f2)" +%s); d=$(( (e-NOW)/86400 )); [ $d -lt 21 ] && echo "$(basename $(dirname $c)):${d}d"; done 2>/dev/null | tr '\n' ' ')
[ -z "$SOON" ] && row "Certificates" OK "none expire within 21 days" || row "Certificates" WARN "$SOON"

# RK-003 413s and 5xx (current access log)
L=/var/log/nginx/access.log
N413=$(awk '$9==413' $L | wc -l); N5=$(awk '$9>=500' $L | wc -l)
[ "$N413" -eq 0 ] && row "RK-003 upload 413s" OK "0 today" || row "RK-003 upload 413s" WARN "$N413 today: $(awk '$9==413 {print $7}' $L | cut -d? -f1 | sort | uniq -c | sort -rn | head -3 | tr -s ' ' | tr '\n' ';')"
[ "$N5" -lt 20 ] && row "Server errors (5xx)" OK "$N5 today" || row "Server errors (5xx)" WARN "$N5 today: $(awk '$9>=500 {print $9, $7}' $L | cut -d? -f1 | sort | uniq -c | sort -rn | head -3 | tr -s ' ' | tr '\n' ';')"

# RK-011 outage page coverage (redirect-only blocks are skipped)
MISS=""; for f in /etc/nginx/sites-enabled/*; do p=$(readlink -f "$f"); grep -q proxy_pass "$p" && ! grep -q swosting-outage.conf "$p" && MISS="$MISS $(basename $f)"; done
[ -z "$MISS" ] && row "RK-011 outage page" OK "all proxied sites covered" || row "RK-011 outage page" WARN "missing:$MISS"

# RK-012 ports bound to all interfaces (Hostinger firewall is the outer wall)
OPEN=$(ss -ltnH | awk '{print $4}' | grep -E "^(0\.0\.0\.0|\*|\[::\]):" | sed 's/.*://' | sort -un | grep -v -E "^(22|25|80|443|465|587|993|2022|7881|5349)$" | tr '\n' ' ')
row "RK-012 ports on all interfaces" INFO "${OPEN:-none} (Hostinger firewall passes only 22,80,443,mail,2022,7881,5349,8005-8796,8798-8995)"

# Shield
CS=$(systemctl is-active crowdsec); A=$(cscli alerts list -o raw --since 24h 2>/dev/null | tail -n +2 | wc -l); B=$(cscli bouncers list -o raw 2>/dev/null | tail -n +2 | wc -l)
row "Shield (CrowdSec)" "$( [ "$CS" = active ] && echo OK || echo FAIL )" "engine $CS, $A alerts in 24h, $B blocking bouncer(s)"

# Key sites and swadebase-2
for d in swadebase.cloud sssbrain.live blacktales.online oathloom.com abagale.live yourown.delivery; do
  c=$(curl -s -o /dev/null -m 10 -w '%{http_code}' https://$d/); case $c in 2*|3*) r=OK;; *) r=FAIL;; esac; row "Site $d" $r "HTTP $c"; done
H=$(curl -s -o /dev/null -m 10 -w '%{http_code}' https://sssbrain.live/api/health)
row "swadebase-2 (SSS Brain health)" "$( [ "$H" = 200 ] && echo OK || echo FAIL )" "HTTP $H"

# RK-007 builder badge on our nginx-served domains
BADGE=""; for d in $(grep -Rh "server_name" /etc/nginx/sites-enabled/ | sed 's/server_name//;s/;//' | tr ' ' '\n' | grep -E '\.' | grep -v -E '^\*|sslip|^www\.' | sort -u | head -40); do
  curl -s -m 6 "https://$d/" 2>/dev/null | grep -q -i -E "lovable-badge|edit with lovable|lovable\.dev/badge" && BADGE="$BADGE $d"; done
[ -z "$BADGE" ] && row "RK-007 builder badge" OK "none on nginx-served domains" || row "RK-007 builder badge" WARN "found on:$BADGE"

echo "" >> "$TMP"; echo "FAIL = act now (Support Desk T1/T2 or escalate). WARN = review in CoS brief. Fixes follow the catalog and rules 17, 19, 20." >> "$TMP"
mv "$TMP" "$OUT"; chmod 644 "$OUT"
echo "fails: $(grep -c '| FAIL |' "$OUT") warns: $(grep -c '| WARN |' "$OUT")"
