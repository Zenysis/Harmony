ENV_FILE=.env
include $(ENV_FILE)

# TODO: change to `DOCKER_HOST ?= ssh://$(ZEN_WEB_REMOTE)` - that way you
# can drop `@DOCKER_HOST=$(DOCKER_REMOTE)` from all the commands.
DOCKER_REMOTE ?= ssh://$(ZEN_WEB_REMOTE)
PROJECT_NAME ?= harmony-web

configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}
	@scp global_config.py $(ZEN_WEB_REMOTE):${GLOBAL_CONFIG}

up:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate
	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

down:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml down
	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

logs:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs -f

web_up:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate web
	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

web_logs:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs web -f

web_bash:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash

web_ssh:
	ssh $(ZEN_WEB_REMOTE)

hasura_logs:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs hasura -f

postgres_up:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres up postgres -d --force-recreate

postgres_psql:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres exec postgres psql -h localhost -U ${POSTGRES_USER}

generate_connection_string:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run web /bin/bash -c "ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh ${POSTGRES_DB_HOST} ${HARMONY_INSTANCE_DB_NAME} ${POSTGRES_USER}"

upgrade_database:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash -c "./scripts/upgrade_database.sh"

