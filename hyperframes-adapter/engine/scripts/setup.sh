#!/usr/bin/env bash
# One-step setup for the Hyperframes kit: checks Node >=22, ffmpeg, headless Chrome, installs deps.
set -euo pipefail
cd "$(dirname "$0")/.."
say(){ printf '\033[1;33m[hyperframes-kit]\033[0m %s\n' "$*"; }
SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null && SUDO="sudo"

# Node >= 22
major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$major" -lt 22 ]; then
  say "Node >= 22 required (found: $(node -v 2>/dev/null || echo none))."
  say "Install it, e.g.: nvm install 22 && nvm use 22   (or brew install node@22)"
  exit 1
fi
say "Node $(node -v) OK"

# ffmpeg / ffprobe
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  say "Installing ffmpeg..."
  if command -v apt-get >/dev/null; then $SUDO apt-get update -y && $SUDO apt-get install -y ffmpeg
  elif command -v brew >/dev/null; then brew install ffmpeg
  elif command -v dnf >/dev/null; then $SUDO dnf install -y ffmpeg
  else say "Please install ffmpeg manually."; exit 1; fi
fi
say "ffmpeg OK ($(ffmpeg -version | head -1 | cut -d' ' -f3))"

# npm deps (pinned)
if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Headless Chrome (finds system Chrome or downloads one into the cache)
npx hyperframes browser ensure
say "Chrome: $(npx hyperframes browser path 2>/dev/null | tail -1)"
say "Setup complete. Try: npm run render"
