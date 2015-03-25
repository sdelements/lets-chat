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
