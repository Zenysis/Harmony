#!/bin/bash -eu
set -o pipefail

# Register the pipelines with the Prefect server.

pushd /zenysis &> /dev/null

# HACK(stephen): Right now, the zeus arguments get baked into the flow that is
# sent to Prefect. This includes the PIPELINE_DATE env var. To work around this,
# we just need to reregister the pipeline at the start of each day.
while true ; do
  cur_date=$(date +%Y-%m-%d)
  echo "Registering pipelines for date: ${cur_date}"
  zeus_prefect/register_zeus_pipelines.py

  # Calculate how many seconds to sleep for so that we reregister the pipeline
  # at the beginning of the next day.
  cur_epoch=$(date +%s)
  target_epoch=$(date -d '+1 day 00:00' +%s)
  sleep_time=$(( target_epoch - cur_epoch ))

  echo "Sleeping ${sleep_time} seconds until next day"
  sleep "${sleep_time}"
done

popd &> /dev/null
