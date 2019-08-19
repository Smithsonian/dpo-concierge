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

# build server code in services/api/bin/
if [ ! -d "services/api/bin" ]; then
    npm run build-api
fi

# build development client code in dist/
if [ ! -d "dist" ]; then
    npm run build-dev
fi

# start server in debug mode, watching source code changes
npm run watch

