# **Let's Chat**

A self-hosted chat app for small teams.

![Screenshot](http://i.imgur.com/djnd0Uk.png)

## Features and Stuff

* BYOS (bring your own server)
* Persistent messages
* Multiple rooms
* New message alerts / notifications
* Mentions (hey @you)
* Image embeds
* Code pasting
* XMPP Multi-user chat (MUC)
* Local / Kerberos / LDAP authentication
* MIT Licensed

## Running locally

Make sure you have [Node.js](https://github.com/joyent/node/wiki/Installation) and [MongoDB](http://www.mongodb.org/display/DOCS/Quickstart) installed.

```
git clone -b release/0.3.0 https://github.com/sdelements/lets-chat.git
cd lets-chat
npm install
npm start
```

(Optional) For custom settings, copy and edit ```settings.yml.sample```:

```
cp settings.yml.sample settings.yml
```

Party time: [http://localhost:5000](http://localhost:5000)

## Deploying to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Using Docker

Make sure you have [Docker](https://www.docker.com/) installed. The following is a basic example of how to use the Dockerfile. We recommend reading documentation and/or tutorials, if you have never used Docker before.

```
docker pull mongo

git clone -b release/0.3.0 https://github.com/sdelements/lets-chat.git
cd lets-chat
docker build -t lets-chat .

docker run -d --name db mongo
docker run -p 5000:5000 --link db:db lets-chat
```

If you're using Mac OS X or Windows, you'll need to use this command to get the IP address of the Docker VM:

```
boot2docker ip
```
You can now access the app at ```http://<boot2docker ip>:5000``` or ```http://localhost:5000```

## Using Vagrant

Make sure you have a recent version of [Vagrant](https://www.vagrantup.com/) installed.

```
git clone -b release/0.3.0 https://github.com/sdelements/lets-chat.git
cd lets-chat
vagrant up
```

Access the app at: [http://localhost:5000](http://localhost:5000)

XMPP Details:
 * Server: localhost
 * Port: 5222
