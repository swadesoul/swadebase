#!/usr/bin/env bash
# Ingest anything dropped into /opt/swadebase/chat-imports/inbox/{chatgpt,claude,bigmamma}/, then refresh docs.
set -euo pipefail
BASE=/opt/swadebase/chat-imports; TOOL=/opt/swadebase/tools/chat-archive
exec 9>/run/chat-archive.lock; flock -n 9 || exit 0
for kind in chatgpt claude bigmamma; do
  mkdir -p "$BASE/inbox/$kind" "$BASE/processed/$kind" "$BASE/failed/$kind"
  for f in "$BASE/inbox/$kind"/*; do
    [ -f "$f" ] || continue
    stamp=$(date +%Y%m%dT%H%M%S)
    if python3 "$TOOL/ingest.py" "$kind" "$f"; then mv "$f" "$BASE/processed/$kind/${stamp}_$(basename "$f")"
    else mv "$f" "$BASE/failed/$kind/${stamp}_$(basename "$f")"; fi
  done
done
python3 "$TOOL/ingest.py" daily /opt/swadebase/docs/daily >/dev/null
python3 "$TOOL/export_md.py" /opt/swadebase/docs/chats >/dev/null
