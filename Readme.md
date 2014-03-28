# **Let's Chat**

A self-hosted chat app for small teams.

![Screenshot](http://i.imgur.com/djnd0Uk.png)

## Features and Stuff

* BYOS (bring your own server)
* Persistent messages
* Multiple rooms
* New message alerts
* Mentions (hey @you)
* Image embeds
* Code pasting
* File uploads
* SSL/TLS
* MIT Licensed

## Upcoming Features

* API
* Better transcripts with search
* Better error handling
* Emote autocomplete
* Access control
* Mobile client

## Getting started

Install [nodejs](https://github.com/joyent/node/wiki/Installation) and [mongo](http://www.mongodb.org/display/DOCS/Quickstart)

Clone le repo

```php
git clone https://github.com/sdelements/lcb.git
cd lcb
```

Install node dependencies

```php
npm install
```

Create a settings file (make sure to edit if you need to). 

```php
cp settings.js.sample settings.js
```

Run the app

```php
nodejs app.js
```

Party time: [http://localhost:5000](http://localhost:5000)
