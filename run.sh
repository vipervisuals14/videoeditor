#!/usr/bin/env bash
# One-shot dev launcher (no install step beyond requirements).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
if [ ! -d .venv ]; then
  echo "Run ./install.sh first."
  exit 1
fi
exec .venv/bin/python -m cutline serve "$@"
