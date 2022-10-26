DOCKER_NAMESPACE=zengineering
DOCKER_TAG=latest

web_client_build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web-client:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web-client .

web_client_push:
	docker push $(DOCKER_NAMESPACE)/harmony-web-client:$(DOCKER_TAG)

web_server_build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web-server:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web-server .

web_server_push:
	@docker push $(DOCKER_NAMESPACE)/harmony-web-server:$(DOCKER_TAG)

web_build:
	@docker build -t $(DOCKER_NAMESPACE)/harmony-web:$(DOCKER_TAG) \
		-f docker/web/Dockerfile_web \
		--build-arg SOURCE=$(DOCKER_NAMESPACE) \
		--build-arg TAG=$(DOCKER_TAG)  .

web_push:
	@docker push $(DOCKER_NAMESPACE)/harmony-web:$(DOCKER_TAG)

all_build: web_client_build web_server_build web_build

all_push: web_client_push web_server_push web_push
