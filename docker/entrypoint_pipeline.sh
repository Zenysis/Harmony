#!/bin/bash -eu
set -o pipefail

#################################################################################
# This script is run by the Docker image to start the pipeline server.
#################################################################################

# Start the pipeline.
source venv/bin/activate && $COMMAND