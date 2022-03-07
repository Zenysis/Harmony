#!/bin/bash -e
# Usage: ./create_deployment_database.sh <database name> <staging|prod|kvap-prod|kvap-staging>
#

# Colors
Color_Off='\033[0m'
BRed='\033[1;31m'
BYellow='\033[1;33m'
Gray='\033[90m'

if [[ $# -lt 2 ]]; then
  echo 'Usage: ./create_deployment_database.sh <database name> <staging|prod|kvap-[prod|staging]|mz-[prod|staging]|et-jcc-[prod|staging]>'
  echo 'Example: ./create_deployment_database.sh mz-staging staging'
  exit 1
fi

DB_NAME=$1
DEV_MODE=$2

ZEN_PG_PORT=5432
ZEN_PG_USERNAME="power_user"
ZEN_PG_ROLENAME="power_user"

if [[ "${DEV_MODE}" == "prod" ]]; then
  echo 'Using RDS prod database...'
  ZEN_PG_HOSTNAME="zenysis-production.csfqorosc2ec.us-east-1.rds.amazonaws.com"
fi
if [[ "${DEV_MODE}" == "staging" ]]; then
  echo 'Using RDS staging database...'
  ZEN_PG_HOSTNAME="zenysis-staging.csfqorosc2ec.us-east-1.rds.amazonaws.com"
fi
if [[ "${DEV_MODE}" == "kvap-prod" ]]; then
  echo 'Using Azure prod database...'
  ZEN_PG_HOSTNAME="kvap-postgres-prod2.postgres.database.azure.com"
  # Azure requires us to include hostname in username...
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}@kvap-postgres-prod2"
fi
if [[ "${DEV_MODE}" == "kvap-staging" ]]; then
  echo 'Using Azure staging database...'
  ZEN_PG_HOSTNAME="kvap-postgres-staging.postgres.database.azure.com"
  # Azure requires us to include hostname in username...
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}@kvap-postgres-staging"
fi
if [[ "${DEV_MODE}" == "mz-staging" ]]; then
  echo 'Using MZ staging database...'
  ZEN_PG_HOSTNAME="100.84.215.86"
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}"
fi
if [[ "${DEV_MODE}" == "mz-prod" ]]; then
  echo 'Using MZ prod database...'
  ZEN_PG_HOSTNAME="100.84.215.86"
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}"
fi
if [[ "${DEV_MODE}" == "pk-prod" ]]; then
  echo 'Using PK prod NTC database...'
  ZEN_PG_HOSTNAME="100.105.250.69"
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}"
fi
if [[ "${DEV_MODE}" == "et-jcc-prod" ]]; then
  echo 'Using ET JCC prod database...'
  ZEN_PG_HOSTNAME="harmony-prod.clnkgy7qwr3r.us-east-1.rds.amazonaws.com"
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}"
fi
if [[ "${DEV_MODE}" == "et-jcc-staging" ]]; then
  echo 'Using ET JCC staging database...'
  ZEN_PG_HOSTNAME="harmony-staging.clnkgy7qwr3r.us-east-1.rds.amazonaws.com"
  ZEN_PG_USERNAME="${ZEN_PG_USERNAME}"
fi


echo 'Enter postgres password when prompted...'
if [[ "${DEV_MODE}" == "prod" ]]; then
  echo 'Prod credential: https://phab.zenysis.com/K36'
fi
if [[ "${DEV_MODE}" == "staging" ]]; then
  echo 'Staging credential: https://phab.zenysis.com/K37'
fi
if [[ "${DEV_MODE}" == "kvap-prod" ]]; then
  echo 'KVAP prod credential: https://phab.zenysis.com/K170'
fi
if [[ "${DEV_MODE}" == "kvap-staging" ]]; then
  echo 'KVAP staging credential: https://phab.zenysis.com/K175'
fi
if [[ "${DEV_MODE}" == "mz-prod" ]]; then
  echo 'MZ prod credential: "zenpass"'
fi
if [[ "${DEV_MODE}" == "mz-staging" ]]; then
  echo 'MZ staging credential: "zenpass"'
fi
if [[ "${DEV_MODE}" == "pk-prod" ]]; then
  echo 'PK prod credential: "zenpass"'
fi
if [[ "${DEV_MODE}" == "et-jcc-prod" ]]; then
  echo 'JCC prod credential: https://phab.zenysis.com/K205'
fi
if [[ "${DEV_MODE}" == "et-jcc-staging" ]]; then
  echo 'JCC staging credential: https://phab.zenysis.com/K242'
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
echo -e "Running commands: ${Gray}${SQL_CREATE_USER}${Color_Off}"
psql -h ${ZEN_PG_HOSTNAME} -U "${ZEN_PG_USERNAME}" -p ${ZEN_PG_PORT} -W postgres -c "${SQL_CREATE_USER}"

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
echo -e "Running commands: ${Gray}${SQL_CREATE_DB}${Color_Off}"
psql -h ${ZEN_PG_HOSTNAME} -U ${ZEN_PG_USERNAME} -p ${ZEN_PG_PORT} -W postgres -c "${SQL_CREATE_DB}"

echo "Add HASURA requirements to ${DB_NAME} database..."
echo -e "Running commands: ${Gray}${SQL_ADD_HASURA_REQUIREMENTS}${Color_Off}"
psql -h ${ZEN_PG_HOSTNAME} -U ${ZEN_PG_USERNAME} -p ${ZEN_PG_PORT} -W ${DB_NAME} -c "${SQL_ADD_HASURA_REQUIREMENTS}"

echo 'Go to Passphrase @ https://phab.zenysis.com/passphrase/. Add this credential as a token and enable conduit sharing:'
echo -e "${BRed}postgresql://${DB_NAME}-admin:${DB_ADMIN_PASSWORD}@${ZEN_PG_HOSTNAME}/${DB_NAME}${Color_Off}"
echo 'Done.'
