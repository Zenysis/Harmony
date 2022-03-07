#!/bin/bash -eu
set -o pipefail

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

if [ $# -ne 2 ] ; then
  echo 'Usage: ./create_deployment_config.sh DEPLOYMENT_CODE PRETTY_NAME'
  echo 'DEPLOYMENT_CODE should be the shorthand code this deployment is' \
       'referred to. It indicates what folder the config will be stored in.' \
       'Examples include: et, zm, alliance_india'
  echo 'PRETTY_NAME is the pretty, full deployment name.' \
       'Examples include: Ethiopia, Zambia, Alliance India'
  exit 1
fi

DEPLOYMENT_CODE="$1"
PRETTY_NAME="$2"
CONFIG_DIR="${ZEN_SRC_ROOT}/config/${DEPLOYMENT_CODE}"

echo "Deployment code: ${DEPLOYMENT_CODE}"
echo "Pretty deployment name: ${PRETTY_NAME}"
echo "Config directory: ${CONFIG_DIR}"

if [ -d "${CONFIG_DIR}" ] ; then
  echo 'Config directory already exists! Cannot continue.'
  exit 1
fi

pushd "${ZEN_SRC_ROOT}" &> /dev/null

echo "Copying config template to ${CONFIG_DIR}"
cp -r config/template "${CONFIG_DIR}"

popd &> /dev/null

pushd "${CONFIG_DIR}" &> /dev/null

# Replace config.template with correct import first.
echo 'Rewriting config template imports'
ag -l 'config\.template' \
  | xargs perl -pi -e "s:config\.template:config.${DEPLOYMENT_CODE}:"

# Replace deployment code usages.
echo 'Rewriting template deployment code usages'
ag -l 'template_deployment_code' \
  | xargs perl -pi -e "s:template_deployment_code:${DEPLOYMENT_CODE}:g"

# Replace the deployment name usages. Find instances where the deployment name
# is not used inside camelcased variables.
echo 'Rewriting template deployment name usages'
ag -l 'template_deployment_name' \
  | xargs perl -pi -e "s:template_deployment_name:${PRETTY_NAME}:g"

# Convert deployment name to camelcased variable and replace camelcased usages.
CAMEL_NAME=$(python \
  -c "\
from slugify import slugify
print(slugify('${PRETTY_NAME}', lowercase=False).title().replace('-', ''))")
echo "Rewriting camelcased template variable usages to ${CAMEL_NAME}"
ag -l 'TemplateCamelName' \
  | xargs perl -pi -e "s:TemplateCamelName:${CAMEL_NAME}:g"

popd &> /dev/null

echo 'Successfully created config'
