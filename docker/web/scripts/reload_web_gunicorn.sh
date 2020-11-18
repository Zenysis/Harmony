#!/bin/bash -eu
set -o pipefail

# This script will reload the gunicorn web server. This will cause a
# re-initialization of the entire web app. A new gunicorn master process will be
# started and will take over for the existing master process.

# Location of gunicorn master PID.
PID_FILE='/tmp/gunicorn_master.pid'

# Location of a potentialy secondary master gunicorn process file. When the
# primary gunicorn process is being replaced, the new master will store its PID
# in this file until it becomes the new master.
CONCURRENT_MASTER_PID_FILE="${PID_FILE}.2"

# Maximum amount of sleep time to wait for the new master to load before
# aborting. Also the maximum amount of sleep time to wait for the old master to
# gracefully shut down.
MAX_SLEEP_TIME=240

if ! [ -f "${PID_FILE}" ] ; then
  echo 'Unable to find gunicorn master PID! Cannot continue'
  exit 1
fi

if [ -f "${CONCURRENT_MASTER_PID_FILE}" ] ; then
  echo 'Multiple gunicorn masters are running! Cannot continue'
  exit 1
fi

# NOTE(stephen): If multiple calls to reload are made from separate processes,
# there could be some really weird behavior. We could implement a file lock and
# use `flock`, however I didn't want to add the complexity *right now*.

# Grab the current gunicorn master process PID.
CURRENT_MASTER_PID=$(cat "${PID_FILE}")

# Send the USR2 signal to this process. This will instruct gunicorn to create a
# brand new master process that will replace the current master process.
echo 'Spawning new master gunicorn process'
kill -USR2 "${CURRENT_MASTER_PID}"

# Wait for the new master process to take over and start receiving requests.
# TODO(stephen): Potentially include loop breaker
sleep_time=0
while ! [ -f "${CONCURRENT_MASTER_PID_FILE}" ] ; do
  if (( sleep_time >= MAX_SLEEP_TIME )) ; then
    echo 'New master has not started quickly enough. Aborting'
    exit 1
  fi

  echo 'Waiting for new master to start'
  ((sleep_time += 1))
  sleep 1
done

echo 'New master has started!'

# Gracefully shutdown original master. This will allow any in-progress requests
# to complete.
echo 'Gracefully shutting down current master'
kill -TERM "${CURRENT_MASTER_PID}"

sleep_time=0
while [ -f "${CONCURRENT_MASTER_PID_FILE}" ] ; do
  if (( sleep_time >= MAX_SLEEP_TIME )) ; then
    echo 'Current master has not shut down fast enough. Aborting'
    exit 1
  fi

  echo 'Waiting for current master to shut down'
  ((sleep_time += 1))
  sleep 1
done

echo 'New master has taken over completely!'
echo "New master PID: $(cat "${PID_FILE}")"
