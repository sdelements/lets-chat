#!/bin/bash
#
# vim:syntax=sh:sw=4:ts=4:expandtab

cd /app
#exec /sbin/setuser defaultuser /usr/bin/memcached >>/var/log/memcached.log 2>&1
exec npm start >>/var/log/myapp.log 2>&1



