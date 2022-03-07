#!/bin/sh -eu

# NOTE(stephen): Using /bin/sh here instead of bash since this script runs
# *inside* the docker container. Also we have to make sure we only use the bare
# unix utilities and commands, not the extended ones that might normally exit.

DB_NAME="$1"

# Rely on the builtin docker entrypoint to apply the metadata upgrades.
export HASURA_GRAPHQL_MIGRATIONS_DATABASE_URL="postgres://postgres:@host.docker.internal/${DB_NAME}"

# Disable database migrations since Hasura does not do that for us.
export HASURA_GRAPHQL_MIGRATIONS_DIR='/xxx/disabled'

export HASURA_GRAPHQL_METADATA_DIR='/hasura-metadata/latest'

# The entrypoint will run migrations automatically if they exist. Redirect
# stderr and stdout to the root process's stderr/stdout so that `docker logs`
# works as you would expect.
/bin/docker-entrypoint.sh >/proc/1/fd/1 2>/proc/1/fd/2
