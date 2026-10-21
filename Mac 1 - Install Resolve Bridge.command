#!/bin/bash
# ============================================================================
#  PulseVFX — STEP 1: install the Resolve bridge
#  Double-click this file. It copies the Lua bridge and the Fusion macros into
#  your own DaVinci Resolve folder. Nothing is installed system-wide, no
#  password is needed, and it can be run again safely.
# ============================================================================
cd "$(dirname "$0")" || exit 1

clear
echo "==========================================================="
echo "   PulseVFX  —  STEP 1 of 3:  Install into DaVinci Resolve"
echo "==========================================================="
echo

RESOLVE_DIR="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve"

if [ ! -d "$RESOLVE_DIR" ]; then
  echo "I could not find your DaVinci Resolve folder."
  echo
  echo "Expected it here:"
  echo "   $RESOLVE_DIR"
  echo
  echo "That usually means Resolve has never been opened on this Mac."
  echo "Open DaVinci Resolve once, close it, then double-click this file again."
  echo
  read -r -p "Press Return to close this window. " _
  exit 1
fi

if [ ! -f "./resolve-bridge/VFXKit_ResolveFree_Bridge.lua" ]; then
  echo "This file must stay inside the PulseVFX folder it came in."
  echo "Move the whole folder (not just this file) to your Desktop and try again."
  echo
  read -r -p "Press Return to close this window. " _
  exit 1
fi

bash ./install-macos-resolve-free.sh || {
  echo
  echo "Something went wrong above. Copy the red text and send it over."
  read -r -p "Press Return to close this window. " _
  exit 1
}

echo
echo "==========================================================="
echo "   DONE. Now do STEP 2:"
echo "   Double-click  \"Mac 2 - Start VFX Panel.command\""
echo "==========================================================="
echo
echo "   Then, inside DaVinci Resolve, click once per session:"
echo "   Workspace  >  Scripts  >  VFXKit_ResolveFree_Bridge"
echo
read -r -p "Press Return to close this window. " _
