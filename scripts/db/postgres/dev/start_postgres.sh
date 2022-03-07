#!/bin/bash -eu
set -o pipefail

# This script starts the postgres database system on your dev machine. If
# postgres is already running, it silently quits successfully.

SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)
POSTGRES_SYSTEM_USER="$("${SCRIPT_DIR}/get_postgres_system_user.sh")"

function pg () {
  local arg="$1"

  sudo -u "${POSTGRES_SYSTEM_USER}" pg_ctl -D /usr/local/var/postgres "${arg}"
}

if ! command -v pg_ctl &> /dev/null ; then
  echo 'Fatal error: Postgres does not appear to be installed.'
  exit 1
fi

# If postgres is already running, do nothing. Quit silently since this is likely
# the most common situation.
if pg status &> /dev/null ; then
  exit 0
fi

echo '*** Starting Postgres ***'
pg start

echo '*** Postgres successfully started ***'
