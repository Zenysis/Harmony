#!/bin/sh -eu

# NOTE(stephen): Using /bin/sh here instead of bash since this script runs
# *inside* the docker container. Also we have to make sure we only use the bare
# unix utilities and commands, not the extended ones that might normally exit.

DB_NAME="$1"
SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)

"${SCRIPT_DIR}/apply_metadata_upgrades.sh" "${DB_NAME}"

# Shut down any existing instances of graphql-engine.
GRAPHQL_ENGINE_PID=$(pidof 'graphql-engine' || true)
if [ -n "${GRAPHQL_ENGINE_PID}" ] ; then
  # NOTE(stephen): Intentionally passing this unquoted since it is possible for
  # two graphql-engine instances to be running in parallel (the main one and
  # the one that applies metadata upgrades that should be shutting down).
  kill ${GRAPHQL_ENGINE_PID}
fi

export HASURA_GRAPHQL_DATABASE_URL="postgres://postgres:@host.docker.internal/${DB_NAME}"

# Internal command to run inside the hasura conatiner. Run the graphql-engine
# and redirect stderr and stdout to the root process's stderr/stdout so that
# `docker logs` works as you would expect.
graphql-engine \
    --host 'host.docker.internal' \
    --port 5432 \
    --user 'postgres' \
    --dbname "${DB_NAME}" \
  serve \
    --enable-console \
    --console-assets-dir /srv/console-assets \
  >/proc/1/fd/1 \
  2>/proc/1/fd/2
