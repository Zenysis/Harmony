#!/bin/bash

# This script is used to run the harmony backend locally.
# It consist of 5 arguments which are:
# 1. The environment file to be used
# 2. The email of the user to be created
# 3. The first name of the user to be created
# 4. The last name of the user to be created
# 5. The password of the user to be created

# Function to install and configure the virtual environment
setup_virtualenv() {
    echo "Creating virtual environment..."
    pwd
    python3.9 -m venv venv
    echo "Activating virtual environment..."
    source ./venv/bin/activate
    echo "Upgrading pip and installing dependencies..."
    python -m pip install --upgrade pip
    python -m pip install wheel==0.43.0
    python -m pip install --no-build-isolation -r requirements.txt -r requirements-dev.txt -r requirements-web.txt -r requirements-pipeline.txt
}

# Function to load environment variables
load_env_vars() {
    echo "Loading environment variables..."
    set -o allexport
    source $ENV_FILE
    set +o allexport
}

# Function to run pipeline processes
run_pipeline() {
    echo "Running pipeline processes..."
    ./pipeline/harmony_demo/process/process_all
    ./pipeline/harmony_demo/index/index_all
    ./pipeline/harmony_demo/validate/validate_all
}

# Function to initialize the database and populate indicators
init_db() {
    echo "Initializing the database..."
    yarn init-db harmony_demo --populate_indicators_from_config
}

# Function to create a user
create_user() {
    echo "Creating user $EMAIL..."
    ./scripts/create_user.py --username "$EMAIL" --first_name "$FIRST_NAME" --last_name "$LAST_NAME" --site_admin --password "$PASSWORD"
}

# Function to start the server
start_server() {
    echo "Starting the server..."
    yarn server
}

ENV_FILE=$1
EMAIL=$2
FIRST_NAME=$3
LAST_NAME=$4
PASSWORD=$5

echo "Using environment file: $ENV_FILE"

# Main execution starts here
setup_virtualenv
load_env_vars
run_pipeline
init_db
create_user $EMAIL $FIRST_NAME $LAST_NAME $PASSWORD
start_server

echo "All tasks completed successfully!"

