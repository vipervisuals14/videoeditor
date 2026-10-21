#!/usr/bin/env bash
# ============================================================================
# macOS One-Click Installer for DaVinci Resolve Free 21.1.1
# Installs:
#   1. VFXKit_ResolveFree_Bridge.lua -> Resolve Utility Scripts menu
#   2. Native Fusion .setting VFX Macros -> Resolve Edit Effects Templates
#   3. Creates ~/.vfxkit-resolve-free mailbox state directory
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RESOLVE_BASE="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve"
UTILITY_SCRIPTS_DIR="$RESOLVE_BASE/Fusion/Scripts/Utility"
EDIT_EFFECTS_DIR="$RESOLVE_BASE/Fusion/Templates/Edit/Effects/VFXKit Free"
STATE_DIR="$HOME/.vfxkit-resolve-free"

echo "========================================================"
echo "  PulseVFX Studio — DaVinci Resolve Free 21.1.1 Setup   "
echo "========================================================"

if [ ! -d "$RESOLVE_BASE" ]; then
  echo ""
  echo "[!] No DaVinci Resolve folder found at:"
  echo "    $RESOLVE_BASE"
  echo ""
  echo "    Open DaVinci Resolve once (it creates these folders),"
  echo "    quit it, then run this installer again."
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/resolve-bridge/VFXKit_ResolveFree_Bridge.lua" ]; then
  echo ""
  echo "[!] Run this from inside the PulseVFX folder — the bridge file is missing."
  exit 1
fi

mkdir -p "$UTILITY_SCRIPTS_DIR"
mkdir -p "$EDIT_EFFECTS_DIR"
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

cp "$SCRIPT_DIR/resolve-bridge/VFXKit_ResolveFree_Bridge.lua" "$UTILITY_SCRIPTS_DIR/VFXKit_ResolveFree_Bridge.lua"
cp "$SCRIPT_DIR/fusion-macros/"*.setting "$EDIT_EFFECTS_DIR/"

echo ""
echo "[✓] Installed Lua Bridge to:"
echo "    $UTILITY_SCRIPTS_DIR/VFXKit_ResolveFree_Bridge.lua"
echo ""
echo "[✓] Installed Zero-Plugin Fusion VFX Macros to:"
echo "    $EDIT_EFFECTS_DIR/"
echo ""
echo "[✓] Initialized Mailbox State Directory:"
echo "    $STATE_DIR"
echo ""
echo "NEXT STEPS IN DAVINCI RESOLVE FREE 21.1.1:"
echo "  1. Open DaVinci Resolve Free 21.1.1 and open any project."
echo "  2. In the top menu bar, click: Workspace > Scripts > VFXKit_ResolveFree_Bridge"
echo "  3. Start the panel:  double-click 'Mac 2 - Start VFX Panel.command'"
echo "     (or, from Terminal:  npm start)"
echo ""
MACRO_COUNT=$(ls -1 "$EDIT_EFFECTS_DIR"/*.setting 2>/dev/null | wc -l | tr -d ' ')
echo "  Installed:"
echo "    bridge  -> $UTILITY_SCRIPTS_DIR"
echo "    macros  -> $MACRO_COUNT .setting files in $EDIT_EFFECTS_DIR"
echo "    mailbox -> $STATE_DIR"
echo "========================================================"
