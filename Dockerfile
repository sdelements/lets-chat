FROM ubuntu:latest
MAINTAINER SD Elements

RUN apt-get update
RUN apt-get install -y nodejs nodejs-legacy npm git

RUN git clone -b master https://github.com/sdelements/lets-chat.git

WORKDIR /lets-chat
RUN npm install

ENV LCB_DATABASE_URI mongodb://db/letschat

EXPOSE 5000

CMD ["npm", "start"]
