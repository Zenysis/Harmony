from builtins import object
from abc import ABCMeta, abstractmethod
from future.utils import with_metaclass


class BaseDashboardConfig(with_metaclass(ABCMeta, object)):
    def __init__(self, dimension_filters, field_ids, group_ids):
        self._dimension_filters = dimension_filters
        self._field_ids = field_ids
        self._group_ids = group_ids

    # Return a list of navigable child pages
    @abstractmethod
    def get_child_pages(self):
        pass

    # Return the date of the data the dashboard should show
    @abstractmethod
    def get_dashboard_date(self):
        pass

    @abstractmethod
    def get_title(self):
        pass

    @abstractmethod
    def get_subtitle(self):
        pass

    # Return the dimension level the dashboard should show
    @abstractmethod
    def get_granularity(self):
        pass

    # Return an ordered list of sections the dashboard should show
    @abstractmethod
    def get_group_sections(self):
        pass

    # Return the field IDs the dashboard should show
    def get_fields_to_display(self):
        return self._field_ids

    # Return the dimension filters to apply on the dashboard
    def get_dimension_filters(self):
        # TODO(stephen): Support multiple dimension filters or switch the client
        # to pass an array instead of constructing one here.
        return [self._dimension_filters]

    # Optional optimization that instructs the frontend on what exact
    # granularities and dates are needed to build the dashboard.
    def get_query_granularities(self):
        return []

    def to_dict(self):
        return {
            'children': self.get_child_pages(),
            'dashboardDate': self.get_dashboard_date(),
            'detailedGroups': self.get_group_sections(),
            'fields': self.get_fields_to_display(),
            'filters': self.get_dimension_filters(),
            'granularity': self.get_granularity(),
            'queryGranularities': self.get_query_granularities(),
            'title': self.get_title(),
            'subtitle': self.get_subtitle(),
        }


class BaseGeoDashboardConfig(BaseDashboardConfig):
    # Return the geo key for this geo dashboard page.
    # TODO(stephen): Rename geo key to dimension key
    @abstractmethod
    def get_geo_key(self):
        pass

    # Return mapping from program area id to program area name.
    # TODO(stephen): Remove this when program area lookup is passed separately
    # from the dashboard config.
    @abstractmethod
    def get_group_id_lookup(self):
        pass

    def to_dict(self):
        output = {
            'geoKey': self.get_geo_key(),
            'groupIdLookup': self.get_group_id_lookup(),
        }
        output.update(BaseDashboardConfig.to_dict(self))
        return output


# Create a query granularity config that is expected by the geo and
# field dashboard's frontends
def build_dashboard_query_granularity(granularity, start_date, end_date):
    return {'granularity': granularity, 'startDate': start_date, 'endDate': end_date}
