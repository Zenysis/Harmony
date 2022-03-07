#!/bin/sh -eu

# NOTE(stephen): Using /bin/sh here instead of bash since this script runs
# *inside* the docker container. Also we have to make sure we only use the bare
# unix utilities and commands, not the extended ones that might normally exit.

DB_NAME="$1"
SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)

# NOTE(stephen): Need to grep for the command plus some flags since there
# appears to be an accumulation of zombie processes after we call pkill the
# first time.
GRAPHQL_ENGINE_PID=$(pidof 'graphql-engine' || true)

if [ -n "${GRAPHQL_ENGINE_PID}" ] ; then
  current_db=$(cat /proc/${GRAPHQL_ENGINE_PID}/cmdline \
    | tr '\000' ' ' \
    | sed -E 's#.+--dbname ([^ ]+?) .*#\1#')

  # If the current DB is the same as the new DB, do nothing.
  # NOTE(stephen): Using posix shell string equality check here which is
  # different from how we normally do this in bash.
  if [ "${current_db}" = "${DB_NAME}" ] ; then
    exit 0
  fi
fi

"${SCRIPT_DIR}/start_graphql_engine.sh" "${DB_NAME}"
