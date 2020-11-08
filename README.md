# Harmony

Harmony is an analytical platform that consists of two parts:

- A frontend for running queries, constructing dashboards, and performing other analytical duties, and
- A pipeline for ingesting incompatible data streams and transforming them into a standard, joinable format.

Data pipelines tend to run regularly and extract data from all sorts of data systems, ranging from Excel spreadsheets to custom SQL databases.  After processing, data is dumped into a [Druid](https://druid.apache.org) database and then queried by the frontend.

Users can manage their dashboards and sharing settings:

![](https://static.slab.com/prod/uploads/posts/images/BdH3MMWzBx0wPUMrGGiPZUiS.png)

And issue their own queries across multiple information systems:

![](https://static.slab.com/prod/uploads/posts/images/tzuemKluLx8BQ1qf0gcUUvPw.png)



# Data processing &amp; storage

## Database architecture

Druid database is an OLAP database built to handle large analytical queries.  It is:

- Column oriented, NoSQL built for analytical workloads
- Distributed and scalable (via Apache Zookeeper)
- Open source and customizable to many types of hardware

A new Druid collection is created every time the pipeline runs.  This ensures that all datasets reflect a single common snapshot in time, and makes it possible to inspect historical records for tampering and other inconsistencies.

![](https://static.slab.com/prod/uploads/posts/images/h0kkzOZmq9pOgWwhc5n9T93t.png)

---

You will need to set up a standard Druid database.  Setup is documented [here](https://druid.apache.org/docs/latest/tutorials/index.html).

For more detail, see the Technical Overview.

## Data pipeline architecture

This project comes with a built-in ETL pipeline that has been proven to work in a variety of global health contexts.

It provides a general framework for scraping data from any number of data sources or APIs, tools for standardizing this data in a common format (called Zenysis Base Format), and libraries for merging these disparate datasets together in such a way to make them mutually queryable.

![](https://docs.google.com/drawings/u/0/d/s9eL0gIYn0dyR8qhP9lif9w/image?w=624&h=261&rev=2&ac=1&parent=16hZpMQs0FUVEDTEcoXtOPM36sqTqCu8Mvb4vV9PLW1E)

Our data pipeline is based on [Zeus](https://github.com/room77/py77/tree/master/pylib/zeus), an open-source, no-frills, command-line oriented pipeline runner originally created by travel search engine Room 77 (there is an ongoing effort to migrate it to [Apache Airflow](https://airflow.apache.org), which provides a more interactive UI — stay tuned).

On a technical level, a &quot;data pipeline&quot; is comprised by sub-pipelines: Generate, Process, and Index.

These pipelines are the main data integration point for a deployment. Even though each role is designed to be standalone and stateless, the roles make up a meta pipeline that has the following steps: Generate → Process → Index

**Generate**

The data generation pipeline is used for providing data sets to the process and validate pipelines in a stateless manner. Tasks in the data generation pipeline tend have specific requirements around network access (like running within a specific intranet), task duration (like long running machine learning jobs), or complex source data transformations (like a convoluted excel workbook that is rarely updated and only needs to be cleaned once) that make them unsuitable for running in the other pipelines.

Since there is no guarantee that all generate tasks can be run from a single machine with access to NFS, we cannot use Zeus&#39;s export and publish commands. Tasks within the data generation pipeline must handle data persistence themselves by uploading to object storage such as AWS S3 or Minio.

**Process**

This is where the majority of a deployment&#39;s data integration work happens. The data processing pipeline is used for transforming and merging multiple different data sets into a single common format that can be stored in a database by the &#39;index&#39; pipeline. Dimension value matching and unification across sources (like location hierarchy) will happen in this pipeline.

**Index**

The data indexing pipeline uploads the published data from the process pipeline into the datastores (like Druid and Postgres) used by the frontend for querying and data display.

## Formatting data for ingestion

The easiest way to prepare data for ingestion is by conforming to a flexible predefined CSV format that we refer to as **Zenysis Base Format**.

A &quot;`process_csv"` module is included in the repository at `data/pipeline/scripts/process_csv.py`.  This module accepts tabular data in a variety of compatible formats and transforms it for fast indexing into the Druid database.  In our experience, `process_csv` is flexible enough to handle a significant majority of health data sources in the development sector with little customization or editing.

Before we get into how you should format your data, let&#39;s define some terminology:

- **dimension**: A column that you want to group by or filter on.  Examples of this are &quot;Region&quot; or &quot;Gender&quot;.  These columns represent categorical data and all values in these columns are strings.
- **date**: The date associated with this datapoint, as a string formatted YYYY-MM-DD.
- **field**: An indicator or dataset name.  Usually it&#39;s best to [slugify](https://www.google.com/search?q=slugify&oq=slugify&aqs=chrome..69i57j0l5.503j0j0&sourceid=chrome&ie=UTF-8) these.  For example, &quot;Malaria Cases&quot; may become &quot;malaria_cases&quot; or &quot;MalariaCases&quot;.  The values in these columns are numeric.

The simplest Zenysis Base Format is as follows:

```
dimension1, dimension2, ..., dimensionN, date, field1, field2, ..., fieldN
```

Here&#39;s an example set of columns and an example row:

| **RegionName** | **SubregionName** | **DistrictName** | **Date** | **MalariaCases** | **MeaslesCases** | **NumberOfDoctors** |
| --- | --- | --- | --- | --- | --- | --- |
| North America | United States | District 13 | 2019-01-01 | 150 | 0 | 20 |
| North America | Canada | Albert | 2019-02-15 | 0 | 2 | 1 |

If you are integrating a single field, you may use the following format:

```
dimension1, dimension2, ..., dimensionN, date, field, val
```

Here&#39;s an example of valid input that follows that format:

| **RegionName** | **SubregionName** | **DistrictName** | **Date** | **field** | **val** |
| --- | --- | --- | --- | --- | --- |
| North America | United States | District 13 | 2019-01-01 | population | 150000 |
| North America | United States | District 13 | 2019-02-15 | malaria_cases | 150 |
| North America | United States | District 2 | 2019-02-15 | malaria_cases | 22 |

There&#39;s more to learn about the CSV processor - it supports a variety of formats, wildcards, and even Python hooks.  See `data/pipeline/scripts/process_csv.py` for a README.

When calling process_csv, you must specify the `date` column, the `sourcename` (a label for your datasource), and the `prefix` for all indicators produced (usually the name of your datasource or some other informative tag).  You&#39;ll also have to specify some input and output files.  You can call `process_csv` from your Python pipeline scripts directly, or invoke it on the command line.

Here&#39;s the full usage signature of process_csv:

```
usage: process_csv.py [-h] [--dimensions [DIMENSIONS [DIMENSIONS ...]]]
                      [--rename_cols [RENAME_COLS [RENAME_COLS ...]]]
                      [--join_cols [JOIN_COLS [JOIN_COLS ...]]]
                      [--join_str JOIN_STR] [--fields [FIELDS [FIELDS ...]]]
                      --date DATE --prefix PREFIX --sourcename SOURCENAME
                      [--disable_rollup] [--policy POLICY]
                      [--tracer_field TRACER_FIELD]
                      [--flatten_string_categories] [--enable_field_wildcards]
                      --input INPUT --output_rows OUTPUT_ROWS
                      --output_locations OUTPUT_LOCATIONS --output_fields
                      OUTPUT_FIELDS [--output_indicators OUTPUT_INDICATORS]

```

Here&#39;s an example invocation that transforms DHS API survey data into Zenysis Base Format:

```
#!/bin/bash -eu

source "${PIPELINE_UTILS_DIR}/bash/common.sh"

"${PIPELINE_SRC_ROOT}/data/pipeline/scripts/process_csv.py" \
  --rename_cols 'CharacteristicLabel:ProvinceName' 'Value:val' \
  --join_cols 'Indicator+ByVariableLabel:field' \
  --dimensions 'ProvinceName' \
  --date 'SurveyYear' \
  --prefix 'dhs' \
  --sourcename 'DHS API' \
  --input="${PIPELINE_FEED_DIR}/dhs.csv.gz" \
  --output_locations="${PIPELINE_TMP_DIR}/locations.csv" \
  --output_fields="${PIPELINE_TMP_DIR}/fields.csv" \
  --output_rows="${PIPELINE_TMP_DIR}/processed_data.json.lz4" \
  --output_indicators="${PIPELINE_TMP_DIR}/indicators.json"
```

## Indexing data

After you&#39;ve developed processing and transformation steps for each data source, the next step is to index the data in the Druid database.  Harmony will index all data sources in the same database, allowing them to be queried together.

Harmony provides a helper that sets up the Druid indexing job for you (`db/druid/indexing/scripts/run_indexing.py`).

Here&#39;s an example pipeline invocation that indexes the data outputs of your pipeline:

```
#!/bin/bash -eu
set -o pipefail

"${PIPELINE_SRC_ROOT}/db/druid/indexing/scripts/run_indexing.py" \
  --data_files='/home/share/data/brazil/*/current/processed_rows.*' \
  --output_task_id_file="${PIPELINE_TMP_DIR}/task_id" \
  --min_data_date='1970-01-01'
```

# Deployment configuration

We refer to Harmony setups as &quot;deployments&quot;.  Each deployment has its own databases, data sources, and is hosted separately.

The next step in setting up Harmony is to configure its deployment.  Configurations are created in the `config/` directory.  There is a basic configuration in the `config/template`.  Usually configuration directories are named after two or three-letter country codes.  In order to run the web server, you&#39;ll need to create your own configuration directory.

## Choosing a configuration

When you run a script or the web server, select a configuration by setting the `ZEN_ENV` environmental variable.  This environmental variable maps directly to folder names in `config/`, and will cause the `config` module to export the contents of that particular configuration.

Suppose we had a configuration directory named `usa`.  We can specify that configuration with the following:

```
export ZEN_ENV='usa'
```

In our code, top-level config imports will provide the U.S. configuration:

```
>>> from config.ui import FULL_PLATFORM_NAME
>>> FULL_PLATFORM_NAME
'US Demo'
```

## Creating a new configuration

To create a new configuration, copy the `config/template` directory into a new directory.

There are many options you can explore, but at a minimum you should start with the following:

- Customize basic settings (e.g. site name) in `general.py`
- Create dimensions for querying in `datatypes.py`
- Customize aggregation options in `aggregation.py`
- Add indicators based on the field ids you created in the pipeline step (see `indicator_groups/demo/demo.py` for example)

There is a lot that goes into configuration and customization of a Harmony deployment.  We are working on making this easier to use (and configurable from a frontend) in future releases.

# Web server

Now that we&#39;ve set up some datasources, let&#39;s create the web environment.

## Setting up your environment

### Python dependencies

First, start by creating a Python virtualenv.  Note that Python 3 is required:

```
python3 -m venv venv
```

Enter the virtualenv and begin installing dependencies via pip:

```
source venv/bin/activate

pip install -r requirements.txt -r requirements-web.txt -r requirements-pipeline.txt -r requirements-dev.txt
```
Run the following command to run necessary database migrations such as configurations et cetera:
```
FLASK_APP='web.server.app' ZEN_OFFLINE='1' flask db upgrade
```
### Javascript dependencies

This project uses [yarn](https://yarnpkg.com/lang/en/) for Javascript dependency management.  You can install Javascript dependencies via:

```
yarn install
```

Frontend assets are built with webpack.   Note that there are multiple webpack configurations, `webpack.config.js` and `webpack.prod.config.js` for development and production respectively.

Here&#39;s an example command:

```
NODE_ENV=production webpack -p --config web/webpack.prod.config.js --mode 'production'
```

You may have to resolve webpack directly.  For example:

```
NODE_ENV=production ./node_modules/webpack/bin/webpack.js -p --config web/webpack.prod.config.js --mode 'production'
```

You can also use the `webpack-dashboard` and `webpack-dev-server` commands to watch for changes and rebuild locally:

```
webpack-dashboard -- webpack-dev-server --config web/webpack.config.js --mode 'development'
```

### A note on production environments

Production environments do not need Python dev dependencies (`requirements-dev.txt`) or Javascript (`yarn`/`node`) dependencies, as long as assets built on the frontend (via `yarn build`) are distributed on the production server.

# PostgreSQL

You will have to set up a [PostgreSQL database](https://www.postgresql.org/) to host relational data and web application state.

## **Creating the Database**

To ensure that you keep data from separate deployments separate, it is recommended that you create a new database for each deployment that you are working on. Unfortunately, we do not have the tooling in place to make this easy for developers to do, so we will start by creating a single database for all depolyments.

Enter the Postgres CLI.  If you've just set up Postgres locally, the command to do this is probably `psql postgres`.

Once you are inside the Postgres CLI, enter the following command to create the Harmony database:

```
CREATE DATABASE harmony;
```

Verify you can connect to the database by typing `\c harmony`.  Once you are done, you can type `\q` or enter Ctrl+D to quit.

Here is an example set of SQL commands you can use to bootstrap your database:

```
CREATE USER "power_user" WITH
  LOGIN
  SUPERUSER
  CONNECTION LIMIT -1
  PASSWORD 'GTCvRyha5UeGh7WH';
COMMIT;

CREATE USER "test_admin" WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT
  NOREPLICATION
  CONNECTION LIMIT -1
  PASSWORD 'an4978wauGednmYZ';

CREATE USER "druid_user" WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT
  NOREPLICATION
  CONNECTION LIMIT -1
  PASSWORD 'q2PRpsEX9eHZHgfh';

GRANT "test_admin" TO "power_user" WITH ADMIN OPTION;
COMMIT;

CREATE DATABASE "harmony"
    WITH
    OWNER = "test_admin"
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;
COMMIT;

CREATE DATABASE "druid"
    WITH
    OWNER = "druid_user"
    ENCODING = 'UTF8'
    CONNECTION LIMIT =
```

## **Setting up your Environment**

By default, Flask will look for the SQLite Database to retrieve user information. You can override the database that Flask uses by setting DATABASE_URL. It is recommended you do this in your environment initialization step. For example, this is what a sample value for DATABASE_URL can look like (you can also place it in your bash_profile file).

On the command line:

```
export DATABASE_URL='postgresql://test_admin:an4978wauGednmYZ@localhost/harmony'
```

If you are hosting postgres remotely, replace "localhost" with the appropriate hostname.

## **Seeding the Database**

Once we've created our application database, we need to initialize it with seed data. This section will deal with upgrading the database schema to ensure that it is consistent with the latest version. By default, our application will _not_ start unless the database schema version matches the latest version in the source tree.

Make sure `DATABASE_URL` is set - you should see it when you run this:

```
echo "${DATABASE_URL}"
```

We first need to create all the Tables in the Database and set up all
constraints, sequences and other details contained in the Database Schema. If
`DATABASE_URL` is not set, this step will 'upgrade' the hard-coded database.

```
ZEN_ENV=br scripts/upgrade_database.sh
```

Once we've upgraded the database and populated the appropriate seed values,
we'll need to create a user account so that we can login via the Web UI:

```
ZEN_ENV=br scripts/create_user.py --first_name "Your First Name" --last_name "Your Last Name" --username "username@example.com" --site_admin
```

Be sure to record the password it generates for you.  You can also specify a password of your own using the `--password` option.

# Druid

Harmony comes pre-configured with a Brazil deployment (configuration directory `config/br`).  This guide will use the Brazil as an example and walk you through how to set up and run the pipeline.

## Application configuration

You will have to set up an [Apache Druid database](https://druid.apache.org/) to host your data.

To point the web server at Druid, set `DRUID_HOST` in `config/XX/druid.py`, where `XX` corresponds to the configuration directory of your deployment.  This can be overridden by the `DRUID_HOST` environmental variable.

In this case, edit `config/br/druid.py` and find the `DRUID_HOST` variable.  Replace it with the URL of your Druid database endpoint.

Finally, if you are running multiple deployments, you can set `DEFAULT_DRUID_HOST` in your global settings config to set a default host.

## Preparing data

Download the sample data here: https://drive.google.com/a/zenysis.com/file/d/19RyMvCH3vygfYT1wffNBGYFYOJXjA1ZF/view?usp=sharing.  This is a mixture of public and simulated data.

Let's take a look at the data:

```
zless br_demo_data.csv.gz
```

Note that it is a well-formed CSV.

Use the `process_csv.py` module (described above) to convert it to Druid format and ingest it into the database.  See [Druid docs](https://druid.apache.org/docs/latest/ingestion/data-formats.html) on how to ingest CSV and other basic formats.  We plan to add more Harmony-specific guidance on how to create Druid indexing jobs, stay tuned!

## Running locally

The platform is built on [Flask](http://flask.palletsprojects.com/en/1.1.x/).  To run a local development server, run:

```
FLASK_ENV=development python ./web/runserver.py
```

You will also need to set a `ZEN_ENV` environmental variable that corresponds with a config you&#39;d like to load.

Harmony ships with a Brazil/"br" config.  You can set `ZEN_ENV=br` to use it:

```
ZEN_ENV=br FLASK_ENV=development python ./web/runserver.py
```

## Running in production

We use gunicorn using the `gunicorn_server.py` entrypoint.  You&#39;ll also want to set the `ZEN_ENV` envar to reflect the deployment config you want to load, as well as the `ZEN_PROD` envar to indicate that we should load production assets.  Here&#39;s an example:

```
ZEN_ENV=br ZEN_PROD=1 ./web/gunicorn_server.py
```

## Running with docker

```bash
$ cp env.example .env
$ docker-compose build
$ docker-compose run --rm harmony_app yarn install --pure-lockfile --frozen-lockfile --production=false --no-cache
$ docker-compose run --rm harmony_app yarn run build
$ docker-compose up -d --force-recreate
$ docker-compose run --rm harmony_app scripts/create_user.py --first_name "Your First Name" --last_name "Your Last Name" --username "username@example.com" --site_admin --password "123456"
```

# Contributing

Contributions are welcome!  Use Github&#39;s Issues and Pull Requests feature to report bugs, plan features, or submit changes.

We have an open [Google Group mailing list zenysis-harmony@googlegroups.com](https://groups.google.com/forum/#!forum/zenysis-harmony), which you can join or email with questions and other discussion.  For general open source matters at Zenysis you may contact open-source@zenysis.com.
