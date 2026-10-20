#!/bin/bash
# Cutline one-click installer for macOS.
# Double-click this file. It finds the Cutline folder, installs everything,
# adds the menu to DaVinci Resolve, and starts the background watcher.
set -u

cd "$(dirname "$0")" || exit 1

BOLD="$(printf '\033[1m')"
DIM="$(printf '\033[2m')"
RED="$(printf '\033[31m')"
RESET="$(printf '\033[0m')"

say() { printf "\n%s%s%s\n" "$BOLD" "$*" "$RESET"; }
warn() { printf "%s%s%s\n" "$RED" "$*" "$RESET"; }
plain() { printf "%s\n" "$*"; }

DRY="${CUTLINE_INSTALLER_DRY_RUN:-0}"
run() {
  if [ "$DRY" = "1" ]; then
    plain "[dry-run] $*"
    return 0
  fi
  "$@"
}

finish() {
  plain ""
  if [ -t 0 ]; then
    printf "%s" "Press Return to close this window. "
    read -r _
  fi
  exit "${1:-0}"
}

printf "\n%s\n" "----------------------------------------------"
printf "%s\n" "  CUTLINE - one-click installer"
printf "%s\n\n" "----------------------------------------------"

# --- 1. Find the Cutline folder -------------------------------------------
ROOT=""
if [ -f "./install.sh" ] && [ -d "./cutline" ]; then
  ROOT="$PWD"
else
  for candidate in "$HOME/cutline" "$HOME/Cutline" "$HOME/Downloads/cutline" "$HOME"/videoeditor-*; do
    if [ -f "$candidate/install.sh" ] && [ -d "$candidate/cutline" ]; then
      ROOT="$candidate"
      break
    fi
  done
fi

if [ -z "$ROOT" ]; then
  for candidate in "$HOME/Downloads"/videoeditor-*; do
    if [ -f "$candidate/install.sh" ] && [ -d "$candidate/cutline" ]; then
      warn "I found Cutline in Downloads, but it needs to live in your home folder."
      plain ""
      plain "In Finder: drag that folder into the Home folder, rename it to cutline,"
      plain "then double-click this installer again."
      finish 1
    fi
  done
  warn "I could not find the Cutline folder."
  plain ""
  plain "Expected it here: $HOME/cutline"
  plain "Move the unzipped Cutline folder into your home folder, rename it to cutline,"
  plain "and double-click this installer again."
  finish 1
fi

cd "$ROOT" || finish 1
say "Using Cutline at $ROOT"

# --- 2. Find a usable Python ---------------------------------------------
PYTHON=""
for candidate in python3.12 python3.11 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
      PYTHON="$candidate"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  warn "Cutline needs Python 3.10 or newer, and I could not find it."
  plain ""
  plain "I will open the Python download page. Install Python 3.12, then"
  plain "double-click this installer again."
  [ "$DRY" = "1" ] || open "https://www.python.org/downloads/macos/"
  finish 1
fi

say "Python $("$PYTHON" -c 'import platform; print(platform.python_version())' 2>/dev/null)"
plain "If this says 3.13 or newer, the install may not find all packages; 3.12 is safest."

# --- 3. Environment -------------------------------------------------------
if [ ! -d .venv ]; then
  say "Creating the local environment (one time only)…"
  if ! run "$PYTHON" -m venv .venv; then
    warn "Could not create the environment. Delete the .venv folder and try again."
    finish 1
  fi
fi

if [ "$DRY" != "1" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi
PYBIN=".venv/bin/python"

say "Installing the engine. This takes a few minutes - leave this window open."
plain "(You will see a lot of package lines. That is normal.)"

grep -v '^[[:space:]]*faster-whisper' requirements.txt > .venv/requirements-core.txt
run "$PYBIN" -m pip install --upgrade pip wheel > /dev/null 2>&1 || true

if ! run "$PYBIN" -m pip install -r .venv/requirements-core.txt; then
  warn ""
  warn "The core install failed."
  plain ""
  plain "This is usually a Python version without prebuilt packages."
  plain "Fix: install Python 3.12 from python.org, delete the .venv folder inside:"
  plain "  $ROOT"
  plain "then double-click this installer again."
  finish 1
fi

say "Adding speech-to-text (optional)…"
if ! run "$PYBIN" -m pip install --only-binary=:all: 'faster-whisper>=1.0'; then
  warn "No prebuilt speech engine for this Python - skipping it."
  plain "Captions will work from an .srt file; everything else is unaffected."
fi

# --- 4. Launcher, Resolve menu, watcher ----------------------------------
mkdir -p bin
cat > bin/cutline <<EOF
#!/usr/bin/env bash
cd "$ROOT"
source "$ROOT/.venv/bin/activate"
exec python -m cutline "\$@"
EOF
chmod +x bin/cutline

say "Adding Cutline to DaVinci Resolve's Scripts menu…"
if ! run "$PYBIN" -m cutline resolve-install; then
  warn "Could not write the Resolve scripts folder."
  plain "You can retry later with: cd \"$ROOT\" && ./bin/cutline resolve-install"
fi

if [ "$(uname -s)" = "Darwin" ]; then
  say "Starting the background watcher…"
  run "$PYBIN" -m cutline resolve-agent || true
  # Load it here too, so this works with older copies of Cutline that only
  # printed the launchctl instructions.
  PLIST="$HOME/Library/LaunchAgents/com.cutline.watch.plist"
  if [ -f "$PLIST" ] && [ "$DRY" != "1" ]; then
    launchctl unload "$PLIST" >/dev/null 2>&1 || true
    launchctl load "$PLIST" >/dev/null 2>&1 || launchctl bootstrap "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
  fi
  if ! launchctl list com.cutline.watch >/dev/null 2>&1 && [ "$DRY" != "1" ]; then
    plain "The watcher did not start on its own. Start it when you need it with:"
    plain "  cd \"$ROOT\" && ./bin/cutline resolve-watch"
  fi
fi

DROP="$HOME/Movies/Cutline"
if [ "$DRY" != "1" ]; then
  FOUND_DROP="$("$PYBIN" -c 'from cutline.resolve_bridge import default_root; print(default_root())' 2>/dev/null)"
  [ -n "$FOUND_DROP" ] && DROP="$FOUND_DROP"
fi
mkdir -p "$DROP/inbox"
[ "$DRY" = "1" ] || open "$DROP" 2>/dev/null || true

# --- 5. What next ---------------------------------------------------------
say "Cutline is installed."
plain ""
plain "1. Quit DaVinci Resolve completely (Command-Q) and reopen it."
plain "2. Open Workspace > Scripts > Cutline - check bridge."
plain "   A timeline named 'Cutline: bridge ready' means you are set."
plain "3. Drop clips into the Cutline drop folder that just opened, wait about 20"
plain "   seconds, then use"
plain "   Workspace > Scripts > Cutline - import latest."
plain ""
plain "Settings live in $DROP/config.json."
plain "If you need to rerun any of this later: $ROOT/Install Cutline.command"
finish 0
