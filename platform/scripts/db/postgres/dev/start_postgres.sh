#!/bin/bash -eu
set -o pipefail

echo "start_postgres.sh"

# if docker command exists then try to start the database.
if command -v docker &> /dev/null
then
  docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d postgres
  # Don't proceed until we can connect to the postgres server. This ensures that
  # subsequent commands will not fail due to the postgres server not being ready.
  until psql -h localhost -U postgres -c "select version()" &> /dev/null
  do
    echo "Waiting for postgres to start..."
    sleep 1
  done
  echo "Docker command exists"
else
  echo "Docker command does not exist - assuming postgres is running..."
  exit
fi

echo "done"