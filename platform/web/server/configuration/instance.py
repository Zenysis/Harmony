import json
import os

from pylib.file.file_utils import FileUtils

from web.server.environment import IS_PRODUCTION

DEFAULT_INSTANCE_CONFIG_PATH = os.path.join(
    os.getenv('ZENYSIS_SRC_ROOT', FileUtils.GetSrcRoot()), 'instance_config.json'
)


# Verbose name is preferred in this case.
# pylint:disable=C0103
def load_instance_configuration_from_file(
    instance_config_path=DEFAULT_INSTANCE_CONFIG_PATH, log_missing=True
):
    return {}
