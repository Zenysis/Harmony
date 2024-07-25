#!/bin/bash -eu
set -o pipefail

# Find the mounts that have >= 90% space used.
full_mounts=$(df \
    --output='pcent,target' \
    -x 'tmpfs' \
    -x 'devtmpfs' \
    -x 'overlay' \
    -x 'squashfs' \
  | awk 'BEGIN {
    FS=" "
    OFS=" "
  }

  {
    # Skip header
    if (NR==1) {
      next;
    }

    if (strtonum($1) >= 90) {
      print "Running out of space: "$2" ("$1")";
    }
  }
')

if ! [ -z "${full_mounts}" ] ; then
  echo "On $(hostname)"
  echo "${full_mounts}"
  exit 1
fi
