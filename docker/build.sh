#!/bin/bash -e

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd ${ZEN_SRC_ROOT} &>/dev/null

NAMESPACE="ghcr.io/zenysis"
TAG="latest"

docker build -f ./docker/web/Dockerfile_web-client -t ${NAMESPACE}/harmony-web-client:${TAG} .
docker build -f ./docker/web/Dockerfile_web-server -t ${NAMESPACE}/harmony-web-server:${TAG} .
docker build -f ./docker/web/Dockerfile_web --build-arg NAMESPACE=${NAMESPACE} --build-arg TAG=${TAG} -t ${NAMESPACE}/harmony-web:${TAG} .

popd &>/dev/null
