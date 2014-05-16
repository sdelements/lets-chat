FROM ubuntu:latest
MAINTAINER Doğan Aydın <dogan1aydin@gmail.com>

RUN apt-get install -y nodejs npm git
RUN git clone https://github.com/sdelements/lets-chat.git
WORKDIR lets-chat
RUN npm install
RUN rm settings.js.sample

ADD ./settings.js.sample lets-chat/settings.js

EXPOSE 80

CMD ["./app.js"]
ENTRYPOINT ["/usr/bin/nodejs"]
