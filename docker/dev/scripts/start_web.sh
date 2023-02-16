#!/bin/bash -eu
set -o pipefail

##############################################################################
# This script is run by the development Docker image to start the web server
# for development purposes.
##############################################################################

# We need webpack to run in the background.
source venv/bin/activate && yarn webpack &
# Start the actual server.
source venv/bin/activate && yarn server