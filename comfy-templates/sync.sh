#!/bin/bash
# Swade Comfy template sync: pull official templates at the latest Comfy-Org commit, convert with convert.py against
# Comfy Cloud's live node list, and upsert into swade_media.comfy_templates. Safe to rerun; prints what changed.
set -euo pipefail
cd /opt/swadebase/comfy-templates
REPO=Comfy-Org/workflow_templates
SHA=$(curl -s -m 30 "https://api.github.com/repos/$REPO/commits/main" | python3 -c "import sys,json;print(json.load(sys.stdin)['sha'])")
K=$(grep -E '^COMFYUI_API_KEY=' /opt/swadebase/docker/functions.env | cut -d= -f2- | tr -d "\"'\r")
curl -s -m 60 -H "X-API-Key: $K" https://cloud.comfy.org/api/object_info -o object_info.json
unset K
mkdir -p upstream built
for m in manifests/*.json; do
  slug=$(python3 -c "import json;print(json.load(open('$m'))['slug'])")
  src=$(python3 -c "import json;print(json.load(open('$m'))['source'])")
  curl -s -m 60 -f -o "upstream/$(basename "$src")" "https://raw.githubusercontent.com/$REPO/$SHA/$src"
  python3 convert.py "upstream/$(basename "$src")" object_info.json "$m" > "built/$slug.json"
  python3 - "$m" "built/$slug.json" "$SHA" > "built/$slug.sql" <<'EOF'
import json, sys
m = json.load(open(sys.argv[1])); b = json.load(open(sys.argv[2])); sha = sys.argv[3]
q = lambda s: "'" + str(s).replace("'", "''") + "'"
fam = m['slug'].rsplit('_', 1)[0]
print(f"""insert into swade_media.comfy_templates (slug, family, source_path, source_sha, workflow, bindings, defaults, output_kind, has_audio, synced_at)
values ({q(m['slug'])}, {q(fam)}, {q(m['source'])}, {q(sha)}, {q(json.dumps(b['workflow']))}::jsonb, {q(json.dumps(b['bindings']))}::jsonb,
  {q(json.dumps(b['defaults']))}::jsonb, {q(m.get('kind','video'))}, {str(bool(m.get('has_audio'))).lower()}, now())
on conflict (slug) do update set family = excluded.family, source_path = excluded.source_path, source_sha = excluded.source_sha,
  workflow = excluded.workflow, bindings = excluded.bindings, defaults = excluded.defaults, output_kind = excluded.output_kind,
  has_audio = excluded.has_audio, synced_at = now();""")
EOF
  docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "built/$slug.sql"
  echo "synced $slug @ ${SHA:0:7} ($(python3 -c "import json;print(len(json.load(open('built/$slug.json'))['workflow']))") nodes)"
done
