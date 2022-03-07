from builtins import object


class PostgresConfig(object):
    '''Postgres connection configuration
    '''

    def __init__(self, username, password, host, port):
        self._username = username
        self._password = password
        self._host = host
        self._port = port

    @property
    def username(self):
        return self._username

    @property
    def password(self):
        return self._password

    @property
    def host(self):
        return self._host

    @property
    def port(self):
        return self._port
