## 0.4.6 (2016-1-22)

Fixes

* Display bugs in Chrome 48
* NODE_PATH whitespace issue

Enhancements

* nl/es language adjustments

## 0.4.5 (2015-12-22)

Fixes

* Issues with NODE_PATH
* Fr language update

## 0.4.4 (2015-10-26)

Enhancements

* Support for Node v4

## 0.4.3 (2015-10-09)

Fixes

* Issues with passport dependencies
* XMPP message ID

Enhancements

* New client styling
* Russian and Polish languages

## 0.4.2 (2015-07-14)

Fixes

* Update dependencies

Enhancements

* Show version in the app
* Various accessibility additions

## 0.4.1 (2015-07-08)

Fixes

* [Conversations](https://github.com/siacs/Conversations) double messaging
* Transcripts were not printable

Enhancements

* Giphy can be toggled in settings
* New translations: nl, de, pt, fr, jp, etc
* Various Docker improvements (config volume, etc)
* Better message time groupings

## 0.4.0 (2015-06-04)

Enhancements

* Private and password-protected rooms
* Private 1-to-1 chat between XMPP users
* Giphy image search
* @all mentions are highlighted for everyone
* Basic server-side i18n support

## 0.3.13 (2015-05-29)

Fixes

* Multiple layout bugs due to overflowing content in Firefox
* Layout issue introduced by Chrome 43

## 0.3.12 (2015-05-19)

Fixes

* Multiple layout bugs due to overflowing content in Firefox
* Layout issue introduced by Chrome 43

## 0.3.11 (2015-05-19)

Fixes

* Env variable loading
* Various notification adjustments

Enhancements

* Usernames may now contain underscores and dashes
* Unicode character support for links in messages
* Unread message counts in the favicon
* Newlines with `shift+enter`

## 0.3.10 (2015-04-14)

Fixes

* Fixed Hyperlink parsing
* Fixed issue whereby a deleted user's messages would not display

## 0.3.9 (2015-04-06)

Deprecated

* `xmpp.host` configuration setting - use `xmpp.domain` instead

Enhancements

* Thumbnails are improved
* Support multiple XMPP domains being used between clients
* XMPP can be configured to authenticate using full JID - instead of only node
* Added process title

Fixes

* Fixed "express deprecated req.host: Use req.hostname instead"
* Fixed File Uploads "Post" checkbox
* Fixed issues with desktop notifications
* Fixed XMPP MUC nickname not being reflected to user

## 0.3.8 (2015-03-02)

Fixes

* Fixed error when passing an invalid room ID to transcript page
* Fixed problem where client would join a room twice

## 0.3.7 (2015-03-01)

Fixes

* Fixed MongoDB version check

## 0.3.6 (2015-02-28)

Enhancements

* Transcripts now support text search (#39)
* Plugins support environment variables (#254)

Fixes

* Long room names are clipped in the UI (#221)
* User details are updated in message list (#172)
* XMPP status changes no longer re-trigger room join event (#322)
* Fixed error when rooms in local storage are no longer available

## 0.3.5 (2015-02-26)

Fixes

* Asset pipeline outputs relative paths (#208)
* Temporary upload files are cleaned up
* Fixed UI rendering performance issues
* Updated login registration form layout
* Fixed room archive bug
* XMPP fixes (chat history and client compatibility)

## 0.3.4 (2015-02-19)

Enhancements

* OpenShift compatibility (#199)
* Added ability to serve robots.txt file

Fixes

* Fixed parsing of environment variables
* Disable autocomplete on password fields
* Upload modal only shows rooms you have joined

## 0.3.3 (2015-02-14)

Enhancements

* XMPP users can create rooms (if enabled by configuration)
* Extra methods can be defined on XMPP message processors
* Support periods in usernames
* [Amazon S3](https://github.com/sdelements/lets-chat-s3) support has been extracted into a separate plugin

Fixes

* Auth token men option when XMPP was disabled (#235)
* Improved transcript date range picker
* Chat history didn't load when rejoining room (#242)
* Error messages not shown when creating a room (#229)

## 0.3.2 (2015-02-12)

Enhancements

* Extracted [Kerberos](https://github.com/sdelements/lets-chat-kerberos) and [LDAP](https://github.com/sdelements/lets-chat-ldap) authentication into separate plugins
* Added fig.yml

Fixes

* Fixed error on messages andpoint when room parameter not specified (#211)
* Fixed undefined error (#210)
* XMPP root now advertises itself as a server, not conference (#214)

## 0.3.1 (2015-02-10)

Enhancements

* Now using an [assets pipeline](https://github.com/adunkman/connect-assets)

Fixes

* Fixes related to file upload functionality

## 0.3.0 (2015-02-06)
