
# Demonstration

This folder contains docker-compose files for druid and harmony to easily run a demonstration of the platform by running all dependencies in docker containers.

The two docker-compose files:
- ./demonstration/druid/docker-compose.yml
- ./demonstration/harmony/docker-compose.yml


Harmony and druid run in seperate docker networks, but Harmony has access to the Druid network.

## Druid
Start druid:
```
cd demonstration/druid
cp .env.example .env
docker compose up
```

## Harmony
- Optional - build Harmony images:
```
cd demonstration/harmony
docker compose build web_client
docker compose build web_server
docker compose build web
docker compose build pipeline
```

- Alternative - download pre-built images.

Start harmony:
```
cd demonstration/harmony
# create instance configuration
echo "{}" > instance_config.json
cp .env.example .env
# make appropriate changes to .env!!!
docker compose up
```

### Run the pipeline
```
docker compose run pipeline /bin/bash
source venv/bin/activate
./pipeline/br/generate/zeus_generate run
```

### Notes on minio
- Validate minio is running:
  - browse to http://localhost:9090
  - run `docker compose run pipeline /bin/bash -c "mc ls zen"`
- For convenience, mc.config.json is set up with user and password matching .env.example

## M1 Specific Notes
- Enabling "Use Rosetta for x86/amd64 emulation on Apple Silicon" in Docker Settings under "Features in development" is supposed to speed up emulation, but has also been found to cause issues with building Harmony images.
- Provide sufficient memory to Docker (12GB), otherwise building web images will fail.