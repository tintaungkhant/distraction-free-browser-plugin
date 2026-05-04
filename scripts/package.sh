#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

rm -rf dist releases
bun run build
mkdir -p releases

ZIP="releases/distraction-free-browser.zip"

zip -rq "$ZIP" \
  manifest.json \
  icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/icon-128.png \
  popup/popup.html popup/popup.css \
  styles \
  dist \
  -x "*.DS_Store"

echo "Built: $ZIP"
ls -la releases/
