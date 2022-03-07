# mypy: disallow_untyped_defs=True
from typing import Optional, cast

from flask import current_app
from redis import Redis


def create_instance(host: Optional[str] = None, port: Optional[int] = None) -> Redis:
    if not host:
        host = current_app.config.get('REDIS_HOST', 'redis')
    if not port:
        port_str = current_app.config.get('REDIS_PORT', '6379')
        port = int(port_str)
    return Redis(host=cast(str, host), port=port)


# NOTE(stephen): Rudimentary singleton class for accessing Redis in a centralized way.
class RedisClient:
    _singleton: Optional[Redis] = None

    @staticmethod
    def instance() -> Redis:
        '''Return a singleton reference to a Redis session.'''
        if not RedisClient._singleton:
            RedisClient._singleton = create_instance()
        return RedisClient._singleton
