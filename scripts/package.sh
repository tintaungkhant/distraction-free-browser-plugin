#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

rm -rf dist
bun run build
mkdir -p releases

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ZIP="releases/distraction-free-browser-${TIMESTAMP}.zip"

zip -rq "$ZIP" \
  manifest.json \
  icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/icon-128.png \
  icons/note-16.png icons/note-32.png icons/note-48.png icons/note-128.png \
  popup/popup.html popup/popup.css \
  options/options.html options/options.css \
  notes/notes.html notes/notes.css \
  styles \
  dist \
  -x "*.DS_Store"

echo "Built: $ZIP"
ls -la releases/
