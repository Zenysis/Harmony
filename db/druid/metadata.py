from abc import ABC, abstractmethod
from datetime import datetime
import requests

from pydruid.utils.filters import Filter

from db.druid.datasource import DruidDatasource, SiteDruidDatasource
from db.druid.errors import MissingDatasourceException
from db.druid.query_client import DruidQueryClient_
from log import LOG

ISO_8601_FORMAT = '%Y-%m-%dT%H:%M:%S.%fZ'

# Class that exposes the metadata druid stores for datasources and
# segments.
# http://druid.io/docs/latest/querying/datasourcemetadataquery.html
# http://druid.io/docs/latest/querying/segmentmetadataquery.html


DEFAULT_DATASOURCE_LIST_PATH = 'druid/coordinator/v1/metadata/datasources'
DEFAULT_DATASOURCE_LOAD_STATUS_PATH = 'druid/coordinator/v1/loadstatus'


class AbstractDruidMetadata(ABC):
    @abstractmethod
    def get_all_datasources(self):
        raise NotImplementedError()

    @abstractmethod
    def get_site_datasources(self):
        raise NotImplementedError()

    @abstractmethod
    def get_datasources_for_site(self, site):
        raise NotImplementedError()

    @abstractmethod
    def get_most_recent_datasource(self, site):
        raise NotImplementedError()

    @abstractmethod
    def get_datasource_metadata(self, datasource_name):
        raise NotImplementedError()

    @abstractmethod
    def get_datasource_version(self, datasource_name):
        raise NotImplementedError()

    @abstractmethod
    def get_datasource_load_status(self, datasource_name):
        raise NotImplementedError()

    @abstractmethod
    def is_datasource_queryable(self, datasource_name):
        raise NotImplementedError()

    @abstractmethod
    def get_datasource_timeboundary(self, datasource_name, query_filter=None):
        raise NotImplementedError()


class DruidMetadata_(AbstractDruidMetadata):
    def __init__(
        self,
        druid_configuration,
        query_client=None,
        datasource_list_path=DEFAULT_DATASOURCE_LIST_PATH,
        load_status_path=DEFAULT_DATASOURCE_LOAD_STATUS_PATH,
    ):
        self.query_client = query_client or DruidQueryClient_(druid_configuration)
        self.druid_configuration = druid_configuration
        self.datasource_list_path = datasource_list_path
        self.load_status_path = load_status_path

    # Return an unfiltered list of all druid datasources available
    def get_all_datasources(self):
        url = '%s/%s' % (
            self.druid_configuration.segment_metadata_endpoint(),
            self.datasource_list_path,
        )
        r = requests.get(url)
        raw_datasources = r.json()
        # Convert unicode to string since datasource names are valid ASCII
        return [DruidDatasource(str(d)) for d in raw_datasources]

    # Return the list of druid datasources available that match our standard
    # indexing naming pattern
    def get_site_datasources(self):
        return [
            SiteDruidDatasource.build(ds.name)
            for ds in self.get_all_datasources()
            if SiteDruidDatasource.is_valid_datasource_name(ds.name)
        ]

    def get_datasources_for_site(self, site):
        '''Return a list of druid datasource names available for a given site
        '''
        return [ds.name for ds in self.get_site_datasources() if ds.site == site]

    # Return the most recent datasource for a given site
    def get_most_recent_datasource(self, site):
        LOG.info('Getting most recent Druid datasources...')
        output = None
        for ds in self.get_site_datasources():
            if ds.site == site and (not output or ds.date > output.date):
                output = ds
        if not output:
            raise MissingDatasourceException(
                'No datasource could be found matching site prefix: %s' % site
            )
        LOG.info('Got most recent Druid datasources')
        return output

    # Issue a druid datasource metadata query and return the metadata
    # druid has for the requested datasource.
    # http://druid.io/docs/latest/querying/datasourcemetadataquery.html
    def get_datasource_metadata(self, datasource_name):
        query = {'queryType': 'dataSourceMetadata', 'dataSource': datasource_name}
        return self.query_client.run_raw_query(query)

    # Retrieve the current version of the given datasource.
    def get_datasource_version(self, datasource_name):
        # TODO(stephen): Druid has a bug where the "full" version of the
        # datasource endpoint doesn't work. When it gets fixed, see if it
        # includes version. If so, include it above as part of the core
        # DruidDatasource class.
        url = '%s/%s/%s?simple' % (
            self.druid_configuration.segment_metadata_endpoint(),
            self.datasource_list_path,
            datasource_name,
        )
        r = requests.get(url)
        if not r.ok:
            raise MissingDatasourceException(
                'Cannot retrieve version for datasource. Datasource does not '
                'exist: %s' % datasource_name
            )

        versions = set(segment['version'] for segment in r.json()['segments'])
        if len(versions) != 1:
            LOG.warn(
                'Somehow datasource has multiple live versions! Taking the most '
                'recent. Datasource: %s\nVersions: %s',
                datasource_name,
                versions,
            )
        return sorted(versions, reverse=True)[0]

    # Retrieve the percentage of segments that are queryable on the cluster for
    # the given datasource.
    def get_datasource_load_status(self, datasource_name):
        url = '%s/%s' % (
            self.druid_configuration.segment_metadata_endpoint(),
            self.load_status_path,
        )
        r = requests.get(url)
        r.raise_for_status()
        result = r.json()

        if datasource_name not in result:
            raise MissingDatasourceException(
                'Cannot retrieve load status for datasource. Datasource does '
                'not exist: %s' % datasource_name
            )

        return result[datasource_name]

    # Check if the given datasource is loaded on the cluster.
    def is_datasource_queryable(self, datasource_name):
        try:
            load_status = self.get_datasource_load_status(datasource_name)
            return load_status == 100
        except (
            MissingDatasourceException,
            requests.exceptions.HTTPError,
            requests.exceptions.ConnectionError,
        ):
            pass
        return False

    # Issue a druid timeBoundary metadata query and return the results.
    # Optionally pass the specified query_filter along with the request.
    # Converts the result to a datetime object, and returns a tuple of
    # (start, end) datetime objects.
    def get_datasource_timeboundary(self, datasource_name, query_filter=None):
        query = {'queryType': 'timeBoundary', 'dataSource': datasource_name}
        if query_filter:
            # Accept both Pydruid Filters and plain python dictionaries as
            # valid filters to send.
            if isinstance(query_filter, Filter):
                query_filter = query_filter.build_filter()
            query['filter'] = query_filter
        query_result = self.query_client.run_raw_query(query)[0]['result']
        return (
            datetime.strptime(query_result['minTime'], ISO_8601_FORMAT),
            datetime.strptime(query_result['maxTime'], ISO_8601_FORMAT),
        )


class DruidMetadata(AbstractDruidMetadata):
    DATASOURCE_LIST_PATH = 'druid/coordinator/v1/metadata/datasources'
    DATASOURCE_LOAD_STATUS = 'druid/coordinator/v1/loadstatus'
    DATASOURCE_SOURCES = 'druid/coordinator/v1/datasources'

    # Return an unfiltered list of all druid datasources available
    @classmethod
    def get_all_datasources(cls):
        from db.druid.config import DruidConfig

        url = '%s/%s' % (
            DruidConfig.segment_metadata_endpoint(),
            cls.DATASOURCE_LIST_PATH,
        )
        r = requests.get(url)
        raw_datasources = r.json()
        # Convert unicode to string since datasource names are valid ASCII
        return [DruidDatasource(str(d)) for d in raw_datasources]

    # Return the list of druid datasources available that match our standard
    # indexing naming pattern
    @classmethod
    def get_site_datasources(cls):
        return [
            SiteDruidDatasource.build(ds.name)
            for ds in cls.get_all_datasources()
            if SiteDruidDatasource.is_valid_datasource_name(ds.name)
        ]

    @classmethod
    def get_datasources_for_site(cls, site):
        '''Return a list of druid datasource names available for a given site
        '''
        return [ds.name for ds in cls.get_site_datasources() if ds.site == site]

    # Return the most recent datasource for a given site
    @classmethod
    def get_most_recent_datasource(cls, site):
        output = None
        for ds in cls.get_site_datasources():
            if ds.site == site and (not output or ds.date > output.date):
                output = ds
        if not output:
            raise MissingDatasourceException(
                'No datasource could be found matching site prefix: %s' % site
            )
        return output

    # Issue a druid datasource metadata query and return the metadata
    # druid has for the requested datasource.
    # http://druid.io/docs/latest/querying/datasourcemetadataquery.html
    @classmethod
    def get_datasource_metadata(cls, datasource_name):
        from db.druid.query_client import DruidQueryClient

        query = {'queryType': 'dataSourceMetadata', 'dataSource': datasource_name}
        return DruidQueryClient.run_raw_query(query)

    # Retrieve the current version of the given datasource.
    @classmethod
    def get_datasource_version(cls, datasource_name):
        from db.druid.config import DruidConfig

        url = '%s/%s/%s?simple' % (
            DruidConfig.segment_metadata_endpoint(),
            cls.DATASOURCE_LIST_PATH,
            datasource_name,
        )
        r = requests.get(url)
        if not r.ok:
            raise MissingDatasourceException(
                'Cannot retrieve version for datasource. Datasource does not '
                'exist: %s' % datasource_name
            )

        versions = set(segment['version'] for segment in r.json()['segments'])
        if len(versions) != 1:
            LOG.warn(
                'Somehow datasource has multiple live versions! Taking the most '
                'recent. Datasource: %s\nVersions: %s',
                datasource_name,
                versions,
            )
        return sorted(versions, reverse=True)[0]

    # Retrieve the percentage of segments that are queryable on the cluster for
    # the given datasource.
    @classmethod
    def get_datasource_load_status(cls, datasource_name):
        from db.druid.config import DruidConfig

        url = '%s/%s' % (
            DruidConfig.segment_metadata_endpoint(),
            cls.DATASOURCE_LOAD_STATUS,
        )
        r = requests.get(url)
        r.raise_for_status()
        result = r.json()

        if datasource_name not in result:
            raise MissingDatasourceException(
                'Cannot retrieve load status for datasource. Datasource does '
                'not exist: %s' % datasource_name
            )

        return result[datasource_name]

    # Check if the given datasource is loaded on the cluster.
    @classmethod
    def is_datasource_queryable(cls, datasource_name):
        try:
            load_status = cls.get_datasource_load_status(datasource_name)
            return load_status == 100
        except (
            MissingDatasourceException,
            requests.exceptions.HTTPError,
            requests.exceptions.ConnectionError,
        ):
            pass
        return False

    # Issue a druid timeBoundary metadata query and return the results.
    # Optionally pass the specified query_filter along with the request.
    # Converts the result to a datetime object, and returns a tuple of
    # (start, end) datetime objects.
    @classmethod
    def get_datasource_timeboundary(cls, datasource_name, query_filter=None):
        from db.druid.query_client import DruidQueryClient

        query = {'queryType': 'timeBoundary', 'dataSource': datasource_name}
        if query_filter:
            # Accept both Pydruid Filters and plain python dictionaries as
            # valid filters to send.
            if isinstance(query_filter, Filter):
                query_filter = query_filter.build_filter()
            query['filter'] = query_filter
        query_result = DruidQueryClient.run_raw_query(query)
        # This condition should only be true if there is a filter passed in. If there
        # is no filter, there should be a query_result returned.
        if not query_result:
            return (None, None)
        query_result = query_result[0]['result']
        return (
            datetime.strptime(query_result['minTime'], ISO_8601_FORMAT),
            datetime.strptime(query_result['maxTime'], ISO_8601_FORMAT),
        )
