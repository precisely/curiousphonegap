#!/usr/local/bin/zsh
rm -rf www
cd famous-app
grunt copy
cd ..
cordova build ios
