ENV_FILE=.env
include $(ENV_FILE)

DOCKER_HOST ?= ssh://$(ZEN_WEB_REMOTE)
PROJECT_NAME ?= harmony-web

configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}
	@scp global_config.py $(ZEN_WEB_REMOTE):${GLOBAL_CONFIG}

prune:
	@DOCKER_HOST=$(DOCKER_HOST) docker system prune -af

up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate
	@DOCKER_HOST=$(DOCKER_HOST) docker system prune --all --force --filter "until=24h"

down:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml down
	@DOCKER_HOST=$(DOCKER_HOST) docker system prune --all --force --filter "until=24h"

logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs -f

web_up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate web

web_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs web -f

web_bash:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash

web_ssh:
	ssh $(ZEN_WEB_REMOTE)

hasura_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs hasura -f

postgres_up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres up postgres -d --force-recreate

postgres_stop:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres stop postgres

postgres_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres logs -f postgres

postgres_psql:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres exec postgres psql -h localhost -U ${POSTGRES_USER}

create_db_setup_script:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run web /bin/bash -c "ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh ${POSTGRES_HOST} ${INSTANCE_DB_NAME} ${POSTGRES_USER}"

upgrade_database:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash -c "./scripts/upgrade_database.sh"

