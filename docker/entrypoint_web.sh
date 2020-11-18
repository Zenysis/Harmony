#!/bin/bash -eu
set -o pipefail

# Script called from docker to upgrade and run the web server in production.

# File that will be created to show that entrypoint initialization has been
# completed. This helps avoid spamming Rollbar with the same sourcemaps, and
# allows us to skip DB upgrading when the container is reused. When
# `docker restart web` is called, the same container filesystem will be used and
# this flag will be set.
INIT_COMPLETE='/tmp/initialization_completed'

pushd /zenysis &>/dev/null

if ! [ -f "${INIT_COMPLETE}" ] ; then
  echo 'Initializing server'
  ./initialize_new_container.sh

  echo 'Initialization complete'
  touch "${INIT_COMPLETE}"
fi

echo 'Running server...'
./run_web_gunicorn.sh

popd &>/dev/null
