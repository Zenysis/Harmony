#!/bin/bash -eu
set -o pipefail

# This script starts the postgres database system on your dev machine. If
# postgres is already running, it silently quits successfully.

SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)
POSTGRES_SYSTEM_USER="$("${SCRIPT_DIR}/get_postgres_system_user.sh")"

# `pg_ctl` is the command used on mac and `service postgresql` is the command
# used on ubuntu. First check for `pg_ctl` to construct the `pg` command,
# then check for `service postgresql`.
if ! command -v pg_ctl &> /dev/null ; then
  if ! command -v service postgresql &> /dev/null ; then
    echo 'Fatal error: Postgres does not appear to be installed.'
    exit 1
  else
    function pg () {
      local arg="$1"
      local postgres_path="$("${SCRIPT_DIR}/get_postgres_path.sh")"

      sudo -u "${POSTGRES_SYSTEM_USER}" service postgresql "${arg}"
    }
  fi
else
  function pg () {
    local arg="$1"
    local postgres_path="$("${SCRIPT_DIR}/get_postgres_path.sh")"

    sudo -u "${POSTGRES_SYSTEM_USER}" pg_ctl -D "${postgres_path}" "${arg}"
  }
fi

# If postgres is already running, do nothing. Quit silently since this is likely
# the most common situation.
if pg status &> /dev/null ; then
  exit 0
fi

echo '*** Starting Postgres ***'
pg start

echo '*** Postgres successfully started ***'
