#!/bin/bash
# DOCKER IMAGE PROVISIONING SCRIPT
# INSTALL UBUNTU WITH NODE.JS

# Create application directory
mkdir -p /app

# Install utilities
apt-get install -y vim wget curl bzip2 git

# Install build essentials (required for NPM package compilation)
apt-get install -y build-essential libssl-dev python

# Install NVM (node version manager)
cd ~
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install-nvm.sh
bash install-nvm.sh

# load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# install node.js
nvm install 12.11.0
nvm use 12.11.0
nvm alias default 12.11.0

# update npm
npm i -g npm

# Check node versions
node --version
npm --version

# increase file watch count
echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf && sysctl -p

# add repository storage mount directory
apt-get install -y cifs-utils
mkdir -p /storage

# some helpful bash aliases
cat <<EOF >> ~/.bash_aliases
alias ll='ls -la'
alias ..='cd ..'
EOF
