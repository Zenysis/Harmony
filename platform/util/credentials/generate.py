import os

ALPHANUMERIC_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
# pylint: disable=line-too-long
ALPHANUMERIC_WITH_SYMBOLS_CHARSET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
)


def generate_secure_password(length=16, charset=ALPHANUMERIC_WITH_SYMBOLS_CHARSET):
    '''Taken from:
    https://stackoverflow.com/questions/41969093/how-to-generate-passwords-in-python-2-and-python-3-securely'''
    random_bytes = os.urandom(length)
    len_charset = len(charset)
    indices = [int(len_charset * (byte / 256.0)) for byte in random_bytes]
    return ''.join([charset[index] for index in indices])
