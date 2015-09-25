#!/bin/bash

# RHEL 7.1 installation script for Let's Chat

yum update
yum install libicu-devel git curl gcc-c++ make
yum groupinstall 'Development Tools'
curl --silent --location https://rpm.nodesource.com/setup | bash -
yum install nodejs
cat >> /etc/yum.repos.d/mongodb-org-3.0.repo <<EOL
[mongodb-org-3.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.0/x86_64/
gpgcheck=0
enabled=1
EOL
yum update
yum install mongodb-org
cd /opt/
git clone https://github.com/sdelements/lets-chat
cd lets-chat && npm install passport.socketio@3.5.1 --save
npm install
npm install lets-chat-ldap
cp settings.yml.sample settings.yml
firewall-cmd --add-port=5000/tcp --add-port=5222/tcp --permanent && firewall-cmd --reload
LCB_HTTP_HOST=0.0.0.0 npm start
