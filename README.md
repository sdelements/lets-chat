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
git clone https://github.com/sdelements/lets-chat.git
cd lets-chat
npm install
npm start
```

For custom settings, copy and edit ```settings.yml.sample```:

```
cp settings.yml.sample settings.yml
```

Party time: [http://localhost:5000](http://localhost:5000)

## Deploying to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)
