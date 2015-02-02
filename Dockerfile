FROM ubuntu:latest
MAINTAINER SD Elements

RUN apt-get update
RUN apt-get install -y nodejs nodejs-legacy npm git libkrb5-dev

RUN git clone -b release/0.3.0 https://github.com/sdelements/lets-chat.git
WORKDIR lets-chat
RUN npm install

ENV LCB_DATABASE_URI mongodb://db/letschat

EXPOSE 5000

CMD ["node", "./app.js"]
