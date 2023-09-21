#!/bin/bash -eu
# Upgrades the Local SQLite Database with the data from the Alembic Migrations directory.
# USAGE: ./downgrade_database.sh
set -o pipefail

if [ -z "${ZEN_ENV:-}" ] ; then
  echo 'You must set a Zenysis Environment in order to modify the Application Database.'
  exit 1
fi

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd "${ZEN_SRC_ROOT}" &> /dev/null

FLASK_APP='web.server.app' ZEN_OFFLINE='1' flask db downgrade

popd &> /dev/null

echo 'Successfully downgraded Application Database.'
