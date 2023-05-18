DOCKER_NAMESPACE=zengineering
DOCKER_TAG=latest

default:
	@echo "Please specify a target to make"

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
		--build-arg NAMESPACE=$(DOCKER_NAMESPACE) \
		--build-arg TAG=$(DOCKER_TAG)  .

web_push:
	@docker push $(DOCKER_NAMESPACE)/harmony-web:$(DOCKER_TAG)

etl_pipeline_build:
	@DOCKER_BUILDKIT=1 docker build -t $(DOCKER_NAMESPACE)/harmony-etl-pipeline:$(DOCKER_TAG) \
		-f Dockerfile_dev  .

etl_pipeline_push:
	@docker push $(DOCKER_NAMESPACE)/harmony-etl-pipeline:$(DOCKER_TAG)

all_build: web_client_build web_server_build web_build etl_pipeline_build

all_push: web_client_push web_server_push web_push etl_pipeline_push
