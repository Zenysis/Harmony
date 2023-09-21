import os

from config import settings


class BaseDruidConfig:
    def __init__(self, druid_host: str, always_use_router: bool = False):
        self._druid_host = druid_host
        self._always_use_router = always_use_router

    def base_endpoint(self):
        return self._druid_host

    def build_endpoint(self, port):
        base_endpoint = self.base_endpoint()

        # If the router is available, send all requests through the router. The router
        # will proxy the request to the correct server.
        if self._always_use_router:
            return self.router_endpoint()

        return f'{base_endpoint}:{port}'

    def query_endpoint(self):
        # Queries should be routed through the broker
        return self.build_endpoint(8082)

    def indexing_endpoint(self):
        # Indexing tasks are managed by the overlord which runs inside the coordinator.
        return self.build_endpoint(8081)

    def router_endpoint(self):
        return f'{self.base_endpoint()}:8888'

    def segment_metadata_endpoint(self):
        return self.build_endpoint(8081)


class ImplyDruidConfig(BaseDruidConfig):
    # pylint: disable=C0301
    def __init__(
        self,
        druid_host: str = settings.DRUID_HOST,
    ):
        super().__init__(druid_host, always_use_router=True)

    def router_endpoint(self):
        return f'{self.base_endpoint()}:9088'


def guess_druid_host():
    env_druid_host = os.getenv('DRUID_HOST')
    if env_druid_host:
        return env_druid_host

    try:
        # pylint: disable=import-outside-toplevel
        from config.druid import DRUID_HOST

        return DRUID_HOST
    except ImportError:
        pass

    return None


def construct_druid_configuration(druid_host=None):
    # If no druid host can be derived, return the default config with the default druid
    # host set.
    if not druid_host:
        return BaseDruidConfig(settings.DRUID_HOST)

    return BaseDruidConfig(druid_host)


DruidConfig = construct_druid_configuration()
