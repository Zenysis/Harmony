#!/bin/bash -e
# Script called from docker to prepare the server and run it.

# Create the logs directory if it does not yet exist. It should be
# mounted by the caller though.
mkdir -p /logs

echo 'Waiting for db...'
scripts/wait_for_db.py

echo 'Running standard web entrypoint...'
docker/entrypoint_web.sh 2>&1 | tee /logs/web_server.log
