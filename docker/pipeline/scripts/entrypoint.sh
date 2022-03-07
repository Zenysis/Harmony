#!/bin/bash -eu
set -o pipefail

pushd /zenysis &> /dev/null

source venv/bin/activate
source prefect.env

echo '***** Starting Dask cluster in background *****'
./run_dask_cluster.sh &
sleep 3

echo '***** Registering pipelines inside Prefect *****'
./register_pipelines.sh &
sleep 3

echo '***** Running Prefect agent *****'
prefect agent start

popd &> /dev/null
