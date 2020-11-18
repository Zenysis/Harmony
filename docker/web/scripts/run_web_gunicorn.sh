#!/bin/bash
# Run a gunicorn server and block until it is no longer running. If the primary
# gunicorn server is replaced, this script will block until the replacement is
# no longer running as well.
# NOTE(stephen): Intentionally not using bash strict mode here since the
# gunicorn_server.py script can exit abnormally when the gunicorn master is
# replaced.

# Location of gunicorn master PID. Gunicorn will store its master process ID in
# this file when the server has fully initialized.
PID_FILE='/tmp/gunicorn_master.pid'

# Clean up pid file on first run in case container was stopped and the file was
# not cleared.
rm -f "${PID_FILE}"

# Start the first gunicorn server. This will block until it is killed (either
# because the server is shutting down or because the master is being replaced).
# NOTE(ian): If adjusting this timeout, also adjust nginx timeout in
# `prod/nginx/nginx_vhost_default_location`.
web/gunicorn_server.py --timeout=600 --pidfile "${PID_FILE}"

# Monitor the gunicorn PID file to detect if the server is still running. Prefer
# to loop like this since the master process can be replaced out-of-band by a
# different process. If the master process is replaced, gunicorn will
# technically still be running but we will no longer be blocking on a process
# (since the original master will terminate). Watching the PID file allows us to
# continue blocking even if the original gunicorn is replaced.
retry_count=0
while true ; do
  # NOTE(stephen): There are some edge cases where the master PID file will be
  # replaced *right when this while loop comes out of sleep*. This is because
  # gunicorn manages this file in multiple operations (the file of the original
  # master is first unlinked and then the new master's pid file replaces it).
  # To avoid prematurely exiting, just retry a few times.
  if ! [ -f "${PID_FILE}" ] ; then
    if (( retry_count > 2 )) ; then
      echo 'Master gunicorn process has ended.'
      break
    fi
    echo 'Master gunicorn process has gone away! Waiting to see if it is replaced...'
    ((retry_count += 1))
  else
    retry_count=0
  fi

  sleep 5
done
