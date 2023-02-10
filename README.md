# Documentation Contents

1. [Harmony overview](#harmony-overview)

Server/environment setup:

2. [Project setup](#project-initialization)
3. [Local development setup](#local-development-setup)
4. [Production pipeline server setup](#production-pipeline-server-setup)
5. [Production PostgreSQL server setup](#production-postgres-server-setup)
6. [Production web server setup](#production-web-server-setup)
7. [Production Druid server setup](#production-druid-server-setup)

Code base customization

8. [Writing integrations](#writing-integrations)
9. [Contributions](#contributions)
10. [Product overview](#harmony-products)

## Harmony overview

The Harmony Analytics Platform (Harmony), developed by [Zenysis Technologies](https://www.zenysis.com/), helps make sense of messy data by transforming, cleaning and enriching data from multiple sources. With Harmony, disparate data are displayed within a single analytical view, giving you a complete picture of your data through triangulated queries and customizable visualizations and dashboards. Harmony is available as an open source solution under the [GNU General Public License v3 (GPL v3)](https://github.com/Zenysis/Harmony/blob/master/LICENSE).

Harmony technology supports two critical workflows for organizations:
- **Data Integration**: Through its data pipeline, Harmony ingests raw data from various sources, harmonizes it into a consistent format, and stores it in a database. Source data systems remain unaltered and unaffected–Harmony essentially serves as a data integration layer that sits on top of source data systems.
- **Advanced Analytics**: Harmony enables you to analyze millions of data points at sub-second speed, and quickly uncover insights you can use to make better decisions. Users can easily access and query newly integrated data in Harmony via a web browser.

We developed Harmony to serve in a variety of global health and development contexts, including HIV, tuberculosis and malaria programs, supply chain management, emergency response, immunization and vaccination campaigns, and resource allocation and coordination. Harmony works with structured data sources typically found in these settings, including health management information systems (e.g. DHIS2), logistic management information systems (e.g. OpenLMIS), Excel and CSV files, survey data (e.g. Demographic and Health Surveys) and scorecards. Governments in more than eight low- and middle-income countries in Asia, Africa, and Latin America have leveraged Harmony’s core functionality to improve and manage their health and development programs.

## Project initialization

We refer to Harmony setups as "deployments". Each deployment has its own databases, data sources, and is hosted separately.

The next step in setting up your Harmony project is to configure its deployment. Configurations are created in the `config/` directory. There is a configuration template in `config/template` and an example configuration in `config/br`. Typically, configuration directories are named after two or three-letter project codes. You'll now need to choose a project code and create your own configuration directory.


### Creating a new configuration

To create a new configuration, copy the `config/template` directory into a new directory named for your project code.

At minimum, the following configuration files must be updated (documentation inside the files provides instructions):
- Define global constants in `global_config.py`
- Customize basic settings (e.g. site name) in `config/<project code>/general.py` and `config/<project code>/ui.py`

After you have written your first data integration (see [writing integrations](#writing-integrations)):
- Create dimensions for querying in `datatypes.py`
- Customize aggregation options in `aggregation.py`
- Add indicators based on the field ids you created in the pipeline step

We are working on making this customization easier (and configurable from a frontend) in future releases.

## Generating a Mapbox Access Token

### Introduction

Harmony currently uses [mapbox](https://www.mapbox.com/) for all Map UI visiualisations. In order to use our map visiualisations you would need to have your own `Mapbox Access Token`

### Getting Started

First you would need to create your own mabox account, you can signup [here](https://account.mapbox.com/auth/signup/).

> Already have an account, sign in [here](https://account.mapbox.com/auth/signin/).

### Access Token

> You can read more on access tokens [here](https://docs.mapbox.com/help/getting-started/access-tokens/#how-access-tokens-work).

#### Finding your token

Once logged in you will find your **Default public token** on the homepage, the token will typically start with `pk.`. You can also access your tokens under the [Acccess tokens](https://account.mapbox.com/access-tokens/) page.

#### Updating your token

You can update your token in the Harmony codebase in the `config/<DEPLOYMENT>` directory in `ui.py`, updating the `MAPBOX_ACCESS_TOKEN` variable, example config [here](https://github.com/Zenysis/Harmony/blob/master/config/br/ui.py#L126).

### Mapbox Pricing

Mapbox has a free tier, however there are paid options available. For most users the free tier will be sufficient since you get 50,000 monthly loads, refer to [pricing](https://www.mapbox.com/pricing/#map-loads-for-web) for more.

## Misc. notes

- Some of the config variables require your Druid and PostreSQL hosts to be set up. See [Production PostgreSQL server setup](#production-postgres-server-setup) and [Production Druid server setup](#production-druid-server-setup).

- When you run a script or the web server, select a configuration by setting the `ZEN_ENV` environmental variable. This environmental variable maps directly to folder names in `config/`, and will cause the `config` module to export the contents of that particular configuration.

      Say there is configuration directory named `usa`. We can specify that configuration with the following:

      ```bash
      export ZEN_ENV='usa'
      ```

## Local development setup

In order to run a local web server or run data pipeline steps on the command line, you'll need to set up a local development environment. This is distinct from setting up production servers (explained in other sections).

Running your development environment in Docker should work on any operating system that is capable of running the latest version of Docker.

The provided `docker-compose.yml` file in the root directory of the project is intended to assist developer in quickly getting a locally running instance of Harmony up along with several services it relies on (postgres, redis & hasura). The local filesystem is mounted, so any changes made to the codebase will be reflected in the running web container.

### Druid setup
​
Specify druid host in `global_config.py`: `DEFAULT_DRUID_HOST = '<public production Druid server IP>'`
### Prepare environment

1. Install the latest version of [Docker](https://docs.docker.com/get-docker/). 
2. Clone the git repository: `git clone https://github.com/Zenysis/Harmony`. (Alternatively, you may want to fork the repo and clone the fork — that way you can use version control for your customization.)
3. Build your development docker images: `docker compose build` (this will take some time!)

### Run Web Server

1. Start your development environment: `DEFAULT_DRUID_HOST=<public production Druid server IP> ZEN_ENV=<specify environment> docker compose up` (you need to specify druid host and environment)
2. In a seperate terminate, create user account `docker compose exec web /bin/bash -c "source venv/bin/activate && ./scripts/create_user.py --u me@mydomain.com -p admin --first_name=admin --last_name=istrator -a"`
3. Browse to website on [http://localhost:5000](http://localhost:5000) and log in with the credentials used in step 5.

### Run Pipeline

1. Execute the pipeline `DEFAULT_DRUID_HOST=http://aws-druid.corp.clambda.com COMMAND="./pipeline/br/generate/zeus_generate run" docker compose --profile=pipeline up pipeline`
or
1. Get a terminal on the pipeline container ` DEFAULT_DRUID_HOST=http://aws-druid.corp.clambda.com docker compose --profile=pipeline run pipeline /bin/bash`

### Next steps & useful tips

- You can do a lot with docker compose that's beyond the scope of this document, but a good starting point is `docker compose --help`
- Know what containers are running: `docker compose ps`
- It's useful to have a terminal open on the web instance: `docker compose exec web /bin/bash` ; furthermore running `source venv/bin/activate` will activate the python virtual environment.
- You can start a container and attach to the shell with: `docker compose run web /bin/bash`

## Production pipeline server setup

The pipeline server runs the data pipeline to generate datasources (typically, daily). These pipeline server setup instructions were developed for Linux/Ubuntu.

1. Configure your server's users, firewall, etc. Sign in as root.
2. Update system packages.
      ```
      sudo apt-get update # updates available package version list
      sudo apt-get upgrade # update packages
      sudo apt-get autoremove # remove old packages
      sudo do-release-upgrade # update os version
      ```
4. Install system dependencies.
      ```
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install --no-install-recommends -y \
       build-essential \
       curl \
       dtach \
       freetds-bin \
       freetds-dev \
       git \
       jq \
       libffi-dev \
       libgeos-dev \
       libssl-dev \
       lz4 \
       lzop \
       pigz \
       python3 \
       python3-dev \
       python3-levenshtein \
       python3-lxml \
       python3-venv \
       pypy3 \
       pypy3-dev \
       unzip \
       wget \
       libpq-dev \
       gfortran \
       libopenblas-dev \
       liblapack-dev
      apt-get clean
      rm -rf /var/lib/apt/lists/*
      curl \
       -o /usr/local/bin/mc \
       https://dl.min.io/client/mc/release/linux-amd64/archive/mc.RELEASE.2021-11-16T20-37-36Z
      chmod 755 /usr/local/bin/mc
      ```
      (You may not need to install minio depending on your cloud storage choices.)
6. Clone your fork of the Harmony repo.
      `git clone <URL of Harmony clone>`
8. cd into the Harmony source directory and create two Python virtual environments. One is for regular python, one for pypy (which has a faster runtime and may be used for pipelines).
      ```
      # First set up the normal python3 venv
      python3 -m venv venv
      source venv/bin/activate
      pip install --upgrade pip setuptools
      pip install -r requirements.txt
      pip install -r requirements-pipeline.txt
      pip install -r requirements-web.txt
      pip install -r requirements-dev.txt

      # Second set up the pypy venv
      deactivate
      pypy3 -m venv venv_pypy3
      source venv_pypy3/bin/activate
      pip install --upgrade pip setuptools
      pip install -r requirements.txt
      pip install -r requirements-pipeline.txt
      ```
10. Configure necessary permissions for your cloud storage service. For example, if you're using Minio, you'll need to set up `~/.mc/config` on the server.
11. Optionally, you may want to configure an automated task runner like GitLab, CircleCI, or Jenkins (to automate pipeline runs).

## Production Postgres server setup

### Introduction

You will have to set up a [PostgreSQL](https://www.postgresql.org/) database to host relational data and web application state.

### Getting Started

If not using a relational database cloud service like Amazon RDS, Postgres can be installed on a server manually or via Docker.

Regardless of installation approach, the database will require the `power_user` to be created as a **SUPERUSER**.

#### Power User

By default the `power_user` account on these databases has access to all databases on the server. We do not share the `power_user` credentials with the instance. It is **recommended** to not store these credentials on your local machine in an insecure fashion. The instance has its own credentials and ability to manage its own database.

#### Direct Installation

Follow the [instructions](https://www.postgresql.org/download/linux/ubuntu/) to install postgres on linux (ubuntu).
Once the database is up and running, create the `power_user` by running the below script:

> Provide your own, secure password for the `power_user`, **keep it safe!**

```sql
CREATE USER "power_user" WITH
  LOGIN
  SUPERUSER
  CONNECTION LIMIT -1
  PASSWORD '[YOUR_PASSWORD]';
COMMIT;
```

#### Docker Installation

Follow the [instructions](https://docs.docker.com/engine/install/ubuntu/) to install docker on linux (ubuntu).
Once docker is up and running, start the database by running the below script:

> The terminal will prompt for the `power_user` password to use, **keep it safe!**

```sh
docker run -d --name postgres \
    --restart always \
    -e POSTGRES_USER=power_user \
    -e POSTGRES_PASSWORD=$(read -s;echo $REPLY) \
    -p 1994:5432 \
    postgres:14
```

### Deployment Database

Postgres should now be up and running with the `power_user` **SUPERUSER**, now the database instance for the deloyment needs to be created.

Running the below script, replace `[YOUR_HOSTNAME]` with the hostname/IP of your postgres instance (example: *localhost*) and `[YOUR_DATABASE_NAME]` with the database name you want to use (example: *harmony*).

```sh
./scripts/create_deployment_database.sh [YOUR_HOSTNAME] [YOUR_DATABASE_NAME] power_user
# Log output only
# ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh [YOUR_HOSTNAME] [YOUR_DATABASE_NAME] power_user
```

> If you cannot connect directly to your postgres instance, you can run the script to log the output only by using the `ZEN_DB_LOG_ONLY=1` environment variable. The output will have all the raw SQL commands for you to run.

The database is now ready and the instance database connection string is outputted to the console.

### Setting Up Your Environment

By default, Flask will look for the SQLite Database to retrieve user information. You can override the database that Flask uses by setting `DATABASE_URL`. It is recommended you do this in your environment initialization step. For example, this is what a sample value for `DATABASE_URL` can look like.

```sh
export DATABASE_URL='postgresql://test_admin:test_pwd@my.postgres.host/harmony'
```

### Seeding The Database

Once we've created our application database, we need to initialize it with seed data. This section will deal with upgrading the database schema to ensure that it is consistent with the latest version. By default, our application will not start unless the database schema version matches the latest version in the source tree.

First, make sure `DATABASE_URL` is set

```sh
echo "${DATABASE_URL}"
```

We first need to create all the Tables in the Database and set up all constraints, sequences and other details contained in the Database Schema.
If `DATABASE_URL` is not set, this step will 'upgrade' the hard-coded database.

Upgrade the database by running the below script:

> `ZEN_ENV` needs to be set with a valid environment configured

```sh
scripts/upgrade_database.sh
# Example
# ZEN_ENV=br scripts/upgrade_database.sh
```

> If you cannot run the above, the database upgrade is also done on initialization of the web container

Once we've upgraded the database and populated the appropriate seed values, we'll need to create a user account so that we can login via the Web UI.

```sh
scripts/create_user.py -a -f "[YOUR_FIRST_NAME]" -l "[YOUR_LAST_NAME]" -u "[YOUR_EMAIL]"
# Example
# scripts/create_user.py -a -f "Test" -l "User" -u "test@test.com"
```

## Production web server setup

### Before you begin

Harmony uses numerous external servives (some free, some paid) that need to be instantiated or swapped out from the codebase.
- Ensure you have active accounts for the following
  - Mapbox access token, see [Generating a Mapbox Access Token](#generating-a-mapbox-access-token)
  - Mailgun API key, see [Mailgun](https://signup.mailgun.com/new/signup)
  - AWS EC2, currently use to host the web machine, Druid, and the pipleine maching. See [setup instructions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html). This can be swapped with any VM running Ubuntu 18 LTS & up (docker installed) open ports: 22, 80, 443
  - AWS S3 for cloud storage, see [setup instructions](https://aws.amazon.com/pm/serv-s3/?trk=fecf68c9-3874-4ae2-a7ed-72b6d19c8034&sc_channel=ps&s_kwcid=AL!4422!3!536456034896!p!!g!!s3%20cloud%20storage&ef_id=CjwKCAiArY2fBhB9EiwAWqHK6uoDGaUc7ThsxZ_W_o5j_WwqSuOTpNzAC71GuUORqMdwIIeC7WaNuBoCmfgQAvD_BwE:G:s&s_kwcid=AL!4422!3!536456034896!p!!g!!s3%20cloud%20storage). This be swapped out with [MinIO](https://min.io/docs/minio/linux/index.html).
  - Google Domains for DNS management, this is paid. See [setup instructions](https://cloud.google.com/dns/docs/set-up-dns-records-domain-name).
  - [LogDNA aka Mezmo](https://www.mezmo.com/) for logging (paid), [Grafana](https://grafana.com/) for operational dashboards(has a free tier), [Uptime Robot](https://grafana.com/) for monitoring server status and alerts engineers to outages (free).

  - No reply & support email accounts
 
- Ensure you have the following running and accessible
  - Postgres database, see [Production Postgres server setup](#production-postgres-server-setup)
  - Druid database, see [Production Druid server setup](#production-druid-server-setup)
  - Passphrase management, see [Phabricator](https://www.phacility.com/phabricator/). This is a free open source tool.


### Getting Started

Before deploying the web server we need to setup some configuration to ensure everything will connect up, for this you will need:

> Recommedned to **NOT** check this in with source code

1. Instance Config File

Create the instance config file as `instance_config.json` in the `/deploy` directory and copy paste the below.

```json
{}
```

2. Global Config

Copy `global_config.py` from the root directory into the `/deploy` directory and update all values as needed.

3. Environment File

Create the environment file as `.env` in the `/deploy` directory and copy paste the below, updating all values as needed.

```properties
ZEN_WEB_ENV=br
ZEN_WEB_REMOTE=ubuntu@localhost

ZEN_WEB_HOST=harmony.yourdomain.com
ZEN_WEB_EMAIL=harmony@yourdomain.com

POSTGRES_DB_URI="postgresql://harmony-admin:[PASSWORD]@postgres.yourdomain.com:5432/harmony"
GRAPHQL_DATABASE_URL="postgresql://harmony-admin:[PASSWORD_URL_ENCODED]@postgres.yourdomain.com:5432/harmony"

OUTPUT_PATH=/data/output
NGINX_DEFAULT_VHOST_CONFIG=/home/ubuntu/nginx_vhost_default_location
INSTANCE_CONFIG=/home/ubuntu/instance_config.json
GLOBAL_CONFIG=/home/ubuntu/global_config.py
UPLOADS_DIR=/home/ubuntu/uploads

DOCKER_NAMESPACE=zengineering
DOCKER_TAG=latest
```

### Docker Builds

#### Pre Built

There are pre-built Harmony docker images that can be found at [hub.docker.com](https://hub.docker.com/r/zengineering/harmony-web) for:
- harmony-web-server
- harmony-web-client
- harmony-web

#### Custom Builds

In certain cases you would want to make changes to Harmony or setup your own config pre-built in the docker image, for that you can run the below:

> Set DOCKER_NAMESPACE & DOCKER_TAG in the `Makefile` found in the root directory

```sh
make all_build all_push
```

### Deploying Web

You should now we all set up and ready to deploy harmony web.

> The below commands uses `ZEN_WEB_REMOTE` over ssh with public key authentication. Confirm the IP specified is reachable & [public key authentication](https://kb.iu.edu/d/aews) is enabled before proceeding.

```sh
# Navigate to the deploy directory
cd deploy
# Initial setup for the web server
make web_configure
# Deploy to remote server
make web_deploy
```

Once deployed you should be able to login at your domain specified in `ZEN_WEB_HOST`, logging in with the credentials created in [Seeding The Database](#seeding-the-database).

## Production Druid server setup

Druid database is an OLAP database built to handle large analytical queries. It is:

- Column oriented, NoSQL built for analytical workloads
- Distributed and scalable (via Apache Zookeeper)
- Open source and customizable to many types of hardware

A new Druid collection is created every time the pipeline runs. This ensures that all datasets reflect a single common snapshot in time, and makes it possible to inspect historical records for tampering and other inconsistencies.

![](https://static.slab.com/prod/uploads/posts/images/h0kkzOZmq9pOgWwhc5n9T93t.png)

---

### On an (Ubuntu) server dedicated to running Druid, follow these instructions:

This setup makes use of [docker-compose](https://docs.docker.com/compose/) to easlity spin up and manage a druid cluster. For cluster configuration we use a [Druid Docker Environment file](https://druid.apache.org/docs/latest/tutorials/docker.html#environment-file).

> The configuration below will spin up a druid cluster on a **single** server. Druid recommends having a [Clustered deployment](https://druid.apache.org/docs/latest/tutorials/cluster.html) running on **multiple** servers for larger production instances.

#### Custom Setup (Optimised configuration)

Druid resources settings are usually tied to the hardware specifications. The Optimised configuration in `environment` works for most Harmony deployments. This can be increased/changed based on your usage requirements - See [Duird Configuration](https://druid.apache.org/docs/latest/tutorials/docker.html#configuration) for more.

> The below commands uses `*_DOCKER_HOST` (found in `.env`) over ssh with public key authentication. Confirm the IP(s) specified is reachable & [public key authentication](https://kb.iu.edu/d/aews) is enabled before proceeding.

> **Clustered Server**: There are some additional environment variables that will have to be configured for the server to run optinally. Common config can be found in `druid_setup/cluster/environment/common.env`:  `druid_zk_service_host`, `druid_metadata_storage_connector_connectURI` and `druid_cache_hosts`. Coordinator config can be found in `druid_setup/cluster/environment/coordinator.env`: `druid_host`. Historical config can be found in `druid_setup/cluster/environment/historical.env`: `druid_host`.

```sh
cd druid_setup
# Deploy single server mode
make single_server_up
# Deploy cluster server mode
make cluster_server_up
```

#### Bare Setup (Default configuration)

```
sudo apt-get install -y docker-compose
mkdir druid_setup && cd druid_setup
wget https://raw.githubusercontent.com/apache/druid/0.22.1/distribution/docker/docker-compose.yml
wget https://raw.githubusercontent.com/apache/druid/0.22.1/distribution/docker/environment
docker-compose up -d
```

You should be able to see the Druid router console at http://{SERVER_IP}:8888/

## Writing integrations

This project comes with a built-in ETL pipeline that has been proven to work in a variety of global health contexts.

It provides a general framework for scraping data from any number of data sources or APIs, tools for standardizing this data in a common format (called Zenysis Base Format), and libraries for merging these disparate datasets together in such a way to make them mutually queryable.

![](https://docs.google.com/drawings/u/0/d/s9eL0gIYn0dyR8qhP9lif9w/image?w=624&h=261&rev=2&ac=1&parent=16hZpMQs0FUVEDTEcoXtOPM36sqTqCu8Mvb4vV9PLW1E)

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

## Contributions

Contributions are welcome! Use Github's Issues and Pull Requests features to report bugs, plan features, or submit changes.

We have an open [Google Group mailing list zenysis-harmony@googlegroups.com](https://groups.google.com/forum/#!forum/zenysis-harmony), which you can join or email with questions and other discussion. For general open source matters at Zenysis you may contact open-source@zenysis.com.

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
- Mapping files and CSV validation: allows users to download the location mapping files for level of the geographic hierarchy, update these offline, and reupload them with new matches.

### Field Setup

The Field Setup App allows users to set up fields that are in Druid and not yet in Data Catalog, and therefore visible to end users to be queried.

The app is populated with the id, data source, and default sum calculation for each field and users can edit the name, description, calculation, and category. Once the fields are ready, they can be published to Data Catalog.

![](https://slabstatic.com/prod/uploads/rzv7xv5j/posts/images/71BllLgN_UIJ0yWjjAaSxi2X.png)
