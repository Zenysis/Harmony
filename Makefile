ENV_FILE=deploy/.env
include $(ENV_FILE)

DOCKER_WEB_CONTEXT=${ZEN_WEB_ENV}-web

web_client_build:
	docker build -t $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web-client:$(DOCKER_BRANCH_NAME) \
		-f docker/web/Dockerfile_web-client .

web_client_push:
	docker push $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web-client:$(DOCKER_BRANCH_NAME)

web_server_build:
	docker build -t $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web-server:$(DOCKER_BRANCH_NAME) \
		-f docker/web/Dockerfile_web-server .

web_server_push:
	docker push $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web-server:$(DOCKER_BRANCH_NAME)

web_build:
	docker build -t $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web:$(DOCKER_BRANCH_NAME) \
		-f docker/web/Dockerfile_web \
		--build-arg SOURCE=$(DOCKER_SOURCE) \
		--build-arg PROJECT=$(DOCKER_DOCKER_PROJECT_ID) \
		--build-arg TAG=$(DOCKER_BRANCH_NAME)  .

web_push:
	docker push $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/web:$(DOCKER_BRANCH_NAME)

postgres_build:
	docker build -t $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/postgres:$(DOCKER_BRANCH_NAME) \
		-f docker/postgres/Dockerfile .

postgres_push:
	docker push $(DOCKER_SOURCE)/$(DOCKER_PROJECT_ID)/postgres:$(DOCKER_BRANCH_NAME)

all_build: web_client_build web_server_build web_build postgres_build

all_push: web_client_push web_server_push web_push postgres_push

web_configure:
	scp deploy/nginx/nginx_vhost_default_location $(DOCKER_REMOTE_SSH):${NGINX_DEFAULT_VHOST_CONFIG}
	scp deploy/instance_config.json $(DOCKER_REMOTE_SSH):${INSTANCE_CONFIG}
	docker context create $(DOCKER_WEB_CONTEXT) --docker "host=ssh://$(DOCKER_REMOTE_SSH)"

web_deploy:
	docker-compose --context $(DOCKER_WEB_CONTEXT) --env-file $(ENV_FILE) --file deploy/docker-compose.yml pull
	docker-compose --context $(DOCKER_WEB_CONTEXT) --env-file $(ENV_FILE) --file deploy/docker-compose.yml up -d --force-recreate

web_stop:
	docker-compose --context $(DOCKER_WEB_CONTEXT) --env-file $(ENV_FILE) --file deploy/docker-compose.yml down

web_ssh:
	ssh $(DOCKER_REMOTE_SSH)
