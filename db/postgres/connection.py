from builtins import object
import psycopg2

from sqlalchemy import create_engine


class PostgresConnection(object):
    '''Basic utility for creating new postgres connections
    '''

    @classmethod
    def create_psycopg2(cls, pg_config, dbname):
        return psycopg2.connect(
            user=pg_config.username,
            password=pg_config.password,
            host=pg_config.host,
            port=pg_config.port,
            dbname=dbname,
        )

    @classmethod
    def create_sqlalchemy(cls, pg_config, dbname=None):
        db_uri = cls.create_db_uri(pg_config, dbname)
        return create_engine(db_uri)

    @classmethod
    def create_db_uri(cls, pg_config, dbname=None):
        '''Create a database URI that can be used by sqlalchemy
        '''
        output = 'postgresql://%s:%s@%s:%s' % (
            pg_config.username,
            pg_config.password,
            pg_config.host,
            pg_config.port,
        )
        if dbname:
            output += '/%s' % dbname
        return output
