import os

from pylib.file.file_utils import FileUtils

# Detect if the current code is running within EC2
_BIOS_VERSION_FILE = '/sys/devices/virtual/dmi/id/bios_version'
RUNNING_IN_EC2 = os.path.isfile(
    _BIOS_VERSION_FILE
) and 'amazon' in FileUtils.FileContents(_BIOS_VERSION_FILE)
