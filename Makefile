ENV_FILE?=.env
-include $(ENV_FILE)

COMMIT?=master
DOCKER_NAMESPACE?=zengineering
DOCKER_TAG?=latest
DOCKER_HOST?=ssh://$(WEB_REMOTE)
SERVICE?=
PROJECT_NAME?=harmony-web

ACTIVATE_VENV := $(if $(DEV), -c "source venv/bin/activate && /bin/bash",)
DEV_OVERRIDE := $(if $(DEV), -f docker-compose.dev.yaml,)
DB_OVERRIDE := $(if $(DB), -f docker-compose.db.yaml,)
LOCAL_OVERRIDE := $(if $(LOCAL), -f docker-compose.local.yaml,)
PROD_OVERRIDE := $(if $(PROD), -f docker-compose.prod.yaml,)
OVERRIDES := $(DB_OVERRIDE)$(LOCAL_OVERRIDE)$(DEV_OVERRIDE)$(PROD_OVERRIDE)
COMPOSE_COMMAND := DOCKER_HOST=$(DOCKER_HOST) docker compose -p $(PROJECT_NAME) --env-file $(ENV_FILE) -f docker-compose.yaml $(OVERRIDES)

# help command copied from https://dwmkerr.com/makefile-help-command/
help: # Show help for each of the Makefile recipes.
	@grep -E '^[a-zA-Z0-9 -_]+:.*#'  Makefile | sort | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done

configure:	
	scp ./prod/nginx/nginx_vhost_default_location $(WEB_REMOTE):${NGINX_VHOST}

lint-python: # Lint only the python files that have changed on this branch, with respect to master. (You can run `make lint-python COMMIT=<my-commit>` e.g. `make lint-python COMMIT=HEAD~1` to lint the files that have changed on the last commit.)
	COMMIT=$(COMMIT) ./scripts/lint_python.sh

lint-js: # Lint only the js and jsx files that have changed on this branch, with respect to master. (You can run `make lint-js COMMIT=<my-commit>` e.g. `make lint-js COMMIT=my-other-branch` to lint the files that have changed with respect to my-other-branch.)
	COMMIT=$(COMMIT) ./scripts/lint_js.sh

lint: lint-python lint-js # Lint only the python, js and jsx files that have changed on this branch, with respect to master. (You can run `make lint COMMIT=<my-commit>` e.g. `make lint COMMIT=HEAD~1` to lint the files that have changed on the last commit.)
	
black: # Run black on all python files that have changed on this branch, with respect to master. (You can run `make black COMMIT=<my-commit>` e.g. `make black COMMIT=origin/master` to lint the files that have changed with respect to origin/master.)
	COMMIT=$(COMMIT) ./scripts/format_python.sh

build: # Build docker images (for development and production) using docker compose.
	docker compose --env-file $(ENV_FILE) -f docker-compose.build.yaml build $(SERVICE)

convert: # Use the "docker compose config" command to render the compose file. (Useful to see the impact of environment variables.) 
	$(COMPOSE_COMMAND) config

create-db-setup-script: # Create the db setup script.
	$(COMPOSE_COMMAND) run --rm web /bin/bash -c "ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh ${POSTGRES_HOST} ${POSTGRES_USER} ${INSTANCE_DB_NAME}"

create-admin-user: # Create an admin user.
	$(COMPOSE_COMMAND) run --rm web /bin/bash -c "./scripts/create_user.py --username=${ADMIN_USERNAME} --password=${ADMIN_PASSWORD} --first_name=${ADMIN_FIRSTNAME} --last_name=${ADMIN_LASTNAME} --site_admin"

dev-prepare-database: # Prepare database. Not something you can run in production. This is only for local development.
	docker compose --env-file $(ENV_FILE) -f docker-compose.yaml -f docker-compose.dev.yaml run --rm web /bin/bash -c "source venv/bin/activate && yarn init-db $(ZEN_ENV) --populate_indicators"

exec-bash: # Connect to a running container
	$(COMPOSE_COMMAND) exec $(SERVICE) /bin/bash

down: # Stop all containers.
	$(COMPOSE_COMMAND) down $(SERVICE)

logs: # Tail the logs of all containers.
	$(COMPOSE_COMMAND) logs $(SERVICE) -f --tail 100

minio-server-up: # Start the minio server container.
	DOCKER_HOST=$(DOCKER_HOST) docker compose --env-file $(ENV_FILE) -f docker-compose.minio.yaml up --detach

minio-server-down: # Stop the minio server container.
	DOCKER_HOST=$(DOCKER_HOST) docker compose --env-file $(ENV_FILE) -f docker-compose.minio.yaml down

mypy: # Run mypy using `mypy --config-file mypy.ini`
	source venv/bin/activate;
	mypy --config-file mypy.ini;

postgres-psql:
	$(COMPOSE_COMMAND) exec postgres psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} ${POSTGRES_DB}

ps:
	$(COMPOSE_COMMAND) ps

restart: # Restart a container.
	$(COMPOSE_COMMAND) restart $(SERVICE)

stop: # Stop a container.
	$(COMPOSE_COMMAND) stop $(SERVICE)

up: # Start all containers.
	$(COMPOSE_COMMAND) up $(SERVICE) --detach

up-no-detach: # Start all containers, but don't detach.
	$(COMPOSE_COMMAND) up $(SERVICE)

up-dev-pipeline: # Start the dev pipeline.
	COMMAND=$(COMMAND) $(COMPOSE_COMMAND) up pipeline

up-pipeline:
	DOCKER_HOST=$(DOCKER_HOST) docker compose --env-file $(ENV_FILE) -f docker-compose.pipeline.yaml up

bash-pipeline:
	DOCKER_HOST=$(DOCKER_HOST) docker compose --env-file $(ENV_FILE) -f docker-compose.pipeline.yaml run --rm etl-pipeline /bin/bash -c "source venv/bin/activate && /bin/bash"

bash-dev-pipeline:
	$(COMPOSE_COMMAND) run --rm pipeline /bin/bash -c "source venv/bin/activate && /bin/bash"

bash-web:
	$(COMPOSE_COMMAND) run --rm web /bin/bash $(ACTIVATE_VENV)

upgrade-database:
	$(COMPOSE_COMMAND) run --rm web /bin/bash -c "./scripts/upgrade_database.sh"

populate-query-models:
	$(COMPOSE_COMMAND) run --rm web /bin/bash -c "./scripts/data_catalog/populate_query_models_from_config.py"

run-bash: # Bash into a container
	$(COMPOSE_COMMAND) run --rm $(SERVICE) /bin/bash

web-client-build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web-client:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web-client .

web-client-push: # Push the web client docker image to the container registry.
	docker push $(DOCKER_NAMESPACE)/harmony-web-client:$(DOCKER_TAG)

web-server-build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web-server:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web-server .

web-server-push: # Push the web server docker image to the container registry.
	docker push $(DOCKER_NAMESPACE)/harmony-web-server:$(DOCKER_TAG)

web-build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web \
		--build-arg NAMESPACE=$(DOCKER_NAMESPACE) \
		--build-arg TAG=$(DOCKER_TAG)  .

web-push: # Push the web docker image to the container registry.
	docker push $(DOCKER_NAMESPACE)/harmony-web:$(DOCKER_TAG)

etl-pipeline-build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-etl-pipeline:$(DOCKER_TAG) \
		-f docker/pipeline/Dockerfile  .

etl-pipeline-push: # Push the etl pipeline docker image to the container registry.
	docker push $(DOCKER_NAMESPACE)/harmony-etl-pipeline:$(DOCKER_TAG)

all-build: web-client-build web-server-build web-build etl-pipeline-build

all-push: web-client-push web-server-push web-push etl-pipeline-push # Push all docker images.
