#!/usr/bin/env bash
# Cutline installer — macOS and Linux.
# Creates a local Python environment, installs the engine, and adds a launcher.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

BOLD="\033[1m"; DIM="\033[2m"; LIME="\033[38;5;154m"; RED="\033[31m"; RESET="\033[0m"
say() { printf "${BOLD}Cutline${RESET} %s\n" "$1"; }
warn() { printf "${RED}%s${RESET}\n" "$1"; }

PYTHON=""
for candidate in python3.12 python3.11 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
      PYTHON="$candidate"; break
    fi
  fi
done
if [ -z "$PYTHON" ]; then
  warn "Cutline needs Python 3.10 or newer. Install it from python.org and run this again."
  exit 1
fi
say "using $($PYTHON --version)"

if [ ! -d ".venv" ]; then
  say "creating the local environment…"
  "$PYTHON" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

say "installing the engine (this takes a minute)…"
python -m pip install --quiet --upgrade pip wheel
python -m pip install --quiet -r requirements.txt

if [ "${CUTLINE_SKIP_ASR:-0}" != "1" ]; then
  say "installing local speech-to-text (optional but recommended)…"
  if ! python -m pip install --quiet 'faster-whisper>=1.0'; then
    warn "faster-whisper could not be installed on this machine. Captions will accept SRT/VTT files."
  fi
fi

say "checking the install…"
python -m cutline doctor || true

# Launcher: a single command plus a double-clickable app for macOS.
mkdir -p bin
cat > bin/cutline <<EOF
#!/usr/bin/env bash
cd "$HERE"
source "$HERE/.venv/bin/activate"
exec python -m cutline "\$@"
EOF
chmod +x bin/cutline

if [ "$(uname -s)" = "Darwin" ]; then
  cat > "$HERE/Cutline.command" <<EOF
#!/usr/bin/env bash
cd "$HERE"
source "$HERE/.venv/bin/activate"
python -m cutline serve
EOF
  chmod +x "$HERE/Cutline.command"
  say "double-click Cutline.command to start the studio"
fi

say "${LIME}done.${RESET} Start with: ${BOLD}./bin/cutline serve${RESET}"
printf "${DIM}The first caption run downloads a small speech model; everything stays on this machine.${RESET}\n"
