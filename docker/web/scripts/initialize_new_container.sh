#!/bin/bash -eu
set -o pipefail

# Run specific initialization steps that are needed when a new docker web
# container is being run for the first time.

# Copy static assets to a directory that nginx can access.
echo 'Copying static files...'
mkdir -p /data/output/zenysis_static
rm -rf /data/output/zenysis_static/*
cp -r /zenysis/web/public/{build,images,js} /data/output/zenysis_static

# Don't want to expose sourcemaps to the user.
# TODO(stephen): This could be an nginx rule also.
rm -f /data/output/zenysis_static/build/min/*.js.map

echo 'Running db upgrade...'
FLASK_APP='web.server.app' ZEN_OFFLINE=1 flask db upgrade
