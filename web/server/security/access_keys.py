import time

from log import LOG
from util.credentials.generate import generate_secure_password, ALPHANUMERIC_CHARSET
from web.server.environment import IS_PRODUCTION
from web.server.redis.client import RedisClient

# Length of access key string
KEY_LENGTH = 32

# Access keys expire after this many seconds
KEY_LIFETIME_SEC = 60


class AccessKeys(object):
    '''Utility for generating and validating temporary keys that can be used to
    access the platform without a login.

    Our Flask app is configured to accept this key passed via cookie named
    `accessKey`.
    '''

    def __init__(self):
        self.access_keys = {}

    def generate_temporary_key(self, expiration_sec=KEY_LIFETIME_SEC):
        '''Generate a temporary access key that expires after a given length of
        time.

        expiration_sec: TTL of key in seconds
        '''
        key = generate_secure_password(KEY_LENGTH, ALPHANUMERIC_CHARSET)
        expiration = int(time.time()) + expiration_sec
        self.access_keys[key] = expiration
        if IS_PRODUCTION:
            RedisClient.instance().set(get_redis_key(key), 1, ex=expiration_sec)
        return key

    def is_valid_key(self, key):
        if IS_PRODUCTION:
            if RedisClient.instance().get(get_redis_key(key)):
                return True
            LOG.debug('AccessKeys: redis does not contain key %s', key)
        elif key in self.access_keys:
            now = int(time.time())
            valid = now < self.access_keys[key]
            if valid:
                return True
            LOG.debug('AccessKeys: rejected expired key %s', key)
        else:
            LOG.debug('AccessKeys: did not recognize key %s', key)
        return False


def get_redis_key(key):
    return f'accesskey:{key}'


# pylint:disable=invalid-name
KeyManager = AccessKeys()
