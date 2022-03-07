Harmony is an analytical platform that consists of two parts:

- A frontend for running queries, constructing dashboards, and performing other analytical duties, and
- A pipeline for ingesting incompatible data streams and transforming them into a standard, joinable format.

Data pipelines tend to run regularly and extract data from all sorts of data systems, ranging from Excel spreadsheets to custom SQL databases.  After processing, data is dumped into a [Druid](https://druid.apache.org) database and then queried by the frontend.

Users can manage their dashboards and sharing settings:

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/eXtJcx3Mclk8ricKEPW9eXSD.png)

And issue their own queries across multiple information systems:

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/vPBE685C74CiUUVQXzVBOB6b.png)



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

Create instance with Ubuntu 18.04.4 LTS This will need to have whatever specific certificate/firewalls/security groups you usually use to access a server

ssh into it.

# 

# Update Packages

Next we should update the system packages.

```
sudo apt-get update # updates available package version list
sudo apt-get upgrade # update packages
sudo apt-get autoremove # remove old packages
sudo do-release-upgrade # update os version
```

# Install Docker

```
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce
sudo service docker start
sudo groupadd docker || true
sudo gpasswd -a $USER docker
```

Unfortunately, there is a security flaw when using docker with ufw where docker modifies the iptables configuration setup by ufw - see [here](https://www.techrepublic.com/article/how-to-fix-the-docker-and-ufw-security-flaw/) for more information.

If we are using ufw for our firewall, we should fix this flaw by adding the following line to `/etc/default/docker`.

```
DOCKER_OPTS="--iptables=false"
```

We then need to restart docker:

```
sudo systemctl restart docker
```


Check that all the services are running:

```
docker ps
```


# EASY DRUID SETUP on UBUNTU:

```
sudo apt-get install -y docker-compose
mkdir druid_setup
cd druid_setup
wget https://raw.githubusercontent.com/apache/druid/0.22.1/distribution/docker/docker-compose.yml
wget https://raw.githubusercontent.com/apache/druid/0.22.1/distribution/docker/environment
docker-compose up -d

```

You should now be able to see the druid router console at http://{SERVER_IP}:8888/

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

```bash
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

## Matching across 

## Indexing data

After you&#39;ve developed processing and transformation steps for each data source, the next step is to index the data in the Druid database.  Harmony will index all data sources in the same database, allowing them to be queried together.

Harmony provides a helper that sets up the Druid indexing job for you (`db/druid/indexing/scripts/run_indexing.py`).

Here&#39;s an example pipeline invocation that indexes the data outputs of your pipeline:

```bash
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

```bash
export ZEN_ENV='usa'
```

In our code, top-level config imports will provide the U.S. configuration:

```bash
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

### Javascript dependencies

This project uses [yarn](https://yarnpkg.com/lang/en/) for Javascript dependency management.  You can install Javascript dependencies via:

```
yarn install
```

Frontend assets are built with webpack.   Note that there are multiple webpack configurations, `webpack.config.js` and `webpack.prod.config.js` for development and production respectively.

Here&#39;s an example command:

```bash
NODE_ENV=production webpack -p --config web/webpack.prod.config.js --mode 'production'
```

You may have to resolve webpack directly.  For example:

```bash
NODE_ENV=production ./node_modules/webpack/bin/webpack.js -p --config web/webpack.prod.config.js --mode 'production'
```

You can also use the `webpack-dashboard` and `webpack-dev-server` commands to watch for changes and rebuild locally:

```bash
webpack-dashboard -- webpack-dev-server --config web/webpack.config.js --mode 'development'
```

### A note on production environments

Production environments do not need Python dev dependencies (`requirements-dev.txt`) or Javascript (`yarn`/`node`) dependencies, as long as assets built on the frontend (via `yarn build`) are distributed on the production server.

## Running locally

The platform is built on [Flask](http://flask.palletsprojects.com/en/1.1.x/).  To run a local development server, run:

```bash
FLASK_ENV=development python ./web/runserver.py
```

You will also need to set a `ZEN_ENV` environmental variable that corresponds with a config you&#39;d like to load.

## Running in production

We use gunicorn using the `gunicorn_server.py` entrypoint.  You&#39;ll also want to set the `ZEN_ENV` envar to reflect the deployment config you want to load, as well as the `ZEN_PROD` envar to indicate that we should load production assets.  Here&#39;s an example:

```
ZEN_ENV=us ZEN_PROD=1 ./web/gunicorn_server.py
```

# PostgreSQL

You will have to set up a [PostgreSQL database](https://www.postgresql.org/) to host relational data and web application state.

## **Creating the Database**

To ensure that you keep data from separate deployments separate, it is recommended that you create a new database for each deployment that you are working on. Unfortunately, we do not have the tooling in place to make this easy for developers to do, so we will start by creating a single database for all depolyments.

Once you are inside the Postgres CLI, enter the following command to create the Harmony Database

```
CREATE DATABASE harmony;
```

Verify you can connect to the database by typing `\c harmony`.  Once you are done, you can type `\q` or enter Ctrl+D to quit.

Here is an example set of SQL commands you can use to bootstrap your database:

```sql
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

```bash
export DATABASE_URL 'postgresql://test_admin:an4978wauGednmYZ@my.postgres.host/harmony'
```

## **Seeding the Database**

Once we&#39;ve created our application database, we need to initialize it with seed data. This section will deal with upgrading the database schema to ensure that it is consistent with the latest version. By default, our application will _not_ start unless the database schema version matches the latest version in the source tree.

```bash
# Make sure `DATABASE_URL` is set
echo "${DATABASE_URL}"
# We first need to create all the Tables in the Database and set up all constraints, 
# sequences and other details contained in the Database Schema. If `DATABASE_URL` 
# is not set, this step will 'upgrade' the hard-coded database.
scripts/upgrade_database.sh


# Once we've upgraded the database and populated the appropriate seed values, we'll
# need to create a user account so that we can login via the Web UI. 
scripts/create_user.py -f "Your First Name" -l "Your Last Name" -u "username@zenysis.com" -
```



# Druid

To point the web server at Druid, set `DRUID_HOST` in `config/XX/druid.py`, where `XX` corresponds to the configuration directory you created.  This can be overridden by the `DRUID_HOST` environmental variable.

Finally, if you are running multiple deployments, you can set `DEFAULT_DRUID_HOST` in your global settings config to set a default host.

# Harmony Products 

## Homepage

The Homepage is a personalized ‘landing’ page you see when you log into the platform. It is intended to provide you with an overview and easy access to the different parts of the platform you regularly work with.

From the Homepage, you can easily access official dashboards and other dashboards you or your colleagues have created. For each dashboard, key information such as date of creation, your last date of visit, and number of views is displayed.

## Analyze

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

## Dashboards

A dashboard represents a collection of analyses that you wish to save for a variety of purposes, including to give a presentation, make a report or to monitor continuously. Dashboards can store any analysis that you create on Analyze, whether it takes the form of a graph, table or time series.

Dashboards also support different types of content such as text, images, dividers and iFrames. These content types enable the user to craft report-like dashboards and tell a more complex story about their data.

In addition, users can add dashboard-level filters and aggregations. For example, a user can modify the date range, geographical filters and level of aggregation of data within the dashboard directly. In this way, your personal dashboard becomes a dynamic tool which you can use for monitoring key data points across various dimensions and do further exploratory analysis.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/AN8QVulnqrp-KCeaDub23oRr.png)

## Alerts

An alert is a query that is constructed around a threshold of interest or a relationship between two indicators to you and your team. When these thresholds are crossed in the data, an alert is automatically triggered in the platform. Instead of retrospectively looking for how many cases of a certain disease were reported in a certain area, you can set up an alert that will proactively trigger an automated notification when a certain number of cases are reported in a given area. This is especially useful for epidemiological and data quality use cases.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/4nY_aAz4AD0GjyEJp7jTjTZh.png)

## Data Quality Lab

The objective of Data Quality Lab (DQL) is to help you identify potential reporting and data quality issues for your indicators and provide you with tools to diagnose and investigate these issues. The information and tools in DQL allows you to attempt to diagnose the specific data quality issues the indicator has and the score could be used to assess trends or changes as a result of actions taken. DQL allows diagnostics of all types of indicators, even complex indicators integrated from other systems.

The aim of the Quality Score is to give you an at-a-glance idea of whether or not the user can trust an indicator&#39;s data. The things to be assessed as input to the score are shown in the tabs below, with their denominator representing their weight in the score. These inputs are inspired by the dimensions laid out in WHO&#39;s Data Quality Framework - and we will be adding more tabs to cover more dimensions of data quality over time.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/Ka6-hOtKy2Gb1-LBRo-n8-_E.png)

There are two data quality areas being assessed in DQL:

1. Indicator Characteristics: this tab summarizes some basic facts about the indicator that may impact reporting or data quality, as well as explaining how they affect the score. After choosing an indicator, you’ll see cards displaying the indicator’s age, time since the last report, reporting completeness trend and estimated reporting periods. Both age and freshness are counted in terms of the number of estimated reporting periods (i.e. months if it’s a monthly report).
1. Reporting Completeness: The score is based on the consistency in the number of reports received per reporting period. The more consistent, the better it is for the score. Within this tab, there are investigative tools designed to enable you to identify where reporting completeness issues may be coming from.

## Platform Administration 

The Admin interface is used by administrators of the platform to manage user access and permissions. The interface allows administrators to give or revoke access to users, to create and manage user groups and to edit access and permissions levels for users on the platform.

The Admin option is only available to users with administrative permissions, which can only be granted by another platform administrator.

To access the Admin App, click on the menu button at the top right corner of your screen and then click on ‘Admin.’ This will take you to the Admin page where you will notice four tabs:

- Users: view and manage platform users or invite new users
- Groups: view and manage platform groups or create new ones
- Role Management: view and manage platform roles or create new ones
- Site Configuration: manage platform settings like the default homepage

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/9SSfiiRI7OYgS9Ks2jTU5CXl.png)

## Data Catalog 

Data Catalog enables Data Managers to manage their indicators and augment them with useful information. Specifically this allows:

- Organizing datasets into a hierarchical structure that is surfaced in the Analyze tool 
- Provide useful metadata to indicators (e.g. definitions, operations etc.)
- Create new custom calculations 

In Data Catalog, the Analyze hierarchical selector is organized in the form of a directory table that resembles a ‘file system’. This allows us to navigate and organize categories (folders) and indicators (files) in a familiar format. The indicators themselves are the files in the file system. Each file is its own page called the Indicator Details page. This page contains metadata about each indicator and options to edit that metadata.

![](https://static.slab.com/prod/uploads/rzv7xv5j/posts/images/aWreLFOT62th7O9mV_pznYCF.png)

## Data Digest

The Data Digest tool is an internal tool that can be used by administrators to manage aspects of the integration pipeline. For example:

- Pipeline overview: this includes information about the most recent pipeline and a summary of location matching. 
- Data source overview: this includes an overview of the number of data points, indicators, mapped and unmatched location for each data source integrated via the pipeline. 
- Mapping files and CSV validation: allows users to download the location mapping files for level of the geographic hierarchy, update these offline, and reupload them with new matches. 

# Contributing

Contributions are welcome!  Use Github&#39;s Issues and Pull Requests feature to report bugs, plan features, or submit changes.

We have an open [Google Group mailing list zenysis-harmony@googlegroups.com](https://groups.google.com/forum/#!forum/zenysis-harmony), which you can join or email with questions and other discussion.  For general open source matters at Zenysis you may contact open-source@zenysis.com.
