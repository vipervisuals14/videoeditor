#!/bin/bash
# Cutline — Start Fresh.
#
# Removes every trace of a previous Cutline install from this Mac, then installs
# the clean copy that this file came with. Double-click it.
#
# It never touches your footage. The work folder (~/Movies/Cutline) keeps its
# inbox and config; only Cutline's own scratch output is cleared.
set -u

cd "$(dirname "$0")" || exit 1
HERE="$PWD"

BOLD="$(printf '\033[1m')"
DIM="$(printf '\033[2m')"
RED="$(printf '\033[31m')"
GREEN="$(printf '\033[32m')"
RESET="$(printf '\033[0m')"

say() { printf "\n%s%s%s\n" "$BOLD" "$*" "$RESET"; }
warn() { printf "%s%s%s\n" "$RED" "$*" "$RESET"; }
ok() { printf "%s%s%s\n" "$GREEN" "$*" "$RESET"; }
plain() { printf "%s\n" "$*"; }
dim() { printf "%s%s%s\n" "$DIM" "$*" "$RESET"; }

DRY="${CUTLINE_RESET_DRY_RUN:-0}"
run() {
  if [ "$DRY" = "1" ]; then
    dim "[dry-run] $*"
    return 0
  fi
  "$@" 2>/dev/null
}

finish() {
  plain ""
  if [ -t 0 ]; then
    printf "%s" "Press Return to close this window. "
    read -r _
  fi
  exit "${1:-0}"
}

PROGRAM="$HOME/cutline"
WORK="$HOME/Movies/Cutline"
PLIST="$HOME/Library/LaunchAgents/com.cutline.watch.plist"
RESOLVE_SCRIPTS="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility"

printf "\n%s\n" "----------------------------------------------"
printf "%s\n" "  CUTLINE - start fresh"
printf "%s\n\n" "----------------------------------------------"

# --- 1. Never delete the folder we are running from ------------------------
# If this was double-clicked inside ~/cutline, stage a copy in a temp folder and
# re-run from there, so the delete below cannot pull the floor out from under us.
case "$HERE" in
  "$PROGRAM"|"$PROGRAM"/*)
    STAGE="$(mktemp -d 2>/dev/null)/cutline-fresh"
    mkdir -p "$STAGE" || { warn "Could not create a staging folder."; finish 1; }
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --exclude '.venv' --exclude '.git' --exclude '__pycache__' \
        --exclude '.pytest_cache' --exclude 'data' --exclude 'downloads' \
        "$HERE/" "$STAGE/" || { warn "Could not stage a copy."; finish 1; }
    else
      (cd "$HERE" && tar -cf - --exclude '.venv' --exclude '.git' \
        --exclude '__pycache__' --exclude '.pytest_cache' --exclude 'data' \
        --exclude 'downloads' .) | (cd "$STAGE" && tar -xf -) \
        || { warn "Could not stage a copy."; finish 1; }
    fi
    chmod +x "$STAGE/Start Fresh.command" "$STAGE/Install Cutline.command" 2>/dev/null
    exec bash "$STAGE/Start Fresh.command"
    ;;
esac

# --- 2. Show exactly what goes -------------------------------------------
say "This will remove the old Cutline from this Mac:"

size_of() {
  if [ -e "$1" ]; then
    du -sh "$1" 2>/dev/null | cut -f1
  fi
}

item() {
  local path="$1" label="$2" size
  if [ -e "$path" ]; then
    size="$(size_of "$path")"
    printf "  %-42s %s\n" "$label" "${size:-present}"
    return 0
  fi
  printf "  %-42s %s\n" "$label" "not installed"
}

item "$PROGRAM" "program folder (~/cutline)"
item "$PLIST" "background watcher (launch agent)"
count=0
if [ -d "$RESOLVE_SCRIPTS" ]; then
  count="$(find "$RESOLVE_SCRIPTS" -maxdepth 1 -name 'Cutline*' 2>/dev/null | wc -l | tr -d ' ')"
fi
printf "  %-42s %s\n" "Resolve menu scripts" "$count file(s)"

plain ""
say "This will clear Cutline's own scratch output, and nothing else:"
for sub in latest engine logs; do
  printf "  %-42s\n" "~/Movies/Cutline/$sub"
done
plain ""
ok "Your footage stays. ~/Movies/Cutline/inbox and config.json are kept."

# --- 3. Confirm -----------------------------------------------------------
plain ""
plain "Nothing has changed yet."
printf "Type %syes%s to continue, or press Return to cancel: " "$BOLD" "$RESET"
read -r answer
case "$answer" in
  yes|YES|Yes) ;;
  *) plain ""; plain "Cancelled. Nothing was touched."; finish 0 ;;
esac

# --- 4. Stop the watcher --------------------------------------------------
say "Stopping the background watcher"
UID_NUM="$(id -u)"
if [ "$DRY" != "1" ]; then
  launchctl bootout "gui/$UID_NUM/com.cutline.watch" 2>/dev/null \
    || launchctl unload "$PLIST" 2>/dev/null \
    || true
fi
if [ -e "$PLIST" ]; then
  run rm -f "$PLIST" && ok "  watcher removed"
else
  dim "  no watcher installed"
fi

# --- 5. Remove the Resolve menu scripts -----------------------------------
say "Removing Cutline from DaVinci Resolve's Scripts menu"
if [ -d "$RESOLVE_SCRIPTS" ]; then
  found=0
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    run rm -f "$file" && found=$((found + 1))
  done <<EOF
$(find "$RESOLVE_SCRIPTS" -maxdepth 1 -name 'Cutline*' 2>/dev/null)
EOF
  if [ "$found" -gt 0 ]; then
    ok "  removed $found menu file(s)"
  else
    dim "  none found"
  fi
  dim "  Resolve only re-reads that folder when it starts, so quit Resolve now."
else
  dim "  Resolve scripts folder not found"
fi

# --- 6. Remove the program folder ----------------------------------------
say "Removing the old program"
if [ -e "$PROGRAM" ]; then
  run rm -rf "$PROGRAM" && ok "  ~/cutline removed"
else
  dim "  ~/cutline was already gone"
fi

# --- 7. Clear Cutline's scratch output, keep the footage ------------------
say "Clearing scratch output (footage untouched)"
for sub in latest engine logs; do
  target="$WORK/$sub"
  if [ -e "$target" ]; then
    run rm -rf "$target" && ok "  removed $sub/"
  else
    dim "  $sub/ was already clean"
  fi
done
if [ -f "$WORK/config.json" ]; then
  run mv "$WORK/config.json" "$WORK/config.json.old"
  ok "  config.json set aside as config.json.old (fresh defaults next run)"
fi

# --- 8. Install the clean copy -------------------------------------------
plain ""
if [ -f "$HERE/Install Cutline.command" ]; then
  say "Installing the clean copy"

  # The old install lived at ~/cutline, so the clean one does too. Copy this
  # folder into place first — installing from Downloads would leave the program
  # in the wrong place and the next update would miss it.
  if [ "$DRY" = "1" ]; then
    dim "[dry-run] copy $HERE -> $PROGRAM"
  else
    mkdir -p "$PROGRAM"
    if command -v rsync >/dev/null 2>&1; then
      rsync -a \
        --exclude '.venv' --exclude '.git' --exclude '__pycache__' \
        --exclude '.pytest_cache' --exclude 'data' --exclude 'downloads' \
        "$HERE/" "$PROGRAM/" || { warn "Copy failed."; finish 1; }
    else
      (cd "$HERE" && tar -cf - --exclude '.venv' --exclude '.git' \
        --exclude '__pycache__' --exclude '.pytest_cache' --exclude 'data' \
        --exclude 'downloads' .) | (cd "$PROGRAM" && tar -xf -) \
        || { warn "Copy failed."; finish 1; }
    fi
    chmod +x "$PROGRAM/Install Cutline.command" "$PROGRAM/Start Fresh.command" 2>/dev/null
    ok "  clean copy placed at ~/cutline"
  fi

  plain ""
  plain "The installer takes it from here."
  plain ""
  if [ "$DRY" = "1" ]; then
    dim "[dry-run] bash \"$PROGRAM/Install Cutline.command\""
    finish 0
  fi
  exec bash "$PROGRAM/Install Cutline.command"
fi

warn "The clean copy is missing its installer."
plain "Unzip the download again and double-click Install Cutline.command."
finish 1
