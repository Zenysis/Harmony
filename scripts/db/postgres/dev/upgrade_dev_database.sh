#!/bin/bash -eu
set -o pipefail

DEPLOYMENT_CODE="$1"
DB_NAME="$2"
SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)
POSTGRES_SYSTEM_USER="postgres"


# Test to see if the destination database already exists.
DB_EXISTS_TEST=$(psql -h ${DATABASE_HOST:-postgres} -U postgres postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")

if [[ "${DB_EXISTS_TEST}" == '' ]] ; then
  echo "Creating database ${DB_NAME}"
  psql -h ${DATABASE_HOST:-postgres} -U postgres postgres -tAc "CREATE DATABASE \"${DB_NAME}\""
fi

pushd "${ZEN_HOME}" &> /dev/null

# Run the Flask-Migrate command to upgrade the database tables to the latest
# version.
# NOTE(stephen): Filtering out some common log messages so that databases that
# don't need upgrading will not produce any logs.
# NOTE(stephen): Using the simplified base app since we don't need to import all
# the extra crap that is needed to actually start the full flask server. We only
# need the core.
export DATABASE_URL="postgresql://postgres:zenysis@${DATABASE_HOST:-postgres}/${DB_NAME}"
export FLASK_APP='web.server.app_base'
export ZEN_ENV="${DEPLOYMENT_CODE}"
flask db upgrade 2>&1 \
  | (grep -v ':MainThread: Context impl PostgresqlImpl.' || true) \
  | (grep -v ':MainThread: Will assume transactional DDL.' || true) \
  | perl -pe 's#.+:MainThread: ##'

popd &> /dev/null