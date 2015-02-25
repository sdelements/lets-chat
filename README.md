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

See the [wiki][wiki] for instructions on deploying locally, or to Docker, Vagrant and Heroku.


## Support & Problems

We have a document listing some [common issues][common-issues], otherwise please use our [mailing list][mailing-list] for support issues and questions.


## Bugs and feature requests

Have a bug or a feature request? Please first read the [issue guidelines][contributing] and search for existing and closed issues. If your problem or idea is not addressed yet, [please open a new issue][new-issue].


## Documentation

Let's Chat documentation is hosted in the [wiki]. If there is an inaccuracy in the documentation, [please open a new issue][new-issue].


## Contributing

Please read through our [contributing guidelines][contributing]. Included are directions for opening issues, coding standards, and notes on development.

Editor preferences are available in the [editor config][editorconfig] for easy use in common text editors. Read more and download plugins at <http://editorconfig.org>.


## Upgrading from 0.2.x

Release 0.3.0+ uses a new settings file called ```settings.yml```, just move over your old ```settings.js``` options and run ```npm run migrate```.


## License

Released under [the MIT license][license].


[wiki]: https://github.com/sdelements/lets-chat/wiki
[common-issues]: https://github.com/sdelements/lets-chat/blob/master/COMMON-ISSUES.md
[mailing-list]: https://groups.google.com/forum/#!forum/lets-chat-app
[tracker]: https://github.com/sdelements/lets-chat/issues
[contributing]: https://github.com/sdelements/lets-chat/blob/master/CONTRIBUTING.md
[new-issue]: https://github.com/sdelements/lets-chat/issues/new
[editorconfig]: https://github.com/sdelements/lets-chat/blob/master/.editorconfig
[license]: https://github.com/sdelements/lets-chat/blob/master/LICENSE
