FROM ubuntu:latest
MAINTAINER SD Elements

RUN apt-get update
RUN apt-get install -y nodejs nodejs-legacy npm git libkrb5-dev

# Ensure to mount the Let's Chat repository as "/lets-chat".
VOLUME "/lets-chat"

WORKDIR /lets-chat
RUN npm install

ENV LCB_DATABASE_URI mongodb://db/letschat

EXPOSE 5000

CMD ["npm", "start"]
