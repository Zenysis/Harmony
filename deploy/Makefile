ENV_FILE=.env
include $(ENV_FILE)

DOCKER_HOST ?= ssh://$(ZEN_WEB_REMOTE)
PROJECT_NAME ?= harmony-web

configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}
	@scp global_config.py $(ZEN_WEB_REMOTE):${GLOBAL_CONFIG}

prune:
	docker system prune -af

up:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate

down:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml down

logs:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs -f

web_up:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate web

web_logs:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs web -f

web_bash:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash

web_ssh:
	ssh $(ZEN_WEB_REMOTE)

hasura_logs:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml logs hasura -f

postgres_up:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres up postgres -d --force-recreate

postgres_psql:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres exec postgres psql -h localhost -U ${POSTGRES_USER}

generate_connection_string:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run web /bin/bash -c "ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh ${POSTGRES_DB_HOST} ${HARMONY_INSTANCE_DB_NAME} ${POSTGRES_USER}"

upgrade_database:
	docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml run --rm web /bin/bash -c "./scripts/upgrade_database.sh"

