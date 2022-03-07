from builtins import object
from db.druid.metadata import AbstractDruidMetadata, DruidDatasource
from db.druid.config import BaseDruidConfig
from web.server.data.dimension_metadata import DimensionMetadata
from web.server.data.dimension_values import DimensionValuesLookup
from web.server.data.row_count import RowCountLookup
from web.server.data.status import SourceStatus
from web.server.data.time_boundary import DataTimeBoundary


class DruidApplicationContext(object):
    '''A class that contains and produces metadata related to the currently
    loaded Druid datasource.
    '''

    def __init__(
        self,
        druid_metadata,
        druid_port_configuration,
        dimension_values_lookup,
        data_time_boundary,
        data_status_information,
        row_count_lookup,
        dimension_metadata,
        current_datasource,
    ):
        assert isinstance(druid_metadata, AbstractDruidMetadata)
        assert isinstance(druid_port_configuration, BaseDruidConfig)
        assert isinstance(dimension_values_lookup, DimensionValuesLookup)
        assert isinstance(data_time_boundary, DataTimeBoundary)
        assert isinstance(data_status_information, SourceStatus)
        assert isinstance(row_count_lookup, RowCountLookup)
        assert isinstance(dimension_metadata, DimensionMetadata)
        assert issubclass(type(current_datasource), DruidDatasource)

        self.druid_metadata = druid_metadata
        self.druid_port_configuration = druid_port_configuration
        self.dimension_values_lookup = dimension_values_lookup
        self.data_time_boundary = data_time_boundary
        self.data_status_information = data_status_information
        self.row_count_lookup = row_count_lookup
        self.dimension_metadata = dimension_metadata
        self.current_datasource = current_datasource
