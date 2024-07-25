#!/bin/bash -eu
set -o pipefail

# if docker command doesn't exist, assume we're running containerized and quit
if ! command -v docker &> /dev/null
then
  echo "Docker command does not exist - assuming hasura is running..."
  exit 0
fi

DB_NAME="$1"
CONTAINER_NAME='hasura'
IMAGE_NAME='hasura/graphql-engine:v2.11.3.cli-migrations-v2'
ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)
HASURA_METADATA_DIR="${ZEN_SRC_ROOT}/graphql/hasura/metadata/versions"
HASURA_CONTAINER_SCRIPTS_DIR="${ZEN_SRC_ROOT}/scripts/db/hasura/dev/container"

# Check to see if the correct hasura image is running.
# NOTE: Using grep here to filter on the image name, which isn't supported
# with `docker ps --filter`
CONTAINER_COUNT=$(docker ps | grep -wc $IMAGE_NAME) || true
if (( CONTAINER_COUNT == 0 )) ; then
  echo 'Removing previous container (if it exists)'
  docker stop "${CONTAINER_NAME}" &> /dev/null || true
  docker rm "${CONTAINER_NAME}" &> /dev/null || true

  # Run the hasura container in background mode.
  # NOTE: Specifying the `sh` script so that the container runs
  # indefinitely and we can manually change what options are passed in without
  # needing to restart the container.
  echo 'Starting Hasura'
  docker run \
      -d \
      -it \
      --name "${CONTAINER_NAME}" \
      -v "${HASURA_METADATA_DIR}:/hasura-metadata" \
      -v "${HASURA_CONTAINER_SCRIPTS_DIR}:/zenysis:ro" \
      -p '8088:8080' \
      --entrypoint 'sh' \
    "${IMAGE_NAME}"
fi

docker exec -d -it "${CONTAINER_NAME}" /zenysis/switch_db.sh "${DB_NAME}"
