#!/bin/bash -e
pushd /zenysis &>/dev/null

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

if [ -z "${DONT_SYNC_SOURCEMAPS}" ]; then
  echo 'Syncing sourcemaps'
  # Don't spend more than 5 min syncing sourcemaps
  timeout 300 scripts/sync_sourcemaps.py || echo 'WARNING: Sourcemap upload timed out'
fi

echo 'Running server...'
# If adjusting this timeout, also adjust nginx timeout in
# prod/nginx/nginx_vhost_default_location
web/gunicorn_server.py --timeout=600

popd &>/dev/null
