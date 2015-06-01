FROM node:0.10-onbuild
MAINTAINER SD Elements

ENV LCB_DATABASE_URI mongodb://db/letschat
ENV LCB_HTTP_HOST 0.0.0.0

RUN	groupadd -r node \
&&	useradd -r -g node node \
&&	chown node:node uploads

USER node

EXPOSE 5000
