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
    # Instance config is global and loaded only once. It lives at the root of
    # the source tree.
    if instance_config_path and os.path.isfile(instance_config_path):
        with open(instance_config_path, 'r') as f:
            return json.load(f)

    error_msg = 'Instance config file does not exist: %s' % DEFAULT_INSTANCE_CONFIG_PATH
    if IS_PRODUCTION:
        raise IOError(error_msg)

    if log_missing:
        print(error_msg)
    return {}
