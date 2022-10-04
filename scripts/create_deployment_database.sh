#!/bin/bash -e
# Usage: ./create_deployment_database.sh  <database-host> <database-name> <database-admin-user>
#

# Colors
Color_Off='\033[0m'
BRed='\033[1;31m'
BYellow='\033[1;33m'
Gray='\033[90m'

if [[ $# -lt 2 ]]; then
  echo 'Usage: ./create_deployment_database.sh  <database-host> <database-name> <database-admin-user>'
  echo 'Example: ./create_deployment_database.sh localhost harmony-staging postgres'
  exit 1
fi

ZEN_PG_HOSTNAME=$1
DB_NAME=$2
ZEN_PG_USERNAME=$3
ZEN_PG_ROLENAME=$3
ZEN_PG_PORT=5432


if [ -z "$ZEN_DB_LOG_ONLY" ]; then
  echo "Enter adminstrator postgres password for user "${ZEN_PG_USERNAME}" when prompted..."
  read -sp "Password: " ZEN_PG_PASSWORD
else
  echo "Logging only enabled..."
fi

DB_ADMIN_PASSWORD=$(openssl rand -base64 32)

SQL_CREATE_USER="$(cat <<-EOM

CREATE USER "${DB_NAME}-admin" WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    INHERIT
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD '${DB_ADMIN_PASSWORD}';

GRANT "${DB_NAME}-admin" TO "${ZEN_PG_ROLENAME}" WITH ADMIN OPTION;

EOM
)"

echo -e "Creating user ${DB_NAME}-admin with password ${BRed}${DB_ADMIN_PASSWORD}${Color_Off}"
echo -e "Running commands: ${Gray}${SQL_CREATE_USER}${Color_Off}\n"
if [ -z "$ZEN_DB_LOG_ONLY" ]; then
	PGPASSWORD=${ZEN_PG_PASSWORD} psql -h ${ZEN_PG_HOSTNAME} -U "${ZEN_PG_USERNAME}" -p ${ZEN_PG_PORT} postgres -c "${SQL_CREATE_USER}"
fi

SQL_CREATE_DB="$(cat <<-EOM

CREATE DATABASE "${DB_NAME}"
    WITH
    OWNER = "${DB_NAME}-admin"
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

EOM
)"

SQL_ADD_HASURA_REQUIREMENTS="$(cat <<-EOM

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS hdb_catalog;
CREATE SCHEMA IF NOT EXISTS hdb_views;

GRANT ALL ON SCHEMA hdb_catalog TO "${DB_NAME}-admin";
GRANT ALL ON SCHEMA hdb_views TO "${DB_NAME}-admin";

EOM
)"

echo "Creating the ${DB_NAME} database..."
echo -e "Running commands: ${Gray}${SQL_CREATE_DB}${Color_Off}\n"
if [ -z "$ZEN_DB_LOG_ONLY" ]; then
	PGPASSWORD=${ZEN_PG_PASSWORD} psql -h ${ZEN_PG_HOSTNAME} -U ${ZEN_PG_USERNAME} -p ${ZEN_PG_PORT} postgres -c "${SQL_CREATE_DB}"
fi

echo "Add HASURA requirements to ${DB_NAME} database..."
echo -e "Running commands: ${Gray}${SQL_ADD_HASURA_REQUIREMENTS}${Color_Off}\n"
if [ -z "$ZEN_DB_LOG_ONLY" ]; then
	PGPASSWORD=${ZEN_PG_PASSWORD} psql -h ${ZEN_PG_HOSTNAME} -U ${ZEN_PG_USERNAME} -p ${ZEN_PG_PORT} ${DB_NAME} -c "${SQL_ADD_HASURA_REQUIREMENTS}"
fi

echo 'Your newly created database connection string'
echo -e "${BRed}postgresql://${DB_NAME}-admin:${DB_ADMIN_PASSWORD}@${ZEN_PG_HOSTNAME}:${ZEN_PG_PORT}/${DB_NAME}${Color_Off}"
echo 'Done.'
