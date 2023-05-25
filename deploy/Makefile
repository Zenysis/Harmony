ENV_FILE=.env
include $(ENV_FILE)

DOCKER_HOST ?= ssh://$(ZEN_WEB_REMOTE)
PROJECT_NAME ?= harmony-web
LOGS_ARGS ?= -f -n 1000

default:
	@echo "Please specify a target to make"

configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}
	@scp global_config.py $(ZEN_WEB_REMOTE):${GLOBAL_CONFIG}

prune:
	@DOCKER_HOST=$(DOCKER_HOST) docker system prune -af

up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml up -d --force-recreate

down:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml down

logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml logs -f

web_up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml up -d --force-recreate web

web_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml logs web $(LOGS_ARGS)

web_bash:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml run --rm web /bin/bash

web_exec:
    @DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml exec web /bin/bash

web_ssh:
	ssh $(ZEN_WEB_REMOTE)

hasura_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml logs hasura -f

postgres_up:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile postgres up postgres -d --force-recreate

postgres_stop:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile postgres stop postgres

postgres_logs:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile postgres logs -f postgres

postgres_psql:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile postgres exec postgres psql -h localhost -U ${POSTGRES_USER} postgres

create_db_setup_script:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml run web /bin/bash -c "ZEN_DB_LOG_ONLY=1 ./scripts/create_deployment_database.sh ${POSTGRES_HOST} ${INSTANCE_DB_NAME} ${POSTGRES_USER}"

upgrade_database:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml run --rm web /bin/bash -c "./scripts/upgrade_database.sh"

populate_data_models:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml run --rm web /bin/bash -c "./scripts/data_catalog/populate_query_models_from_config.py"

etl_pipeline_bash:
	@DOCKER_HOST=$(DOCKER_HOST) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile pipeline run --rm pipeline /bin/bash

etl_pipeline_generate:
	@DOCKER_HOST=$(DOCKER_HOST) COMMAND="./pipeline/${PIPELINE_ENV}/generate/generate_wrapper" docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile pipeline up pipeline --force-recreate

etl_pipeline_process:
	@DOCKER_HOST=$(DOCKER_HOST) COMMAND="./pipeline/${PIPELINE_ENV}/process/process_all" docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile pipeline up pipeline --force-recreate

etl_pipeline_index:
	@DOCKER_HOST=$(DOCKER_HOST) COMMAND="./pipeline/${PIPELINE_ENV}/index/index_all" docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile pipeline up pipeline --force-recreate

etl_pipeline_validate:
	@DOCKER_HOST=$(DOCKER_HOST) COMMAND="./pipeline/${PIPELINE_ENV}/validate/validate_all" docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --file docker-compose.override.yml --profile pipeline up pipeline --force-recreate