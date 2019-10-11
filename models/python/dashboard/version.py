import related

from models.python.dashboard.schema_20181030.model import (
    DashboardSpecification as DashboardSpecification_20181030,
)
from models.python.dashboard.schema_20181030.visualization_settings import (
    VISUALIZATION_TYPE_VALUES as VISUALIZATION_TYPE_VALUES_20181030,
)
from models.python.dashboard.schema_20181211.model import (
    DashboardSpecification as DashboardSpecification_20181211,
)
from models.python.dashboard.schema_20190124.model import (
    DashboardSpecification as DashboardSpecification_20190124,
)
from models.python.dashboard.schema_20190410.model import (
    DashboardSpecification as DashboardSpecification_20190410,
)
from models.python.dashboard.schema_20190411.model import (
    DashboardSpecification as DashboardSpecification_20190411,
)
from models.python.dashboard.schema_20190524.model import (
    DashboardSpecification as DashboardSpecification_20190524,
)
from models.python.dashboard.schema_20190608.model import (
    DashboardSpecification as DashboardSpecification_20190608,
)
from models.python.dashboard.schema_20190610.model import (
    DashboardSpecification as DashboardSpecification_20190610,
)
from models.python.dashboard.schema_20190823.model import (
    DashboardSpecification as DashboardSpecification_20190823,
)
from models.python.dashboard.schema_20190826.model import (
    DashboardSpecification as DashboardSpecification_20190826,
)
from models.python.dashboard.schema_20190905.model import (
    DashboardSpecification as DashboardSpecification_20190905,
)
from models.python.dashboard.schema_20190911.model import (
    DashboardSpecification as DashboardSpecification_20190911,
)
from models.python.dashboard.latest.model import (
    DashboardSpecification as DashboardSpecification_20190918,
)

VERSION_2018_04_03 = '2018-04-03'
VERSION_2018_10_30 = '2018-10-30'
VERSION_2018_12_11 = '2018-12-11'
VERSION_2019_01_24 = '2019-01-24'
VERSION_2019_04_10 = '2019-04-10'
VERSION_2019_04_11 = '2019-04-11'
VERSION_2019_05_24 = '2019-05-24'
VERSION_2019_06_08 = '2019-06-08'
VERSION_2019_06_10 = '2019-06-10'
VERSION_2019_08_23 = '2019-08-23'
VERSION_2019_08_26 = '2019-08-26'
VERSION_2019_09_05 = '2019-09-05'
VERSION_2019_09_11 = '2019-09-11'
VERSION_2019_09_18 = '2019-09-18'
LATEST_VERSION = VERSION_2019_09_18

# When the dashboard schema is changed, the version date needs to be added here
DASHBOARD_SCHEMA_VERSIONS = sorted(
    [
        # placeholder version for all versions before versioning started.
        VERSION_2018_04_03,
        VERSION_2018_10_30,
        VERSION_2018_12_11,
        VERSION_2019_01_24,
        VERSION_2019_04_10,
        VERSION_2019_04_11,
        VERSION_2019_05_24,
        VERSION_2019_06_08,
        VERSION_2019_06_10,
        VERSION_2019_08_23,
        VERSION_2019_08_26,
        VERSION_2019_09_05,
        VERSION_2019_09_11,
        VERSION_2019_09_18,
    ]
)

NEXT_SCHEMA_VERSION_MAP = {
    VERSION_2018_04_03: VERSION_2018_10_30,
    VERSION_2018_10_30: VERSION_2018_12_11,
    VERSION_2018_12_11: VERSION_2019_01_24,
    VERSION_2019_01_24: VERSION_2019_04_10,
    VERSION_2019_04_10: VERSION_2019_04_11,
    VERSION_2019_04_11: VERSION_2019_05_24,
    VERSION_2019_05_24: VERSION_2019_06_08,
    VERSION_2019_06_08: VERSION_2019_06_10,
    VERSION_2019_06_10: VERSION_2019_08_23,
    VERSION_2019_08_23: VERSION_2019_08_26,
    VERSION_2019_08_26: VERSION_2019_09_05,
    VERSION_2019_09_05: VERSION_2019_09_11,
    VERSION_2019_09_11: VERSION_2019_09_18,
    VERSION_2019_09_18: None,
}

# Upgrades the specification from '2018-04-03' to '2018-10-30'
def _upgrade_2018_04_03_specification(specification):
    updated_specification = {}
    updated_specification['version'] = VERSION_2018_10_30
    array_fields = set(
        ['dateRanges', 'filters', 'items', 'queries', 'settings', 'sizes']
    )

    # Convert dateRanges, filters, items, etc. into a field map instead of an array
    for (field, value) in specification.items():
        if field in array_fields:
            field_map = {}

            for item in value:
                item_id = item['id']
                field_map[item_id] = item

            updated_specification[field] = field_map
        else:
            updated_specification[field] = value

    # Make the 'seriesSettings' object visualization specific
    for setting_id in list(updated_specification['settings'].keys()):
        settings_object = updated_specification['settings'][setting_id]
        series_settings = settings_object['seriesSettings']
        settings_object['viewTypeSettings'] = {}
        settings_object.pop('seriesSettings')

        for visualization_type in VISUALIZATION_TYPE_VALUES_20181030:
            if settings_object.get(visualization_type):
                settings_object[visualization_type]['seriesSettings'] = series_settings
                settings_object['viewTypeSettings'][
                    visualization_type
                ] = settings_object[visualization_type]
                settings_object.pop(visualization_type)

        updated_specification['settings'][setting_id] = settings_object

    # Change 'size' => 'sizeId'
    for layout_object in list(updated_specification['items'].values()):
        layout_object['sizeId'] = layout_object['size']
        layout_object.pop('size')
        layout_object['frontEndSelections'] = layout_object.get(
            'frontendSelectionsFilter', {}
        )

    # Change 'dateRange' => 'dateRangeId'
    for layout_object in list(updated_specification['queries'].values()):
        layout_object['dateRangeId'] = layout_object['dateRange']
        layout_object.pop('dateRange')

    # Change 'dateRange' => 'dateRangeId'
    for layout_object in list(updated_specification['sizes'].values()):
        layout_object['rows'] = int(layout_object['rows'])
        layout_object['columns'] = int(layout_object['columns'])

    updated_specification['options'] = updated_specification['dashboardOptions']
    updated_specification.pop('dashboardOptions')
    return updated_specification


def _upgrade_2018_10_30_specification(specification):
    old_specification = DashboardSpecification_20181030(specification).serialize()
    for layout_id, layout_item in old_specification['items'].items():
        layout_item['frontendSelectionsFilter'] = layout_item['frontEndSelections']
        layout_item.pop('frontEndSelections')
        old_specification['items'][layout_id] = layout_item

    upgraded_specification = DashboardSpecification_20181211(old_specification)
    return upgraded_specification.serialize()


# Upgrades the old specification to remove references to Scorecard viz and merge
# its settings with Table.
def _upgrade_2018_12_11_specification(specification):
    old_specification = DashboardSpecification_20181211(specification).serialize()
    active_scorecards = set()
    for layout_item in old_specification['items'].values():
        if layout_item['type'] == 'SCORECARD':
            layout_item['type'] = 'TABLE'
            active_scorecards.add(layout_item['settingId'])

    for setting_id, settings_object in old_specification['settings'].items():
        view_settings = settings_object['viewTypeSettings']
        table_view_type_settings = {
            'enablePagination': True,
            'invertedFields': [],
            'rowHeight': 30,
            'tableFormat': 'table',
        }

        # if we have a scorecard, remove it from the view settings and move
        # over the invertedFields setting to TABLE
        scorecard_settings = None
        if 'SCORECARD' in view_settings:
            scorecard_settings = view_settings.pop('SCORECARD')
        if setting_id in active_scorecards:
            table_view_type_settings['tableFormat'] = 'scorecard'
            if scorecard_settings is not None:
                table_view_type_settings['invertedFields'] = scorecard_settings[
                    'viewSpecificSettings'
                ]['invertedFields']
            else:
                table_view_type_settings['invertedFields'] = []

        if 'TABLE' in view_settings:
            view_settings['TABLE']['viewSpecificSettings'] = table_view_type_settings
        else:
            # if TABLE isn't in view_settings then we should create it. We'll
            # take the CHART's seriesSettings as the canonical series settings.
            chart_settings = view_settings['CHART']
            view_settings['TABLE'] = {
                'seriesSettings': chart_settings['seriesSettings'],
                'viewSpecificSettings': table_view_type_settings,
            }
    upgraded_specification = DashboardSpecification_20190124(old_specification)
    return upgraded_specification.serialize()


# Upgrades the old specification to add support for relative date ranges.
def _upgrade_2019_01_24_specification(specification):
    old_specification = DashboardSpecification_20190124(specification).serialize()
    for date_range in old_specification['dateRanges'].values():
        if date_range['dateType'] == 'ABSOLUTE':
            date_range['dateType'] = 'CUSTOM'
    upgraded_specification = DashboardSpecification_20190410(old_specification)
    return upgraded_specification.serialize()


# Upgrades the old specification to add support for relative date ranges.
def _upgrade_2019_04_10_specification(specification):
    old_specification = DashboardSpecification_20190410(specification).serialize()
    upgraded_specification = DashboardSpecification_20190411(old_specification)
    return upgraded_specification.serialize()


############## Starting 2019-05-24 dashboard models use `related` ##############
def _upgrade_2019_04_11_specification(specification):
    old_specification = DashboardSpecification_20190411(specification).serialize()
    upgraded_specification = related.to_model(
        DashboardSpecification_20190524, old_specification
    )
    upgraded_specification.version = VERSION_2019_05_24
    return related.to_dict(upgraded_specification)


# Upgrades the 2019-05-24 specification to add support for GroupBySettings
def _upgrade_2019_05_24_specification(specification):
    from flask_potion import fields
    from config.aggregation import DIMENSION_SLICES
    from web.server.api.aqt.api_models import DimensionResource

    dimension_converter = fields.ToOne(DimensionResource).converter

    # First, some pre-processing: any settings objects that are not
    # used by a layout_item can not have a GroupBySettings object generated for
    # them (because we need access to query data in order to create that object).
    # So we should remove those settings objects from the dashbaord
    for settings_obj in list(specification['settings'].values()):
        settings_id = settings_obj['id']
        settings_is_used = False

        # check if this settings_id is found in any layout item
        for layout_item in list(specification['items'].values()):
            if layout_item['settingId'] == settings_id:
                settings_is_used = True
                break
        if not settings_is_used:
            del specification['settings'][settings_id]

    # Now, for each layout item, we need to create a groupBySettings object.
    # To do that we will have to look at its selected groupings from its
    # query object, and create a groupBy setting object from that.
    for layout_item in list(specification['items'].values()):
        query_id = layout_item['queryId']
        setting_id = layout_item['settingId']
        query = specification['queries'][query_id]
        settings = specification['settings'][setting_id]

        is_advanced_query_item = layout_item['isAdvancedQueryItem']
        groupings = {}
        if is_advanced_query_item:
            # Set up GroupBySettings with AQT groupings
            advanced_groups = query['advancedGroups']
            has_string_dimension = False
            for group in advanced_groups:
                if group['type'] == 'GRANULARITY':
                    groupings['timestamp'] = {
                        'id': 'timestamp',
                        'type': 'DATE',
                        'displayValueFormat': 'DEFAULT',
                        'label': None,
                    }
                elif group['type'] == 'GROUPING_DIMENSION':
                    has_string_dimension = True
                    dimension = dimension_converter(group['item']['dimension'])
                    groupings[dimension.id] = {
                        'id': dimension.id,
                        'type': 'STRING',
                        'displayValueFormat': 'DEFAULT',
                        'label': None,
                    }
            # if we have no string dimension, create a default Nation grouping
            if not has_string_dimension:
                groupings['nation'] = {
                    'id': 'nation',
                    'type': 'STRING',
                    'displayValueFormat': 'DEFAULT',
                    'label': None,
                }
        else:
            # Set up GroupBySettings with SQT's groupBy selection
            group_by_id = query['groupBy']
            dimension_ids = [group_by_id]
            if group_by_id in DIMENSION_SLICES:
                dimension_ids += DIMENSION_SLICES[group_by_id]
            for dimension_id in dimension_ids:
                groupings[dimension_id] = {
                    'id': dimension_id,
                    'type': 'STRING',
                    'label': None,
                    'displayValueFormat': 'DEFAULT',
                }
        settings['groupBySettings'] = {'groupings': groupings}

    upgraded_specification = related.to_model(
        DashboardSpecification_20190608, specification
    )
    upgraded_specification.version = VERSION_2019_06_08
    return related.to_dict(upgraded_specification)


# Upgrades the 2019-06-08 specification to add support for new goalline options
def _upgrade_2019_06_08_specification(specification):
    upgraded_specification = related.to_model(
        DashboardSpecification_20190610, specification
    )
    upgraded_specification.version = VERSION_2019_06_10
    return related.to_dict(upgraded_specification)


# Upgrades the 2019-06-10 specification to add support for "no data" bar graph control
def _upgrade_2019_06_10_specification(specification):
    upgraded_specification = related.to_model(
        DashboardSpecification_20190823, specification
    )
    upgraded_specification.version = VERSION_2019_08_23
    return related.to_dict(upgraded_specification)


def _upgrade_2019_08_23_specification(specification):
    from config.ui import FILTER_ORDER, DEFAULT_DATE_PICKER_TYPE, DEFAULT_FILTER_OPTIONS

    old_options = specification['options']
    new_options = {
        'columnCount': old_options['columnCount'],
        'title': old_options['title'],
        'filterPanelSettings': {
            'showDashboardFilterButton': old_options['showDashboardFilterButton'],
            'datePickerType': DEFAULT_DATE_PICKER_TYPE,
            'filterPanelComponents': DEFAULT_FILTER_OPTIONS,
            'enabledFilters': FILTER_ORDER,
        },
    }

    specification['options'] = new_options

    # NOTE(pablo): there was a bug in the 2019-05-24 upgrade where some default
    # grouping items were not created. This fixes it for any dashboards that
    # were already upgraded after 2019-06-10:
    for layout_item in list(specification['items'].values()):
        settings = specification['settings'][layout_item['settingId']]
        groupings = settings['groupBySettings']['groupings']
        has_string_dimension = False
        for grouping_obj in groupings.values():
            if grouping_obj['type'] == 'STRING':
                has_string_dimension = True
                break
        if not has_string_dimension:
            groupings['nation'] = {
                'id': 'nation',
                'type': 'STRING',
                'displayValueFormat': 'DEFAULT',
                'label': None,
            }

    upgraded_specification = related.to_model(
        DashboardSpecification_20190826, specification
    )
    upgraded_specification.version = VERSION_2019_08_26
    return related.to_dict(upgraded_specification)


# Upgrades the 2019-08-26 specification to add support for different types of
# dashboard layout items
def _upgrade_2019_08_26_specification(specification):
    specification_keys_to_keep = [
        'options',
        'dateRanges',
        'filters',
        'items',
        'queries',
        'settings',
        'version',
    ]
    query_keys_to_move = [
        'type',
        'customFields',
        'filterModalSelections',
        'frontendSelectionsFilter',
        'isAdvancedQueryItem',
        'settingId',
    ]
    # Any query object that is not linked to a layout item should be removed
    queries = {}
    for item_id in specification['items']:
        item = specification['items'][item_id]
        size = specification['sizes'][item['sizeId']]
        layout_metadata = {
            'upperX': item['upperX'],
            'upperY': item['upperY'],
            'rows': size['rows'],
            'columns': size['columns'],
            'isLocked': item['isLocked'],
        }
        query_id = item['queryId']

        new_item = {
            'id': item_id,
            'name': item['name'],
            'layoutMetadata': layout_metadata,
        }

        query = specification['queries'][query_id]
        for key in query_keys_to_move:
            query[key] = item[key]
        query['itemId'] = item_id
        specification['items'][item_id] = new_item
        queries[query_id] = query

    new_specification = {key: specification[key] for key in specification_keys_to_keep}
    new_specification['queries'] = queries
    new_specification['text_elements'] = {}

    upgraded_specification = related.to_model(
        DashboardSpecification_20190905, new_specification
    )
    upgraded_specification.version = VERSION_2019_09_05
    return related.to_dict(upgraded_specification)


# Upgrades the 2019-09-05 specification to fix a bug where GroupBySettings
# for AQT items could have time granularity groupings with a "DEFAULT"
# displayValueFormat, which is invalid. All time granularity groupings
# must now default to their granularity id.
def _upgrade_2019_09_05_specification(specification):
    from flask_potion import fields
    from web.server.api.aqt.api_models import GranularityResource

    granularity_converter = fields.ToOne(GranularityResource).converter

    for query in list(specification['queries'].values()):
        is_advanced_query_item = query['isAdvancedQueryItem']
        settings = specification['settings'][query['settingId']]
        grouping_settings_map = settings['groupBySettings']['groupings']
        if is_advanced_query_item:
            # find the time granularity grouping (if there is one). There
            # can only be up to one.
            granularity = None
            for aqt_group in query['advancedGroups']:
                if aqt_group['type'] == 'GRANULARITY':
                    granularity = granularity_converter(aqt_group['item'])
                    break

            if granularity:
                for group_settings in list(grouping_settings_map.values()):
                    # check if a group setting has an invalid displayValueFormat
                    if (
                        group_settings['id'] == 'timestamp'
                        and group_settings['displayValueFormat'] == 'DEFAULT'
                    ):
                        group_settings['displayValueFormat'] = granularity.id
                        break

    upgraded_specification = related.to_model(
        DashboardSpecification_20190911, specification
    )
    upgraded_specification.version = VERSION_2019_09_11
    return related.to_dict(upgraded_specification)


def _upgrade_2019_09_11_specification(specification):
    specification_keys_to_keep = [
        'options',
        'dateRanges',
        'filters',
        'items',
        'queries',
        'settings',
        'version',
    ]
    new_specification = {key: specification[key] for key in specification_keys_to_keep}
    new_specification['textItems'] = {}
    upgraded_specification = related.to_model(
        DashboardSpecification_20190918, new_specification
    )
    upgraded_specification.version = VERSION_2019_09_18
    return related.to_dict(upgraded_specification)


VERSION_TO_UPGRADE_FUNCTION = {
    VERSION_2018_04_03: _upgrade_2018_04_03_specification,
    VERSION_2018_10_30: _upgrade_2018_10_30_specification,
    VERSION_2018_12_11: _upgrade_2018_12_11_specification,
    VERSION_2019_01_24: _upgrade_2019_01_24_specification,
    VERSION_2019_04_10: _upgrade_2019_04_10_specification,
    VERSION_2019_04_11: _upgrade_2019_04_11_specification,
    VERSION_2019_05_24: _upgrade_2019_05_24_specification,
    VERSION_2019_06_08: _upgrade_2019_06_08_specification,
    VERSION_2019_06_08: _upgrade_2019_06_08_specification,
    VERSION_2019_06_10: _upgrade_2019_06_10_specification,
    VERSION_2019_08_23: _upgrade_2019_08_23_specification,
    VERSION_2019_08_26: _upgrade_2019_08_26_specification,
    VERSION_2019_09_05: _upgrade_2019_09_05_specification,
    VERSION_2019_09_11: _upgrade_2019_09_11_specification,
}
