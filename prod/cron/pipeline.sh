#!/bin/bash
##########################################################################
#
# This bash script is intended to run as a cronjob on the pipeline server.
#
# IMPORTANT NOTE: Ideally the pipeline should be run by some orchestration
# /automation framework.
#
# Pre-requisites:
#  - The administrator user is authenticated with the container registry.
#  - The Harmony repository is cloned (or the required files are copied) to
#    /home/ubuntu/Harmony
#
# Instructions:
# - On pipeline server
# `crontab -e`
# - Then add a line, setting the frequency and changing the ZEN_ENV value
#   as needed.
# `0 0 * * */14 ZEN_ENV=harmony_demo /home/ubuntu/Harmony/prod/cron/pipeline.sh`
#
##########################################################################

set -euxo pipefail

# Run generate
COMMAND="./pipeline/$ZEN_ENV/generate/generate_wrapper run/..." DOCKER_HOST= docker compose --project-name harmony-etl-pipeline-$ZEN_ENV-generate --env-file /home/ubuntu/Harmony/.env.harmony.pipeline -f /home/ubuntu/Harmony/docker-compose.pipeline.yaml up --exit-code-from etl-pipeline

# Run process
COMMAND="./pipeline/$ZEN_ENV/process/process_all" DOCKER_HOST= docker compose --project-name harmony-etl-pipeline-$ZEN_ENV-process --env-file /home/ubuntu/Harmony/.env.harmony.pipeline -f /home/ubuntu/Harmony/docker-compose.pipeline.yaml up --exit-code-from etl-pipeline

# Run index
COMMAND="./pipeline/$ZEN_ENV/index/index_all" DOCKER_HOST= docker compose --project-name harmony-etl-pipeline-$ZEN_ENV-index --env-file /home/ubuntu/Harmony/.env.harmony.pipeline -f /home/ubuntu/Harmony/docker-compose.pipeline.yaml up --exit-code-from etl-pipeline

# Run validate
COMMAND="./pipeline/$ZEN_ENV/validate/validate_all" DOCKER_HOST= docker compose --project-name harmony-etl-pipeline-$ZEN_ENV-validate --env-file /home/ubuntu/Harmony/.env.harmony.pipeline -f /home/ubuntu/Harmony/docker-compose.pipeline.yaml up --exit-code-from etl-pipeline
