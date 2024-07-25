import os
from contextlib import contextmanager
from log import LOG


class EnvironmentCredentialProvider:
    def get(self, key):
        value = os.getenv(key, None)
        if not value:
            LOG.warning('Environment variable %s is not set', key)
        return value

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


@contextmanager
def CredentialProvider(_):  # pylint: disable=invalid-name
    yield EnvironmentCredentialProvider()
