##########################################################################################
# Dockerfile that prepares an image for the ETL (Extract Transform Load) pipeline to run
# containerized.
##########################################################################################
#
#
##########################################################################################
# Build stage common to CPython and PyPy
# We can't run anything in parallel unfortunately. Zeus assumes a PyPy virtualenv, and
# virtualenv's are very tightly coupled to their environment - so we can't just have
# nicely seperate build stages and a clean runtime stage.
# 
# TODO: The common step should be broken out to a different image (would have to move a few things around) 
#       We're really don't need to install all the common ubuntu packages from scratch on every build! 
FROM ubuntu:22.04 as common
# Tell apt-get we're never going to be able to give manual input
RUN export DEBIAN_FRONTEND=noninteractive

# Update the package listing, install security updates & install requirements for build server
# We want update, upgrade and install to all happen in the same layer because
# 1. It's best practice: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#minimize-the-number-of-layers
# 2. Specifically, we want to avoid install will running on an old version of the package index and failing.
#
# numpy needs: gcc, build-essential, gfortran
# shapely needs: libgeos-dev
# proj needs: cmake, libtiff-dev, sqlite3 and libsqlite3-dev
# pip needs: git (because it's installing from github)
# watchdog wants: libyaml-dev (according to watchdog docs, libyaml-dev is optional, but brings performance boosts)
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get -y install \
    --no-install-recommends \
    dtach \
    freetds-bin \
    freetds-dev \
    jq \
    libffi-dev \
    libssl-dev \
    liblz4-tool \
    lzop \
    pigz \
    python3-levenshtein \
    python3-lxml \
    unzip \
    libpq-dev \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    git \
    python3 \    
    python3-pip \
    python3-venv \
    pypy3 \
    build-essential \
    cmake \
    curl \
    libtiff-dev \
    sqlite3 \
    wget \
    libsqlite3-dev \
    libcurl4-openssl-dev \
    gcc \
    libpq-dev \
    libnetcdf-dev \
    gfortran \
    libgeos-dev \
    libyaml-dev \
    python3-dev \
    pypy3-dev \
    proj-bin \
    libproj-dev \
    lz4 \
    openssh-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy python pip requirements files
COPY requirements.txt /app/requirements.txt
COPY requirements-pipeline.txt /app/requirements-pipeline.txt

##########################################################################################
# Build CPython virtual env.
FROM common as cpython-builder

WORKDIR /app

# Upgrade & setup pip for CPython
RUN python3 -m pip install --upgrade pip

# Upgrade pip, install & build python third-party requirements for CPython.
# Following instructions from:
# https://zenysis.slab.com/posts/creating-a-pipeline-server-irsgvegh#hv17u-setup-virtual-envs-for-pipeline
# But don't know why web and dev would be included?
RUN python3 -m pip install --upgrade pip setuptools \
    && python3 -m venv venv \
    && . venv/bin/activate \
    && pip install --upgrade pip setuptools \
    && pip install -r requirements.txt \
    && pip install -r requirements-pipeline.txt
# && pip install -r requirements-web.txt 
# && pip install -r requirements-dev.txt

##########################################################################################
# Build PyPy virtual env.
FROM cpython-builder as pypy-builder
# Note: It's theoretically possible to have a clean base image here - but the python
# venv is very tightly bound to all the various application that were used to install
# it. e.g. numpy uses proj, which depends binary package - we don't know how it uses proj,
# so it's just safter to assume that we need everything that we used to build the venv.

WORKDIR /app

# Upgrade pip, install & build python third-party requirements for PyPy.
RUN pypy3 -m pip install --upgrade pip setuptools \
    && pypy3 -m venv venv_pypy3 \
    && . venv_pypy3/bin/activate

RUN . venv_pypy3/bin/activate \
    && pypy3 -m pip install --upgrade pip setuptools \
    && pypy3 -m pip install -r requirements.txt \
    && pypy3 -m pip install -r requirements-pipeline.txt

##########################################################################################
# Final image for runtime
# FROM --platform=linux/amd64 pypy:3.9-slim-bullseye
FROM cpython-builder as runtime


# Install minio client
RUN case $(uname -m) in \
    "x86_64")\
    wget https://dl.minio.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc;\
    ;;\
    "aarch64")\
    wget https://dl.minio.io/client/mc/release/linux-arm64/mc -O /usr/local/bin/mc;\
    ;;\
    esac;
RUN chmod +x /usr/local/bin/mc

# Set system environment variables
ENV PYTHONUNBUFFERED 1

# Copy the PyPy venv from the builder to where "SetupEnvForPyPy" expects it.
COPY --from=pypy-builder \
    /app/venv_pypy3 \
    /src/zenysis/venv_pypy3

# Copy the Python venv from the builder to where docker-entrypoint.sh expects it.
COPY --from=cpython-builder \
    /app/venv \
    /src/zenysis/venv

# Setup pipeline workdir
WORKDIR /src/zenysis

# Copy docker entrypoint script
# COPY docker-entrypoint.sh /src/docker-entrypoint.sh

# Set default PYTHONPATH for volume mount
ENV PYTHONPATH=/src/zenysis

# Install minio config
RUN mkdir /root/.mc/
# COPY mc.config.json /root/.mc/config.json

COPY . .
RUN git init

# CMD [ "/src/docker-entrypoint.sh" ]

# Refer to docker-compose-etl-pipeline.yml for instructions on how to build and run.

# TODO: check Ideons raw commands given my changes.

# docker run --rm -it -v $(pwd):/src/zenysis \
#     -e ZEN_DEPLOYMENT=zen \
#     -e ZEN_STEP=generate \
#     pipeline:debian

# docker run --rm -it -v $(pwd)/pipeline/out:/src/zenysis/pipeline/out \
#     pipeline:debian \
#     /bin/bash -c \
#     'cd /src/zenysis/pipeline/zen/generate/ \
#     && ./zeus_generate run run/00_uptime/00_fetch'

# docker run --rm -it -v /Users/ideonvanniekerk/.ssh/:/root/.ssh/ \
#     -v $(pwd)/pipeline/out:/src/zenysis/pipeline/out \
#     -e ZEN_DEPLOYMENT=zen \
#     -e ZEN_STEP=generate \
#     pipeline:debian