#!/bin/bash -eu
set -o pipefail

# This script creates the default Postgres superuser account that will be used
# by our dev python server.

SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)
POSTGRES_SYSTEM_USER="$("${SCRIPT_DIR}/get_postgres_system_user.sh")"

# First, ensure the postgres server is running.
"${SCRIPT_DIR}/start_postgres.sh"

# We use the `postgres` account name as the default superuser account.
# Test if the user was already created. If it has been, exit silently.
DB_USER_TEST=$(sudo -u "${POSTGRES_SYSTEM_USER}" \
  psql postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'")

if [[ "${DB_USER_TEST}" == '1' ]] ; then
  exit 0
fi

# The user has not yet been created. Create it now with superuser permissions.
echo '*** Creating `postgres` DB admin user ***'
sudo -u "${POSTGRES_SYSTEM_USER}" \
  createuser \
    -h 'localhost' \
    -p 5432 \
    -s 'postgres'

echo '*** Finished creating `postgres` admin user ***'
