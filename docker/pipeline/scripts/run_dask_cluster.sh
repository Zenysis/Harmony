#!/bin/bash -eu
set -o pipefail

pushd /zenysis &> /dev/null

source prefect.env

# Start dask
dask-scheduler &
sleep 1

# Run a dask worker for every cpu the system has.
for i in $(seq 1 $(nproc)) ; do
  dask-worker 'tcp://127.0.0.1:8786' &
done

# Wait for the dask system to terminate (shouldn't happen unless cluster is shut
# down).
# NOTE(stephen): Don't really care about exit code here.
wait

popd &> /dev/null
