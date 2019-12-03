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
mkdir -p /storage
if [ $STORAGE_DRIVE_URL ]; then
    mount -t cifs -o username=${STORAGE_DRIVE_USERNAME},password="${STORAGE_DRIVE_PASSWORD}" ${STORAGE_DRIVE_URL} /storage
    if [ $? -ne 0 ]; then
        echo "[FATAL] Failed to mount storage drive at ${STORAGE_DRIVE_URL}"
    fi
else 
    echo "[WARNING] STORAGE_DRIVE_URL not set"
fi

# mount digitization drive
mkdir -p /digitization
if [ $DIGITIZATION_DRIVE_URL ]; then
    mount -t cifs -o username=${DIGITIZATION_DRIVE_USERNAME},password="${DIGITIZATION_DRIVE_PASSWORD}" ${DIGITIZATION_DRIVE_URL} /digitization
    if [ $? -ne 0 ]; then
        echo "[FATAL] Failed to mount digitization drive at ${DIGITIZATION_DRIVE_URL}"
    fi
else
    echo "[WARNING] DIGITIZATION_DRIVE_URL not set"
fi

# start server in debug mode, watching source code changes
npm run watch

