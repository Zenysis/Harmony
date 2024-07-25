#!/bin/bash -eu
set -o pipefail

# Run specific initialization steps that are needed when a new docker web
# container is being run for the first time.
DEFAULT_HASURA_HOST="http://hasura:${HASURA_PORT:-8080}"

# Copy static assets to a directory that nginx can access.
echo 'Copying static files...'
mkdir -p /data/output/zenysis_static
rm -rf /data/output/zenysis_static/*
cp -r /zenysis/web/public/{build,images,js} /data/output/zenysis_static

echo 'Running db upgrade...'
FLASK_APP='web.server.app' ZEN_OFFLINE=1 flask db upgrade

# Apply hasura metadata
echo 'Applying hasura metadata'
scripts/db/hasura/apply_metadata_snapshot.py --hasura_host "${HASURA_HOST:-$DEFAULT_HASURA_HOST}"

# NOTE: populate query models if we have this flag enabled
# This is dangerous and can potentially truncate production
# data catalog models. This shouldn't be enabled for staging/production
# instances.
if [ -n "${POPULATE_QUERY_MODELS_FROM_CONFIG:-}" ] ; then
  echo 'Populating query models from config'
  scripts/data_catalog/populate_query_models_from_config.py
fi
