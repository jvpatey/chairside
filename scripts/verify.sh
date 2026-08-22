#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> API tests"
pnpm --filter @chairside/api test

echo "==> Mobile tests"
pnpm --filter mobile test

echo "==> Mobile lint"
pnpm --filter mobile lint

echo "==> Mobile typecheck"
pnpm --filter mobile typecheck

echo "==> Mobile web export"
pnpm --filter mobile export:web

echo
echo "All verify checks passed."
