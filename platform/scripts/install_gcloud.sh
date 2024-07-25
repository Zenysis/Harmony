#!/bin/bash -e
SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd -P)

# If gcloud has already been installed, update it.
if command -v gcloud &> /dev/null ; then
  gcloud components update
  exit 0
fi

# Install and initialize gcloud.
curl https://sdk.cloud.google.com | bash

echo 'Gcloud installation complete. Beginning initialization.'

# Spawn a new shell to ensure the updated PATH is loaded.
exec -l "${SHELL}" "${SCRIPT_DIR}/init_gcloud.sh"
