#!/bin/bash
# DOCKER IMAGE STARTUP SCRIPT
# NODE SERVER ENTRYPOINT

# make sure path for node, npm and module binaries is registered
source /root/.nvm/nvm.sh

# increase file watch count
sysctl -w fs.inotify.max_user_watches=524288

# install/update application/api module dependencies
cd /app
npm install

# install/update client module dependencies
cd /app/source/client
npm install
cd /app

# build server code in services/api/bin/
if [ ! -d "services/api/bin" ]; then
    npm run build-api
fi

# build development client code in dist/
if [ ! -d "dist" ]; then
    npm run build-dev
fi

# mount storage drive
if [ -z $STORAGE_DRIVE_URL ]; then
    echo "no mount point"
else 
    mount -t cifs -o username=${STORAGE_DRIVE_USERNAME},password="${STORAGE_DRIVE_PASSWORD}" ${STORAGE_DRIVE_URL} /storage
fi

# start server in debug mode, watching source code changes
npm run watch

