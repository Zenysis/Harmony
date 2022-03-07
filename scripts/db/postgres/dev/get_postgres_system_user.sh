#!/bin/bash -eu
set -o pipefail

# This script returns the user account that can run postgres locally on a dev
# machine. On mac, it is just the current user account. On Linux, it is the
# special `postgres` user.
# NOTE(stephen): This user account is *different* from the admin user account
# that is created inside Postgres. This user account only matters for running
# Postgres commands from the command line.

# If a `postgres` user account exists on the machine, this indicates that we
# likely will need to run commands using that account.
if id -u postgres &> /dev/null ; then
  echo 'postgres'
else
  echo "${USER}"
fi
