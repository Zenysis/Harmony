#!/bin/bash -eu
set -o pipefail

CONTAINER_NAME='hasura'
ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)
HASURA_METADATA_DIR="${ZEN_SRC_ROOT}/graphql/hasura/metadata/versions"

pushd "${HASURA_METADATA_DIR}" &> /dev/null

# The version name to give the `latest` version after it is backed up and before
# it is replaced. It is equal to the hash of the commit that the `latest`
# version was most recently updated with (implying this was the commit that
# created the `latest` metadata at that time).
PREVIOUS_VERSION="$(git rev-list --abbrev-commit --abbrev=10 -1 HEAD latest)"

echo "Backing up previous version: ${PREVIOUS_VERSION}"
mkdir -p "${PREVIOUS_VERSION}"

mv latest/* "${PREVIOUS_VERSION}"

echo 'Exporting latest metadata'
docker exec -it \
  "${CONTAINER_NAME}" \
  hasura-cli \
    --project '/tmp/hasura-project' \
    --endpoint 'http://localhost:8080' \
    metadata \
    export

docker exec -it \
  "${CONTAINER_NAME}" \
  sh -c "cp /tmp/hasura-project/metadata/*.yaml /hasura-metadata/latest"

if diff -q "${PREVIOUS_VERSION}" latest &> /dev/null ; then
  echo 'New version is identical to previous. No changes needed.'
  rm -r "${PREVIOUS_VERSION}"
else
  echo 'New version created in `latest` directory'.
fi
