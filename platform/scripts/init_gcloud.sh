#!/bin/bash -eu
set -o pipefail

gcloud init
gcloud config set project zen-1234

echo 'Finished initializing gcloud.'
