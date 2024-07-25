#!/bin/bash -eu
set -o pipefail

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd "${ZEN_SRC_ROOT}" &> /dev/null

DESTINATION='graphql/v2/schema.graphql'

echo "Updating schema in <src-root>/${DESTINATION} with latest version on the web server"
node_modules/.bin/gq 'http://0.0.0.0:5000/graphql' --introspect > "${DESTINATION}"

popd &> /dev/null
