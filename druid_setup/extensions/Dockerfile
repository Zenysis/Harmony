FROM alpine:latest

RUN apk add bash

WORKDIR /druid/extensions

COPY load_extensions.sh /druid/load_extensions.sh

ENTRYPOINT [ "/bin/bash", "/druid/load_extensions.sh" ]
