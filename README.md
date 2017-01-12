![Let's Chat](http://i.imgur.com/0a3l5VF.png)

![Screenshot](http://i.imgur.com/C4uMD67.png)

A self-hosted chat app for small teams built by [Security Compass][seccom].

[![Build Status](https://travis-ci.org/sdelements/lets-chat.svg?branch=master)](https://travis-ci.org/sdelements/lets-chat)
[![Dependency Status](https://david-dm.org/sdelements/lets-chat.svg)](https://david-dm.org/sdelements/lets-chat)
[![devDependency Status](https://david-dm.org/sdelements/lets-chat/dev-status.svg)](https://david-dm.org/sdelements/lets-chat#info=devDependencies)

## Features and Stuff

* BYOS (bring your own server)
* Persistent messages
* Multiple rooms
* Private and password-protected rooms
* New message alerts / notifications
* Mentions (hey @you/@all)
* Image embeds / Giphy search
* Code pasting
* File uploads (Local / [Amazon S3][s3] / [Azure][azure])
* Transcripts / Chat History (with search)
* XMPP Multi-user chat (MUC)
* 1-to-1 chat between XMPP users
* Local / [Kerberos][kerberos] / [LDAP][ldap] authentication
* [Hubot Adapter][hubot]
* REST-like API
* Basic i18n support
* MIT Licensed


## Deployment

For installation instructions, please use the following links:

* [Local installation][install-local]
* [Docker][install-docker]
* [Heroku][install-heroku]
* [Vagrant][install-vagrant]
* [Cloudron](https://github.com/cloudron-io/letschat-app/blob/master/README.md)

## Support & Problems

We have a [troubleshooting document][troubleshooting], otherwise please use our
[mailing list][mailing-list] for support issues and questions.


## Bugs and feature requests

Have a bug or a feature request? Please first read the [issue
guidelines][contributing] and search for existing and closed issues. If your
problem or idea is not addressed yet, [please open a new issue][new-issue].


## Documentation

Let's Chat documentation is hosted in the [wiki]. If there is an inaccuracy in
the documentation, [please open a new issue][new-issue].


## Contributing

Please read through our [contributing guidelines][contributing]. Included are
directions for opening issues, coding standards, and notes on development.

Editor preferences are available in the [editor config][editorconfig] for easy
use in common text editors. Read more and download plugins at
<http://editorconfig.org>.


## License

Released under [the MIT license][license].


[wiki]: https://github.com/sdelements/lets-chat/wiki
[troubleshooting]: https://github.com/sdelements/lets-chat/blob/master/TROUBLESHOOTING.md
[mailing-list]: https://groups.google.com/forum/#!forum/lets-chat-app
[tracker]: https://github.com/sdelements/lets-chat/issues
[contributing]: https://github.com/sdelements/lets-chat/blob/master/CONTRIBUTING.md
[new-issue]: https://github.com/sdelements/lets-chat/issues/new
[editorconfig]: https://github.com/sdelements/lets-chat/blob/master/.editorconfig
[license]: https://github.com/sdelements/lets-chat/blob/master/LICENSE
[ldap]: https://github.com/sdelements/lets-chat-ldap
[kerberos]: https://github.com/sdelements/lets-chat-kerberos
[s3]: https://github.com/sdelements/lets-chat-s3
[seccom]: http://securitycompass.com/
[hubot]: https://github.com/sdelements/hubot-lets-chat
[azure]: https://github.com/maximilian-krauss/lets-chat-azure
[install-local]: https://github.com/sdelements/lets-chat/wiki/Installation
[install-docker]: https://registry.hub.docker.com/u/sdelements/lets-chat/
[install-heroku]: https://github.com/sdelements/lets-chat/wiki/Heroku
[install-vagrant]: https://github.com/sdelements/lets-chat/wiki/Vagrant
[install-cloudron]: https://github.com/sdelements/lets-chat/wiki/Cloudron
