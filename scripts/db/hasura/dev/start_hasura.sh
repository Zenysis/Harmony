#!/bin/bash -eu
set -o pipefail

DB_NAME="$1"
CONTAINER_NAME='hasura'
ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)
HASURA_METADATA_DIR="${ZEN_SRC_ROOT}/graphql/hasura/metadata/versions"
HASURA_CONTAINER_SCRIPTS_DIR="${ZEN_SRC_ROOT}/scripts/db/hasura/dev/container"

# Check to see if hasura is running.
CONTAINER_COUNT=$(docker ps -q --filter "name=^${CONTAINER_NAME}\$" | wc -l)
if (( CONTAINER_COUNT == 0 )) ; then
  # Run the hasura container in background mode.
  # NOTE(stephen): Specifying the `sh` script so that the container runs
  # indefinitely and we can manually change what options are passed in without
  # needing to restart the container.
  echo 'Removing previous container (if it exists)'
  docker rm "${CONTAINER_NAME}" &> /dev/null || true

  echo 'Starting Hasura'
  docker run \
      -d \
      -it \
      --name "${CONTAINER_NAME}" \
      -v "${HASURA_METADATA_DIR}:/hasura-metadata" \
      -v "${HASURA_CONTAINER_SCRIPTS_DIR}:/zenysis:ro" \
      -p '8088:8080' \
      --entrypoint 'sh' \
    hasura/graphql-engine:latest.cli-migrations-v2
fi

docker exec -d -it "${CONTAINER_NAME}" /zenysis/switch_db.sh "${DB_NAME}"
