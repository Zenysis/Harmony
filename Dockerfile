FROM python:3.7-slim-stretch
# Setup environment
ENV INSTALL_PATH /zenysis
ENV R77_SRC_ROOT ${INSTALL_PATH}
ENV ZENYSIS_SRC_ROOT ${INSTALL_PATH}
ENV NODE_ENV 'production'
ENV ZEN_ENV 'br'
ENV ZEN_PROD 1
ENV ZEN_DOCKER 1
ENV PYTHONPATH "${ZENYSIS_SRC_ROOT}:${PYTHONPATH}"

RUN mkdir -p ${INSTALL_PATH}
RUN mkdir -p /data/output

WORKDIR ${INSTALL_PATH}

ADD . .

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

# Install python dependencies
RUN python3.7 -m pip install --upgrade pip
RUN pip3.7 install -r requirements.txt -r requirements-web.txt -r requirements-pipeline.txt -r requirements-dev.txt

# Log dir
RUN mkdir -p /logs
RUN echo '{}' > /zenysis/instance_config.json

# Upgrade database and run
EXPOSE 5000

CMD docker/entrypoint_web.sh 2>&1 | tee /logs/web_server.log
