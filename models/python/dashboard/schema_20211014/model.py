# pylint: disable=invalid-name
from enum import Enum

import related

from util.related.polymorphic_model import build_polymorphic_base

from .visualization_settings.model import (
    GroupBySettings,
    TitleSettings,
    VisualizationSettings,
    ViewType,
    ViewTypeSettings,
    VisualizationType,
)

DEFAULT_COLUMN_COUNT = 100
DEFAULT_DASHBOARD_ITEM_ROWS = 50
DEFAULT_DASHBOARD_ITEM_COLUMNS = 75


class FilterPanelAlignment(Enum):
    '''An enumeration for defining different filter panel alignments for dashboard'''

    # Align across the top of the dashboard
    TOP = 'TOP'

    # Align down the left of the dashboard
    LEFT = 'LEFT'


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


@related.mutable(strict=True)
class CommonQueryTileSettings:
    '''Common settings that apply to each query tile such as dashboard
    level filters or group bys.
    '''

    enabled_categories = related.SequenceField(str, [], key='enabledCategories')
    excluded_tiles = related.SequenceField(str, [], key='excludedTiles')
    # NOTE(david): Active work is still in progress on the models for this
    # property. Once they are stable we should update this to no longer be just
    # a dict.
    items = related.SequenceField(dict, [])
    visible = related.BooleanField(False)


@related.mutable(strict=True)
class DashboardCommonSettings:
    '''Common Settings for a dashboard. This contains configuration such as
    dashboard level filters and group bys.'''

    filter_settings = related.ChildField(
        CommonQueryTileSettings, CommonQueryTileSettings(), key='filterSettings'
    )
    grouping_settings = related.ChildField(
        CommonQueryTileSettings, CommonQueryTileSettings(), key='groupingSettings'
    )
    panel_alignment = related.ChildField(
        FilterPanelAlignment, FilterPanelAlignment.LEFT, key='panelAlignment'
    )


@related.mutable(strict=True)
class DashboardOptions:
    title = related.StringField('New Dashboard')
    column_count = related.IntegerField(DEFAULT_COLUMN_COUNT, key='columnCount')


# TODO(stephen, anyone): Replace the sequence fields in the AQT query definition
# with references to their true models. Cannot reference the inidividual models
# directly, though, since they get serialized in their `flask_potion` style and
# not in their backend style.
@related.mutable(strict=True)
class AdvancedFieldDefinition:
    id = related.StringField()
    calculation = related.ChildField(dict)
    canonical_name = related.StringField(key='canonicalName')
    customizable_filter_items = related.SequenceField(
        dict, key='customizableFilterItems'
    )
    short_name = related.StringField(key='shortName')
    user_defined_label = related.StringField('', key='userDefinedLabel')
    show_null_as_zero = related.BooleanField(False, key='showNullAsZero')


@related.mutable(strict=True)
class FrontendDataFilter:
    '''This class represents a data filter applied to query results on the
    frontend. An array of these are converted into a frontend DataFilterGroup
    model when deserialized.
    '''

    field_id = related.StringField(key='fieldId')
    rule = related.ChildField(dict)
    operation = related.StringField()


@related.mutable(strict=True)
class FormulaFieldConfiguration:
    field_id = related.StringField(key='fieldId')
    treat_no_data_as_zero = related.BooleanField(key='treatNoDataAsZero')


@related.mutable(strict=True)
class CustomField:
    id = related.StringField()
    field_ids = related.SequenceField(str, key='fieldIds')
    formula = related.StringField()
    field_configurations = related.MappingField(
        FormulaFieldConfiguration, 'fieldId', key='fieldConfigurations'
    )
    name = related.StringField(required=False)


@related.mutable(strict=True)
class QueryResultSpecDefinition:
    group_by_settings = related.ChildField(GroupBySettings, key='groupBySettings')
    title_settings = related.ChildField(TitleSettings, key='titleSettings')
    view_types = related.SequenceField(ViewType, key='viewTypes')
    visualization_settings = related.ChildField(
        ViewTypeSettings, key='visualizationSettings'
    )

    custom_fields = related.SequenceField(CustomField, [], key='customFields')
    data_filters = related.SequenceField(FrontendDataFilter, [], key='dataFilters')


@related.mutable(strict=True)
class QuerySelectionsDefinition:
    fields = related.SequenceField(AdvancedFieldDefinition, [], key='fields')
    filters = related.SequenceField(dict, [], key='filters')
    groups = related.SequenceField(dict, [], key='groups')


# NOTE(david): DashboardItem is a polymorphic model that can take many types
# (query, text etc.). To enable easy serialization/deserialization of these
# items we have wrapper model for each one containing the item type.
@related.mutable(strict=True)
class DashboardItem(build_polymorphic_base()):
    '''Polymorphic DashboardItem model for item type specific information'''


@related.mutable(strict=True)
class QueryDefinition(DashboardItem):
    query_result_spec = related.ChildField(
        QueryResultSpecDefinition, key='queryResultSpec'
    )
    query_selections = related.ChildField(
        QuerySelectionsDefinition, key='querySelections'
    )
    visualization_type = related.ChildField(VisualizationType, key='visualizationType')
    type = related.StringField('QUERY_ITEM')


# TODO(nina): $GISDashboard - This is going to grow big fast. It would be nice
# to import it from a separate file
@related.mutable(strict=True)
class GISItemDefinition(DashboardItem):
    @related.mutable(strict=True)
    class EntityLayerDefinition:
        id = related.StringField(key='id')
        filters = related.ChildField(dict, {}, key='filterSettings')
        style = related.ChildField(dict, {}, key='styleSettings')

    @related.mutable(strict=True)
    class GISGeneralSettings:
        admin_boundaries_color = related.StringField(
            '#313234', key='adminBoundariesColor'
        )
        admin_boundaries_width = related.StringField(
            'normal', key='adminBoundariesWidth'
        )
        base_layer = related.StringField('Streets', key='baseLayer')
        global_legend_position = related.StringField(
            'TOP_LEFT', key='globalLegendPosition'
        )
        selected_geo_tiles = related.StringField('StateName', key='selectedGeoTiles')
        show_admin_boundaries = related.BooleanField(False, key='showAdminBoundaries')
        viewport = related.ChildField(dict, {}, key='viewport')

    # TODO(nina): Update this model to use the QueryResultSpecDefinition and
    # QuerySelectionsDefinition models
    @related.mutable(strict=True)
    class IndicatorLayerDefinition:
        id = related.StringField(key='id')
        field_id = related.StringField(key='fieldId')
        visualization_settings = related.ChildField(
            ViewTypeSettings, key='visualizationSettings'
        )

        colored_label_settings = related.ChildField(
            dict, {}, key='coloredLabelSettings'
        )
        current_geo_grouping = related.ChildField(dict, {}, key='currentGeoGrouping')
        custom_fields = related.SequenceField(CustomField, [], key='customFields')
        fields = related.SequenceField(AdvancedFieldDefinition, [], key='fields')
        filters = related.SequenceField(dict, [], key='filters')
        frontend_data_filters = related.SequenceField(
            FrontendDataFilter, [], key='frontendDataFilters'
        )
        groups = related.SequenceField(dict, [], key='groups')

        # Ambiguously defined because frontend model isn't concrete
        style_settings = related.ChildField(dict, {}, key='styleSettings')

    @related.mutable(strict=True)
    class LayerSelectionDefinition:
        id = related.StringField(key='layerId')
        layer_type = related.StringField(key='layerType')

    # Settings for the base map
    general_settings = related.ChildField(GISGeneralSettings, key='generalSettings')

    # Stored entity layers
    entity_layers = related.MappingField(
        EntityLayerDefinition, 'id', {}, key='entityLayers'
    )

    # Stored indicator layers
    indicator_layers = related.MappingField(
        IndicatorLayerDefinition, 'id', {}, key='indicatorLayers'
    )

    # Selected layers, by ID and layer type
    selected_layer_ids = related.SequenceField(
        LayerSelectionDefinition, [], key='selectedLayerIds'
    )
    type = related.StringField('GIS_ITEM')


@related.mutable(strict=True)
class TextItemDefinition(DashboardItem):
    text = related.StringField(key='text')
    read_only = related.BooleanField(False, key='readOnly')
    autosize = related.BooleanField(True, key='autosize')
    type = related.StringField('TEXT_ITEM')


@related.mutable(strict=True)
class IFrameItemDefinition(DashboardItem):
    title = related.StringField(key='title')
    iframe_url = related.StringField(key='iFrameURL')
    type = related.StringField('IFRAME_ITEM')


@related.mutable(strict=True)
class PlaceholderItemDefinition(DashboardItem):
    '''Model for placeholder dashboard items. These are the empty tiles that
    can be added to a dashboard. When a query, iFrame or text item is added
    to them, this model is removed and replaced with the corresponding item.
    '''

    item_type = related.StringField(key='itemType', default='query')
    type = related.StringField('PLACEHOLDER_ITEM')


@related.mutable(strict=True)
class SpacerItemDefinition(DashboardItem):
    '''Model for spacer dashboard items. These are for intentional whitespace on
    a dashboard.
    '''

    type = related.StringField('SPACER_ITEM')


# The build_polymorphic_base utility requires that we register each sub-type
DashboardItem.register_subtype(GISItemDefinition)
DashboardItem.register_subtype(IFrameItemDefinition)
DashboardItem.register_subtype(PlaceholderItemDefinition)
DashboardItem.register_subtype(QueryDefinition)
DashboardItem.register_subtype(SpacerItemDefinition)
DashboardItem.register_subtype(TextItemDefinition)


@related.mutable(strict=True)
class Position:
    '''Model for position and size information about a dashboard item'''

    x = related.IntegerField()
    y = related.IntegerField()
    row_count = related.IntegerField(key='rowCount')
    column_count = related.IntegerField(key='columnCount')


@related.mutable(strict=True)
class DashboardItemHolder:
    '''Model holding all information about a dashboard tile'''

    id = related.StringField(key='id')
    position = related.ChildField(Position)
    item = DashboardItem.child_field(DashboardItem)


@related.mutable(strict=True)
class DashboardSpecification:
    version = related.StringField()
    items = related.SequenceField(DashboardItemHolder)
    common_settings = related.ChildField(
        DashboardCommonSettings, DashboardCommonSettings(), key='commonSettings'
    )
    options = related.ChildField(DashboardOptions, DashboardOptions())

    # This property indicates that the dashboard was built with the legacy dashboard
    # building experience. When this flag is `True`, modern dashboard features cannot be
    # used if they will cause the dashboard to look different.
    legacy = related.BooleanField(False)
