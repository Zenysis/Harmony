#!/bin/bash -eu
set -o pipefail

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

CURRENT_VERSION=$(python -c '
from models.python.dashboard.version import LATEST_VERSION
print(LATEST_VERSION)
')
CURRENT_VERSION_SHORT="${CURRENT_VERSION//-/}"
CURRENT_VERSION_UNDERSCORE="${CURRENT_VERSION//-/_}"
CURRENT_VERSION_ID="VERSION_${CURRENT_VERSION_UNDERSCORE}"
NEW_VERSION=$(date +%Y-%m-%d)
NEW_VERSION_SHORT="${NEW_VERSION//-/}"
NEW_VERSION_UNDERSCORE="${NEW_VERSION//-/_}"
NEW_VERSION_ID="VERSION_${NEW_VERSION_UNDERSCORE}"
SCHEMA_DIR_NAME="schema_${CURRENT_VERSION_SHORT}"

NEW_IMPORT="
)
from models.python.dashboard.latest.model import (
    DashboardSpecification as DashboardSpecification_${NEW_VERSION_SHORT},"

UPGRADE_FN="def _upgrade_${CURRENT_VERSION_UNDERSCORE}_specification(specification):
    upgraded_specification = related.to_model(
        DashboardSpecification_${NEW_VERSION_SHORT}, specification
    )
    upgraded_specification.version = ${NEW_VERSION_ID}
    return related.to_dict(upgraded_specification)"

echo "Current version: ${CURRENT_VERSION}"
echo "New version: ${NEW_VERSION}"

pushd "${ZEN_SRC_ROOT}/models/python/dashboard" &> /dev/null

echo '(1/10) Storing latest schema in versioned directory'
# Check if the schema directory already exists. This should only happen if
# an eng is building a new schema on multiple different branches. If this
# happens, there could be `__pycache__` files left behind that preserves the
# folder. If the folder contains anything other than cache files, raise an
# error.
if [ -d "${SCHEMA_DIR_NAME}" ] ; then
  # Count the number of non-pycache files in the destination schema directory.
  non_pycache_file_count=$(find \
      "${SCHEMA_DIR_NAME}" \
      -type f \
    | grep \
        -P \
        -c \
        -v \
        '__pycache__/|\.pyc$' \
    || true)
  if [[ "${non_pycache_file_count}" != '0' ]] ; then
    echo 'Schema directory already exists! This should not be possible.'
    echo "Directory: $(pwd)/${SCHEMA_DIR_NAME}"
    exit 1
  fi
  rm -r "${SCHEMA_DIR_NAME}"
fi

mkdir -p "${SCHEMA_DIR_NAME}"
cp -r latest/* "${SCHEMA_DIR_NAME}"

echo '(2/10) Updating imports in version file'
perl \
  -pi \
  -e "s:\.latest\.:.${SCHEMA_DIR_NAME}.:;" \
  -e "s:(DashboardSpecification_${CURRENT_VERSION_SHORT},$):\$1${NEW_IMPORT}:" \
  version.py

echo '(3/10) Adding new version constants and updating LATEST_VERSION'
perl \
  -pi \
  -e "s:LATEST_VERSION = .+:${NEW_VERSION_ID} = '${NEW_VERSION}'\nLATEST_VERSION = ${NEW_VERSION_ID}:" \
  version.py

echo '(4/10) Updating DASHBOARD_SCHEMA_VERSIONS and NEXT_SCHEMA_VERSION_MAP'
perl \
  -pi \
  -e "s:(        ${CURRENT_VERSION_ID},):\$1\n        ${NEW_VERSION_ID},:;" \
  -e "s#(    ${CURRENT_VERSION_ID}): None,#\$1: ${NEW_VERSION_ID},\n    ${NEW_VERSION_ID}: None,#" \
  version.py

echo '(5/10) Adding a default spec upgrade method. You might need to customize this.'
perl \
  -pi \
  -e "s#(VERSION_TO_UPGRADE_FUNCTION = {)#${UPGRADE_FN}\n\n\$1#" \
  version.py

echo '(6/10) Registering the spec upgrade method.'
perl \
  -0pi \
  -e "s#(    VERSION_.+: _upgrade_.+_specification,)\n}#\$1\n    ${CURRENT_VERSION_ID}: _upgrade_${CURRENT_VERSION_UNDERSCORE}_specification,\n}#" \
  version.py

popd &> /dev/null

pushd "${ZEN_SRC_ROOT}" &> /dev/null

echo '(7/10) Updating EXPECTED_VERSION in the frontend DashboardSpecification.'

perl \
  -pi \
  -e "s:const EXPECTED_VERSION =.+:const EXPECTED_VERSION = '${NEW_VERSION}';:" \
  web/client/models/core/Dashboard/DashboardSpecification/index.js

echo '(8/10) Adding empty schema to config/dashboard_base.py'

NEW_EMPTY_SPECIFICATION=$(sed \
    -n "/EMPTY_SPECIFICATION_${CURRENT_VERSION_UNDERSCORE} = {/,/^}/p" \
    config/dashboard_base.py \
  | perl \
      -pe "s:${CURRENT_VERSION_UNDERSCORE}:${NEW_VERSION_UNDERSCORE}:;" \
      -e "s:${CURRENT_VERSION}:${NEW_VERSION}:")
perl \
  -pi \
  -e "s#EMPTY_SPECIFICATION = .+#${NEW_EMPTY_SPECIFICATION}\n\nEMPTY_SPECIFICATION = EMPTY_SPECIFICATION_${NEW_VERSION_UNDERSCORE}#" \
  config/dashboard_base.py

echo '(9/10) Adding all new files to git'
git add \
  "${ZEN_SRC_ROOT}/models/python/dashboard/${SCHEMA_DIR_NAME}" \
  "${ZEN_SRC_ROOT}/models/python/dashboard/version.py" \
  web/client/models/core/Dashboard/DashboardSpecification/index.js \
  config/dashboard_base.py

popd &> /dev/null

echo '(10/10) New dashboard specification has been created! You can now start making changes to the new schema'
