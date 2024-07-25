#!/bin/bash -eu
set -o pipefail

#################################################################################
# This script is run by the development Docker image to start the pipeline server
# for development purposes.
#################################################################################

# Start the actual server.
source venv/bin/activate && $COMMAND