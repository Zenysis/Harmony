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
from models.python.dashboard.latest.model import (
    DashboardSpecification as DashboardSpecification_20211025,
    DEFAULT_COLUMN_COUNT,
)

VERSION_2021_08_05 = '2021-08-05'
VERSION_2021_08_16 = '2021-08-16'
VERSION_2021_10_14 = '2021-10-14'
VERSION_2021_10_19 = '2021-10-19'
VERSION_2021_10_25 = '2021-10-25'
LATEST_VERSION = VERSION_2021_10_25

# When the dashboard schema is changed, the version date needs to be added here
DASHBOARD_SCHEMA_VERSIONS = sorted(
    [
        VERSION_2021_08_05,
        VERSION_2021_08_16,
        VERSION_2021_10_14,
        VERSION_2021_10_19,
        VERSION_2021_10_25,
    ]
)

NEXT_SCHEMA_VERSION_MAP = {
    VERSION_2021_08_05: VERSION_2021_08_16,
    VERSION_2021_08_16: VERSION_2021_10_14,
    VERSION_2021_10_14: VERSION_2021_10_19,
    VERSION_2021_10_19: VERSION_2021_10_25,
    VERSION_2021_10_25: None,
}

PREVIOUS_SCHEMA_VERSION_MAP = {
    VERSION_2021_08_16: VERSION_2021_08_05,
    VERSION_2021_10_14: VERSION_2021_08_16,
    VERSION_2021_10_19: VERSION_2021_10_14,
    VERSION_2021_10_25: VERSION_2021_10_19,
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
    for item_holder in specification['items']:
        item = item_holder['item']
        if item['type'] != 'QUERY_ITEM':
            continue

        all_viz_settings = item['queryResultSpec']['visualizationSettings']

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

    upgraded_specification = related.to_model(
        DashboardSpecification_20211025, specification
    )
    upgraded_specification.version = VERSION_2021_10_25
    return related.to_dict(upgraded_specification)


def _downgrade_2021_10_25_specification(specification):
    '''Adds back the legacy goal line settings into axes settings models. These
    all have default values so we don't need to do anything here.'''
    downgraded_specification = related.to_model(
        DashboardSpecification_20211019, specification
    )
    downgraded_specification.version = VERSION_2021_10_19
    return related.to_dict(downgraded_specification)


VERSION_TO_UPGRADE_FUNCTION = {
    VERSION_2021_08_05: _upgrade_2021_08_05_specification,
    VERSION_2021_08_16: _upgrade_2021_08_16_specification,
    VERSION_2021_10_14: _upgrade_2021_10_14_specification,
    VERSION_2021_10_19: _upgrade_2021_10_19_specification,
}


VERSION_TO_DOWNGRADE_FUNCTION = {
    VERSION_2021_08_16: _downgrade_2021_08_16_specification,
    VERSION_2021_10_14: _downgrade_2021_10_14_specification,
    VERSION_2021_10_19: _downgrade_2021_10_19_specification,
    VERSION_2021_10_25: _downgrade_2021_10_25_specification,
}
