[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md) [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Documentation Contents

1. [Harmony overview](#harmony-overview)

Server/environment setup:

2. [Project initialization](#project-initialization)
3. [Local development setup](#local-development-setup)
4. [Object storage setup](#object-storage-setup)
5. [Production pipeline server setup](#production-pipeline-server-setup)
6. [Production PostgreSQL server setup](#production-postgresql-server-setup)
7. [Production web server setup](#production-web-server-setup)
8. [Production Druid server setup](#production-druid-server-setup)

Codebase customization:

9. [Writing integrations](#writing-integrations)
10. [Backup and recovery process](#backup-and-recovery-process)
11. [Contribution and quality assurance process](#contribution-and-quality-assurance-process)


Product documentation:

12. [Product overview](#harmony-products)
13. [Architecture overview](#architecture-overview)
14. [Roadmap overview](#roadmap-overview)

Community engagement: 

15. [Community engagement policy](#community-engagement-policy)
16. [Governance structure](#governance-structure)
17. [Feature requests](#feature-requests)
18. [Future community plans](#future-community-plans)
19. [Do no harm policy](#do-no-harm-policy)

Ownership considerations: 

20. [Cost of ownership](#cost-of-ownership)


## Harmony overview

The Harmony Analytics Platform (Harmony), developed by [Zenysis Technologies](https://www.zenysis.com/), helps make sense of messy data by transforming, cleaning and enriching data from multiple sources. With Harmony, disparate data are displayed within a single analytical view, giving you a complete picture of your data through triangulated queries and customizable visualizations and dashboards.

Harmony supports two critical workflows for organizations:

- **Data Integration**: Through its data pipeline, Harmony ingests raw data from various sources, harmonizes it into a consistent format, and stores it in a database. Source data systems remain unaltered and unaffected–Harmony essentially serves as a data integration layer that sits on top of source data systems.
- **Advanced Analytics**: Harmony enables you to analyze millions of data points at sub-second speed, and quickly uncover insights you can use to make better decisions. Users can easily access and query newly integrated data in Harmony via a web browser.

We developed Harmony to serve in a variety of global health and development contexts, including HIV, tuberculosis and malaria programs, supply chain management, emergency response, immunization and vaccination campaigns, and resource allocation and coordination. Harmony works with structured data sources typically found in these settings, including health management information systems (e.g. DHIS2), logistic management information systems (e.g. OpenLMIS), Excel and CSV files, survey data (e.g. Demographic and Health Surveys) and scorecards. Governments in more than eight low- and middle-income countries in Asia, Africa, and Latin America have leveraged Harmony’s core functionality to improve and manage their health and development programs.

## Project initialization

### Repository setup

While you're welcome to create a public fork of Harmony for your project, you likely want to maintain a private mirror of the repository to protect information like your API tokens.

```
$ git clone --bare  https://github.com/Zenysis/Harmony.git
$ cd Harmony.git && git push --mirror https://github.com/EXAMPLE-USER/NEW-REPOSITORY.git
```

### Creating a new configuration

We refer to Harmony projects as "deployments". Each deployment has its own databases, data sources, and is hosted separately.

Deployment configurations are created in the `config/` directory. There is a configuration template in `config/template` and an example configuration in `config/harmony_demo`. The first step in setting up your Harmony deployment is to select a two or three-letter project code and create your own `config/<project code>` directory. (🎉) Next, copy the `config/template` directory into your new directory.

At minimum, the following configuration files must be updated (documentation inside the files provides instructions):

- Customize basic settings (e.g. site name) in `config/<project code>/general.py` and `config/<project code>/ui.py`

Some of the config variables require your Druid and PostgreSQL hosts to be set up. See [Production PostgreSQL server setup](#production-postgres-server-setup) and [Production Druid server setup](#production-druid-server-setup).

After you have written your first data integration (see [writing integrations](#writing-integrations)):

- Create dimensions for querying in `datatypes.py`
- Customize aggregation options in `aggregation.py`
- Add indicators based on the field ids you created in the pipeline step

We are working on making this customization easier (and configurable from a frontend) in future releases.

### Providing access tokens

To ensure that Harmony operates as intended, several external services are available as optional features. These services must be instantiated or swapped out from the codebase as needed. It is essential to have active accounts for the following services:

- Mailgun API key; see [Instructions](https://signup.mailgun.com/new/signup)

> Mailgun is not a core dependency. Harmony’s core data integration platform (used for pipeline orchestration and integrating data into Druid) runs without the mailing service. In addition, there are [capabilities in the backend](https://github.com/Zenysis/Harmony#seeding-the-database) to manage user registrations to Harmony’s analytics product such that a mailing service is not required. Mailgun can be switched out for an alternative in Harmony with limited code changes. This means an implementer of Harmony can choose to forgo the use of Mailgun if they wanted to use an alternative. Users can substitute the Mailgun API call for a call to another client, such as [Postal](https://github.com/postalserver/postal) (an open source email client). To do this, the API calls to the new client would need to switch to the new client’s API and input structure, the email class would need to be updated with the new client’s initialization, and the configuration files would need to include the new client’s credentials. Given the source code is open source, we leave that decision to the Harmony user.

- Mapbox access token; see [Generating a Mapbox Access Token](#generating-a-mapbox-access-token) below

> Mapbox is not a mandatory dependency. If a Harmony user were to not provide a Mapbox API token, then Harmony analytics would still function as expected but map layers would be disabled. In addition, a Harmony user can easily sign up to Mapbox and leverage the free tier for up to 50k monthly map loads. In our experience so far, no Harmony user has surpassed this number of monthly loads.

#### Generating a Mapbox Access Token

Harmony currently uses [mapbox](https://www.mapbox.com/) for all Map UI visualisations. In order to use our map visualisations, you need to have your own `Mapbox Access Token`.

> You can read more about access tokens [here](https://docs.mapbox.com/help/getting-started/access-tokens/#how-access-tokens-work).

1. Open your Mapbox account (Sign up [here](https://account.mapbox.com/auth/signup/) or sign in [here](https://account.mapbox.com/auth/signin/)).
2. You will find your **Default public token** on the homepage (the token will typically start with `pk`). You can also access your tokens under the [Acccess tokens](https://account.mapbox.com/access-tokens/) page.
3. In your Harmony project, assign your Mapbox access token to envrionment variable `MAPBOX_ACCESS_TOKEN`

For many Harmony projects, the free tier of Mapbox will be sufficient. Refer to [pricing](https://www.mapbox.com/pricing/#map-loads-for-web) for more information.

### Misc. initialization notes

When you run a script or the web server, select a configuration by setting the `ZEN_ENV` environmental variable. This environmental variable maps directly to folder names in `config/`, and will cause the `config` module to export the contents of that particular configuration.

      Say there is configuration directory named `usa`. We can specify that configuration with the following:

      ```bash
      export ZEN_ENV='usa'
      ```

## Local development setup

In order to run a local web server or run data pipeline steps on the command line, you'll need to set up a local development environment. This is distinct from setting up production servers (explained in other sections).

The instructions found below are for running a local development environment using Docker.

[Step by step instructions for running "un-containerised" can be found on the Harmony Wiki](https://github.com/Zenysis/Harmony/wiki/Local-Development-%E2%80%90-Step-by-step-instructions).

### Prepare environment

1. Install the latest version of [Docker](https://docs.docker.com/get-docker/).
2. Clone the git repository: `git clone https://github.com/Zenysis/Harmony`. (Alternatively, you may want to fork the repo and clone the fork — that way you can use version control for your customization.)
3. Build your development docker images: `make build` (this will take some time!)

### Configure environment

You may either

1. Create a `.env` file in the root directory of the project and add the following lines:

```
DRUID_HOST=<druid host goes here>
ZEN_ENV=<environment>
DEV=1
DOCKER_HOST=
```

> `DEV=1` indicates to the Makefile that you are in "development" mode, and uses the appropriate docker compose files.
> `DOCKER_HOST=` indicates to docker that you are connecting to your local docker instance.

2. Add the environment variables listed above to your system environment variables
3. Or set them in your terminal each time before running the docker compose command

All instructions going forward will assume that the environment variables have been set.

### Prepare Database

Run `make dev-prepare-database`

### Run Web Server

1. Run `make up`
2. In a separate terminal, connect to the running web container, run `SERVICE=web make exec-bash`
3. Now run: `source venv/bin/activate && ./scripts/create_user.py --username=me@mydomain.com --password=password --first_name=admin --last_name=istrator --site_admin`
4. Browse to website on [http://localhost:5000](http://localhost:5000) and log in with the credentials used in step 3.

### Run Pipeline

1. Execute a command on the pipeline container `COMMAND=<your command here> make up-dev-pipeline`
   or
1. Get a terminal on the pipeline container: `SERVICE=pipeline make run-bash`

### Run development tools

1. Run translations: `SERVICE=web make exec-bash` then `source venv/bin/activate && yarn translations`

### Next steps & useful tips

- You can do a lot with docker compose that's beyond the scope of this document, but a good starting point is `docker compose --help`
- Know what containers are running: `make ps`
- It's useful to have a terminal open on the web instance: `SERVICE=web make exec-bash` ; furthermore running `source venv/bin/activate` will activate the python virtual environment.
- You can start a container and attach to the shell with: `SERVICE=web make run-bash`.

## Object storage setup

The Harmony system uses object storage on the pipeline and web server to store files and historical backups of raw data. There needs to be an object storage server and client. The server is flexible and can be Amazon S3, Azure Blob Storage, MinIO server, etc. The instructions below are for MinIO, which is open source, but any object storage server would work. The client is required to be a MinIO client and requires no additional setup since it is already included in the dev and pipeline Dockerfiles.

### MinIO Server Setup (Optional)

As described above, any object storage server works and using a MinIO server is optional. [MinIO server documentation](https://min.io/docs/minio/container/index.html).

1. Follow the [instructions](https://docs.docker.com/engine/install/ubuntu/) to install Docker on Linux (Ubuntu).
2. Set the requisite environment variables in a `.env` file: `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`.
3. Create directory for Docker volume. This location can be customized with the `MINIO_DATA_FOLDER` env variable.

```
sudo mkdir /localdisk/data
```

4. Switch volume directory to non-root ownership. (On machines without an "ubuntu" user, other default, non-root users can be swapped in here.)

```
sudo chown ubuntu:ubuntu /localdisk/data
```

5. Start the minio server. You will then be able to access the minio console at http://&lt;ip address&gt;:9090.

```bash
make minio-server-up
```

### MinIO Client Setup (Required)

1. Set the requisite environment variables in a `.env` file: `OBJECT_STORAGE_ALIAS` and `MC_CONFIG_PATH`. `OBJECT_STORAGE_ALIAS` is an alias name for the object storage server and can be anything. It will be used in the pipeline like `mc cp <alias>/<path>`. `MC_CONFIG_PATH` is a folder on the machine that will be the working directory for the minio client. If the web and pipeline containers are not running on the same machine, then these steps will need to be run for the web machine as well.
2. Enter the pipeline bash container with `make bash-pipeline`.
3. Add the object storage alias. If using a minio server, then the host url will be the machine IP at the 9000 port, the user will be `MINIO_ROOT_USER`, and the password will be `MINIO_ROOT_PASSWORD`.

```bash
mc alias set <alias> <host url> <user> <password>
```

4. Create a bucket matching the `ZEN_ENV`. The bucket name should be prefixed with "zenysis-" followed by the `ZEN_ENV` and any underscores in the `ZEN_ENV` should be replaced with "-". For example, the bucket for "harmony_demo" is "zenysis-harmony-demo".

```bash
mc mb <alias>/<bucket name>
```

## Production pipeline server setup

The pipeline server runs the ETL data pipeline to generate datasources (typically, daily). These pipeline server setup instructions were developed for Ubuntu. Currently, the instructions are also written with the assumption that Druid is running on the same machine.

1. Configure your server's users, firewall, etc. Sign in.
2. Follow the [instructions](https://docs.docker.com/engine/install/ubuntu/) to install Docker on Linux (Ubuntu).
3. Set the requisite environment variables in a `.env` file: `$DATABASE_URL`, `$ZEN_ENV`, `$DRUID_HOST`, `$PIPELINE_USER`, `$PIPELINE_GROUP`, `$DEFAULT_SECRET_KEY`, and `$HASURA_HOST`.
   > Running `id` on the host machine will show you your user and group IDs.
4. Optionally add `$DRUID_SHARED_FOLDER` and `$OUTPUT_PATH` if the defaults are not suitable. Set `$DOCKER_HOST` if connecting to remote host.
5. Create directories for Docker volumes.

```
sudo mkdir /home/share
sudo mkdir /data/output
```

5. Switch volume directories to non-root ownership. (On machines without an "ubuntu" user, other default, non-root users can be swapped in here.)

```
sudo chown ubuntu:ubuntu /home/share
sudo chown ubuntu:ubuntu /data/output
```

6. Start and enter pipeline container. This will automatically enter the virtual environment. After this step, it will be possible to execute pipeline commands using Zeus.

```bash
make bash-pipeline
```

7. Optionally, you may want to configure an automated task runner like GitLab, CircleCI, or Jenkins (to automate pipeline runs on a set schedule). Passing the environment variable `COMMAND` you can specify what steps to run when the container starts.

## Production PostgreSQL server setup

You will have to set up a [PostgreSQL](https://www.postgresql.org/) database to host relational data and web application state.

### Production PostgreSQL : getting started

It is highly recommended to use a relational database cloud service like Amazon RDS for its guarantees related to security, availability, backups, etc. If your project is restricted from using a cloud service, we provide [instructions for running postgres in a Docker container](docker/postgres/README.md).

#### Docker installation

1. Follow the [instructions](https://docs.docker.com/engine/install/ubuntu/) to install Docker on Linux (Ubuntu).

2. Populate an file `.env.postgres` adding the following entries:

```plaintext
DOCKER_HOST=<server hosting your docker container, blank if localhost>
POSTGRES_USER=<postgres super user>
POSTGRES_PASSWORD=<postgres super user password>
PG_DATA=<optionally, specify where to store the database files e.g. /usr/local/pgsql/data>
```

(specify a username and password for the postgres **SUPERUSER**, **keep the credentials safe!**)

Refer to "postgres" section of docker-compose.db.yaml for further configuration options.

3. Start the postgres database server:

Using the docker-compose.db.yml file:

```bash
# Start the postgres server in a docker container.
docker compose --env-file .env.postgres -f docker-compose.db.yaml up --detach
```

On the first run, the database will be initialized and a "super user" will be created with the specified username and password.

Postgres will run in "detached" mode, meaning it will run in the background. If you wish to see the logs you can run:

```bash
# Fetch logs from the postgres container.
docker compose --env-file .env.postgres -f docker-compose.db.yaml logs
```

If you wish to stop the postgres database you can run:

```bash
# Stop the postgres container.
docker compose --env-file .env.postgres -f docker-compose.db.yaml down
```

### Power User creation

Regardless of installation approach, the postgres server will require a **SUPERUSER** account. (if you used the Docker installation instructions above, this was already done for you, and you can skip this step.)

By default the **SUPERUSER** account has access to all databases on the server. We do not share the **SUPERUSER** credentials with the instance. The instance has its own credentials and ability to manage its own database.

> Provide your own, secure password for the **SUPERUSER** user. **Keep it safe!**

```sql
CREATE USER "<YOUR POSTGRES SUPER USER>" WITH
  LOGIN
  SUPERUSER
  CONNECTION LIMIT -1
  PASSWORD '<YOUR POSTGRES SUPER USER PASSWORD>';
COMMIT;
```

### Deployment database

Postgres should now be up and running with a **SUPERUSER**. Now the database instance for your deployment needs to be created.

Running the below script, replace `<POSTGRES_HOST>` with the hostname/IP of your postgres instance (example: _localhost_) and `<INSTANCE_DB_NAME>` with the database name you want to use (example: _harmony_) and `<POSTGRES_SUPER_USER>` with the **SUPERUSER** username you created.

```bash
# Run script in the web container that will generate the sql commands to create the database.
DOCKER_HOST=<server hosting the web container, or blank on local machine> make create-db-setup-script POSTGRES_HOST=<POSTGRES_HOST> POSTGRES_USER=<POSTGRES_SUPER_USER> INSTANCE_DB_NAME=<INSTANCE_DB_NAME>
```

Take note of the sql commands that are output. You will need to run them on your postgres instance to create the database.

If you are using the Docker installation instructions above, to run postgres locally, you can run the below script to connect to the postgres instance and run the sql commands:

```bash
# Connect to the postgres container and run the psql program interactively.
docker compose --env-file .env.postgres -f docker-compose.db.yaml exec postgres bash
psql -U <POSTGRES_SUPER_USER> -h localhost
```

Set `DATABASE_URL` as your deployment database connection string in your environment initialization step. Here is an example of what that may look like: `export DATABASE_URL='postgresql://test_admin:test_pwd@my.postgres.host/harmony'`

### Seeding the database

After we've created our deployment database, we need to initialize it with seed data. This section addresses upgrading the database schema to ensure consistency with the latest version. The web server will not start unless the database schema version matches the latest version in the source tree.

We need to create all the database tables and configure all constraints, sequences, and other details contained in the database schema.

1. If you have not already done so, follow the [instructions](#production-web-server-setup-:-getting-started) to configure the web server.
2. Upgrade the database by running the below script:

```bash
# Run the upgrade script inside the web container.
make upgrade-database
```

> If you cannot run the above, the database upgrade is also done on initialization of the web container.

Once we've upgraded the database and populated the appropriate seed values, we'll need to create a user account so that we can login via the web UI.

```sh
ADMIN_USERNAME=<YOUR_USERNAME> ADMIN_PASSWORD=<YOUR_PASSWORD> ADMIN_FIRSTNAME=<YOUR_FIRST_NAME> ADMIN_LASTNAME=YOUR_LAST_NAME make create-admin-user
```

## Production web server setup

### Before you begin

- Ensure you have the following running and accessible:

  - Postgres database, see [Production Postgres server setup](#production-postgres-server-setup)
  - Druid database, see [Production Druid server setup](#production-druid-server-setup)

- We recommend configuring tools for monitoring system status and resource usage as well.

### Production web server setup : getting started

Before deploying the web server, we need to setup some configuration to ensure everything will connect up.

1. Environment File

Create a `.env` file and copy paste the below, updating all values as needed.

```properties
# docker related:
DOCKER_NAMESPACE=zengineering
DOCKER_TAG=latest
# DOCKER_HOST=ssh://<WEB_REMOTE>
WEB_REMOTE=<ip or dns that maps to the web server, usually some private ip/dns>

# lets encrypt related:
WEB_LETSENCRYPT_HOST=<your domain>
WEB_LETSENCRYPT_EMAIL=<your domain email>

# nginx related:
NGINX_VHOST=/home/ubuntu/nginx_vhost_default_location
WEB_VIRTUAL_HOST=<your web server url>

# email related:
EMAIL_HOST=<smtp server>
EMAIL_HOST_USER=<smtp server username>
EMAIL_HOST_PASSWORD=<smtp server password>
#MAILGUN_SMTP_ACCOUNT_ID=<optional, if using mailgun>
#EMAIL_TAG_HEADER_NAME=<optional tag, defaults to "X-Mailgun-Tag"
#EMAIL_USE_ENCRYPTION=<optional encryption, defaults to "tls">
NOREPLY_EMAIL=<no reply email>
SUPPORT_EMAIL=<support email>

# web server related:
DATA_PATH=/data
ZEN_ENV=<project code>
DATABASE_URL="postgresql://<INSTANCE USER>:<INSTANCE PASSWORD>@<POSTGRES HOST>:5432/<INSTANCE DATABASE>"
DRUID_HOST=<http://your.druid.instance>
MAPBOX_ACCESS_TOKEN=<mapbox access token>
```

> Ensure that all the file references (e.g. NGINX_DEFAULT_VHOST_CONFIG) are correct.

> DOCKER_HOST can be configured to use a remote Docker host, see [Docker Remote API](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option)

### Docker builds

#### Pre-built

There are pre-built Harmony Docker images that can be found at [hub.docker.com](https://hub.docker.com/r/zengineering/harmony-web) for:

- harmony-web-server
- harmony-web-client
- harmony-web

#### Custom Builds

In certain cases you would want to make changes to Harmony or setup your own config pre-built in the Docker image, for that you can run the below:

> Set DOCKER_NAMESPACE, DOCKER_TAG in your .env file

```bash
# build everything
make build
```

or

```bash
# build something specific
SERVICE=web make build
```

### Deploying web

If you have [druid configured](#production-druid-server-setup), and have successfully created a druid datasource, you should now be ready to deploy the web server.

> `make configure` uses `WEB_REMOTE` over ssh with public key authentication. Confirm the IP specified is reachable & [public key authentication](https://kb.iu.edu/d/aews) is enabled before proceeding.

> `make up` uses `DOCKER_HOST`, Refer to [Docker Remote API](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option) for configuration.

```bash
# Initial setup for the web server, using docker compose.
make configure
# Deploy to remote server, using docker compose.
make up
```

Once deployed you should be able to login at your domain specified in `WEB_VIRTUAL_HOST`, logging in with the credentials created in [Seeding The Database](#seeding-the-database).

## Production Druid server setup

[Apache Druid](https://druid.apache.org/docs/latest/design/index.html) is an OLAP database built to handle large analytical queries. It is:

- Column-oriented, NoSQL built for analytical workloads
- Distributed and scalable (via Apache Zookeeper)
- Open source and customizable to many types of hardware

Harmony uses Druid as a datastore for queryable data produced by the ETL pipeline. A new Druid collection is created every time the pipeline runs. This ensures that all datasets reflect a single common snapshot in time and makes it possible to inspect historical records for tampering and other inconsistencies.

![](https://static.slab.com/prod/uploads/posts/images/h0kkzOZmq9pOgWwhc5n9T93t.png)

### Setup overview

This setup makes use of [docker compose](https://docs.docker.com/compose/) to easily spin up and manage Druid. For cluster configuration, we use a [Druid Docker Environment file](https://druid.apache.org/docs/latest/tutorials/docker.html#environment-file).

> The instructions describe how to spin up a Druid cluster on a **single** server _or_ on **multiple** servers. Druid recommends having a [clustered deployment](https://druid.apache.org/docs/latest/tutorials/cluster.html) running on multiple servers for production instances.

Druid resource settings are usually tied to your hardware specifications. The optimized configuration in `environment` works for most Harmony deployments. Allocation can be changed based on your usage requirements. See [Druid Configuration](https://druid.apache.org/docs/latest/tutorials/docker.html#configuration) for more.

These instructions were written for Ubuntu operating systems.

### Instructions

The first step is to update the appropriate `DOCKER_HOST` in `druid_setup/.env`.

- For a single-server cluster, set `SINGLE_SERVER_DOCKER_HOST` to your local Druid host. (This is the default DOCKER ENDPOINT printed when `docker context ls` is run.)
- For a multiple-server cluster, set the `CLUSTER_*_SERVER_DOCKER_HOST` variables to the machine IPs partitioned for each service ([master, data, and query](https://druid.apache.org/docs/latest/tutorials/cluster.html)).
  - There are some additional environment variables that have to be configured for a multi-server cluster to run optimally.
    - Common config is located in `druid_setup/cluster/environment/common.env` (`druid_zk_service_host`, `druid_metadata_storage_connector_connectURI`, and `druid_cache_hosts`)
    - Coordinator config is located in `druid_setup/cluster/environment/coordinator.env` (`druid_host`)
    - Historical config is located in `druid_setup/cluster/environment/historical.env` (`druid_host`)
  - Also, ensure that [public key authentication](https://kb.iu.edu/d/aews) is enabled.

Next, create the following directories on the remote server:

- /home/share
- /data/output

Finally, deploy the appropriate Druid cluster:

> Single server setup:

```bash
cd druid_setup
# Deploy single server mode
make single_server_up
```

> Cluster server setup:

```bash
cd druid_setup
# Deploy cluster server mode
make cluster_server_up
```

Once all containers are running, the Druid router console should be available at http://{SERVER_IP}:8888/.

### Troubleshooting

- If running Compose V1 (now deprecated), install the [docker-compose-plugin](https://docs.docker.com/compose/install/) package. Otherwise you will need to update all `druid_setup/Makefile` commands to call `docker-compose ...` instead of `docker compose ...`. (Replace the space with a hyphen.)

- If running your `make *_server_up` command causes a `org.freedesktop.secrets` error, run `sudo apt install gnupg2 pass`.

- If certain containers are continuously restarting, their services likely require more memory. Adjust the resource settings in the `druid_setup/*/environment` files or upgrade your machine(s).

## Writing integrations

This project comes with a built-in ETL pipeline that has been proven to work in a variety of global health contexts.

It provides a general framework for scraping data from any number of data sources or APIs, tools for standardizing this data in a common format (called Zenysis Base Format), and libraries for merging these disparate datasets together in such a way to make them mutually queryable.

Our data pipeline is based on [Zeus](https://github.com/room77/py77/tree/master/pylib/zeus), an open-source, command-line oriented pipeline runner. Note that Zeus processes files in order of numeric prefix, so given three tasks, `00_fetch_gender`, `00_fetch_sex`, and `03_convert`, Zeus will run 00_fetch_gender and 00_fetch_sex synchronously, then run 03_convert when both are complete.

On a technical level, a "data pipeline" is comprised by three stateless sub-pipelines: Generate → Process → Index.

**Generate**

In short: this pipeline runs queries and collects data from an external source.

The data generation pipeline is used for providing data sets to the process and validate pipelines in a stateless manner. Tasks in the data generation pipeline tend have specific requirements around network access (like running within a specific intranet), task duration (like long running machine learning jobs), or complex source data transformations (like a convoluted excel workbook that is rarely updated and only needs to be cleaned once) that make them unsuitable for running in the other pipelines.

Tasks within the data generation pipeline must handle data persistence themselves by uploading to object storage such as AWS S3 or Minio.

**Process**

In short: this pipeline integrates raw data, cleans it, and standardizes the keys.

This is where the majority of a deployment's data integration work happens. The data processing pipeline is used for transforming and merging multiple different data sets into a single common format that can be stored in a database by the index; pipeline. Dimension value matching and unification across sources will happen in this pipeline.

**Index**

The data indexing pipeline uploads the published data from the process pipeline into the datastores (like Druid and Postgres) used by the frontend for querying and data display.

### Formatting data for ingestion

The easiest way to prepare data for ingestion is by conforming to a flexible predefined CSV format that we refer to as **Zenysis Base Format**.

A `process_csv"` module is included in the repository at `data/pipeline/scripts/process_csv.py`. This module accepts tabular data in a variety of compatible formats and transforms it for fast indexing into the Druid database. In our experience, `process_csv` is flexible enough to handle a significant majority of health data sources in the development sector with little customization or editing.

Before we get into how you should format your data, let's define some terminology:

- **dimension**: A column that you want to group by or filter on. Examples of this are "Region" or "Gender." These columns represent categorical data and all values in these columns are strings.
- **date**: The date associated with this datapoint, as a string formatted YYYY-MM-DD.
- **field**: An indicator or dataset name. Usually it's best to [slugify](https://www.google.com/search?q=slugify&oq=slugify&aqs=chrome..69i57j0l5.503j0j0&sourceid=chrome&ie=UTF-8) these. For example, "Malaria Cases" may become "malaria_cases" or "MalariaCases." The values in these columns are numeric.

The simplest Zenysis Base Format is as follows:

```
dimension1, dimension2, ..., dimensionN, date, field1, field2, ..., fieldN
```

Here's an example set of columns and an example row:

| **RegionName** | **SubregionName** | **DistrictName** | **Date**   | **MalariaCases** | **MeaslesCases** | **NumberOfDoctors** |
| -------------- | ----------------- | ---------------- | ---------- | ---------------- | ---------------- | ------------------- |
| North America  | United States     | District 13      | 2019-01-01 | 150              | 0                | 20                  |
| North America  | Canada            | Albert           | 2019-02-15 | 0                | 2                | 1                   |

If you are integrating a single field, you may use the following format:

```
dimension1, dimension2, ..., dimensionN, date, field, val
```

Here's an example of valid input that follows that format:

| **RegionName** | **SubregionName** | **DistrictName** | **Date**   | **field**     | **val** |
| -------------- | ----------------- | ---------------- | ---------- | ------------- | ------- |
| North America  | United States     | District 13      | 2019-01-01 | population    | 150000  |
| North America  | United States     | District 13      | 2019-02-15 | malaria_cases | 150     |
| North America  | United States     | District 2       | 2019-02-15 | malaria_cases | 22      |

There is more to learn about the CSV processor - it supports a variety of formats, wildcards, and even Python hooks. See `data/pipeline/scripts/process_csv.py` for a README.

When calling process_csv, you must specify the `date` column, the `sourcename` (a label for your datasource), and the `prefix` for all indicators produced (usually the name of your datasource or some other informative tag). You will also have to specify some input and output files. You can call `process_csv` from your Python pipeline scripts directly, or invoke it on the command line.

## Backup and recovery process

Harmony does not include built-in backup or restore functionality. As such, it is the responsibility of implementers to design and configure appropriate backup strategies based on their deployment environment (cloud or on-premise), data retention policies, and operational needs.

### What to Back Up

To support basic recoverability and system continuity, we recommend implementers ensure the following components are backed up regularly:
- PostgreSQL database: This contains metadata, configurations, and system state. It can be backed up using database dumps or automated snapshots (e.g. AWS RDS snapshots).
- Object storage: If using S3, MinIO, or another object storage solution, data stored here (uploaded files, pipeline input/output) should be included in backup policies. S3 provides configurable versioning and lifecycle policies to support automated backups.
- Pipeline output and logs: While not critical for system continuity, logs and output files may be useful for debugging or auditability. These can be backed up to persistent storage depending on local policy.
- Druid data (optional): Druid can re-ingest data from pipeline outputs. However, if preserving historical data sources or real-time segments is necessary, consider backing up the Druid deep storage directory (e.g. NFS or S3).
- Other components (e.g. frontend services, container configurations) can typically be restored via redeployment using existing configuration files and code, and do not generally require separate backup.

### Cloud Environments (e.g. AWS)
Cloud providers typically offer robust, built-in tools for backup and recovery:
- PostgreSQL: Use services like AWS RDS snapshots or scheduled database dumps.
- Object Storage: Enable S3 versioning, replication, or lifecycle policies to support redundancy.
- VMs: Use image snapshots (e.g. AWS AMIs or EBS Snapshots) for infrastructure components if needed.
- Automation: Backup jobs can be scheduled using native cloud tools or workflows like AWS Backup.

### On-Premise Environments
On-premise deployments require implementers to define and configure their own backup mechanisms:
- PostgreSQL: Use pg_dump or scheduled cron jobs to create periodic backups.
- Object Storage: MinIO and similar tools support replication and snapshotting; external scripts or tools may be needed.
- VMs: Consider using hypervisor-based snapshotting (e.g. via VMware, Proxmox, or KVM).
- File-based backup: Use scheduled rsync jobs or tar-based archiving for logs.

### Implementation Considerations
- The appropriate backup frequency and retention policy should be defined based on operational risk tolerance, cost, and compliance requirements.
- For production systems, we recommend a minimum of daily PostgreSQL backups, and weekly snapshot or system backups where feasible.
- Regularly test restore procedures to ensure backup integrity.


## Contribution and Quality Assurance Process

We welcome contributions to Harmony and strive to maintain a high standard of code quality, performance, and stability across the platform.

Developers looking to adapt or extend the system should follow these core contribution and QA guidelines:
- Issue First: Before beginning major work, open a GitHub Issue to describe the proposed change and align with maintainers.
- Fork and Branch: Work should be done in a feature branch from a forked repository, following semantic naming conventions (e.g., feature/dimension-matching-improvement).
- Code Standards: Contributions should follow the existing code structure and style. Aim for clean, modular, and well-documented code.
- Testing Requirements: All contributions must
    - Include test coverage for new features or logic changes (unit or integration tests as appropriate).
    - Pass all existing automated tests.
    - Avoid introducing regressions or breaking backward compatibility.
- Review and Merge: Submit a Pull Request with a clear description of the changes and link to any related Issues. Maintainers will review for correctness, clarity, alignment with roadmap priorities, and QA compliance.
- Latest Version: Contributions should be based on the latest version of the Harmony repository’s main branch. Documentation and code structure may vary across versions, but the most up-to-date QA and development practices are reflected in the current codebase.

We are continuously working to improve our developer documentation. For technical questions or clarification, reach out via harmony@zenysis.com.

## Harmony Products

### Overview Page

The Overview Page is a personalized ‘landing’ page you see when you log into the platform. It is intended to provide you with an overview and easy access to the different parts of the platform you regularly work with.

From the Overview Page, you can easily access official dashboards and other dashboards you or your colleagues have created. For each dashboard, key information such as date of creation, your last date of visit, and number of views is displayed.

![](https://slabstatic.com/prod/uploads/rzv7xv5j/posts/images/CX3qZsFy_HPrSk5XAt512Znw.png)

### Analyze

The Analyze page is your primary means to interact with your data. This is where your analysis usually starts. The page allows you to construct basic and advanced queries and visualize the data in flexible ways. It enables you to select the indicators, geographies and reporting periods your analysis requires. The Analyze page also offers you various visualization tools such as bar charts, time (line) graphs, heat tiles and maps you can use to explore and present your data.

To run a query, you simply go to the Analyze page (click on ‘Analyze’ button in the navigation bar) and select your:

1. Indicator(s) from the available datasets
1. Aggregation level(s) (‘Group By’)
1. Geographic and date range filters (‘Filters’)

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/vPBE685C74CiUUVQXzVBOB6b.png)

Once you have made your query selections, you will be able to visualize your data using different visualizations. These include Table, Scorecard, Bar Chart, Time Graph, Map, Heat Tiles and Ranking. The visualization picker will intuitively guide you in selecting a visualization whose requirements are fulfilled. For example, you can only use a “Time Series” visualization if you have selected a time aggregation in your query. All visualizations designed in the “Analyze” tool can then be added to Dashboards.

In addition, the platform provides useful post-query functionalities for more advanced needs:

- Custom calculations: you can create new and more complex indicators, known as “custom calculations”, by mathematically combining existing ones in your query. The calculations tool lets you use both logical and mathematical operations to create these new indicators.
- Filtering: Filtering results (which is different from filters you used to set the scope of your analysis) will help you to limit the results shown on your visualizations after you run your initial query. By applying different conditions and rules, you can, for example, remove below average results from your visualization.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/CyR_J448UIZssPygvVf9aeEA.png)

### Dashboards

A dashboard represents a collection of analyses that you wish to save for a variety of purposes, including to give a presentation, make a report or to monitor continuously. Dashboards can store any analysis that you create on Analyze, whether it takes the form of a graph, table or time series.

Dashboards also support different types of content such as text, images, dividers and iFrames. These content types enable the user to craft report-like dashboards and tell a more complex story about their data.

In addition, users can add dashboard-level filters and aggregations. For example, a user can modify the date range, geographical filters and level of aggregation of data within the dashboard directly. In this way, your personal dashboard becomes a dynamic tool which you can use for monitoring key data points across various dimensions and do further exploratory analysis.

![](https://slabstatic.com/prod/uploads/rzv7xv5j/posts/images/8U7BgpOLDCNwIzjt6Uc34lVL.png)

In the top navigation bar for a dashboard, users can click

- Play - enter a presentation mode with full screen view, where each tile is its own slide
- Share - export the dashboard as a link, email, or download
- Add content - add a text box, visualization, iFrame, spacer, or divider to the dashboard
- The percentage to modify page fit
- Settings - modify the following capabilities of the dashboard:

![](https://slabstatic.com/prod/uploads/rzv7xv5j/posts/images/FUYhGhSa94jAIcN20738bFNh.png)

### Alerts

An alert is a query that is constructed around a threshold of interest or a relationship between two indicators to you and your team. When these thresholds are crossed in the data, an alert is automatically triggered in the platform. Instead of retrospectively looking for how many cases of a certain disease were reported in a certain area, you can set up an alert that will proactively trigger an automated notification when a certain number of cases are reported in a given area. This is especially useful for epidemiological and data quality use cases.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/4nY_aAz4AD0GjyEJp7jTjTZh.png)

### Data Quality Lab

The objective of Data Quality Lab (DQL) is to help you identify potential reporting and data quality issues for your indicators and provide you with tools to diagnose and investigate these issues. The information and tools in DQL allows you to attempt to diagnose the specific data quality issues the indicator has and the score could be used to assess trends or changes as a result of actions taken. DQL allows diagnostics of all types of indicators, even complex indicators integrated from other systems.

The aim of the Quality Score is to give you an at-a-glance idea of whether or not the user can trust an indicator&#39;s data. The things to be assessed as input to the score are shown in the tabs below, with their denominator representing their weight in the score. These inputs are inspired by the dimensions laid out in WHO&#39;s Data Quality Framework - and we will be adding more tabs to cover more dimensions of data quality over time.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/Ka6-hOtKy2Gb1-LBRo-n8-_E.png)

There are two data quality areas being assessed in DQL:

1. Indicator Characteristics: this tab summarizes some basic facts about the indicator that may impact reporting or data quality, as well as explaining how they affect the score. After choosing an indicator, you’ll see cards displaying the indicator’s age, time since the last report, reporting completeness trend and estimated reporting periods. Both age and freshness are counted in terms of the number of estimated reporting periods (i.e. months if it’s a monthly report).
1. Reporting Completeness: The score is based on the consistency in the number of reports received per reporting period. The more consistent, the better it is for the score. Within this tab, there are investigative tools designed to enable you to identify where reporting completeness issues may be coming from.

### Admin App

The Admin App is used by administrators of the platform to manage user access and permissions. The interface allows administrators to give or revoke access to users, to create and manage user groups and to edit access and permissions levels for users on the platform.

The Admin option is only available to users with administrative permissions, which can only be granted by another platform administrator.

To access the Admin App, click on the menu button at the top right corner of your screen and then click on ‘Admin.’ This will take you to the Admin page where you will notice four tabs:

- Users: view and manage platform users or invite new users
- Groups: view and manage platform groups or create new ones
- Role Management: view and manage platform roles or create new ones
- Site Configuration: manage platform settings like the default homepage

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/9SSfiiRI7OYgS9Ks2jTU5CXl.png)

### Data Catalog

Data Catalog enables Data Managers to manage their indicators and augment them with useful information. Specifically this allows:

- Organizing datasets into a hierarchical structure that is surfaced in the Analyze tool
- Hide or make visible specific groups of data
- Provide useful metadata to indicators (e.g. definitions, operations etc.)
- Create new custom calculations

In Data Catalog, the Analyze hierarchical selector is organized in the form of a directory table that resembles a ‘file system’. This allows us to navigate and organize categories (folders) and indicators (files) in a familiar format. The indicators themselves are the files in the file system. Each file is its own page called the Indicator Details page. This page contains metadata about each indicator and options to edit that metadata.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/aWreLFOT62th7O9mV_pznYCF.png)

### Data Digest

The Data Digest tool is an internal tool that can be used by administrators to manage aspects of the integration pipeline. For example:

- Pipeline overview: this includes information about the most recent pipeline and a summary of location matching.
- Data source overview: this includes an overview of the number of data points, indicators, mapped and unmatched location for each data source integrated via the pipeline.

### Field Setup

The Field Setup App allows users to set up fields that are in Druid and not yet in Data Catalog, and therefore visible to end users to be queried.

The app is populated with the id, data source, and default sum calculation for each field and users can edit the name, description, calculation, and category. Once the fields are ready, they can be published to Data Catalog.

![](https://slabstatic.com/prod/uploads/rzv7xv5j/posts/images/71BllLgN_UIJ0yWjjAaSxi2X.png)

## Architecture Overview

The architecture diagram below describes Harmony’s robust data integration platform, outlining how data moves seamlessly from initial ingestion to impactful use by analysts, decision-makers, and external systems.

<img width="1148" alt="Screenshot 2025-04-25 at 5 34 05 PM" src="https://github.com/user-attachments/assets/9b86dd0d-9f57-4d8c-a5e7-acdb1cd36046" />

- Data Sources: Data enters the system from diverse sources—like electronic health records, disease surveillance platforms, facility registries, and logistic management systems. These datasets often differ significantly in format, complexity, and quality.

- Data Integration Pipeline (Zeus ETL, Python): A sophisticated pipeline designed specifically to address these challenges by:
Generation: Automatically extracting data from the original source systems. The way data is accessed and generated is flexible; it can happen via API or direct database replication; using prod or staging instances; configured at different times; with concurrency etc. 

  - Processing: Cleaning, standardizing, and harmonizing data into a unified, consistent structure. This step ensures accuracy and comparability across datasets from different geographies, programmatic areas etc. 

  - Indexing: Efficiently organizing the harmonized data, allowing for faster retrieval and analysis.

  - Validation: Automatically checking the integrated data for accuracy and completeness, ensuring high-quality outputs. For instance, this step auto-flags outliers. 

- Object Storage (MinIO): Provides a scalable and temporary holding place during data integration, ensuring pipeline stability, facilitating parallel processing, and supporting handling of large volumes of data.

- Data Warehouse (Apache Druid): At the heart of RHAP is a high-performance data warehouse optimized for large-scale analytics. Druid supports real-time queries across billions of records, making it ideal for rapid analyses, trend tracking, and real-time decision-making critical in public health scenarios. More on this in the next slide. 

- Relational Database (PostgreSQL): Stores essential metadata, such as user permissions, dashboard specifications, indicator and dimension metadata in data catalog, and other platform settings, ensuring users see the data and analysis most relevant to their specific context and role.

- Web Server (Python/Flask): Serves as the primary bridge between stored data and the user. It manages and translates user queries into efficient Druid queries, formats the resulting datasets, and securely delivers tailored information back to the web interface and external applications.

- Web Interface & Visualizations (React.js): The user-facing portal, built to enable intuitive data exploration and decision-making. Users—from ministry staff to hospital data managers—can quickly visualize trends, uncover insights, and directly interact with harmonized data through dashboards and reports. 

- API Gateway (Python): Allows external applications and third-party systems, such as national health portals or other data systems, to seamlessly and securely access harmonized data from RHAP. This multiplies the value derived from integrated datasets across the broader health system. This also means that other analytics systems can be leveraged if desired. 


## Roadmap Overview 

At Zenysis, we are committed to continuously improving Harmony to better serve governments and organizations around the world. While our roadmap may evolve based on new learnings and priorities, our current development focus over the next 12–24 months includes four major investment areas:

### 1. Operational Efficiency

We are continually enhancing the technical foundations of Harmony to make deployments even more efficient, reliable, and scalable.
Example initiatives include:
- Improving pipeline performance and maintainability
- Updating core back-end and front-end dependencies to enhance security and speed
- Enhancing platform logs and monitoring tools for faster troubleshooting

### 2. Mobile and Collaboration

We are expanding Harmony’s reach by strengthening mobile support and enabling more collaborative workflows.
Example initiatives include:
- Improving mobile user experience and use of dashboards on the go
- Supporting offline access to dashboards for mobile users
- Enabling collaboration and data sharing directly through the platform

### 3. AI-Powered Data Insights

We are integrating Large Language Models (LLMs) to help users more easily interpret and act on data within Harmony.
Example initiatives include:
- Deploying lightweight, open-source AI models optimized for cost and performance to support data use 
- Fine-tuning models using programmatic and contextual content to enable data querying and interpretation

### 4. Technical Ownership Tooling

We are investing in tools that make it even easier for users and technical teams to manage Harmony deployments independently.
Example initiatives include:
- Building front-end tools to simplify management of data integrations
- Enhancing user tooling to support dimension resolution workflows
- Providing server monitoring recommendations using open-source technologies

These initiatives are forward-looking and subject to change based on user feedback, evolving needs, and collaboration with our partners. We are excited to continue advancing Harmony as an open, powerful, and sustainable tool for integrated data management and decision-making.

## Community Engagement Policy

We are excited to see Harmony being shared and implemented across different geographies. While we do not yet have a formal open-source community program, we are committed to supporting and engaging with users and implementers in a responsible and respectful way.

Our basic community engagement policies are:
- Open Communication: We welcome feedback, questions, and ideas related to Harmony. You can reach us directly at harmony@zenysis.com.
- Join Our Community Slack: We invite users, implementers, and contributors to join the Harmony Community Slack: https://join.slack.com/t/harmonycommunitygroup/shared_invite/zt-34wabc1kw-TM38_~8k9~6nf3f_Et0Rpw. The Slack workspace provides a space for discussion, technical support, feature ideas, collaboration, and announcements. Please review and respect the community guidelines posted in Slack to ensure a welcoming environment for all participants.
- Respectful Interaction: We expect all communications to be respectful and constructive. We are committed to maintaining a professional and inclusive environment for all individuals engaging with the project.
- Working with the Repository: Developers and implementers are encouraged to engage with the Harmony repository directly.
  - If you encounter a bug, have a feature request, or a question, please open a GitHub Issue.
  - If you would like to contribute a solution, feel free to open a Pull Request.
  - Before submitting a pull request, please:
    - Open an Issue to discuss the proposed change, unless it is a small fix.
    - Ensure your code follows our general style and structure (consistency is appreciated).
    - Write clear commit messages and include relevant context or references.
    - Ensure your changes do not break existing functionality.
  - Be respectful and collaborative in reviews and discussions.
  - Contributions will be reviewed on a best-effort basis, prioritizing available capacity and alignment with the platform roadmap.
- Transparency:We aim to be transparent about the development of Harmony. Major updates and changes to the platform will be documented through our public GitHub repository.
- Support Boundaries: While we strive to be responsive, please note that support is provided on a best-effort basis. We prioritize responses based on available capacity and alignment with the core roadmap.

## Governance Structure

The Harmony project is currently maintained and stewarded by Zenysis Technologies.

Roles and Responsibilities
- Zenysis Maintainers: Zenysis leads the development, maintenance, and strategic direction of Harmony. Maintainers are responsible for reviewing issues and pull requests, setting priorities, approving changes, and ensuring the project evolves in line with its mission.
- Community Contributors: We welcome external contributions from the community, including bug reports, feature suggestions, and pull requests. Contributors are encouraged to collaborate through open discussion, propose improvements, and engage respectfully with maintainers and other community members.
- Community Participants: Implementers and users of Harmony are invited to share feedback, suggest ideas, and participate in discussions. While participants may not have direct decision-making authority, their input helps shape the project roadmap and priorities.

Decision-Making
- Zenysis maintains decision-making authority for the Harmony project, including decisions about feature inclusion, releases, and roadmap prioritization.
- We strive to make decisions transparently, taking community feedback into account wherever possible.
- As the community grows, we aim to evolve the governance model to support broader participation.

## Feature Requests

We welcome suggestions for new features and improvements to Harmony.
If you have ideas that could help improve the platform for your use case or for the broader community, please let us know!

You can:
- Open a GitHub Issue to start a public discussion, or
- Submit a request anonymously via our Feature Request Form: https://docs.google.com/forms/d/e/1FAIpQLSeX5wFi-O4XPtcmfw4bD9gtfEhnEgjX9htmVYtGayVjrFPr3w/viewform?usp=header 

All submissions will be reviewed and considered as part of our product planning process.

## Future Community Plans

As Harmony adoption grows, we aim to strengthen and expand our support for the open-source community. Some initiatives we are considering include:
- Periodic Community Calls: Hosting regular virtual calls to bring together implementers, share updates, highlight new features, and discuss lessons learned from deployments.
- Expanded Documentation and Guides: Developing more detailed resources to help new users and implementers onboard more easily and contribute to the project.
- Community-Driven Roadmap Input: Exploring mechanisms for community feedback to help shape priorities and future enhancements to Harmony.

We look forward to growing alongside the community and will share updates as these initiatives take shape.


## Do No Harm Policy

Zenysis is committed to ensuring that Harmony is used in ways that support positive social impact and protect individuals and communities.

By engaging with, using, or contributing to Harmony, you agree to the following principles:
- Use for Good: Harmony is intended to be used to improve data management, analysis, and decision-making for the benefit of public health, social good, and community development. It should not be used to cause harm, violate human rights, or enable discrimination, exploitation, surveillance, or violence against individuals or groups.
- Respect for Privacy and Data Security: Users and implementers of Harmony must respect the privacy, security, and rights of individuals whose data is managed through the platform, in compliance with applicable laws and ethical best practices.
- Responsible Implementation: Implementers should ensure that deployments of Harmony consider the local context, minimize unintended consequences, and prioritize the well-being of the communities served.
- Contributions and Community Behavior: Contributions to Harmony (code, documentation, discussions) must align with these principles. We reserve the right to reject or remove contributions or users that do not respect this commitment.

Zenysis reserves the right to update this policy as needed to reflect evolving best practices in responsible technology development and use.

## Cost of ownership

Harmony is a sophisticated, modular software platform that spans data integration, harmonization, and analytics. While the platform is open source, its successful implementation requires technical infrastructure, skilled personnel, and thoughtful planning to ensure long-term sustainability.

### Technical scope and expertise required

Harmony combines multiple subsystems — including a data pipeline, data warehouse (Apache Druid), storage systems, and analytics front-end — and is designed to support high-volume, high-frequency data use in government health systems.

To operate the platform effectively, most deployments will require technical team members with skills across the following areas:
- System Administration: OS configuration, service deployment, security management, monitoring
- Database Administration: Management of Druid and PostgreSQL, backup, tuning
- Network Administration: Setup of secure, performant infrastructure for intra-system communication
- Data Engineering: Building and maintaining data pipelines, harmonizing across systems
- (Optional) Software Development: Extending core functionality or integrating additional tools

The exact staffing model depends on the scale of deployment. Staffing requirements are closely tied to the scale of data, number of users, hosting environment complexity etc. 
- Small-scale deployments may require 1–2 part-time technical staff for basic maintenance and data integration workflows.
- Larger or self-hosted deployments typically require at least 2 technical staff with complementary skillsets to ensure stability, security, and ongoing support.

### Hosting and Infrastructure Requirements

Harmony can be deployed on-premises or in the cloud. Infrastructure requirements vary by data volume and desired performance but should be sized to support:
- Multi-step ETL workflows
- Large-scale data querying and dashboarding
- High uptime and data availability

For a basic production deployment of Harmony, the following infrastructure specifications are recommended:

| Component        | Cores | RAM (GB) | Storage (GB) | Notes                                |
|------------------|-------|----------|--------------|--------------------------------------|
| `staging`        | 2     | 4        | 20           | Testing and configuration environment |
| `prod`           | 2     | 4        | 20           | Production frontend and API services  |
| `nfs`            | 2     | 4        | 1000         | Shared file system for data storage   |
| `druid-master`   | 4     | 16       | 120          | Coordinates Druid cluster nodes       |
| `druid-data`     | 16    | 64       | 200          | Stores and processes historical data  |
| `druid-query`    | 4     | 16       | 120          | Handles real-time data querying       |
| `pipeline`       | 16    | 32       | 500          | Runs ETL and integration workflows    |
| `postgres`       | 2     | 8        | 100          | Relational DB for metadata and configs|
| `memcache`       | 4     | 16       | 20           | Caching layer for performance         |
| `minio`          | 2     | 8        | 500          | Object storage layer (or AWS S3)      |

We recommend running some services on the same machine to optimize hardware use:
- A single machine can host `nfs`, `druid` (all components), `pipeline`, `postgres`, `memcache`, and `gate`.
- When co-locating `druid` and `pipeline`, sum their core and RAM requirements.
- For other co-located services, use the maximum requirement across services.

In addition: Druid can run in either single-server or clustered mode.  In single-server deployments, the following components can run together on one machine:
- `druid-master`
- `druid-data`
- `druid-query`

### Additional notes

- Cloud vs. On-Premises: Harmony supports both deployment models. Cloud deployments may offer easier scaling and lower setup overhead, while on-prem may be preferred to support local hosting and local infrastructure reuse.
- Infrastructure Planning Support: Zenysis can provide tailored sizing and deployment guidance based on the specific needs and data volumes of each implementation.
      
