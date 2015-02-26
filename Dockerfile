FROM phusion/baseimage:0.9.16

ENV HOME /root

CMD ["/sbin/my_init"]

# SSH - Uncomment for SSH access
#RUN rm -f /etc/service/sshd/down
#RUN /etc/my_init.d/00_regen_ssh_host_keys.sh
"ADD id_ecdsa.pub /tmp/your_key.pub
#RUN cat /tmp/your_key.pub >> /root/.ssh/authorized_keys && rm -f /tmp/your_key.pub

RUN apt-get update && apt-get install -y mc gnupg git-core


RUN gpg --keyserver pool.sks-keyservers.net --recv-keys 9554F04D7259F04124DE6B476D5A82AC7E37093B DD8F2338BAE7501E3DD5AC78C273792F7D83545D
ENV IOJS_VERSION 1.3.0

RUN curl -SLO "https://iojs.org/dist/v$IOJS_VERSION/iojs-v$IOJS_VERSION-linux-x64.tar.gz" \
  && curl -SLO "https://iojs.org/dist/v$IOJS_VERSION/SHASUMS256.txt.asc" \
  && gpg --verify SHASUMS256.txt.asc \
  && grep " iojs-v$IOJS_VERSION-linux-x64.tar.gz\$" SHASUMS256.txt.asc | sha256sum -c - \
  && tar -xzf "iojs-v$IOJS_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
  && rm "iojs-v$IOJS_VERSION-linux-x64.tar.gz" SHASUMS256.txt.asc

ENV LCB_DATABASE_URI mongodb://db/letschat

COPY . /app
WORKDIR /app

# Install Python
RUN apt-get install -y python python-dev python-pip python-virtualenv

RUN npm install -g bower
RUN npm install
RUN bower install --allow-root

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add the app
RUN mkdir /etc/service/myapp
ADD myapp.sh /etc/service/myapp/run

EXPOSE 5000

