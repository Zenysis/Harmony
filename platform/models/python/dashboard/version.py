import related

from models.python.dashboard.schema_20210805.model import (
    DashboardSpecification as DashboardSpecification_20210805,
)
from models.python.dashboard.schema_20210816.model import (
    DashboardSpecification as DashboardSpecification_20210816,
)
from models.python.dashboard.schema_20211014.model import (
    DashboardSpecification as DashboardSpecification_20211014,
)
from models.python.dashboard.schema_20211019.model import (
    DashboardSpecification as DashboardSpecification_20211019,
)
from models.python.dashboard.schema_20211025.model import (
    DashboardSpecification as DashboardSpecification_20211025,
)
from models.python.dashboard.schema_20220808.model import (
    DashboardSpecification as DashboardSpecification_20220808,
)
from models.python.dashboard.schema_20220909.model import (
    DashboardSpecification as DashboardSpecification_20220909,
)
from models.python.dashboard.schema_20221003.model import (
    DashboardSpecification as DashboardSpecification_20221003,
)
from models.python.dashboard.schema_20230117.model import (
    DashboardSpecification as DashboardSpecification_20230117,
)
from models.python.dashboard.schema_20230329.model import (
    DashboardSpecification as DashboardSpecification_20230329,
)
from models.python.dashboard.latest.model import (
    DashboardSpecification as DashboardSpecification_20230630,
)

VERSION_2021_08_05 = '2021-08-05'
VERSION_2021_08_16 = '2021-08-16'
VERSION_2021_10_14 = '2021-10-14'
VERSION_2021_10_19 = '2021-10-19'
VERSION_2021_10_25 = '2021-10-25'
VERSION_2022_08_08 = '2022-08-08'
VERSION_2022_09_09 = '2022-09-09'
VERSION_2022_10_03 = '2022-10-03'
VERSION_2023_01_17 = '2023-01-17'
VERSION_2023_03_29 = '2023-03-29'
VERSION_2023_06_30 = '2023-06-30'
LATEST_VERSION = VERSION_2023_06_30

# When the dashboard schema is changed, the version date needs to be added here
DASHBOARD_SCHEMA_VERSIONS = sorted(
    [
        VERSION_2021_08_05,
        VERSION_2021_08_16,
        VERSION_2021_10_14,
        VERSION_2021_10_19,
        VERSION_2021_10_25,
        VERSION_2022_08_08,
        VERSION_2022_09_09,
        VERSION_2022_10_03,
        VERSION_2023_01_17,
        VERSION_2023_03_29,
        VERSION_2023_06_30,
    ]
)

NEXT_SCHEMA_VERSION_MAP = {
    VERSION_2021_08_05: VERSION_2021_08_16,
    VERSION_2021_08_16: VERSION_2021_10_14,
    VERSION_2021_10_14: VERSION_2021_10_19,
    VERSION_2021_10_19: VERSION_2021_10_25,
    VERSION_2021_10_25: VERSION_2022_08_08,
    VERSION_2022_08_08: VERSION_2022_09_09,
    VERSION_2022_09_09: VERSION_2022_10_03,
    VERSION_2022_10_03: VERSION_2023_01_17,
    VERSION_2023_01_17: VERSION_2023_03_29,
    VERSION_2023_03_29: VERSION_2023_06_30,
    VERSION_2023_06_30: None,
}

PREVIOUS_SCHEMA_VERSION_MAP = {
    VERSION_2021_08_16: VERSION_2021_08_05,
    VERSION_2021_10_14: VERSION_2021_08_16,
    VERSION_2021_10_19: VERSION_2021_10_14,
    VERSION_2021_10_25: VERSION_2021_10_19,
    VERSION_2022_08_08: VERSION_2021_10_25,
    VERSION_2022_09_09: VERSION_2022_08_08,
    VERSION_2022_10_03: VERSION_2022_09_09,
    VERSION_2023_01_17: VERSION_2022_10_03,
    VERSION_2023_03_29: VERSION_2023_01_17,
    VERSION_2023_06_30: VERSION_2023_03_29,
}


def _upgrade_2021_08_05_specification(specification):
    '''Creates a GISGeneralSettings model to store in a Dashboard GIS Item'''

    # Refine original MapSettings type from string to string literal
    def convert_current_display_type(current_display):
        if current_display in ['dots', 'scaled-dots', 'tiles', 'heatmap']:
            return current_display

        return 'dots'

    layout_items = specification['items']

    for layout_item in layout_items:
        dashboard_item = layout_item['item']

        if dashboard_item['type'] != 'GIS_ITEM':
            continue

        old_general_settings = dashboard_item['generalSettings']

        general_settings = {
            'adminBoundariesColor': '#313234',
            'adminBoundariesWidth': 'normal',
            'baseLayer': old_general_settings['baseLayer'],
            'globalLegendPosition': old_general_settings.get(
                'globalLegendPosition', 'TOP_LEFT'
            ),
            'selectedGeoTiles': old_general_settings['selectedGeoTiles'],
            'showAdminBoundaries': old_general_settings['showAdminBoundaries'],
            'viewport': old_general_settings['viewport'],
        }

        # Update generalSettings property with new model
        dashboard_item['generalSettings'] = general_settings

        indicator_layers = dashboard_item['indicatorLayers']

        # Remove the 'controls' property from each Indicator Layer,
        # and transfer over any necessary properties
        for indicator_layer in indicator_layers.values():
            controls = indicator_layer.pop('controls')
            indicator_layer['fieldId'] = controls['selectedField']
            indicator_layer['styleSettings']['shapeOutlineWidth'] = controls[
                'shapeOutlineWidth'
            ]
            indicator_layer['coloredLabelSettings'] = controls[
                'selectedLabelsToDisplay'
            ]
            indicator_layer['styleSettings']['labelSettings']['show'] = controls[
                'showLabels'
            ]
            indicator_layer['styleSettings'][
                'markerType'
            ] = convert_current_display_type(controls['currentDisplay'])

    upgraded_specification = related.to_model(
        DashboardSpecification_20210816, specification
    )
    upgraded_specification.version = VERSION_2021_08_16
    return related.to_dict(upgraded_specification)


def _downgrade_2021_08_16_specification(specification):
    '''This downgrade reverts creating the GISGeneralSettings model'''
    layout_items = specification['items']

    for layout_item in layout_items:
        dashboard_item = layout_item['item']

        if dashboard_item['type'] != 'GIS_ITEM':
            continue

        current_general_settings = dashboard_item['generalSettings']

        general_settings = {
            'baseLayer': current_general_settings['baseLayer'],
            'selectedGeoTiles': current_general_settings['selectedGeoTiles'],
            'showAdminBoundaries': current_general_settings['showAdminBoundaries'],
            'viewport': current_general_settings['viewport'],
        }

        if current_general_settings['globalLegendPosition'] != 'TOP_LEFT':
            general_settings['globalLegendPosition'] = current_general_settings[
                'globalLegendPosition'
            ]

        # Revert generalSettings property to old model
        dashboard_item['generalSettings'] = general_settings

        indicator_layers = dashboard_item['indicatorLayers']

        # Add back the 'controls' property from each Indicator Layer,
        # and transfer over any necessary properties
        for indicator_layer in indicator_layers.values():
            controls = {
                'selectedField': indicator_layer['fieldId'],
                'shapeOutlineWidth': indicator_layer['styleSettings'][
                    'shapeOutlineWidth'
                ],
                'selectedLabelsToDisplay': indicator_layer['coloredLabelSettings'],
                'showLabels': indicator_layer['styleSettings']['labelSettings']['show'],
                'currentDisplay': indicator_layer['styleSettings']['markerType'],
            }
            indicator_layer['controls'] = controls
            indicator_layer.pop('fieldId')
            indicator_layer['styleSettings'].pop('shapeOutlineWidth')
            indicator_layer.pop('coloredLabelSettings')

    downgraded_specification = related.to_model(
        DashboardSpecification_20210805, specification
    )
    downgraded_specification.version = VERSION_2021_08_05
    return related.to_dict(downgraded_specification)


def _upgrade_2021_08_16_specification(specification):
    '''Remove icon property of PlaceholderItemDefinition that was incorrectly
    not removed in the dashboard spec VERSION_2021_08_05.'''

    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'PLACEHOLDER_ITEM':
            continue

        item.pop('icon', None)

    upgraded_specification = related.to_model(
        DashboardSpecification_20211014, specification
    )

    upgraded_specification.version = VERSION_2021_10_14
    return related.to_dict(upgraded_specification)


def _downgrade_2021_10_14_specification(specification):
    '''Add back icon property to PlaceholderItemDefinition model'''
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'PLACEHOLDER_ITEM':
            continue

        item['icon'] = 'svg-bar-line-visualization'
        if item['item_type'] == 'iframe':
            item['icon'] = 'svg-iframe'
        if item['item_type'] == 'text_item':
            item['icon'] = 'svg-text'

    downgraded_specification = related.to_model(
        DashboardSpecification_20210816, specification
    )
    downgraded_specification.version = VERSION_2021_08_16
    return related.to_dict(downgraded_specification)


def _upgrade_2021_10_14_specification(specification):
    '''Nothing in this upgrade, this schema has a divider as a new type of item.'''
    upgraded_specification = related.to_model(
        DashboardSpecification_20211019, specification
    )
    upgraded_specification.version = VERSION_2021_10_19
    return related.to_dict(upgraded_specification)


def _downgrade_2021_10_19_specification(specification):
    '''Removes divider tile from dashboard'''

    new_items = []
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'DIVIDER_ITEM':
            new_items.append(item_holder)
    specification['items'] = new_items

    downgraded_specification = related.to_model(
        DashboardSpecification_20211014, specification
    )
    downgraded_specification.version = VERSION_2021_10_14
    return related.to_dict(downgraded_specification)


def _upgrade_2021_10_19_specification(specification):
    '''Remove the legacy goal line settings from the axes settings models.
    Modern goal lines are stored in visualization specific settings.'''

    # Removes all goal line settings from a given viz settings dictionary
    def remove_axis_settings(all_viz_settings: dict):
        for viz_settings in all_viz_settings.values():
            if not viz_settings is None and 'axesSettings' in viz_settings:
                axes_settings = viz_settings['axesSettings']
                for axis in ['xAxis', 'y1Axis', 'y2Axis']:
                    axis_settings = axes_settings[axis]
                    axis_settings.pop('goalLine')
                    axis_settings.pop('goalLineFontSize')
                    axis_settings.pop('goalLineLabel')
                    axis_settings.pop('goalLineColor')
                    axis_settings.pop('goalLineThickness')
                    axis_settings.pop('goalLineStyle')

    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] == 'QUERY_ITEM':
            all_viz_settings = item['queryResultSpec']['visualizationSettings']
            remove_axis_settings(all_viz_settings)
        elif item['type'] == 'GIS_ITEM':
            # Loop through all of the indicator layers, which each have their own
            # visualization settings.
            for indicator_layer in item['indicatorLayers'].values():
                all_viz_settings = indicator_layer['visualizationSettings']
                remove_axis_settings(all_viz_settings)

    upgraded_specification = related.to_model(
        DashboardSpecification_20211025, specification
    )
    upgraded_specification.version = VERSION_2021_10_25
    return related.to_dict(upgraded_specification)


def _downgrade_2021_10_25_specification(specification):
    '''Adds back the legacy goal line settings into axes settings models. These
    all have default values so we don't need to do anything here.'''

    # Drop the `autoFitToVisibleData` new map setting since it does not exist in the
    # previous spec.
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'QUERY_ITEM':
            continue

        map_settings = item['queryResultSpec']['visualizationSettings'].get('MAP')
        if not map_settings:
            continue
        map_settings['viewSpecificSettings'].pop('autoFitToVisibleData', None)

    downgraded_specification = related.to_model(
        DashboardSpecification_20211019, specification
    )
    downgraded_specification.version = VERSION_2021_10_19
    return related.to_dict(downgraded_specification)


def _upgrade_2021_10_25_specification(specification):
    '''Adding a new parameter to auto expand large tables'''
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'QUERY_ITEM' or item['visualizationType'] not in (
            'TABLE',
            'TABLE_SCORECARD',
        ):
            continue
        all_viz_settings = item['queryResultSpec']['visualizationSettings']
        all_viz_settings['TABLE']['viewSpecificSettings']['enableAutoExpand'] = False

    upgraded_specification = related.to_model(
        DashboardSpecification_20220808, specification
    )
    upgraded_specification.version = VERSION_2022_08_08
    return related.to_dict(upgraded_specification)


def _downgrade_2022_08_08_specification(specification):
    '''Removed a new parameter to auto expand large tables back'''

    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] == 'QUERY_ITEM':
            all_viz_settings = item['queryResultSpec']['visualizationSettings']
            all_viz_settings['TABLE']['viewSpecificSettings'].pop(
                'enableAutoExpand', None
            )
        elif item['type'] == 'GIS_ITEM':
            # Loop through all of the indicator layers, which each have their own
            # visualization settings.
            for indicator_layer in item['indicatorLayers'].values():
                all_viz_settings = indicator_layer['visualizationSettings']
                all_viz_settings['TABLE']['viewSpecificSettings'].pop(
                    'enableAutoExpand', None
                )

    downgraded_specification = related.to_model(
        DashboardSpecification_20211025, specification
    )
    downgraded_specification.version = VERSION_2021_10_25
    return related.to_dict(downgraded_specification)


def _upgrade_2022_08_08_specification(specification):
    '''Adding a new parameter to consolidate legend rules'''
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'QUERY_ITEM':
            continue
        all_viz_settings = item['queryResultSpec']['visualizationSettings']

        for visualisation_type in all_viz_settings.values():
            if (
                visualisation_type is not None
                and 'legendSettings' in visualisation_type
            ):
                visualisation_type['legendSettings']['consolidateRules'] = False
    upgraded_specification = related.to_model(
        DashboardSpecification_20220909, specification
    )
    upgraded_specification.version = VERSION_2022_09_09
    return related.to_dict(upgraded_specification)


def _downgrade_2022_09_09_specification(specification):
    '''Removed a new parameter to consolidate legend rules back'''

    # Removed consolidateRules from all vizs given a viz settings dictionary
    def remove_consolidate_rules(all_viz_settings: dict):
        for visualisation_type in all_viz_settings.values():
            if 'legendSettings' in visualisation_type:
                visualisation_type['legendSettings'].pop('consolidateRules', None)

    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] == 'QUERY_ITEM':
            all_viz_settings = item['queryResultSpec']['visualizationSettings']
            remove_consolidate_rules(all_viz_settings)
        elif item['type'] == 'GIS_ITEM':
            # Loop through all of the indicator layers, which each have their own
            # visualization settings.
            for indicator_layer in item['indicatorLayers'].values():
                all_viz_settings = indicator_layer['visualizationSettings']
                remove_consolidate_rules(all_viz_settings)

    downgraded_specification = related.to_model(
        DashboardSpecification_20220808, specification
    )
    downgraded_specification.version = VERSION_2022_08_08
    return related.to_dict(downgraded_specification)


def _upgrade_2022_09_09_specification(specification):
    '''
    Now we want to get rid of y-coordinate for items because some tiles
    can have dynamic size and it can change and it won't mean dashboard has
    changed. In the same time, it can be derived automatically, if items are
    stored in their order of appearance on the dashbord.
    Thus, this migration sorts items in such an order and then ditches the
    y-coordinate from items positions.
    '''
    specification['items'].sort(
        key=lambda item_holder: (
            item_holder['position']['y'],
            item_holder['position']['x'],
        )
    )
    for item_holder in specification['items']:
        del item_holder['position']['y']

    upgraded_specification = related.to_model(
        DashboardSpecification_20221003, specification
    )
    upgraded_specification.version = VERSION_2022_10_03
    return related.to_dict(upgraded_specification)


def _downgrade_2022_10_03_specification(specification):
    '''Do our best to restore the y-coordinates back. We can't restore the
    order of the items ofc but it's also not necessary'''

    def does_intersect_horizontally(position):
        px1, px2 = (position['x'], position['x'] + position['columnCount'])
        tx1, tx2 = (
            tile_position['x'],
            tile_position['x'] + tile_position['columnCount'],
        )
        # pylint: disable=chained-comparison
        return (
            (tx1 >= px1 and tx1 < px2)
            or (tx2 > px1 and tx2 <= px2)
            or (tx1 < px1 and tx2 > px2)
        )

    new_items = []
    for item_holder in specification['items']:
        tile_position = item_holder['position']
        last_intersect = list(filter(does_intersect_horizontally, new_items))
        if last_intersect:
            last_intersect.sort(key=lambda i: i['y'] + i['rowCount'])
            last_intersect = last_intersect[-1]
            y = last_intersect['y'] + last_intersect['rowCount']
        else:
            y = 0
        item_holder['position']['y'] = y
        new_items.append(item_holder['position'])

    downgraded_specification = related.to_model(
        DashboardSpecification_20220909, specification
    )
    downgraded_specification.version = VERSION_2022_09_09
    return related.to_dict(downgraded_specification)


def _upgrade_2022_10_03_specification(specification):
    '''
    Adds pivoted_dimensions to tablesettings with a default
    Nothing in this upgrade
    '''
    upgraded_specification = related.to_model(
        DashboardSpecification_20230117, specification
    )
    upgraded_specification.version = VERSION_2023_01_17
    return related.to_dict(upgraded_specification)


def _downgrade_2023_01_17_specification(specification):
    '''Removes pivoted_dimensions from the table settings'''

    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] == 'QUERY_ITEM':
            all_viz_settings = item['queryResultSpec']['visualizationSettings']
            all_viz_settings['TABLE']['viewSpecificSettings'].pop(
                'pivotedDimensions', None
            )
        elif item['type'] == 'GIS_ITEM':
            for indicator_layer in item['indicatorLayers'].values():
                all_viz_settings = indicator_layer['visualizationSettings']
                all_viz_settings['TABLE']['viewSpecificSettings'].pop(
                    'pivotedDimensions', None
                )
    downgraded_specification = related.to_model(
        DashboardSpecification_20221003, specification
    )
    downgraded_specification.version = VERSION_2022_10_03
    return related.to_dict(downgraded_specification)


def _upgrade_2023_01_17_specification(specification):
    '''Add enabledFilterHierarchy to filterSettings in commonSettings'''

    filter_settings = specification['commonSettings']['filterSettings']
    filter_settings['enabledFilterHierarchy'] = []

    upgraded_specification = related.to_model(
        DashboardSpecification_20230329, specification
    )
    upgraded_specification.version = VERSION_2023_03_29
    return related.to_dict(upgraded_specification)


def _downgrade_2023_03_29_specification(specification):
    '''Remove enabledFilterHierarchy from filterSettings in commonSettings'''

    filter_settings = specification['commonSettings']['filterSettings']
    filter_settings.pop('enabledFilterHierarchy', None)

    downgraded_specification = related.to_model(
        DashboardSpecification_20230117, specification
    )
    downgraded_specification.version = VERSION_2023_01_17
    return related.to_dict(downgraded_specification)


def _upgrade_2023_03_29_specification(specification):
    '''Adds un_pivot to bargraph seetings with a default value.
    There is Nothing to upgrade'''
    upgraded_specification = related.to_model(
        DashboardSpecification_20230630, specification
    )
    upgraded_specification.version = VERSION_2023_06_30
    return related.to_dict(upgraded_specification)


def _downgrade_2023_06_30_specification(specification):
    '''Removes un_pivot property from the bargraph settings'''
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] == 'QUERY_ITEM':
            all_viz_settings = item['queryResultSpec']['visualizationSettings']
            all_viz_settings['BAR_GRAPH']['viewSpecificSettings'].pop('unPivot', None)
        elif item['type'] == 'GIS_ITEM':
            for indicator_layer in item['indicatorLayers'].values():
                all_viz_settings = indicator_layer['visualizationSettings']
                all_viz_settings['BAR_GRAPH']['viewSpecificSettings'].pop(
                    'unPivot', None
                )
    downgraded_specification = related.to_model(
        DashboardSpecification_20230329, specification
    )
    downgraded_specification.version = VERSION_2023_03_29
    return related.to_dict(downgraded_specification)


VERSION_TO_UPGRADE_FUNCTION = {
    VERSION_2021_08_05: _upgrade_2021_08_05_specification,
    VERSION_2021_08_16: _upgrade_2021_08_16_specification,
    VERSION_2021_10_14: _upgrade_2021_10_14_specification,
    VERSION_2021_10_19: _upgrade_2021_10_19_specification,
    VERSION_2021_10_25: _upgrade_2021_10_25_specification,
    VERSION_2022_08_08: _upgrade_2022_08_08_specification,
    VERSION_2022_09_09: _upgrade_2022_09_09_specification,
    VERSION_2022_10_03: _upgrade_2022_10_03_specification,
    VERSION_2023_01_17: _upgrade_2023_01_17_specification,
    VERSION_2023_03_29: _upgrade_2023_03_29_specification,
}


VERSION_TO_DOWNGRADE_FUNCTION = {
    VERSION_2021_08_16: _downgrade_2021_08_16_specification,
    VERSION_2021_10_14: _downgrade_2021_10_14_specification,
    VERSION_2021_10_19: _downgrade_2021_10_19_specification,
    VERSION_2021_10_25: _downgrade_2021_10_25_specification,
    VERSION_2022_08_08: _downgrade_2022_08_08_specification,
    VERSION_2022_09_09: _downgrade_2022_09_09_specification,
    VERSION_2022_10_03: _downgrade_2022_10_03_specification,
    VERSION_2023_01_17: _downgrade_2023_01_17_specification,
    VERSION_2023_03_29: _downgrade_2023_03_29_specification,
    VERSION_2023_06_30: _downgrade_2023_06_30_specification,
}
