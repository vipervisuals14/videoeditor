#!/bin/bash
# ============================================================================
#  PulseVFX — STEP 2: start the pop-up panel
#  Double-click this file. It starts the panel and opens it in your browser.
#  Leave this Terminal window open while you edit — closing it stops the panel.
# ============================================================================
cd "$(dirname "$0")" || exit 1

# Finder-launched Terminal windows do not always inherit Homebrew / nvm paths
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
URL="http://localhost:3000"

clear
echo "==========================================================="
echo "   PulseVFX  —  STEP 2 of 3:  Start the pop-up panel"
echo "==========================================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed yet."
  echo
  echo "1. Go to:  https://nodejs.org/en/download"
  echo "2. Click the big macOS Installer button (the LTS one)."
  echo "3. Open the downloaded .pkg and keep clicking Continue / Agree."
  echo "4. When it finishes, double-click this file again."
  echo
  read -r -p "Press Return to close this window. " _
  exit 1
fi

echo "Node.js found: $(node -v)"
echo

if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "The panel is already running — opening it for you."
  open "$URL"
  sleep 1
  exit 0
fi

echo "Starting the panel... your browser will open in a moment."
echo
echo "KEEP THIS WINDOW OPEN while you work."
echo "To stop the panel later: close this window, or press Control-C."
echo
echo "-----------------------------------------------------------"

( sleep 2; open "$URL" ) &
node server.js

echo "-----------------------------------------------------------"
echo "The panel has stopped."
read -r -p "Press Return to close this window. " _
