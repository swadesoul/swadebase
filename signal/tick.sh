#!/bin/bash
# Runs the Artist Signal watcher once (now-playing check, advance alerts, push dispatch).
S=$(grep -h '^CRON_SECRET=' /opt/swadebase/docker/functions.env | head -1 | cut -d= -f2- | tr -d '"')
A=$(grep -h '^ANON_KEY=' /opt/swadebase/docker/.env | cut -d= -f2-)
curl -s -m 55 -X POST "http://127.0.0.1:18000/functions/v1/artist-signal?action=tick" -H "apikey: $A" -H "Authorization: Bearer $A" -H "x-cron-secret: $S"
echo
# AI DJ studio: mark aired breaks, clean up, auto mode (only DJs with a daily limit)
curl -s -m 55 -X POST "http://127.0.0.1:18000/functions/v1/dj-studio?action=tick" -H "apikey: $A" -H "Authorization: Bearer $A" -H "x-cron-secret: $S"
echo
