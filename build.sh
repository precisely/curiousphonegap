#!/bin/bash
rm -rf www
cd famous-app
grunt copy
cd ..
environment=$1
if [ -z "$environment" ]; then
    echo "Thanks"
	environment='prod'
fi
environment="$environment=true;"
echo $environment > temp_file.js
cat www/src/main.js >> temp_file.js
mv temp_file.js www/src/main.js
cordova build ios
