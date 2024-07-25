#!/bin/bash -eu
set -o pipefail

# Standalone JS format script that will initialize venv if needed.

SCRIPT_DIR=$(cd "$(dirname "$0")" ; pwd -P)
VIRTUAL_ENV_DISABLE_PROMPT=1

# If not inside the venv, activate it.
if [ -z "${VIRTUAL_ENV:-}" ] ; then
  source "${SCRIPT_DIR}/../venv/bin/activate"
fi

"${SCRIPT_DIR}/format_js_files.py" $@
