# The base exception type all Druid exceptions derive from
class BaseDruidException(Exception):
    pass


# Exception to raise when a datasource cannot be found
class MissingDatasourceException(BaseDruidException):
    pass


class BadIndexingPathException(BaseDruidException):
    pass


class DruidQueryError(BaseDruidException):
    pass
