# **Let's Chat**

A self-hosted chat app for small teams.

![Screenshot](http://i.imgur.com/C4uMD67.png)

## Features and Stuff

* BYOS (bring your own server)
* Persistent messages
* Multiple rooms
* New message alerts / notifications
* Mentions (hey @you)
* Image embeds
* Code pasting
* File uploads
* Transcripts / chat history
* XMPP Multi-user chat (MUC)
* Local / Kerberos / LDAP authentication
* [Hubot Adapter](https://github.com/hhaidar/hubot-lets-chat)
* HTTP API
* MIT Licensed

## Deployment

See the [wiki](https://github.com/sdelements/lets-chat/wiki) for instructions on deploying locally, or to Docker, Vagrant and Heroku.

## Upgrading from 0.2.x

Release 0.3.0+ uses a new settings file called ```settings.yml```, just move over your old ```settings.js``` options and run ```npm scripts migrate```.

