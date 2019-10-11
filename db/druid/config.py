from builtins import object
import os

import global_config

class BaseDruidConfig(object):
    ####### HOSTS #######
    DRUID_HOST = global_config.DEFAULT_DRUID_HOST

    @classmethod
    def base_endpoint(cls):
        return cls.DRUID_HOST

    @classmethod
    def build_endpoint(cls, port):
        return '%s:%s' % (cls.base_endpoint(), port)

    @classmethod
    def query_endpoint(cls):
        # Queries should be routed through the broker
        return cls.build_endpoint(cls.BROKER_PORT)

    @classmethod
    def indexing_endpoint(cls):
        # Indexing tasks are managed by the overlord
        return cls.build_endpoint(cls.OVERLORD_PORT)

    @classmethod
    def segment_metadata_endpoint(cls):
        return cls.build_endpoint(cls.COORDINATOR_PORT)


class TlsDruidConfig(BaseDruidConfig):
    ####### PORTS #######
    # The Druid coordinator node is primarily responsible for segment
    # management and distribution
    # http://druid.io/docs/latest/design/coordinator.html
    COORDINATOR_PORT = 8481

    # The Broker is the node to route queries to if you want to run a
    # distributed cluster
    # http://druid.io/docs/latest/design/broker.html
    BROKER_PORT = 8482

    # Historical nodes load up historical segments and expose them for querying
    # http://druid.io/docs/latest/design/historical.html
    HISTORICAL_PORT = 8483

    # The overlord node is responsible for accepting tasks, coordinating
    # task distribution, creating locks around tasks, and returning
    # statuses to callers.
    # http://druid.io/docs/latest/design/indexing-service.html#overlord-node
    # NOTE(stephen): The coordinator server is handling coordinator and overlord
    # duties using the druid.coordinator.asOverlord.enabled property. That is
    # why we use the coordinator's port here.
    OVERLORD_PORT = 8481

    # The middle manager node is a worker node that executes submitted tasks
    # http://druid.io/docs/latest/design/middlemanager.html
    MIDDLEMANAGER_PORT = 8491


class PlaintextDruidConfig(BaseDruidConfig):
    ####### PORTS #######
    # The Druid coordinator node is primarily responsible for segment
    # management and distribution
    # http://druid.io/docs/latest/design/coordinator.html
    COORDINATOR_PORT = 8081

    # The Broker is the node to route queries to if you want to run a
    # distributed cluster
    # http://druid.io/docs/latest/design/broker.html
    BROKER_PORT = 8082

    # Historical nodes load up historical segments and expose them for querying
    # http://druid.io/docs/latest/design/historical.html
    HISTORICAL_PORT = 8083

    # The overlord node is responsible for accepting tasks, coordinating
    # task distribution, creating locks around tasks, and returning
    # statuses to callers.
    # http://druid.io/docs/latest/design/indexing-service.html#overlord-node
    # NOTE(stephen): The coordinator server is handling coordinator and overlord
    # duties using the druid.coordinator.asOverlord.enabled property. That is
    # why we use the coordinator's port here.
    OVERLORD_PORT = 8081

    # The middle manager node is a worker node that executes submitted tasks
    # http://druid.io/docs/latest/design/middlemanager.html
    MIDDLEMANAGER_PORT = 8091


def construct_druid_configuration(druid_host=None):
    # HACK(stephen, vedant): This is a hack to support a legacy import method with
    # static dependencies. The goal of this method should be to remove all these
    # hacky static checks. Unfortunately it along with the DruidConfig singleton
    # is nescessary for now.

    try:
        if not druid_host:
            from config.druid import DRUID_HOST

            druid_host = os.getenv('DRUID_HOST', DRUID_HOST)

        output = None
        if druid_host.startswith('https://'):
            output = TlsDruidConfig
        else:
            output = PlaintextDruidConfig
        output.DRUID_HOST = druid_host
        return output
    except ImportError:
        # Default to Tls Druid config without a ZEN_ENV.
        return PlaintextDruidConfig


DruidConfig = construct_druid_configuration()
