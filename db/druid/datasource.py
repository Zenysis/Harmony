from builtins import object
import datetime
import re

# Simple Druid datasource representation
# pylint: disable=R0903
class DruidDatasource(object):
    def __init__(self, datasource_name):
        self._datasource_name = datasource_name

    @property
    def name(self):
        return self._datasource_name


# Site specific druid datasource that encodes the site and datasource
# date into the datasource name
class SiteDruidDatasource(DruidDatasource):
    # Site datasources follow the pattern 'site_datasourcedate'
    # NOTE(stephen): Keep the date portion regex in sync with the date format
    DATASOURCE_PATTERN = re.compile('((?:[a-z]+_?)+)_([0-9]{8})')

    # TODO(stephen): Change this to '%Y%m%d.%H%M%S' to prevent collisions when
    # multiple datasources are built on the same day.
    DATE_FORMAT = '%Y%m%d'

    def __init__(self, site_name, datasource_date=None):
        # Default to today's date for a site database if none is specified
        self._date = datasource_date or datetime.datetime.today()
        self._site_name = site_name

        date_str = self._date.strftime(self.DATE_FORMAT)
        datasource_name = '%s_%s' % (self._site_name, date_str)
        # Prevent a datasource object from being created if the datasource
        # name generated is not valid.
        self.validate_datasource_name(datasource_name)
        super(SiteDruidDatasource, self).__init__(datasource_name)

    # The name of the site this datasource was created for
    @property
    def site(self):
        return self._site_name

    # Datetime object representing when this datasource was created
    @property
    def date(self):
        return self._date

    # Create a site datasource from the given datasource name. Throws a
    # ValueError if the datasource name is not valid.
    @classmethod
    def build(cls, name):
        cls.validate_datasource_name(name)

        (site, date_str) = cls.DATASOURCE_PATTERN.match(name).groups()
        datasource_date = datetime.datetime.strptime(date_str, cls.DATE_FORMAT)
        return cls(site, datasource_date)

    # Raise an error if the input datasource name is not a valid site
    # datasource name
    @classmethod
    def validate_datasource_name(cls, datasource_name):
        validation_error_msg = cls._validate_datasource_name(datasource_name)
        if validation_error_msg:
            raise ValueError(
                'Unable to create valid datasource name from input. '
                'Datasource name: %s\tReason: %s'
                % (datasource_name, validation_error_msg)
            )

    # Test that the input datasource name is a valid site datasource name
    @classmethod
    def is_valid_datasource_name(cls, datasource_name):
        validation_error_msg = cls._validate_datasource_name(datasource_name)
        return not validation_error_msg

    # Verify whether a datasource name matches the pattern expected. Return
    # an error message explaining the results of validation. An empty error
    # message means validation was successful.
    @classmethod
    def _validate_datasource_name(cls, datasource_name):
        match = cls.DATASOURCE_PATTERN.match(datasource_name)
        error_str = ''
        # Validate the structure of the datasource name first
        if not match or len(match.groups()) != 2:
            error_str = 'Pattern mismatch: %s' % cls.DATASOURCE_PATTERN.pattern
        else:
            # Validate that the date is parseable
            date_str = match.groups()[1]
            try:
                _ = datetime.datetime.strptime(date_str, cls.DATE_FORMAT)
            except ValueError:
                error_str = 'Date (%s) does not match format (%s)' % (
                    date_str,
                    cls.DATE_FORMAT,
                )

        return error_str
