The instructions to set up Harmony for local development on [https://github.com/Zenysis/Harmony](https://github.com/Zenysis/Harmony) are (currently) hard to follow.

Problems with instructions in repo:

- Assumes running everything Dockerized. This is all good an well, but I personally find it hard to do local development running the application in Docker.
    - Interactive debugging is more complicated
    - There are lots of mapping of volumes and permissions to take care of.
- There isn't a simple step to by step set of instructions, there's a lot of jumping to and fro.
- The instructions on the repo aren't battle tested, very few developers do local development in Harmony.

# Step by step instructions

## Assumptions

- You have python version 3.9.18 (or thereabouts) installed.
- You have node v18.17.1, npm 9.8.1 and yarn 1.22.19 (or thereabouts) installed.
- You have Docker 24.0.6 (or thereabouts) installed.
- You have the [minio](https://min.io/download) client installed
- You're using *nix

## Instructions

### Clone Repo

```
git clone https://github.com/Zenysis/Harmony.git
cd Harmony
```

### Install python dependencies

```
python -m venv venv
source ./venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt -r requirements-dev.txt -r requirements-web.txt -r requirements-pipeline.txt
```

### Install node dependencies

```
yarn install
```

### Prepare druid

You don't have to use a local druid server, but these instructions assume you do. If you're not running druid locally, you'll have to do a few things differently to get indexing to work.

Create a shared folder for druid

```
mkdir -p ~/home/share
```

Create `druid_setup/.env`:

```
SINGLE_SERVER_DOCKER_HOST=
DRUID_SHARED_FOLDER=<druid shared folder, e.g. /Users/jimbo/home/share>
DATA_OUTPUT_FOLDER=<data output folder, e.g. /Users/jimbo/data/output>
```

Start druid:

```
cd druid_setup
make single_sever_up
```

You can see if druid is starting up ok by looking at the logs:

```
make single_server_logs
```

You should now be able to visit druid on [http://localhost:8888/](http://localhost:8888/) (it can take a while to start up)

### Prepare environment file for web and pipeline

Create an environment file `.env.harmony_demo`with the following contents **replacing variable where appropriate!**

```
DEFAULT_SECRET_KEY=somesecret

ZEN_ENV=harmony_demo

DRUID_HOST=http://localhost
HASURA_HOST=http://localhost:8088

SQLALCHEMY_DATABASE_URI='postgresql://postgres:zenysis@localhost:5432/harmony_demo-local'

POSTGRES_HOST=localhost

# You can go to https://www.mapbox.com and create an API token.
MAPBOX_ACCESS_TOKEN=<some mapbox access token>

NOREPLY_EMAIL=noreply@<your domain here>
SUPPORT_EMAIL=suppport@<your domain here>

PYTHONPATH=<source folder, e.g. /Users/jimbo/Harmony>
ZEN_HOME=<source folder, e.g. /Users/jimbo/Harmony>
R77_SRC_ROOT=<source folder, e.g. /Users/jimbo/Harmony>
MC_CONFIG=~/.mc

POSTGRES_PASSWORD=postgres

DRUID_SHARED_FOLDER=<druid shared folder, e.g. /Users/jimbo/home/share>
DATA_OUTPUT_FOLDER=<data output folder, e.g. /Users/jimbo/data/output>
```

### Prepare database

```
# load environment variables
set -o allexport                                                       
source .env.harmony_demo   
set +o allexport

source ./venv/bin/activate
yarn init-db harmony_demo
```

### Prepare S3

1. You need the minio client installed
1. You need a `s3` alias in your minio config
1. You need a `zenysis-harmony-demo` bucket, with a `self_serve` folder ; thus you need `s3/zenysis-harmony-demo/self_serve` to exist.

```
# trick s3 into having a self_serve folder
touch delete_me
mc cp delete_me s3/zenysis-harmony-demo/self_serve/delete_me
rm delete_me
```

The pipeline should run without self_serve folder present, but following the steps above removes any confusing error logs that could distract you at this point in the setup.

### Run pipeline

As noted above, these instructions assume your running druid on your development machine.

```
set -o allexport                                                       
source .env.harmony_demo   
set +o allexport

source ./venv/bin/activate

./pipeline/harmony_demo/process/process_all

./pipeline/harmony_demo/index/index_all

./pipeline/harmony_demo/validate/validate_all                       
```

### Start web server

Start webpack:

```
yarn webpack
```

In a separate terminal, start the flask server:

```
set -o allexport                                                       
source .env.harmony_demo   
set +o allexport

source ./venv/bin/activate

yarn server
```

You should now be able to browse to the login screen on [http://localhost:5000/](http://localhost:5000/)

You can log in user the default user that is created in a development setup (user: `demo@zenysis.com` password: `zenysis` or create your own user:

```
set -o allexport                                                       
source .env.harmony_demo   
set +o allexport

source ./venv/bin/activate

./scripts/create_user.py --username <EMAIL ADDRESS> --first_name <FIRST NAME> --last_name <LAST NAME> --site_admin --password <PASSWORD>
```

# Step by step instructions (using Docker)

TBD
