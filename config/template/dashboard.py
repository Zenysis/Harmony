# NOTE: This dashboard config for nacosa is incomplete and fairly hacky.
# TODO(ian, stephen): Bring this up to the quality level of ET's dashboard.
from config.template.general import NATION_NAME
from config.template.aggregation import get_data_key
from config.template.indicators import VALID_FIELDS
from data.dashboard_config import BaseDashboardConfig, BaseGeoDashboardConfig

# TODO(stephen, ian): Don't hardcode this
DASHBOARD_DATE = '2016-10-01'


class GeoDashboardConfig(BaseGeoDashboardConfig):
    def __init__(self, dimension_filters, field_ids=None, group_ids=None):
        # TODO(ian, stephen): Parse the correct granularity from the
        # dimension_filters
        self._granularity = ''  # 'capital'

        # Display all NACOSA indicators by default
        super(GeoDashboardConfig, self).__init__(
            dimension_filters, sorted(list(VALID_FIELDS)), []
        )

    def get_title(self):
        # TODO(ian, stephen): Don't hardcode this. Base it off the
        # dimension_filters applied
        return NATION_NAME

    def get_subtitle(self):
        # TODO(stephen): Support group subpages for nacosa at some point
        return ''

    def get_granularity(self):
        return self._granularity

    def get_group_sections(self):
        # TODO(ian, stephen): Properly tag nacosa indicators that are being
        # displayed
        return ['All Indicators']

    def get_geo_key(self):
        return get_data_key(self._dimension_filters)

    def get_group_id_lookup(self):
        # TODO(ian, stephen): Properly tag nacosa indicators that are being
        # displayed
        return {'All Indicators': 'all-indicators'}

    def get_dashboard_date(self):
        return DASHBOARD_DATE

    def get_child_pages(self):
        # TODO(ian, stephen): Figure out what would be good child pages to let
        # the user select.
        return {}


class FieldDashboardConfig(BaseDashboardConfig):
    def __init__(self, dimension_filters, field_ids, group_ids=None):
        # Only allow one field ID to be displayed on the field dashboard at once
        super(FieldDashboardConfig, self).__init__(
            dimension_filters, [field_ids[0]], None
        )

    def get_title(self):
        return self._field_ids[0]

    def get_subtitle(self):
        # TODO(ian, stephen): If a dimension filter is applied, show the filter
        # value as the subtitle (like on ET)
        return ''

    def get_granularity(self):
        # TODO(ian, stephen): Set the desired granularity based off the
        # dimension_filters applied and don't hardcode it
        return 'county'

    def get_group_sections(self):
        # TODO(stephen): Currently the frontend constructs the groupings for
        # the field dashboard.
        return []

    def get_dashboard_date(self):
        return DASHBOARD_DATE

    def get_child_pages(self):
        # TODO(ian, stephen): Figure out what would be good child pages to let
        # the user select.
        return {}
