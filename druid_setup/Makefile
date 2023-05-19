ENV_FILE=.env
ENV_COMMON=environment/common.env

PROJECT_NAME=druid

include $(ENV_FILE)

default:
	@echo "Please specify a target to make"

single_server_up:
	@cd single && \
		DOCKER_HOST=$(SINGLE_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		--env-file environment/common.env up -d

single_server_down:
	@cd single && \
		DOCKER_HOST=$(SINGLE_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		--env-file environment/common.env down

single_server_logs:
	@cd single && \
		DOCKER_HOST=$(SINGLE_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		--env-file environment/common.env logs -f

cluster_server_up:
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_MASTER_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-master.yml \
		--env-file cluster.env up -d
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_DATA_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-data.yml \
		--env-file cluster.env up -d
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_QUERY_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-query.yml \
		--env-file cluster.env up -d

cluster_server_down:
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_MASTER_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-master.yml \
		--env-file cluster.env down
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_DATA_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-data.yml \
		--env-file cluster.env down
	@cd cluster && \
		DOCKER_HOST=$(CLUSTER_QUERY_SERVER_DOCKER_HOST) \
		docker compose --project-name $(PROJECT_NAME) \
		-f docker-compose-query.yml \
		--env-file cluster.env down
