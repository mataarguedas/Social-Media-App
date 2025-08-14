#!/bin/bash
set -e

BACKEND_DIR="/home/emma/Social-Media-App/backend"
VENV_PY="$BACKEND_DIR/myvenv/bin/python"
FRONTEND_DIR="/home/emma/Social-Media-App/FrontEnd"
NODE_DIR="/home/emma/Social-Media-App/nodejs-api"

# First terminal - Django server (use venv python explicitly)
gnome-terminal -- bash -c "
cd \"$BACKEND_DIR\" && \
\"$VENV_PY\" -m pip --version >/dev/null 2>&1 || \"$VENV_PY\" -m ensurepip --upgrade; \
\"$VENV_PY\" manage.py runserver 0.0.0.0:5000; \
exec bash
"

# Second terminal - Node server
gnome-terminal -- bash -c "
cd \"$NODE_DIR\" && \
node server.js; \
exec bash
"

# Third terminal - Metro (free port 8081 if busy)
gnome-terminal -- bash -c "
cd \"$FRONTEND_DIR\" && \
kill -9 \$(lsof -t -i:8081) 2>/dev/null || true; \
npx react-native start --reset-cache; \
exec bash
"

# Fourth terminal - Android app emulator (check android folder)
gnome-terminal -- bash -c "
cd \"$FRONTEND_DIR\" && \
if [ ! -d android ]; then
  echo 'ERROR: Android project not found at ./android'
  echo 'If it lives elsewhere, set project.android.sourceDir in react-native.config.js'
  exec bash
  exit 1
fi
npx react-native run-android; \
exec bash
"

