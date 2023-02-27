
# Demonstration

## Start druid
```
cd druid
cp .env.example .env
docker compose up
```

## Start harmony
```
cd harmony
echo "{}" > instance_config.json
cp .env.example .env
# make appropriate changes to .env!!!
docker compose up
```

### Run the pipeline
```
docker compose run pipeline /bin/bash
```

### Notes on minio
- Validate minio is running:
  - browse to http://localhost:9090
  - run `docker compose run pipeline /bin/bash -c "mc ls zen"`
- For convenience, mc.config.json is set up with user and password matching .env.example

## M1 Specific Notes
- Enable "Use Rosetta for x86/amd64 emulation on Apple Silicon" in Docker Settings under "Features in development"
- Provide sufficient memory to Docker (12GB) other