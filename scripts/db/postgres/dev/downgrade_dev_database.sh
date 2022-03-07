#!/bin/bash -eu
set -o pipefail

DEPLOYMENT_CODE="$1"
DB_NAME="$2"
ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd "${ZEN_SRC_ROOT}" &> /dev/null

# Run the Flask-Migrate command to downgrade the database tables to the latest
# version.
# NOTE(stephen): Filtering out some common log messages so that databases that
# don't need upgrading will not produce any logs.
# NOTE(stephen): Using the simplified base app since we don't need to import all
# the extra crap that is needed to actually start the full flask server. We only
# need the core.
export DATABASE_URL="postgresql://postgres:@localhost/${DB_NAME}"
export FLASK_APP='web.server.app_base'
export ZEN_ENV="${DEPLOYMENT_CODE}"

flask db downgrade 2>&1 \
  | (grep -v ':MainThread: Context impl PostgresqlImpl.' || true) \
  | (grep -v ':MainThread: Will assume transactional DDL.' || true) \
  | perl -pe 's#.+:MainThread: ##'

popd &> /dev/null
