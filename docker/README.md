![Let's Chat](http://i.imgur.com/0a3l5VF.png)

# What is Let's Chat?

A self-hosted chat app for small teams.

![Screenshot](http://i.imgur.com/C4uMD67.png)

# How to use this image

## Enable IPv6 in Docker

Modify your docker config file:

CentOS: /etc/sysconfig/docker
Debian: /etc/default/docker

other_opts=--ipv6

Add IPv6 to your docker0 bridge:

You have two options:

Remove the bridge and let Docker create a new one

```
ifconfig docker0 down
brctl delbr docker0
```

Just set the IPv6 address manually

```
ifconfig docker0 inet6 add fe80::1/64
```

I'd recommend 2.

## Running Let's Chat

```
docker run  --name some-letschat --link some-mongo:mongo -d sdelements/lets-chat
```

If you'd like to be able to access the instance from the host without the container's IP, standard port mappings can be used:

```
docker run  --name some-letschat --link some-mongo:mongo -p 8080:8080 -d sdelements/lets-chat
```

Then, access it via `http://localhost:8080` or `http://host-ip:8080` in a browser.

## ... via `docker-compose`

Example docker-compose.yml for `sdelements/lets-chat`:

```yml
app:
  image: sdelements/lets-chat
  links:
    - mongo
  ports:
    - 8080:8080
    - 5222:5222

mongo:
  image: mongo:latest
```

Run `docker-compose up`, wait for it to initialize completely, and visit `http://localhost:8080` or `http://host-ip:8080`.

# Configuration

You can config your Let's Chat Docker instance using one of the following methods:

## Config file

Create a settings.yml file in a directory and then mount that directory as a Docker volume.

`/usr/src/app/config`

## Environment variables

[See the Let's Chat wiki for a list of envirnoment variables](https://github.com/sdelements/lets-chat/wiki/Environment-variables)
