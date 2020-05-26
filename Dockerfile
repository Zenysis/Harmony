FROM python:3.7-slim-stretch

# Setup environment
ENV INSTALL_PATH /zenysis
ENV R77_SRC_ROOT ${INSTALL_PATH}
ENV ZENYSIS_SRC_ROOT ${INSTALL_PATH}
ENV NODE_ENV 'production'
ENV ZEN_ENV 'br'
ENV ZEN_PROD 1
ENV ZEN_DOCKER 1
ENV DATABASE_URL 'postgresql://test_admin:zenpass@zen_postgres/zenysis'
ENV PYTHONPATH "${ZENYSIS_SRC_ROOT}:${PYTHONPATH}"

# Install dependencies needed by python and node requirements
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    curl \
    git-core \
    apt-transport-https \
    gnupg \
    gfortran \
    libpq-dev \
    libffi-dev \
    unattended-upgrades \
  && rm -rf /var/lib/apt/lists/*

RUN \
  echo "deb https://deb.nodesource.com/node_11.x stretch main" > /etc/apt/sources.list.d/nodesource.list && \
  curl https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
  curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  apt-get update && \
  apt-get install -yqq nodejs yarn && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${INSTALL_PATH}
RUN mkdir -p /data/output
WORKDIR ${INSTALL_PATH}

# Install python dependencies
COPY requirements.txt requirements.txt
COPY requirements-web.txt requirements-web.txt
RUN pip3 install -r requirements.txt
RUN pip3 install -r requirements-web.txt

# Lint is baked into the yarn install process
COPY lint lint

# Handle web/client dependencies first.
# Install node dependencies
# By putting this first, Docker will use the node_modules cache unless we make
# edits to package.json.
COPY yarn.lock yarn.lock
COPY package.json package.json
RUN yarn install --pure-lockfile --frozen-lockfile --production=false --no-cache

# Copy client code needed for webpack builds separately from python code. This
# will reduce docker build times if only python code has changed.
RUN mkdir -p web/public
COPY web/webpack.prod.config.js web/
COPY web/public web/public
COPY web/client web/client
COPY .flowconfig .flowconfig
#RUN yarn flow-check
RUN yarn run build && rm -rf node_modules

# Copy over code
COPY config config
COPY data data
COPY db db
COPY log log
COPY models models
COPY util util
COPY web/*.py web/
COPY web/server web/server

# Copy over misc that does not get yarn built.
COPY docker docker
COPY scripts scripts
#COPY test test
#COPY bin bin

# Log dir
RUN mkdir -p /logs

# Upgrade database and run
EXPOSE 5000
CMD docker/entrypoint_web.sh 2>&1 | tee /logs/web_server.log
