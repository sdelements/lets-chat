FROM node:0.12-onbuild
MAINTAINER SD Elements

ENV LCB_DATABASE_URI mongodb://db/letschat
ENV LCB_HTTP_HOST 0.0.0.0

RUN	apt-get update \
&&	apt-get install -y libkrb5-dev --no-install-recommends \
&&	rm -rf /var/lib/apt/lists/*

RUN npm install lets-chat-ldap lets-chat-kerberos lets-chat-s3

RUN	groupadd -r node \
&&	useradd -r -g node node \
&&	chown node:node uploads

USER node

EXPOSE 5000
EXPOSE 5222

VOLUME [ "/usr/src/app/uploads" ]
