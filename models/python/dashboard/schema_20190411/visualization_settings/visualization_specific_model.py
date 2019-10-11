# pylint: disable=too-many-lines
from past.builtins import basestring
from enum import Enum

# $ConfigImportHack
# HACK(vedant) - Because we want to completely break the dependence on the
# configuration import hack, we need to reference values via a dynamic import
from config.loader import get_configuration_module
from models.python import PropertyRegistry, PythonModel
from web.server.util.util import (
    assert_boolean,
    assert_enum,
    assert_float,
    assert_in,
    assert_integer,
    assert_non_string_iterable,
    assert_mapping,
    assert_number,
    assert_string,
    key_value_element_validator,
    string_type_validator,
)

BASE_LAYERS = set(['Satellite', 'Streets', 'Light', 'Blank'])

# pylint:disable=C0103
AnimatedMapProperty = PropertyRegistry()
BarChartProperty = PropertyRegistry()
BoxPlotProperty = PropertyRegistry()
BubbleChartProperty = PropertyRegistry()
BumpChartProperty = PropertyRegistry()
ExpandoTreeProperty = PropertyRegistry()
HeatMapProperty = PropertyRegistry()
HeatTileProperty = PropertyRegistry()
MapProperty = PropertyRegistry()
SunburstProperty = PropertyRegistry()
TableProperty = PropertyRegistry()
TimeSeriesProperty = PropertyRegistry()


def map_coordinate_validator(value, index, argument_name=None):
    value_suffix = (
        'for argument \'{0}\' with value \'{1}\''.format(argument_name, value)
        if argument_name
        else 'for value \'{0}\''.format(value)
    )

    if index >= 2:
        message = (
            'Maps may only have two co-ordinate values. ' 'Recieved more than two {0}.'
        ).format(value_suffix)
        raise ValueError(message)

    int(value)


def string_to_integer_kv_validator(key, value, argument_name=None):
    key_value_element_validator(key, value, argument_name, basestring, 'string', int)


def assert_map_coordinates(value, argument_name=None):
    assert_non_string_iterable(value, argument_name, map_coordinate_validator)


def assert_overlay_layers(value, argument_name=None):
    assert_non_string_iterable(value, argument_name, string_type_validator)


# Visualization specific settings whose keys AND values are unique to that
# specific visualization

DEFAULT_SELECTED_FIELD = ''

DEFAULT_MAP_BASE_LAYER = 'Streets'
DEFAULT_MAP_CURRENT_DISPLAY = 'dots'
DEFAULT_MAP_CENTER = [0.0, 0.0]
DEFAULT_MAP_OVERLAY_LAYERS = ['Administrative']
DEFAULT_MAP_ZOOM_LEVEL = 1.0
DEFAULT_MAP_SHOW_ADMINISTRATIVE_BOUNDARIES = True
DEFAULT_MAP_SHOW_LABELS = False
DEFAULT_MAP_TOOLTIP_BACKGROUND = {'r': 255, 'g': 255, 'b': 255, 'a': 0.75}
DEFAULT_MAP_TOOLTIP_FONT_COLOR = 'black'
DEFAULT_MAP_TOOLTIP_FONT = 'Arial'
DEFAULT_MAP_TOOLTIP_FONT_SIZE = '12px'
DEFAULT_MAP_TOOLTIP_BOLD = False


class BumpChartTheme(Enum):
    LIGHT = 0
    DARK = 1


class TableFormat(Enum):
    TABLE = 0
    SCORECARD = 1


class SortOrder(Enum):
    ASCENDING = 0
    DESCENDING = 1
    ALPHABETICAL = 2


SORT_ORDER_MAP = {
    'ASC': SortOrder.ASCENDING,
    'DESC': SortOrder.DESCENDING,
    'ALPH': SortOrder.ALPHABETICAL,
}

SERIALIZED_SORT_ORDER_MAP = {
    SortOrder.ASCENDING: 'ASC',
    SortOrder.DESCENDING: 'DESC',
    SortOrder.ALPHABETICAL: 'ALPH',
}

BUMP_CHART_THEME_MAP = {'light': BumpChartTheme.LIGHT, 'dark': BumpChartTheme.DARK}


def serialize_sort_order(value):
    formatted_value = SERIALIZED_SORT_ORDER_MAP.get(value)

    if not formatted_value:
        raise ValueError('Unexpected value for SortOrder: \'{0}\''.format(value.name))

    return formatted_value


def deserialize_sort_order(value):
    if isinstance(value, SortOrder):
        return value

    assert_string(value, 'sort_order')
    formatted_value = SORT_ORDER_MAP.get(value.upper())

    if not formatted_value:
        raise ValueError('Unexpected value for SortOrder: \'{0}\''.format(value.name))

    return formatted_value


def deserialize_bump_chart_theme(value):
    if isinstance(value, BumpChartTheme):
        return value

    assert_string(value, 'bump_chart_theme')
    return BumpChartTheme[value.upper()]


def deserialize_table_format(value):
    if isinstance(value, TableFormat):
        return value

    assert_string(value, 'table_format')
    return TableFormat[value.upper()]


def deserialize_bucket_type(value):
    if isinstance(value, TimeSeriesBucket):
        return value

    assert_string(value, 'bucket_type')
    return TimeSeriesBucket[value.upper()]


class AnimatedMapSettings(PythonModel):
    @classmethod
    def registry(cls):
        return AnimatedMapProperty

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_BASE_LAYER,
        value_validate_function=lambda value: assert_in(
            value, BASE_LAYERS, 'base_layer'
        ),
    )
    def base_layer(self):
        return self.get('baseLayer')

    @base_layer.setter
    @AnimatedMapProperty.setter()
    def base_layer(self, value):
        self['baseLayer'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_CURRENT_DISPLAY,
        value_validate_function=lambda value: assert_string(value, 'current_display'),
    )
    def current_display(self):
        return self.get('currentDisplay')

    @current_display.setter
    @AnimatedMapProperty.setter()
    def current_display(self, value):
        self['currentDisplay'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_CENTER,
        value_validate_function=lambda value: assert_map_coordinates(
            value, 'map_center'
        ),
    )
    def map_center(self):
        return self.get('mapCenter')

    @map_center.setter
    @AnimatedMapProperty.setter()
    def map_center(self, value):
        self['mapCenter'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_OVERLAY_LAYERS,
        value_validate_function=lambda value: assert_overlay_layers(
            value, 'overlay_layers'
        ),
    )
    def overlay_layers(self):
        return self.get('overlayLayers')

    @overlay_layers.setter
    @AnimatedMapProperty.setter()
    def overlay_layers(self, value):
        self['overlayLayers'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @AnimatedMapProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(
            value, 'selected_geo_tiles'
        ),
    )
    def selected_geo_tiles(self):
        return self.get('selectedGeoTiles')

    @selected_geo_tiles.setter
    @AnimatedMapProperty.setter()
    def selected_geo_tiles(self, value):
        self['selectedGeoTiles'] = value

    @property
    @AnimatedMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_ZOOM_LEVEL,
        value_validate_function=lambda value: assert_float(value, 'zoom_level'),
    )
    def zoom_level(self):
        return self.get('zoomLevel')

    @zoom_level.setter
    @AnimatedMapProperty.setter(value_parser_function=float)
    def zoom_level(self, value):
        self['zoomLevel'] = value


DEFAULT_BAR_CHART_RESULT_LIMIT = 50
DEFAULT_BAR_CHART_STACK_BARS = False
DEFAULT_BAR_CHART_SORT_ORDER = SortOrder.DESCENDING
DEFAULT_BAR_CHART_Y2_LINE_GRAPH = False
DEFAULT_BAR_CHART_X_TICK_FORMAT = 'YYYY-MM-DD'
DEFAULT_BAR_CHART_REMOVE_BAR_SPACING = False
DEFAULT_BAR_CHART_ROTATE_X_AXIS_LABELS = True
DEFAULT_BAR_CHART_ROTATE_DATA_VALUE_LABELS = True
DEFAULT_BAR_CHART_HIDE_GRIDLINES = False
DEFAULT_BAR_CHART_HIDE_DATA_VALUE_ZEROS = False


class BarChartSettings(PythonModel):
    @classmethod
    def registry(cls):
        return BarChartProperty

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'disabled_fields', string_to_integer_kv_validator
        ),
    )
    def disabled_fields(self):
        return self.get('disabledFields')

    @disabled_fields.setter
    @BarChartProperty.setter()
    def disabled_fields(self, value):
        self['disabledFields'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_RESULT_LIMIT,
        value_validate_function=lambda value: assert_integer(value, 'result_limit'),
    )
    def result_limit(self):
        return self.get('resultLimit')

    @result_limit.setter
    @BarChartProperty.setter()
    def result_limit(self, value):
        self['resultLimit'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_SORT_ORDER,
        value_validate_function=lambda value: assert_enum(
            value, SortOrder, 'SortOrder', 'sort_order'
        ),
        value_formatter_function=serialize_sort_order,
    )
    def sort_order(self):
        return self.get('sortOrder')

    @sort_order.setter
    @BarChartProperty.setter(value_parser_function=deserialize_sort_order)
    def sort_order(self, value):
        self['sortOrder'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'sort_on'),
    )
    def sort_on(self):
        return self.get('sortOn')

    @sort_on.setter
    @BarChartProperty.setter()
    def sort_on(self, value):
        self['sortOn'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_STACK_BARS,
        value_validate_function=lambda value: assert_boolean(value, 'stack_bars'),
    )
    def stack_bars(self):
        return self.get('stackBars')

    @stack_bars.setter
    @BarChartProperty.setter()
    def stack_bars(self, value):
        self['stackBars'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_Y2_LINE_GRAPH,
        value_validate_function=lambda value: assert_boolean(value, 'y2_line_graph'),
    )
    def y2_line_graph(self):
        return self.get('y2LineGraph')

    @y2_line_graph.setter
    @BarChartProperty.setter()
    def y2_line_graph(self, value):
        self['y2LineGraph'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_X_TICK_FORMAT,
        value_validate_function=lambda value: assert_string(value, 'x_tick_format'),
    )
    def x_tick_format(self):
        return self.get('xTickFormat')

    @x_tick_format.setter
    @BarChartProperty.setter()
    def x_tick_format(self, value):
        self['xTickFormat'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_REMOVE_BAR_SPACING,
        value_validate_function=lambda value: assert_boolean(
            value, 'remove_bar_spacing'
        ),
    )
    def remove_bar_spacing(self):
        return self.get('removeBarSpacing')

    @remove_bar_spacing.setter
    @BarChartProperty.setter()
    def remove_bar_spacing(self, value):
        self['removeBarSpacing'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_ROTATE_X_AXIS_LABELS,
        value_validate_function=lambda value: assert_boolean(
            value, 'rotate_x_axis_labels'
        ),
    )
    def rotate_x_axis_labels(self):
        return self.get('rotateXAxisLabels')

    @rotate_x_axis_labels.setter
    @BarChartProperty.setter()
    def rotate_x_axis_labels(self, value):
        self['rotateXAxisLabels'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_ROTATE_DATA_VALUE_LABELS,
        value_validate_function=lambda value: assert_boolean(
            value, 'rotate_data_value_labels'
        ),
    )
    def rotate_data_value_labels(self):
        return self.get('rotateDataValueLabels')

    @rotate_data_value_labels.setter
    @BarChartProperty.setter()
    def rotate_data_value_labels(self, value):
        self['rotateDataValueLabels'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_HIDE_GRIDLINES,
        value_validate_function=lambda value: assert_boolean(value, 'hide_grid_lines'),
    )
    def hide_grid_lines(self):
        return self.get('hideGridLines')

    @hide_grid_lines.setter
    @BarChartProperty.setter()
    def hide_grid_lines(self, value):
        self['hideGridLines'] = value

    @property
    @BarChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_HIDE_DATA_VALUE_ZEROS,
        value_validate_function=lambda value: assert_boolean(
            value, 'hide_data_value_zeros'
        ),
    )
    def hide_data_value_zeros(self):
        return self.get('hideDataValueZeros')

    @hide_data_value_zeros.setter
    @BarChartProperty.setter()
    def hide_data_value_zeros(self, value):
        self['hideDataValueZeros'] = value


class BoxPlotSettings(PythonModel):
    @classmethod
    def registry(cls):
        return BoxPlotProperty

    @property
    @BoxPlotProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'group_by'),
    )
    def group_by(self):
        return self.get('groupBy')

    @group_by.setter
    @BoxPlotProperty.setter()
    def group_by(self, value):
        self['groupBy'] = value


DEFAULT_BUBBLE_CHART_LINEAR_FIT = False
DEFAULT_BUBBLE_CHART_RESULT_LIMIT = 100
DEFAULT_BUBBLE_CHART_SHOW_LEGEND = False


class BubbleChartSettings(PythonModel):
    @classmethod
    def registry(cls):
        return BubbleChartProperty

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUBBLE_CHART_LINEAR_FIT,
        value_validate_function=lambda value: assert_boolean(value, 'linear_fit'),
    )
    def linear_fit(self):
        return self.get('linearFit')

    @linear_fit.setter
    @BubbleChartProperty.setter()
    def linear_fit(self, value):
        self['linearFit'] = value

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUBBLE_CHART_RESULT_LIMIT,
        value_validate_function=lambda value: assert_integer(value, 'result_limit'),
    )
    def result_limit(self):
        return self.get('resultLimit')

    @result_limit.setter
    @BubbleChartProperty.setter()
    def result_limit(self, value):
        self['resultLimit'] = value

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUBBLE_CHART_SHOW_LEGEND,
        value_validate_function=lambda value: assert_boolean(value, 'show_legend'),
    )
    def show_legend(self):
        return self.get('showLegend')

    @show_legend.setter
    @BubbleChartProperty.setter()
    def show_legend(self, value):
        self['showLegend'] = value

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'x_axis'),
    )
    def x_axis(self):
        return self.get('xAxis')

    @x_axis.setter
    @BubbleChartProperty.setter()
    def x_axis(self, value):
        self['xAxis'] = value

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'y_axis'),
    )
    def y_axis(self):
        return self.get('yAxis')

    @y_axis.setter
    @BubbleChartProperty.setter()
    def y_axis(self, value):
        self['yAxis'] = value

    @property
    @BubbleChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'z_axis'),
    )
    def z_axis(self):
        return self.get('zAxis')

    @z_axis.setter
    @BubbleChartProperty.setter()
    def z_axis(self, value):
        self['zAxis'] = value


DEFAULT_BUMP_CHART_RESULT_LIMIT = 25
DEFAULT_BUMP_CHART_USE_ETHIOPIAN_DATES = False
DEFAULT_BUMP_CHART_THEME = BumpChartTheme.DARK


class BumpChartSettings(PythonModel):
    @classmethod
    def registry(cls):
        return BumpChartProperty

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUMP_CHART_RESULT_LIMIT,
        value_validate_function=lambda value: assert_integer(value, 'result_limit'),
    )
    def result_limit(self):
        return self.get('resultLimit')

    @result_limit.setter
    @BumpChartProperty.setter()
    def result_limit(self, value):
        self['resultLimit'] = value

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @BumpChartProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'selected_keys', string_to_integer_kv_validator
        ),
    )
    def selected_keys(self):
        return self.get('selectedKeys')

    @selected_keys.setter
    @BumpChartProperty.setter()
    def selected_keys(self, value):
        self['selectedKeys'] = value

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BAR_CHART_SORT_ORDER,
        value_validate_function=lambda value: assert_enum(
            value, SortOrder, 'SortOrder', 'sort_order'
        ),
        value_formatter_function=serialize_sort_order,
    )
    def sort_order(self):
        return self.get('sortOrder')

    @sort_order.setter
    @BumpChartProperty.setter(value_parser_function=deserialize_sort_order)
    def sort_order(self, value):
        self['sortOrder'] = value

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUMP_CHART_THEME,
        value_validate_function=lambda value: assert_enum(
            value, BumpChartTheme, 'BumpChartTheme', 'theme'
        ),
        value_formatter_function=lambda value: value.name.lower(),
    )
    def theme(self):
        return self.get('theme')

    @theme.setter
    @BumpChartProperty.setter(value_parser_function=deserialize_bump_chart_theme)
    def theme(self, value):
        self['theme'] = value

    @property
    @BumpChartProperty.getter(
        nullable=False,
        default_value=DEFAULT_BUMP_CHART_USE_ETHIOPIAN_DATES,
        value_validate_function=lambda value: assert_boolean(
            value, 'use_ethopian_dates'
        ),
    )
    def use_ethiopian_dates(self):
        return self.get('useEthiopianDates')

    @use_ethiopian_dates.setter
    @BumpChartProperty.setter()
    def use_ethiopian_dates(self, value):
        self['useEthiopianDates'] = value


class ExpandoTreeSettings(PythonModel):
    @classmethod
    def registry(cls):
        return ExpandoTreeProperty

    @property
    @ExpandoTreeProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @ExpandoTreeProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value


class HeatMapSettings(PythonModel):
    @classmethod
    def registry(cls):
        return HeatMapProperty

    @property
    @HeatMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @HeatMapProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value

    @property
    @HeatMapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_BASE_LAYER,
        value_validate_function=lambda value: assert_in(
            value, BASE_LAYERS, 'base_layer'
        ),
    )
    def base_layer(self):
        return self.get('baseLayer')

    @base_layer.setter
    @HeatMapProperty.setter()
    def base_layer(self, value):
        self['baseLayer'] = value


DEFAULT_HEAT_TILE_DIVERGENT_COLORATION = True
DEFAULT_HEAT_TILE_INVERT_COLORATION = False
DEFAULT_HEAT_TILE_LOG_SCALING = True
DEAFULT_HEAT_TILE_RESULT_LIMIT = 100
DEFAULT_HEAT_TILE_SORT_ORDER = SortOrder.DESCENDING
DEFAULT_HEAT_TILE_TIME_ON_Y_AXIS = True
DEFAULT_HEAT_TILE_USE_ETHIOPIAN_DATES = False


class HeatTileSettings(PythonModel):
    @classmethod
    def registry(cls):
        return HeatTileProperty

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_DIVERGENT_COLORATION,
        value_validate_function=lambda value: assert_boolean(
            value, 'divergent_coloration'
        ),
    )
    def divergent_coloration(self):
        return self.get('divergentColoration')

    @divergent_coloration.setter
    @HeatTileProperty.setter()
    def divergent_coloration(self, value):
        self['divergentColoration'] = value

    @property
    @HeatTileProperty.getter(
        serialized_property_name='firstYaxisSelections',
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'first_y_axis_selections', string_type_validator
        ),
    )
    def first_y_axis_selections(self):
        return self.get('firstYaxisSelections')

    @first_y_axis_selections.setter
    @HeatTileProperty.setter()
    def first_y_axis_selections(self, value):
        self['firstYaxisSelections'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_INVERT_COLORATION,
        value_validate_function=lambda value: assert_boolean(
            value, 'invert_coloration'
        ),
    )
    def invert_coloration(self):
        return self.get('invertColoration')

    @invert_coloration.setter
    @HeatTileProperty.setter()
    def invert_coloration(self, value):
        self['invertColoration'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_LOG_SCALING,
        value_validate_function=lambda value: assert_boolean(value, 'log_scaling'),
    )
    def log_scaling(self):
        return self.get('logScaling')

    @log_scaling.setter
    @HeatTileProperty.setter()
    def log_scaling(self, value):
        self['logScaling'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEAFULT_HEAT_TILE_RESULT_LIMIT,
        value_validate_function=lambda value: assert_integer(value, 'result_limit'),
    )
    def result_limit(self):
        return self.get('resultLimit')

    @result_limit.setter
    @HeatTileProperty.setter()
    def result_limit(self, value):
        self['resultLimit'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @HeatTileProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_TIME_ON_Y_AXIS,
        value_validate_function=lambda value: assert_boolean(
            value, 'show_time_on_y_axis'
        ),
    )
    def show_time_on_y_axis(self):
        return self.get('showTimeOnYAxis')

    @show_time_on_y_axis.setter
    @HeatTileProperty.setter()
    def show_time_on_y_axis(self, value):
        self['showTimeOnYAxis'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_SORT_ORDER,
        value_validate_function=lambda value: assert_enum(
            value, SortOrder, 'SortOrder', 'sort_order'
        ),
        value_formatter_function=serialize_sort_order,
    )
    def sort_order(self):
        return self.get('sortOrder')

    @sort_order.setter
    @HeatTileProperty.setter(value_parser_function=deserialize_sort_order)
    def sort_order(self, value):
        self['sortOrder'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'sort_on'),
    )
    def sort_on(self):
        return self.get('sortOn')

    @sort_on.setter
    @HeatTileProperty.setter()
    def sort_on(self, value):
        self['sortOn'] = value

    @property
    @HeatTileProperty.getter(
        nullable=False,
        default_value=DEFAULT_HEAT_TILE_USE_ETHIOPIAN_DATES,
        value_validate_function=lambda value: assert_boolean(
            value, 'use_ethopian_dates'
        ),
    )
    def use_ethiopian_dates(self):
        return self.get('useEthiopianDates')

    @use_ethiopian_dates.setter
    @HeatTileProperty.setter()
    def use_ethiopian_dates(self, value):
        self['useEthiopianDates'] = value


class MapSettings(PythonModel):
    @classmethod
    def registry(cls):
        return MapProperty

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_BASE_LAYER,
        value_validate_function=lambda value: assert_in(
            value, BASE_LAYERS, 'base_layer'
        ),
    )
    def base_layer(self):
        return self.get('baseLayer')

    @base_layer.setter
    @MapProperty.setter()
    def base_layer(self, value):
        self['baseLayer'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_CURRENT_DISPLAY,
        value_validate_function=lambda value: assert_string(value, 'current_display'),
    )
    def current_display(self):
        return self.get('currentDisplay')

    @current_display.setter
    @MapProperty.setter()
    def current_display(self, value):
        self['currentDisplay'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_CENTER,
        value_validate_function=lambda value: assert_map_coordinates(
            value, 'map_center'
        ),
    )
    def map_center(self):
        return self.get('mapCenter')

    @map_center.setter
    @MapProperty.setter()
    def map_center(self, value):
        self['mapCenter'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_OVERLAY_LAYERS,
        value_validate_function=lambda value: assert_overlay_layers(
            value, 'overlay_layers'
        ),
    )
    def overlay_layers(self):
        return self.get('overlayLayers')

    @overlay_layers.setter
    @MapProperty.setter()
    def overlay_layers(self, value):
        self['overlayLayers'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @MapProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(
            value, 'selected_geo_tiles'
        ),
    )
    def selected_geo_tiles(self):
        return self.get('selectedGeoTiles')

    @selected_geo_tiles.setter
    @MapProperty.setter()
    def selected_geo_tiles(self, value):
        self['selectedGeoTiles'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_ZOOM_LEVEL,
        value_validate_function=lambda value: assert_float(value, 'zoom_level'),
    )
    def zoom_level(self):
        return self.get('zoomLevel')

    @zoom_level.setter
    @MapProperty.setter(value_parser_function=float)
    def zoom_level(self, value):
        self['zoomLevel'] = value

    @property
    @MapProperty.getter(
        'showAdminBoundaries',
        nullable=False,
        default_value=DEFAULT_MAP_SHOW_ADMINISTRATIVE_BOUNDARIES,
        value_validate_function=lambda value: assert_boolean(
            value, 'show_administrative_boundaries'
        ),
    )
    def show_administrative_boundaries(self):
        return self.get('showAdminBoundaries')

    @show_administrative_boundaries.setter
    @MapProperty.setter()
    def show_administrative_boundaries(self, value):
        self['showAdminBoundaries'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_SHOW_LABELS,
        value_validate_function=lambda value: assert_boolean(value, 'show_labels'),
    )
    def show_labels(self):
        return self.get('showLabels')

    @show_labels.setter
    @MapProperty.setter()
    def show_labels(self, value):
        self['showLabels'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_TOOLTIP_BACKGROUND,
        value_validate_function=lambda value: True,
    )
    def tooltip_background_color(self):
        return self.get('tooltipBackgroundColor')

    @tooltip_background_color.setter
    @MapProperty.setter()
    def tooltip_background_color(self, value):
        self['tooltipBackgroundColor'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_TOOLTIP_FONT_COLOR,
        value_validate_function=lambda value: assert_string(
            value, 'tooltip_font_color'
        ),
    )
    def tooltip_font_color(self):
        return self.get('tooltipFontColor')

    @tooltip_font_color.setter
    @MapProperty.setter()
    def tooltip_font_color(self, value):
        self['tooltipFontColor'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_TOOLTIP_FONT,
        value_validate_function=lambda value: assert_string(
            value, 'tooltip_font_family'
        ),
    )
    def tooltip_font_family(self):
        return self.get('tooltipFontFamily')

    @tooltip_font_family.setter
    @MapProperty.setter()
    def tooltip_font_family(self, value):
        self['tooltipFontFamily'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_TOOLTIP_FONT_SIZE,
        value_validate_function=lambda value: assert_string(value, 'tooltip_font_size'),
    )
    def tooltip_font_size(self):
        return self.get('tooltipFontSize')

    @tooltip_font_size.setter
    @MapProperty.setter()
    def tooltip_font_size(self, value):
        self['tooltipFontSize'] = value

    @property
    @MapProperty.getter(
        nullable=False,
        default_value=DEFAULT_MAP_TOOLTIP_BOLD,
        value_validate_function=lambda value: assert_boolean(value, 'tooltip_bold'),
    )
    def tooltip_bold(self):
        return self.get('tooltipBold')

    @tooltip_bold.setter
    @MapProperty.setter()
    def tooltip_bold(self, value):
        self['tooltipBold'] = value


DEFAULT_TABLE_ROW_HEIGHT = 30
DEFAULT_TABLE_ENABLE_PAGINATION = True
DEFAULT_TABLE_ADD_TOTAL_ROW = False
DEFAULT_TABLE_FORMAT = TableFormat.TABLE
DEFAULT_TABLE_HEADER_FONT = 'Arial'
DEFAULT_TABLE_HEADER_COLOR = 'black'
DEFAULT_TABLE_HEADER_SIZE = '12px'
DEFAULT_TABLE_HEADER_BACKGROUND = '#fff'
DEFAULT_TABLE_HEADER_BORDER = '#d9d9d9'
DEFAULT_TABLE_ROW_FONT = 'Arial'
DEFAULT_TABLE_ROW_COLOR = 'black'
DEFAULT_TABLE_ROW_SIZE = '12px'
DEFAULT_TABLE_ROW_BACKGROUND = '#fff'
DEFAULT_TABLE_ROW_ALTERNATE_BACKGROUND = '#f0f0f0'
DEFAULT_TABLE_ROW_BORDER = '#d9d9d9'
DEFAULT_TABLE_FOOTER_FONT = 'Arial'
DEFAULT_TABLE_FOOTER_COLOR = 'black'
DEFAULT_TABLE_FOOTER_SIZE = '12px'
DEFAULT_TABLE_FOOTER_BACKGROUND = '#fff'
DEFAULT_TABLE_FOOTER_BORDER = '#fff'


class TableSettings(PythonModel):
    @classmethod
    def registry(cls):
        return TableProperty

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'inverted_fields', string_type_validator
        ),
    )
    def inverted_fields(self):
        return self.get('invertedFields')

    @inverted_fields.setter
    @TableProperty.setter()
    def inverted_fields(self, value):
        self['invertedFields'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FORMAT,
        value_validate_function=lambda value: assert_enum(
            value, TableFormat, 'TableFormat', 'tableFormat'
        ),
        value_formatter_function=lambda value: value.name.lower(),
    )
    def table_format(self):
        return self.get('tableFormat')

    @table_format.setter
    @TableProperty.setter(value_parser_function=deserialize_table_format)
    def table_format(self, value):
        self['tableFormat'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ENABLE_PAGINATION,
        value_validate_function=lambda value: assert_boolean(
            value, 'enable_pagination'
        ),
    )
    def enable_pagination(self):
        return self.get('enablePagination')

    @enable_pagination.setter
    @TableProperty.setter()
    def enable_pagination(self, value):
        self['enablePagination'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ADD_TOTAL_ROW,
        value_validate_function=lambda value: assert_boolean(value, 'add_total_row'),
    )
    def add_total_row(self):
        return self.get('addTotalRow')

    @add_total_row.setter
    @TableProperty.setter()
    def add_total_row(self, value):
        self['addTotalRow'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_HEIGHT,
        value_validate_function=lambda value: assert_number(value, 'row_height'),
    )
    def row_height(self):
        return self.get('rowHeight')

    @row_height.setter
    @TableProperty.setter()
    def row_height(self, value):
        self['rowHeight'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_HEADER_FONT,
        value_validate_function=lambda value: assert_string(
            value, 'header_font_family'
        ),
    )
    def header_font_family(self):
        return self.get('headerFontFamily')

    @header_font_family.setter
    @TableProperty.setter()
    def header_font_family(self, value):
        self['headerFontFamily'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_HEADER_COLOR,
        value_validate_function=lambda value: assert_string(value, 'header_color'),
    )
    def header_color(self):
        return self.get('headerColor')

    @header_color.setter
    @TableProperty.setter()
    def header_color(self, value):
        self['headerColor'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_HEADER_SIZE,
        value_validate_function=lambda value: assert_string(value, 'header_font_size'),
    )
    def header_font_size(self):
        return self.get('headerFontSize')

    @header_font_size.setter
    @TableProperty.setter()
    def header_font_size(self, value):
        self['headerFontSize'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_HEADER_BACKGROUND,
        value_validate_function=lambda value: assert_string(value, 'header_background'),
    )
    def header_background(self):
        return self.get('headerBackground')

    @header_background.setter
    @TableProperty.setter()
    def header_background(self, value):
        self['headerBackground'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_HEADER_BORDER,
        value_validate_function=lambda value: assert_string(
            value, 'header_border_color'
        ),
    )
    def header_border_color(self):
        return self.get('headerBorderColor')

    @header_border_color.setter
    @TableProperty.setter()
    def header_border_color(self, value):
        self['headerBorderColor'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_FONT,
        value_validate_function=lambda value: assert_string(value, 'row_font_family'),
    )
    def row_font_family(self):
        return self.get('rowFontFamily')

    @row_font_family.setter
    @TableProperty.setter()
    def row_font_family(self, value):
        self['rowFontFamily'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_COLOR,
        value_validate_function=lambda value: assert_string(value, 'row_color'),
    )
    def row_color(self):
        return self.get('rowColor')

    @row_color.setter
    @TableProperty.setter()
    def row_color(self, value):
        self['rowColor'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_SIZE,
        value_validate_function=lambda value: assert_string(value, 'row_font_size'),
    )
    def row_font_size(self):
        return self.get('rowFontSize')

    @row_font_size.setter
    @TableProperty.setter()
    def row_font_size(self, value):
        self['rowFontSize'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_BACKGROUND,
        value_validate_function=lambda value: assert_string(value, 'row_background'),
    )
    def row_background(self):
        return self.get('rowBackground')

    @row_background.setter
    @TableProperty.setter()
    def row_background(self, value):
        self['rowBackground'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_BACKGROUND,
        value_validate_function=lambda value: assert_string(
            value, 'row_alternate_background'
        ),
    )
    def row_alternate_background(self):
        return self.get('rowAlternateBackground')

    @row_alternate_background.setter
    @TableProperty.setter()
    def row_alternate_background(self, value):
        self['rowAlternateBackground'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_ROW_BORDER,
        value_validate_function=lambda value: assert_string(value, 'row_border_color'),
    )
    def row_border_color(self):
        return self.get('rowBorderColor')

    @row_border_color.setter
    @TableProperty.setter()
    def row_border_color(self, value):
        self['rowBorderColor'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FOOTER_FONT,
        value_validate_function=lambda value: assert_string(
            value, 'footer_font_family'
        ),
    )
    def footer_font_family(self):
        return self.get('footerFontFamily')

    @footer_font_family.setter
    @TableProperty.setter()
    def footer_font_family(self, value):
        self['footerFontFamily'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FOOTER_COLOR,
        value_validate_function=lambda value: assert_string(value, 'footer_color'),
    )
    def footer_color(self):
        return self.get('footerColor')

    @footer_color.setter
    @TableProperty.setter()
    def footer_color(self, value):
        self['footerColor'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FOOTER_SIZE,
        value_validate_function=lambda value: assert_string(value, 'footer_font_size'),
    )
    def footer_font_size(self):
        return self.get('footerFontSize')

    @footer_font_size.setter
    @TableProperty.setter()
    def footer_font_size(self, value):
        self['footerFontSize'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FOOTER_BACKGROUND,
        value_validate_function=lambda value: assert_string(value, 'footer_background'),
    )
    def footer_background(self):
        return self.get('footerBackground')

    @footer_background.setter
    @TableProperty.setter()
    def footer_background(self, value):
        self['footerBackground'] = value

    @property
    @TableProperty.getter(
        nullable=False,
        default_value=DEFAULT_TABLE_FOOTER_BORDER,
        value_validate_function=lambda value: assert_string(
            value, 'footer_border_color'
        ),
    )
    def footer_border_color(self):
        return self.get('footerBorderColor')

    @footer_border_color.setter
    @TableProperty.setter()
    def footer_border_color(self, value):
        self['footerBorderColor'] = value


class SunburstSettings(PythonModel):
    @classmethod
    def registry(cls):
        return SunburstProperty

    @property
    @SunburstProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'selected_field'),
    )
    def selected_field(self):
        return self.get('selectedField')

    @selected_field.setter
    @SunburstProperty.setter()
    def selected_field(self, value):
        self['selectedField'] = value


DEFAULT_TIME_SERIES_LOG_SCALING = False
DEFAULT_TIME_SERIES_RESULT_LIMIT = 5
DEFAULT_TIME_SERIES_SORT_ORDER = SortOrder.DESCENDING
DEFAULT_TIME_SERIES_USE_BUCKET_MEAN = False
DEFAULT_TIME_SERIES_USE_ETHIOPIAN_DATES = False
DEFAULT_TIME_SERIES_ROTATE_LABELS = True
DEFAULT_TIME_SERIES_SHOW_DATA_LABELS = False


class TimeSeriesBucket(Enum):
    NONE = 0
    WEEK = 1
    MONTH = 2
    QUARTER = 3
    HALF_YEAR = 4
    YEAR = 5
    DAY = 6


class TimeSeriesSettings(PythonModel):
    @classmethod
    def registry(cls):
        return TimeSeriesProperty

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_USE_BUCKET_MEAN,
        value_validate_function=lambda value: assert_boolean(value, 'bucket_mean'),
    )
    def bucket_mean(self):
        return self.get('bucketMean')

    @bucket_mean.setter
    @TimeSeriesProperty.setter()
    def bucket_mean(self, value):
        self['bucketMean'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=TimeSeriesBucket.MONTH,
        value_validate_function=lambda value: assert_enum(
            value, TimeSeriesBucket, 'TimeSeriesBucket', 'bucket_type'
        ),
        value_formatter_function=lambda value: value.name,
    )
    def bucket_type(self):
        return self.get('bucketType')

    @bucket_type.setter
    @TimeSeriesProperty.setter(value_parser_function=deserialize_bucket_type)
    def bucket_type(self, value):
        self['bucketType'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_LOG_SCALING,
        value_validate_function=lambda value: assert_boolean(value, 'log_scaling'),
    )
    def log_scaling(self):
        return self.get('logScaling')

    @log_scaling.setter
    @TimeSeriesProperty.setter()
    def log_scaling(self, value):
        self['logScaling'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_RESULT_LIMIT,
        value_validate_function=lambda value: assert_integer(value, 'result_limit'),
    )
    def result_limit(self):
        return self.get('resultLimit')

    @result_limit.setter
    @TimeSeriesProperty.setter()
    def result_limit(self, value):
        self['resultLimit'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_SORT_ORDER,
        value_validate_function=lambda value: assert_enum(
            value, SortOrder, 'SortOrder', 'sort_order'
        ),
        value_formatter_function=serialize_sort_order,
    )
    def sort_order(self):
        return self.get('sortOrder')

    @sort_order.setter
    @TimeSeriesProperty.setter(value_parser_function=deserialize_sort_order)
    def sort_order(self, value):
        self['sortOrder'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_SELECTED_FIELD,
        value_validate_function=lambda value: assert_string(value, 'sort_on'),
    )
    def sort_on(self):
        return self.get('sortOn')

    @sort_on.setter
    @TimeSeriesProperty.setter()
    def sort_on(self, value):
        self['sortOn'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_USE_ETHIOPIAN_DATES,
        value_validate_function=lambda value: assert_boolean(
            value, 'use_ethopian_dates'
        ),
    )
    def use_ethiopian_dates(self):
        return self.get('useEthiopianDates')

    @use_ethiopian_dates.setter
    @TimeSeriesProperty.setter()
    def use_ethiopian_dates(self, value):
        self['useEthiopianDates'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_SHOW_DATA_LABELS,
        value_validate_function=lambda value: assert_boolean(value, 'show_data_labels'),
    )
    def show_data_labels(self):
        return self.get('showDataLabels')

    @show_data_labels.setter
    @TimeSeriesProperty.setter()
    def show_data_labels(self, value):
        self['showDataLabels'] = value

    @property
    @TimeSeriesProperty.getter(
        nullable=False,
        default_value=DEFAULT_TIME_SERIES_ROTATE_LABELS,
        value_validate_function=lambda value: assert_boolean(value, 'rotate_labels'),
    )
    def rotate_labels(self):
        return self.get('rotateLabels')

    @rotate_labels.setter
    @TimeSeriesProperty.setter()
    def rotate_labels(self, value):
        self['rotateLabels'] = value


VIEW_SPECIFIC_TYPES = [
    AnimatedMapSettings,
    BarChartSettings,
    BoxPlotSettings,
    BubbleChartSettings,
    BumpChartSettings,
    ExpandoTreeSettings,
    HeatMapSettings,
    HeatTileSettings,
    MapSettings,
    SunburstSettings,
    TableSettings,
    TimeSeriesSettings,
]
