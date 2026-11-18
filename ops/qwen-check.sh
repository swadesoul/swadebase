#!/bin/bash
# Checks QWENCLOUD_API_KEY in functions.env against qwen-flash (intl). Never prints the key.
umask 077
H=$(mktemp); trap 'rm -f "$H"' EXIT
printf 'Authorization: Bearer %s\n' "$(grep '^QWENCLOUD_API_KEY=' /opt/swadebase/docker/functions.env | cut -d= -f2- | tr -d '"\r')" > "$H"
curl -s -m 40 https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions -H @"$H" -H "Content-Type: application/json" \
  -d '{"model":"qwen-flash","max_tokens":10,"messages":[{"role":"user","content":"Say: Qwen OK."}]}' \
 | python3 -c 'import json,sys;d=json.load(sys.stdin);print("OK:",d["choices"][0]["message"]["content"],d.get("usage")) if "choices" in d else print("ERR:",str(d.get("error",d))[:160])'
