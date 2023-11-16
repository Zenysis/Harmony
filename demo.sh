#!/bin/bash

DRUID_SHARED_FOLDER=~/druid/home/share
DATA_OUTPUT_FOLDER=~/druid/data/output

#######
# MINIO
#######

# # Create an environment file if it doesn't exist.
# if [ ! -f ".env.demo.minio" ]; then
#     password=$(cat /dev/urandom | tr -dc 'A-Za-z0-9!' | head -c 13)

#     echo "MINIO_DATA_FOLDER=./
# MINIO_ROOT_USER=minio_demo
# MINIO_ROOT_PASSWORD=$password" > .env.demo.minio
# fi
# # Load the environment file
source .env.demo.minio
# # Start the minio server.
# docker compose --env-file .env.demo.minio -f docker-compose.minio.yaml up --detach
# # Create an alias for the minio server.
# docker exec -it harmony-minio-1 /bin/bash -c "mc alias set local http://localhost:9000 minio_demo $MINIO_ROOT_PASSWORD"
# # Create a bucket.
# docker exec -it harmony-minio-1 /bin/bash -c "mc mb /local/zenysis-harmony-demo"
# # Create a self serve folder in the bucket
# docker exec -it harmony-minio-1 /bin/bash -c "touch /tmp/delete_me && mc cp /tmp/delete_me /local/zenysis-harmony-demo/self_serve/delete_me && rm /tmp/delete_me"

#######
# DRUID
#######

# mkdir -p ~/druid/home/share
# mkdir -p ~/druid/data/output

# if [ ! -f "druid_setup/.env" ]; then
#     echo "SINGLE_SERVER_DOCKER_HOST=
# DRUID_SHARED_FOLDER=$DRUID_SHARED_FOLDER
# DATA_OUTPUT_FOLDER=$DATA_OUTPUT_FOLDER" > druid_setup/.env
# fi

# cd druid_setup
# make single_server_up
# cd ..

###############################
# Prepare Harmony Configuration
###############################

mkdir -p ./.mc
if [ ! -f ".mc/config.json" ]; then
    echo "{
    \"version\": \"10\",
    \"hosts\": {
        \"s3\": {
            \"url\": \"http://host.docker.internal:9000\",
            \"accessKey\": \"$MINIO_ROOT_USER\",
            \"secretKey\": \"$MINIO_ROOT_PASSWORD\",
            \"api\": \"S3v4\",
            \"lookup\": \"auto\"
        }
    }
}" > ./.mc/config.json
fi

if [ ! -f ".env.demo" ]; then

    POSTGRES_PASSWORD=$(cat /dev/urandom | tr -dc 'A-Za-z0-9!' | head -c 13)

    echo "DEFAULT_SECRET_KEY=somesecret

ZEN_ENV=harmony_demo

DRUID_HOST=http://host.docker.internal
HASURA_HOST=http://hasura:8080

DATABASE_URL='postgresql://postgres:zenysis@postgres:5432/harmony_demo-local'

POSTGRES_HOST=postgres

# You can go to https://www.mapbox.com and create an API token.
MAPBOX_ACCESS_TOKEN=some_mapbox_access_token

NOREPLY_EMAIL=noreply@zenysis.com
SUPPORT_EMAIL=suppport@zenysis.com

MC_CONFIG_PATH=./.mc

POSTGRES_PASSWORD=$POSTGRES_PASSWORD

DRUID_SHARED_FOLDER=$DRUID_SHARED_FOLDER
DATA_OUTPUT_FOLDER=$DATA_OUTPUT_FOLDER

# Assuming you've created a minio alias called "local":
OBJECT_STORAGE_ALIAS=local" > .env.demo
fi

source .env.demo

##########################
# Prepare Harmony Database
##########################

# docker compose --env-file .env.demo -f docker-compose.yaml -f docker-compose.dev.yaml convert
# docker compose --env-file .env.demo -f docker-compose.yaml -f docker-compose.dev.yaml run --rm web /bin/bash -c "source venv/bin/activate && yarn init-db harmony_demo"

##################
# Run the pipeline
##################

echo COMMAND="./pipeline/harmony_demo/generate/generate_wrapper run/...\ \
    docker compose --project-name harmony-etl-generate --env-file .env.demo \
    -f docker-compose.pipeline.yaml up






