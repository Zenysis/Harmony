#!/bin/bash -eu
set -o pipefail

##############################################################################
# This script is run by the development Docker image to start the web server
# for development purposes.
##############################################################################

# We need webpack to run in the background.
source venv/bin/activate && yarn webpack &
# We need to initialize the database.
source venv/bin/activate && ZEN_ENV=$ZEN_ENV yarn init-db $ZEN_ENV
# Start the actual server.
source venv/bin/activate && yarn server