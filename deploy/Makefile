ENV_FILE=.env
include $(ENV_FILE)

DOCKER_REMOTE=${DOCKER_REMOTE-:ssh://$(ZEN_WEB_REMOTE)}
PROJECT_NAME=harmony

web_configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}
	@scp global_config.py $(ZEN_WEB_REMOTE):${GLOBAL_CONFIG}

up_postgres:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres up postgres -d --force-recreate

create_deployment_database:
# We don't know if we have psql installed locally, so we need to run our script
# in a temporary container that we know has psql.
# This step assumed that you have an instance of postgres running that you
# can connect to.
# 1. spin up a temporary container that we know has psql.
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres_util up postgres_util --detach
# 2. copy create_deployment_database.sh to the temporary container.
	 @DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres_util cp ../scripts/create_deployment_database.sh postgres_util:/tmp/create_deployment_database.sh
# 3. execute the script in the temporary container
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres_util exec postgres_util /tmp/create_deployment_database.sh ${POSTGRES_DB_HOST} ${HARMONY_INSTANCE_DB_NAME} ${POSTGRES_USER}
# 4. stop the temporary container
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml --profile postgres_util stop postgres_util

web_deploy:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate
# 	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

web_stop:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker compose --project-name ${PROJECT_NAME} --env-file $(ENV_FILE) --file docker-compose.yml down
#	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

web_ssh:
	ssh $(ZEN_WEB_REMOTE)
