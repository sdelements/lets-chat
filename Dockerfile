FROM node:0.10-onbuild
MAINTAINER SD Elements

ENV LCB_DATABASE_URI mongodb://db/letschat
EXPOSE 5000
