#!/bin/bash

# First terminal - django server
gnome-terminal -- bash -c "cd /home/emma/Social-Media-App/backend && source myvenv/bin/activate && python3 manage.py runserver 0.0.0.0:5000; exec bash"

# Second terminal - node server
gnome-terminal -- bash -c "cd /home/emma/Social-Media-App/nodejs-api && node server.js; exec bash"

# Third terminal - Native metro bundler
gnome-terminal -- bash -c "cd /home/emma/Social-Media-App/FrontEnd && npx react-native start; exec bash"

# Fourth terminal - Android app emulator
gnome-terminal -- bash -c "cd /home/emma/Social-Media-App/FrontEnd && npx react-native run-android; exec bash"

