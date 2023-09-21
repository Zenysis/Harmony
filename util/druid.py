import os
from functools import lru_cache
from typing import Dict

from db.druid.config import ImplyDruidConfig


@lru_cache(maxsize=10)
def get_druid_request_params(druid_configuration) -> Dict:
    if isinstance(druid_configuration, ImplyDruidConfig):
        return {
            'auth': (os.environ['DRUID_USERNAME'], os.environ['DRUID_PASSWORD']),
            'verify': os.environ['DRUID_PRIVATE_KEY_PATH'],
        }
    return {}
