![Let's Chat](http://i.imgur.com/vDbhXul.png)

![Screenshot](http://i.imgur.com/C4uMD67.png)

A self-hosted chat app for small teams built by [Security Compass](http://securitycompass.com/).

## Features and Stuff

* BYOS (bring your own server)
* Persistent messages
* Multiple rooms
* New message alerts / notifications
* Mentions (hey @you)
* Image embeds
* Code pasting
* File uploads (Local / [Amazon S3](https://github.com/sdelements/lets-chat-s3))
* Transcripts / chat history
* XMPP Multi-user chat (MUC)
* Local / [Kerberos](https://github.com/sdelements/lets-chat-kerberos) / [LDAP](https://github.com/sdelements/lets-chat-ldap) authentication
* [Hubot Adapter](https://github.com/sdelements/hubot-lets-chat)
* REST-like API
* MIT Licensed

## Deployment

See the [wiki](https://github.com/sdelements/lets-chat/wiki) for instructions on deploying locally, or to Docker, Vagrant and Heroku.

## Upgrading from 0.2.x

Release 0.3.0+ uses a new settings file called ```settings.yml```, just move over your old ```settings.js``` options and run ```npm run-script migrate```.

## FAQ

#### What version of Node.JS is required?

Let's Chat requires Node.JS version ```0.10.x```. You will have a bad time if you try to use a different version. 

#### Do I need to start MongoDB manually?

Yes. How you do this varies by operating system.    
