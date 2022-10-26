ENV_FILE=.env
include $(ENV_FILE)

DOCKER_REMOTE=ssh://$(ZEN_WEB_REMOTE)

web_configure:
	@scp nginx/nginx_vhost_default_location $(ZEN_WEB_REMOTE):${NGINX_DEFAULT_VHOST_CONFIG}
	@scp instance_config.json $(ZEN_WEB_REMOTE):${INSTANCE_CONFIG}

web_deploy:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker-compose --env-file $(ENV_FILE) --file docker-compose.yml up -d --force-recreate
	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

web_stop:
	@DOCKER_HOST=$(DOCKER_REMOTE) docker-compose --env-file $(ENV_FILE) --file docker-compose.yml down
	@DOCKER_HOST=$(DOCKER_REMOTE) docker system prune -af

web_ssh:
	ssh $(ZEN_WEB_REMOTE)
