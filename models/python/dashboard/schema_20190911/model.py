# pylint: disable=invalid-name
from enum import Enum

import related

from .visualization_settings.model import VisualizationSettings, VisualizationType

DEFAULT_COLUMN_COUNT = 6


class DateRangeType(Enum):
    '''
    An enumeration for defining different types of date ranges
    '''

    CUSTOM = 'CUSTOM'
    FORECAST = 'FORECAST'
    CURRENT_CALENDAR_MONTH = 'CURRENT_CALENDAR_MONTH'
    CURRENT_QUARTER = 'CURRENT_QUARTER'
    PREVIOUS_CALENDAR_DAY = 'PREVIOUS_CALENDAR_DAY'
    PREVIOUS_CALENDAR_WEEK = 'PREVIOUS_CALENDAR_WEEK'
    PREVIOUS_CALENDAR_MONTH = 'PREVIOUS_CALENDAR_MONTH'
    PREVIOUS_QUARTER = 'PREVIOUS_QUARTER'
    PREVIOUS_CALENDAR_YEAR = 'PREVIOUS_CALENDAR_YEAR'
    LAST_365_DAYS = 'LAST_365_DAYS'
    ALL_TIME = 'ALL_TIME'
    ET_CHOOSE_MONTHS = 'ET_CHOOSE_MONTHS'


@related.mutable(strict=True)
class FilterPanelSettings:
    aggregation_levels = related.SequenceField(str, [], key='aggregationLevels')
    auto_update_granularity = related.BooleanField(False, key='autoUpdateGranularity')
    date_picker_type = related.StringField('CUSTOM', key='datePickerType')
    filter_panel_components = related.SequenceField(
        str, [], key='filterPanelComponents'
    )
    enabled_filters = related.SequenceField(str, [], key='enabledFilters')
    initial_selected_components = related.SequenceField(
        str, [], key='initialSelectedComponents'
    )
    show_dashboard_filterButton = related.BooleanField(
        False, key='showDashboardFilterButton'
    )


@related.mutable(strict=True)
class DashboardOptions:
    title = related.StringField('New Dashboard')
    column_count = related.IntegerField(DEFAULT_COLUMN_COUNT, key='columnCount')
    filter_panel_settings = related.ChildField(
        FilterPanelSettings, FilterPanelSettings(), key='filterPanelSettings'
    )


# TODO(stephen, anyone): Replace the sequence fields in the AQT query definition
# with references to their true models. Cannot reference the inidividual models
# directly, though, since they get serialized in their `flask_potion` style and
# not in their backend style.
@related.mutable(strict=True)
class AdvancedFieldDefinition:
    id = related.StringField()
    calculation = related.ChildField(dict)
    canonical_name = related.StringField(key='canonicalName')
    category = related.ChildField(dict)
    customizable_filter_items = related.SequenceField(
        dict, key='customizableFilterItems'
    )
    description = related.StringField()
    label = related.StringField()
    short_name = related.StringField(key='shortName')
    source = related.ChildField(dict)


@related.mutable(strict=True)
class FilterDefinition:
    id = related.StringField()
    filter_on = related.StringField(key='filterOn')
    filter_values = related.SequenceField(str, [], key='filterValues')
    name = related.StringField(required=False)


@related.mutable(strict=True)
class DateRangeSpecification:
    id = related.StringField()
    date_type = related.ChildField(DateRangeType, key='dateType')
    end_date = related.DateTimeField(key='endDate')
    start_date = related.DateTimeField(key='startDate')


@related.mutable(strict=True)
class CustomField:
    id = related.StringField()
    field_ids = related.SequenceField(str, key='fieldIds')
    formula = related.StringField()
    name = related.StringField(required=False)


@related.mutable(strict=True)
class QueryDefinition:
    id = related.StringField()
    visualization_type = related.ChildField(VisualizationType, key='type')
    layout_item_id = related.StringField(key='itemId')
    advanced_fields = related.SequenceField(
        AdvancedFieldDefinition, [], key='advancedFields'
    )
    advanced_filters = related.SequenceField(dict, [], key='advancedFilters')
    advanced_groups = related.SequenceField(dict, [], key='advancedGroups')
    name = related.StringField(required=False)
    magic_filter_ids = related.SequenceField(str, [], key='magicFilters')
    date_range_id = related.StringField('', key='dateRangeId')
    group_by = related.StringField('', key='groupBy')
    custom_fields = related.SequenceField(CustomField, [], key='customFields')

    # TODO(stephen, anyone): Add full model for filter modal selections and
    # frontend selections filter.
    filter_modal_selections = related.ChildField(dict, {}, key='filterModalSelections')
    front_end_selections_filter = related.ChildField(
        dict, {}, key='frontendSelectionsFilter'
    )
    is_advanced_query_item = related.BooleanField(False, key='isAdvancedQueryItem')
    setting_id = related.StringField(required=False, key='settingId')


@related.mutable(strict=True)
class LayoutMetadataDefinition:
    upper_x = related.IntegerField(key='upperX')
    upper_y = related.IntegerField(key='upperY')
    rows = related.IntegerField()
    columns = related.IntegerField()
    is_locked = related.BooleanField(False, key='isLocked')


@related.mutable(strict=True)
class TextItemDefinition:
    id = related.StringField()
    layout_item_id = related.StringField(key='layoutItemId')
    text = related.StringField(key='text')


@related.mutable(strict=True)
class LayoutItem:
    id = related.StringField()
    layout_metadata = related.ChildField(LayoutMetadataDefinition, key='layoutMetadata')
    name = related.StringField(required=False)


@related.mutable(strict=True)
class DashboardSpecification:
    version = related.StringField()
    date_ranges = related.MappingField(
        DateRangeSpecification, 'id', {}, key='dateRanges'
    )
    filters = related.MappingField(FilterDefinition, 'id', {})
    items = related.MappingField(LayoutItem, 'id', {})
    queries = related.MappingField(QueryDefinition, 'id', {})
    text_elements = related.MappingField(TextItemDefinition, 'id', {})
    settings = related.MappingField(VisualizationSettings, 'id', {})
    options = related.ChildField(DashboardOptions, DashboardOptions())
