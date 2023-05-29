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
    # proj-bin \
    # libproj-dev \
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
    vim \
    && update-ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Numpy needs: proj, but the version of proj ubuntu gives us is too old, so we
# compile a newer one.
RUN wget https://download.osgeo.org/proj/proj-9.2.0.tar.gz -O /tmp/proj-9.2.0.tar.gz \
    && tar -xzf /tmp/proj-9.2.0.tar.gz -C /tmp/ \
    && rm /tmp/proj-9.2.0.tar.gz \
    && mkdir /tmp/proj-9.2.0/build \
    && cd /tmp/proj-9.2.0/build \
    && cmake .. \
    && cmake --build . \
    && cmake --build . --target install \
    && rm -rf /tmp/proj-9.2.0

# Bring in the exact version of CPython we currently use:
ADD https://www.python.org/ftp/python/3.9.16/Python-3.9.16.tgz /tmp/Python-3.9.16.tgz
RUN cd /tmp && tar -xvf Python-3.9.16.tgz && cd Python-3.9.16 \
    && ./configure --prefix=/opt/python/3.9.16/ --enable-optimizations --with-lto --with-computed-gotos --with-system-ffi \
    && make -j "$(nproc)" \
    && make altinstall \
    && rm -rf /tmp/Python-3.9.16*

# Install minio client
COPY --chmod=755 --from=downloader /usr/local/bin/mc /usr/local/bin/mc

WORKDIR /zenysis
# Best practice not to use root in Docker containers:
# Create a system user 'zenysis', with home directory '/home/zenysis'
# -r, --system: Create a system account
# -m, --create-home: Create the user's home directory
# -d, --home-dir: Home directory of the new account
RUN useradd -rm -d /home/zenysis zenysis && chown -R zenysis /zenysis
USER zenysis

# CPython
# Update setup and create venv
RUN /opt/python/3.9.16/bin/python3.9 -m pip install --upgrade pip setuptools \
    && /opt/python/3.9.16/bin/python3.9 -m venv venv \
    && . venv/bin/activate && python -m pip install --upgrade pip setuptools
# Install dependencies
COPY requirements.txt requirements-pipeline.txt ./
RUN . venv/bin/activate \
    && python -m pip install -r requirements.txt \
    && python -m pip install -r requirements-pipeline.txt

# PyPy
# Install pypy
COPY --from=downloader /opt/pypy3.9-v7.3.11 /opt/pypy3.9-v7.3.11
# Update setup and create venv
RUN /opt/pypy3.9-v7.3.11/bin/pypy3 -m ensurepip \
    && /opt/pypy3.9-v7.3.11/bin/pypy3 -m pip install --upgrade pip setuptools \
    && /opt/pypy3.9-v7.3.11/bin/pypy3 -m venv venv_pypy3
# Install pypy dependencies
RUN . venv_pypy3/bin/activate \
    && pypy3 -m pip install --upgrade pip setuptools \
    && pypy3 -m pip install -r requirements.txt \
    && pypy3 -m pip install -r requirements-pipeline.txt

# Copy only what the pipeline needs.
COPY pipeline ./pipeline
COPY util ./util
COPY data ./data
COPY docker/entrypoint_pipeline.sh ./docker/entrypoint_pipeline.sh
COPY config ./config
COPY models ./models
COPY log ./log
COPY web ./web
COPY db ./db
COPY scripts ./scripts