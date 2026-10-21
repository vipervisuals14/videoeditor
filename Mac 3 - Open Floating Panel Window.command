#!/bin/bash
# ============================================================================
#  PulseVFX — OPTIONAL: open the panel as a small floating window
#  Same page, but without browser tabs or an address bar, so it looks like a
#  plugin panel you can park next to DaVinci Resolve.
#  Requires the panel to already be running (Mac 2 - Start VFX Panel.command).
# ============================================================================
cd "$(dirname "$0")" || exit 1
URL="http://localhost:3000"

clear
echo "==========================================================="
echo "   PulseVFX  —  Floating panel window"
echo "==========================================================="
echo

if ! curl -s -o /dev/null --max-time 2 "$URL"; then
  echo "The panel is not running yet."
  echo
  echo "Double-click  \"Mac 2 - Start VFX Panel.command\"  first,"
  echo "then double-click this file again."
  echo
  read -r -p "Press Return to close this window. " _
  exit 1
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
BRAVE="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

if [ -x "$CHROME" ]; then
  exec "$CHROME" --app="$URL" --window-size=480,1120 --window-position=60,60
elif [ -x "$EDGE" ]; then
  exec "$EDGE" --app="$URL" --window-size=480,1120 --window-position=60,60
elif [ -x "$BRAVE" ]; then
  exec "$BRAVE" --app="$URL" --window-size=480,1120 --window-position=60,60
else
  echo "No Chrome/Edge/Brave found — opening in your normal browser instead."
  echo "Tip: drag the browser window next to Resolve and use the"
  echo "\"Pop-Up Dock Mode\" button inside the panel."
  open "$URL"
fi
