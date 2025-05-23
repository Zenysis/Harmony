# This Dockerfile used for local development.
# Not to be confused with what we used in production.
# The development environment is very different from production w.r.t. tools
# installed etc.
# This Dockerfile installs dependencies for the web app and the pipeline.
FROM ubuntu:22.04 as downloader
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update \
    && apt-get clean \
    && apt-get -y install --no-install-recommends \
    ca-certificates \
    wget \
    unzip \
    bzip2 \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download minio client
RUN case $(uname -m) in \
    "x86_64")\
    wget https://dl.minio.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc;\
    ;;\
    "aarch64")\
    wget https://dl.minio.io/client/mc/release/linux-arm64/mc -O /usr/local/bin/mc;\
    ;;\
    esac;

# Download flow
RUN case $(uname -m) in \
    "x86_64")\
    wget https://github.com/facebook/flow/releases/download/v0.200.0/flow-linux64-v0.200.0.zip -O /tmp/flow.zip;\
    ;;\
    "aarch64")\
    wget https://github.com/facebook/flow/releases/download/v0.200.0/flow-linux-arm64-v0.200.0.zip -O /tmp/flow.zip;\
    ;;\
    esac; \
    cd /tmp && unzip flow.zip && mv flow/flow /usr/local/bin/flow && rm -rf flow*;

# Download pypy
RUN case $(uname -m) in \
    "x86_64")\
    wget https://downloads.python.org/pypy/pypy3.9-v7.3.11-linux64.tar.bz2 -O /tmp/pypy3.9-v7.3.11-linux64.tar.bz2;\
    cd /tmp && tar -xf pypy3.9-v7.3.11-linux64.tar.bz2;\
    mv /tmp/pypy3.9-v7.3.11-linux64 /opt/pypy3.9-v7.3.11;\
    ;;\
    "aarch64")\
    wget https://downloads.python.org/pypy/pypy3.9-v7.3.11-aarch64.tar.bz2 -O /tmp/pypy3.9-v7.3.11-aarch64.tar.bz2;\
    cd /tmp && tar -xf pypy3.9-v7.3.11-aarch64.tar.bz2;\
    mv /tmp/pypy3.9-v7.3.11-aarch64 /opt/pypy3.9-v7.3.11;\
    ;;\
    esac; \
    rm /tmp/pypy3.9*;

FROM ubuntu:22.04

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get -y install --no-install-recommends \
    build-essential \
    git \
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
    libffi-dev \
    libbz2-dev \
    apt-transport-https \
    ca-certificates \
    postgresql-client \
    lz4 \
    proj-bin \
    libproj-dev \
    libyaml-dev \
    # dtach: emulates the detach feature of screen, not sure where it's used.
    dtach \
    # jq: command-line JSON processor.
    jq \
    # libssel-dev: TODO: not sure if this is required.
    libssl-dev \
    # liblz4-tool: TODO: not sure if this is required in addition to lz4.
    liblz4-tool \
    # pigz: faster gzip implementation.
    pigz \
    # libopenblas-dev: TODO: not sure if this is required.
    libopenblas-dev \
    # liblapack-dev: TODO: not sure if this is required.
    liblapack-dev \
    # watchman warns not to use Ubuntu supplied version, but the current version
    # doesn't build on arm64, and they don't provide and arm64 .deb package.
    # watchman is used by translations to watch files.
    watchman \
    vim \
    && update-ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Bring in the exact version of node we currently use:
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs

# Bring in the exact version of CPython we currently use:
ADD https://www.python.org/ftp/python/3.9.16/Python-3.9.16.tgz /tmp/Python-3.9.16.tgz
RUN cd /tmp && tar -xvf Python-3.9.16.tgz && cd Python-3.9.16 \
    && ./configure --prefix=/opt/python/3.9.16/ --enable-optimizations --with-lto --with-computed-gotos --with-system-ffi \
    && make -j "$(nproc)" \
    && make altinstall \
    && rm -rf /tmp/Python-3.9.16*

# Install minio client
COPY --chmod=755 --from=downloader /usr/local/bin/mc /usr/local/bin/mc

WORKDIR /app

# CPython
# Create venv
RUN /opt/python/3.9.16/bin/python3.9 -m venv venv
# Install dependencies
COPY requirements.txt requirements-web.txt requirements-dev.txt requirements-pipeline.txt ./
RUN . venv/bin/activate \
    && python -m pip install wheel==0.43.0 \
    && python -m pip install --no-build-isolation -r requirements.txt -r requirements-web.txt -r requirements-dev.txt -r requirements-pipeline.txt

# PyPy
# Install pypy
COPY --from=downloader /opt/pypy3.9-v7.3.11 /opt/pypy3.9-v7.3.11
# Update setup and create venv
RUN /opt/pypy3.9-v7.3.11/bin/pypy3 -m ensurepip \
    && /opt/pypy3.9-v7.3.11/bin/pypy3 -m venv venv_pypy3
# Install pypy dependencies
RUN . venv_pypy3/bin/activate \
    && pypy3 -m pip install wheel==0.43.0 \
    && pypy3 -m pip install --no-build-isolation -r requirements.txt -r requirements-pipeline.txt

# Install flow.
COPY --from=downloader /usr/local/bin/flow /usr/local/bin/flow

RUN npm install -g yarn

COPY package.json yarn.lock ./
RUN yarn install

ENV ZEN_HOME /app

EXPOSE 5000

CMD [ "./docker/dev/scripts/start_web.sh" ]