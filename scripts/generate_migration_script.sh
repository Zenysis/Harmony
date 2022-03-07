#!/bin/bash -eu
# Builds an alembic migration based on changes made to the model definitions
# locally. You should call this via `init-db` command using the `zen` internal
# environment:
# yarn init-db zen --run_scripts scripts/generate_migration_script.sh
set -o pipefail

if [ -z "${VIRTUAL_ENV:-}" ] ; then
  echo 'You must be inside the Zenysis Virtual Environment to modify the Application Database.'
  exit 1
fi

if [ -z "${ZEN_ENV:-}" ] ; then
  echo 'You must set a Zenysis Environment in order to modify the Application Database.'
  exit 1
fi

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd "${ZEN_SRC_ROOT}" &> /dev/null

# NOTE(stephen): If someone didn't use `init-db` to run this script, we
# hardcode the local DB name to use (building migrations can only ever be run in
# development so this is fine).
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:@localhost/${ZEN_ENV}-local}"
export FLASK_APP='web.server.app'
export ZEN_OFFLINE='1'
flask db migrate

popd &> /dev/null

echo "Successfully generated a migration script. Please edit/review it BEFORE running 'upgrade_database.sh'."
