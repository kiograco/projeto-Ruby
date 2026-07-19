#!/bin/bash
set -e

rm -f /app/tmp/pids/server.pid

if [ -f /app/Gemfile ]; then
  bundle check || bundle install
fi

exec "$@"
