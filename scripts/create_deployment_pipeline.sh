#!/bin/bash -eu
set -o pipefail

if [ $# -ne 2 ] ; then
  echo 'Usage: ./create_deployment_pipeline.sh DEPLOYMENT_NAME DEPLOYMENT_CODE'
  echo 'DEPLOYMENT_NAME is the internal name the pipeline folder will be' \
       'stored under. Examples include: ethiopia, zambia, alliance_india'
  echo 'DEPLOYMENT_CODE should be the shorthand code this deployment is' \
       'referred to. It indicates what folder the config will be stored in.' \
       'Examples include: et, zm, alliance_india'
  exit 1
fi

# TODO(stephen): DEPLOYMENT_NAME is used differently here than it is in
# config.general. Update this script to match that naming convention.
DEPLOYMENT_NAME="$1"
DEPLOYMENT_CODE="$2"
ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)
DEPLOYMENT_NAME_PATTERN='^[a-z_]+$'

echo "Building deployment pipeline with name: ${DEPLOYMENT_NAME} \
for site code: ${DEPLOYMENT_CODE}"

if ! [[ "${DEPLOYMENT_NAME}" =~ ${DEPLOYMENT_NAME_PATTERN} ]] ; then
  echo "Deployment name must match pattern: ${DEPLOYMENT_NAME_PATTERN}"
  exit 1
fi

if ! [ -d "${ZEN_SRC_ROOT}/config/${DEPLOYMENT_CODE}" ] ; then
  echo 'Config must be defined before a deployment pipeline can be created'
  exit 1
fi

if [ -d "${ZEN_SRC_ROOT}/pipeline/${DEPLOYMENT_NAME}" ] ; then
  echo "Pipeline for deployment '${DEPLOYMENT_NAME}' already exists. Quitting"
  exit 1
fi

pushd "${ZEN_SRC_ROOT}/pipeline" &> /dev/null

# Copy the template pipeline as the base pipeline for this new deployment
cp -r template "${DEPLOYMENT_NAME}"

# Replace the templated text with this deployment's name
find "${DEPLOYMENT_NAME}/" -type f \
  | xargs -I template_filename \
      perl -pi -e "s:SAMPLE:${DEPLOYMENT_NAME}:g;" \
               -e "s:SITECODE:${DEPLOYMENT_CODE}:g" template_filename

echo "Successfully created new pipeline: ${DEPLOYMENT_NAME}"
