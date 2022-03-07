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

UPGRADE_DOWNGRADE_FNS="def _upgrade_${CURRENT_VERSION_UNDERSCORE}_specification(specification):
    '''UPGRADE DESCRIPTION GOES HERE'''
    upgraded_specification = related.to_model(
        DashboardSpecification_${NEW_VERSION_SHORT}, specification
    )
    upgraded_specification.version = ${NEW_VERSION_ID}
    return related.to_dict(upgraded_specification)


def _downgrade_${NEW_VERSION_UNDERSCORE}_specification(specification):
    '''DOWNGRADE DESCRIPTION GOES HERE'''
    downgraded_specification = related.to_model(
        DashboardSpecification_${CURRENT_VERSION_SHORT}, specification
    )
    downgraded_specification.version = ${CURRENT_VERSION_ID}
    return related.to_dict(downgraded_specification)"

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

echo '(4/10) Updating DASHBOARD_SCHEMA_VERSIONS, NEXT_SCHEMA_VERSION_MAP, and PREVIOUS_SCHEMA_VERSION_MAP'
perl \
  -0pi \
  -e "s:(        ${CURRENT_VERSION_ID},):\$1\n        ${NEW_VERSION_ID},:;" \
  -e "s#(    ${CURRENT_VERSION_ID}): None,#\$1: ${NEW_VERSION_ID},\n    ${NEW_VERSION_ID}: None,#;" \
  -e "s#(    ${CURRENT_VERSION_ID}: VERSION_.+,)\n}#\$1\n    ${NEW_VERSION_ID}: ${CURRENT_VERSION_ID},\n}#" \
  version.py

echo '(5/10) Adding default spec upgrade and downgrade methods. You might need to customize these.'
perl \
  -pi \
  -e "s#(VERSION_TO_UPGRADE_FUNCTION = {)#${UPGRADE_DOWNGRADE_FNS}\n\n\n\$1#" \
  version.py

echo '(6/10) Registering the spec upgrade and downgrade methods.'
perl \
  -0pi \
  -e "s#(    VERSION_.+: _upgrade_.+_specification,)\n}#\$1\n    ${CURRENT_VERSION_ID}: _upgrade_${CURRENT_VERSION_UNDERSCORE}_specification,\n}#;" \
  -e "s#(    VERSION_.+: _downgrade_.+_specification,)\n}#\$1\n    ${NEW_VERSION_ID}: _downgrade_${NEW_VERSION_UNDERSCORE}_specification,\n}#" \
  version.py

popd &> /dev/null

pushd "${ZEN_SRC_ROOT}" &> /dev/null

echo '(7/10) Updating EXPECTED_VERSION in the frontend DashboardSpecification.'

perl \
  -pi \
  -e "s:const EXPECTED_VERSION =.+:const EXPECTED_VERSION = '${NEW_VERSION}';:" \
  web/client/models/core/Dashboard/DashboardSpecification/index.js

echo '(8/10) Adding unit test for dashboard downgrade and upgrade'

TEST_UPGRADE_DOWNGRADE="    def test_upgrade_downgrade_${NEW_VERSION_UNDERSCORE}_specification(self):
        '''TEST DESCRIPTION GOES HERE'''
        my_dashboard_spec = upgrade_spec_to_current(
          self.specification, ${CURRENT_VERSION_ID}
        )
        # make a copy of my_dashboard_spec as a normal dict (a) to store the 
        # original values before the spec is mutated in upgraded_spec() and (b)
        # so that key order doesn't matter 
        my_dashboard_spec_dict = json.loads(json.dumps(my_dashboard_spec))
        upgrade_function = VERSION_TO_UPGRADE_FUNCTION[${CURRENT_VERSION_ID}]
        downgrade_function = VERSION_TO_DOWNGRADE_FUNCTION[${NEW_VERSION_ID}]
        upgraded_spec = upgrade_function(my_dashboard_spec)
        downgraded_spec = downgrade_function(upgraded_spec)

        # converting from ordered dict to normal dict so key order doesn't matter
        downgraded_spec_dict = json.loads(json.dumps(downgraded_spec))
        diff = DeepDiff(
          my_dashboard_spec_dict, 
          downgraded_spec_dict, 
          ignore_order=False, 
          ignore_numeric_type_changes=True
        )

        self.assertEqual(my_dashboard_spec_dict, downgraded_spec_dict, diff)"

echo -e "\n${TEST_UPGRADE_DOWNGRADE}" >> models/python/dashboard/tests/test_schema_upgrade_downgrade.py
    
echo '(9/10) Adding all new files to git'
git add \
  "${ZEN_SRC_ROOT}/models/python/dashboard/${SCHEMA_DIR_NAME}" \
  "${ZEN_SRC_ROOT}/models/python/dashboard/version.py" \
  models/python/dashboard/tests/test_schema_upgrade_downgrade.py \
  web/client/models/core/Dashboard/DashboardSpecification/index.js

popd &> /dev/null

echo '(10/10) New dashboard specification has been created! You can now start making changes to the new schema'
