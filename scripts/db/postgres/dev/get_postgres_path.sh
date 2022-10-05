#!/bin/bash -eu
set -o pipefail

# This script returns the postgress path locally on a dev machine.
# On newer versions of mac this changed to `/opt/homebrew/var/postgres`.

pg_path=""
paths=(
  "/usr/local/var/postgres"
  "/opt/homebrew/var/postgres"
)

for path in ${paths[*]}; do
  if [ -d "$path" ]; then
    pg_path=$path
    break
  fi
done

if [[ -n $pg_path ]]; then
  echo "${pg_path}"
else
  echo "Fatal error: postgres path not found."
  exit 1
fi
