#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v bun >/dev/null 2>&1; then
  echo "error: bun is required. Install from https://bun.sh" >&2
  exit 1
fi

bun install
bun link

echo "browser skill ready. Verify with: which browser-start"
