from builtins import range
from past.builtins import basestring
import random
import re
from enum import Enum
from copy import deepcopy

from stringcase import camelcase, snakecase

from models.python import PythonModel, PropertyRegistry
from models.python.dashboard.schema_20181030.visualization_settings.visualization_specific_model import (
    AnimatedMapSettings,
    BarChartSettings,
    BoxPlotSettings,
    BubbleChartSettings,
    BumpChartSettings,
    ExpandoTreeSettings,
    HeatMapSettings,
    HeatTileSettings,
    MapSettings,
    ScoreCardSettings,
    SunburstSettings,
    TableSettings,
    TimeSeriesSettings,
    VIEW_SPECIFIC_TYPES,
)
from web.server.util.util import (
    assert_boolean,
    assert_enum,
    assert_float,
    assert_mapping,
    assert_one_of,
    assert_non_string_iterable,
    assert_string,
    assert_type,
    string_type_validator,
    try_parse_enum,
    key_value_element_validator,
)

# pylint:disable=C0103
SettingsGroupProperty = PropertyRegistry()
TitleProperty = PropertyRegistry()
AxisProperty = PropertyRegistry()
XAxisProperty = PropertyRegistry()
YAxisProperty = PropertyRegistry()
SeriesProperty = PropertyRegistry()
SeriesObjectProperty = PropertyRegistry()
LegendProperty = PropertyRegistry()

COLOR_PATTERN = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
HEX_COLOR_CHARACTERS = '0123456789ABCDEF'
VIEW_SPECIFIC_TYPES_OR_DICT = list(VIEW_SPECIFIC_TYPES) + [dict]


def generate_random_colour():
    colour = "#" + ''.join([random.choice(HEX_COLOR_CHARACTERS) for index in range(6)])
    return colour


def assert_font_size(value, argument_name=None):
    assert_string(value, argument_name)
    integer_substring = value[:-2]
    try:
        int(integer_substring)
    except ValueError as e:
        message = (
            'Font size value must convertible to an integer. '
            'Could not convert \'{value}\' to an integer.'
        ).format(value=integer_substring)
        raise ValueError(message)


def series_settings_validator(key, value, argument_name=None):
    key_value_element_validator(
        key, value, argument_name, basestring, 'string', SeriesSettingsObject
    )


def assert_series_objects(value, argument_name=None):
    assert_mapping(value, argument_name, series_settings_validator)


def deserialize_legend_placement(value, argument_name=None):
    return try_parse_enum(
        value, LegendPlacement, argument_name, lambda value: snakecase(value).upper()
    )


DEFAULT_SUBTITLE_FONT_SIZE = '18px'
DEFAULT_TITLE_FONT_SIZE = '16px'


class VisualizationType(Enum):
    ANIMATED_MAP = 0
    BOX = 1
    BUBBLE_CHART = 2
    BUMP_CHART = 3
    CHART = 4
    EXPANDOTREE = 5
    HEATMAP = 6
    HEATTILES = 7
    MAP = 8
    TABLE = 9
    SCORECARD = 10
    SUNBURST = 11
    TIME = 12


VISUALIZATION_TYPE_VALUES = set([enum.name for enum in VisualizationType])
VISUALIZATION_TYPE_TO_SETTING = {
    VisualizationType.ANIMATED_MAP: AnimatedMapSettings,
    VisualizationType.BOX: BoxPlotSettings,
    VisualizationType.BUBBLE_CHART: BubbleChartSettings,
    VisualizationType.BUMP_CHART: BumpChartSettings,
    VisualizationType.CHART: BarChartSettings,
    VisualizationType.EXPANDOTREE: ExpandoTreeSettings,
    VisualizationType.HEATMAP: HeatMapSettings,
    VisualizationType.HEATTILES: HeatTileSettings,
    VisualizationType.MAP: MapSettings,
    VisualizationType.TABLE: TableSettings,
    VisualizationType.SCORECARD: ScoreCardSettings,
    VisualizationType.SUNBURST: SunburstSettings,
    VisualizationType.TIME: TimeSeriesSettings,
}


class SettingsGroup(PythonModel):
    AXES_SETTINGS_TYPES = set(
        [
            VisualizationType.CHART,
            VisualizationType.TIME,
            VisualizationType.HEATTILES,
            VisualizationType.BUBBLE_CHART,
        ]
    )

    LEGEND_SETTINGS_TYPES = set(
        [
            VisualizationType.ANIMATED_MAP,
            VisualizationType.CHART,
            VisualizationType.MAP,
            VisualizationType.TIME,
        ]
    )

    def __init__(self, visualization_type, values=None, allow_extra_properties=True):
        self.visualization_type = visualization_type
        super(SettingsGroup, self).__init__(values, allow_extra_properties)

    @classmethod
    def registry(cls):
        return SettingsGroupProperty

    @property
    @SettingsGroupProperty.getter(
        value_validate_function=lambda value: assert_type(
            value, LegendSettings, 'LegendSettings', 'legend_settings'
        ),
        default_value=lambda: LegendSettings(),
    )
    def legend_settings(self):
        return self.get('legendSettings')

    @legend_settings.setter
    @SettingsGroupProperty.setter(
        value_parser_function=lambda value: LegendSettings(value)
    )
    def legend_settings(self, value):
        self['legendSettings'] = value

    @property
    @SettingsGroupProperty.getter(
        value_validate_function=lambda value: assert_type(
            value, AxesSettings, 'AxesSettings', 'axes_settings'
        ),
        default_value=lambda: AxesSettings(),
    )
    def axes_settings(self):
        return self.get('axesSettings')

    @axes_settings.setter
    @SettingsGroupProperty.setter(
        value_parser_function=lambda value: AxesSettings(value)
    )
    def axes_settings(self, value):
        self['axesSettings'] = value

    @property
    @SettingsGroupProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_type(
            value, SeriesSettings, 'SeriesSettings', 'series_settings'
        ),
        default_value=lambda: SeriesSettings(),
    )
    def series_settings(self):
        return self.get('seriesSettings')

    @series_settings.setter
    @SettingsGroupProperty.setter(
        value_parser_function=lambda value: SeriesSettings(value)
    )
    def series_settings(self, value):
        self['seriesSettings'] = value

    @property
    @SettingsGroupProperty.getter(
        value_validate_function=lambda value: assert_one_of(
            value, VIEW_SPECIFIC_TYPES, 'view_specific_settings'
        )
    )
    def view_specific_settings(self):
        if 'viewSpecificSettings' not in self:
            self['viewSpecificSettings'] = VISUALIZATION_TYPE_TO_SETTING[
                self.visualization_type
            ]()

        return self.get('viewSpecificSettings')

    @view_specific_settings.setter
    @SettingsGroupProperty.setter(
        value_validate_function=lambda value: assert_one_of(
            value, VIEW_SPECIFIC_TYPES_OR_DICT, 'view_specific_settings'
        )
    )
    def view_specific_settings(self, value):
        value = VISUALIZATION_TYPE_TO_SETTING[self.visualization_type](value)
        self['viewSpecificSettings'] = value

    def after_serialize(self, serialized_value):
        if self.visualization_type not in SettingsGroup.AXES_SETTINGS_TYPES:
            serialized_value.pop('axesSettings')

        if self.visualization_type not in SettingsGroup.LEGEND_SETTINGS_TYPES:
            serialized_value.pop('legendSettings')

        return serialized_value


# Settings that are shared between EVERY visualization
class TitleSettings(PythonModel):
    @classmethod
    def registry(cls):
        return TitleProperty

    @property
    @TitleProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'subtitle'),
    )
    def subtitle(self):
        return self.get('subtitle')

    @subtitle.setter
    @TitleProperty.setter()
    def subtitle(self, value):
        self['subtitle'] = value

    @property
    @TitleProperty.getter(
        nullable=False,
        default_value=DEFAULT_SUBTITLE_FONT_SIZE,
        value_validate_function=lambda value: assert_font_size(
            value, 'subtitle_font_size'
        ),
    )
    def subtitle_font_size(self):
        return self.get('subtitleFontSize')

    @subtitle_font_size.setter
    @TitleProperty.setter()
    def subtitle_font_size(self, value):
        self['subtitleFontSize'] = value

    @property
    @TitleProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'title'),
    )
    def title(self):
        return self.get('title')

    @title.setter
    @TitleProperty.setter()
    def title(self, value):
        self['title'] = value

    @property
    @TitleProperty.getter(
        nullable=False,
        default_value=DEFAULT_SUBTITLE_FONT_SIZE,
        value_validate_function=lambda value: assert_font_size(
            value, 'title_font_size'
        ),
    )
    def title_font_size(self):
        return self.get('titleFontSize')

    @title_font_size.setter
    @TitleProperty.setter()
    def title_font_size(self, value):
        self['titleFontSize'] = value


# General Settings that apply to each visualization but whose values are unique
# to that specific visualization
class AxesSettings(PythonModel):
    @classmethod
    def registry(cls):
        return AxisProperty

    @property
    @AxisProperty.getter(
        'xAxis',
        value_validate_function=lambda value: assert_type(
            value, desired_type=XAxisSettings, argument_name='x_axis_settings'
        ),
        default_value=lambda: XAxisSettings(),
        nullable=False,
    )
    def x_axis_settings(self):
        return self.get('xAxis')

    @x_axis_settings.setter
    @AxisProperty.setter(value_parser_function=lambda value: XAxisSettings(value))
    def x_axis_settings(self, value):
        self['xAxis'] = value

    @property
    @AxisProperty.getter(
        'y1Axis',
        value_validate_function=lambda value: assert_type(
            value, desired_type=YAxisSettings, argument_name='y1_axis_settings'
        ),
        default_value=lambda: YAxisSettings(),
        nullable=False,
    )
    def y1_axis_settings(self):
        return self.get('y1Axis')

    @y1_axis_settings.setter
    @AxisProperty.setter(value_parser_function=lambda value: YAxisSettings(value))
    def y1_axis_settings(self, value):
        self['y1Axis'] = value

    @property
    @AxisProperty.getter(
        'y2Axis',
        value_validate_function=lambda value: assert_type(
            value, desired_type=YAxisSettings, argument_name='y2_axis_settings'
        ),
        default_value=lambda: YAxisSettings(),
        nullable=False,
    )
    def y2_axis_settings(self):
        return self.get('y2Axis')

    @y2_axis_settings.setter
    @AxisProperty.setter(value_parser_function=lambda value: YAxisSettings(value))
    def y2_axis_settings(self, value):
        self['y2Axis'] = value


DEFAULT_XAXIS_LABEL_FONT_SIZE = '12px'
DEFAULT_XAXIS_TITLE_FONT_SIZE = '12px'
DEFAULT_XAXIS_GOAL_LINE = ''
DEFAULT_XAXIS_GOAL_LINE_LABEL = ''
DEFAULT_XAXIS_GOAL_LINE_FONT_SIZE = '14px'


class XAxisSettings(PythonModel):
    '''Settings for the X-Axis for a given visualization.
    '''

    @classmethod
    def registry(cls):
        return XAxisProperty

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value=DEFAULT_XAXIS_GOAL_LINE,
        value_validate_function=lambda value: assert_string(value, 'goal_line'),
    )
    def goal_line(self):
        return self.get('goalLine')

    @goal_line.setter
    @XAxisProperty.setter()
    def goal_line(self, value):
        self['goalLine'] = value

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value=DEFAULT_XAXIS_GOAL_LINE_FONT_SIZE,
        value_validate_function=lambda value: assert_string(
            value, 'goal_line_font_size'
        ),
    )
    def goal_line_font_size(self):
        return self.get('goalLineFontSize')

    @goal_line_font_size.setter
    @XAxisProperty.setter()
    def goal_line_font_size(self, value):
        self['goalLineFontSize'] = value

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value=DEFAULT_XAXIS_GOAL_LINE_LABEL,
        value_validate_function=lambda value: assert_string(value, 'goal_line_label'),
    )
    def goal_line_label(self):
        return self.get('goalLineLabel')

    @goal_line_label.setter
    @XAxisProperty.setter()
    def goal_line_label(self, value):
        self['goalLineLabel'] = value

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value=DEFAULT_XAXIS_LABEL_FONT_SIZE,
        value_validate_function=lambda value: assert_string(value, 'labels_font_size'),
    )
    def labels_font_size(self):
        return self.get('labelsFontSize')

    @labels_font_size.setter
    @XAxisProperty.setter()
    def labels_font_size(self, value):
        self['labelsFontSize'] = value

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'title'),
    )
    def title(self):
        return self.get('title')

    @title.setter
    @XAxisProperty.setter()
    def title(self, value):
        self['title'] = value

    @property
    @XAxisProperty.getter(
        nullable=False,
        default_value=DEFAULT_XAXIS_TITLE_FONT_SIZE,
        value_validate_function=lambda value: assert_string(value, 'title_font_size'),
    )
    def title_font_size(self):
        return self.get('titleFontSize')

    @title_font_size.setter
    @XAxisProperty.setter()
    def title_font_size(self, value):
        assert_string(value, 'title_font_size')
        self['titleFontSize'] = value


YAxisProperty = deepcopy(XAxisProperty)


class YAxisSettings(XAxisSettings):
    '''A model that represents settings for the series components of a visualization.
    '''

    @classmethod
    def registry(cls):
        return YAxisProperty

    @property
    @YAxisProperty.getter(
        value_validate_function=lambda value: assert_float(value, 'range_from')
    )
    def range_from(self):
        return self.get('rangeFrom')

    @range_from.setter
    @YAxisProperty.setter(value_parser_function=float)
    def range_from(self, value):
        self['rangeFrom'] = value

    @property
    @YAxisProperty.getter(
        value_validate_function=lambda value: assert_float(value, 'range_to')
    )
    def range_to(self):
        return self.get('rangeTo')

    @range_to.setter
    @YAxisProperty.setter(value_parser_function=float)
    def range_to(self, value):
        self['rangeTo'] = value


class LegendPlacement(Enum):
    TOP = 0
    TOP_RIGHT = 1
    LEFT = 2
    RIGHT = 3
    BOTTOM = 4


DEFAULT_LEGEND_FONT_SIZE = '16px'
DEFAULT_LEGEND_PLACEMENT = LegendPlacement.BOTTOM
DEFAULT_LEGEND_OVERLAP_WITH_CHART = False
DEFAULT_SHOW_LEGEND = True


class LegendSettings(PythonModel):
    '''A model that represents settings for the legend of a visualization.
    '''

    @classmethod
    def registry(cls):
        return LegendProperty

    @property
    @LegendProperty.getter(
        nullable=False,
        default_value=DEFAULT_LEGEND_FONT_SIZE,
        value_validate_function=lambda value: assert_font_size(
            value, 'legend_font_size'
        ),
    )
    def legend_font_size(self):
        return self.get('legendFontSize')

    @legend_font_size.setter
    @LegendProperty.setter()
    def legend_font_size(self, value):
        self['legendFontSize'] = value

    @property
    @LegendProperty.getter(
        nullable=False,
        default_value=DEFAULT_LEGEND_PLACEMENT,
        value_validate_function=lambda value: assert_enum(
            value, LegendPlacement, 'LegendPlacement', 'legend_placement'
        ),
        value_formatter_function=lambda value: camelcase(value.name.lower()),
    )
    def legend_placement(self):
        return self.get('legendPlacement')

    @legend_placement.setter
    @LegendProperty.setter(value_parser_function=deserialize_legend_placement)
    def legend_placement(self, value):
        self['legendPlacement'] = value

    @property
    @LegendProperty.getter(
        nullable=False,
        default_value=DEFAULT_LEGEND_OVERLAP_WITH_CHART,
        value_validate_function=lambda value: assert_boolean(
            value, 'overlap_legend_with_chart'
        ),
    )
    def overlap_legend_with_chart(self):
        return self.get('overlapLegendWithChart')

    @overlap_legend_with_chart.setter
    @LegendProperty.setter()
    def overlap_legend_with_chart(self, value):
        self['overlapLegendWithChart'] = value

    @property
    @LegendProperty.getter(
        nullable=False,
        default_value=DEFAULT_SHOW_LEGEND,
        value_validate_function=lambda value: assert_boolean(value, 'show_legend'),
    )
    def show_legend(self):
        return self.get('showLegend')

    @show_legend.setter
    @LegendProperty.setter()
    def show_legend(self, value):
        self['showLegend'] = value


DEFAULT_SERIES_OBJECTS = {}
DEFAULT_SERIES_ORDER = []


class SeriesSettings(PythonModel):
    '''A model that represents settings for the series components of a visualization.
    '''

    @classmethod
    def registry(cls):
        return SeriesProperty

    @property
    @SeriesProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_series_objects(
            value, 'seriesObjects'
        ),
        setter_function_name='_series_objects',
    )
    def series_objects(self):
        return self.get('seriesObjects')

    @series_objects.setter
    @SeriesProperty.setter(
        value_parser_function=lambda series_objects: {
            _id: SeriesSettingsObject(settings_object)
            for (_id, settings_object) in series_objects.items()
        }
    )
    def _series_objects(self, value):
        self['seriesObjects'] = value

    @property
    @SeriesProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'series_order', string_type_validator
        ),
        setter_function_name='_series_order',
    )
    def series_order(self):
        return self.get('seriesOrder')

    @series_order.setter
    @SeriesProperty.setter()
    def _series_order(self, value):
        self['seriesOrder'] = value

    def before_serialize(self):
        order_values = set(self.series_order)
        object_keys = set(self.series_objects.keys())
        difference = object_keys.difference(order_values)
        if difference:
            message = (
                '\'series_objects\' and \'series_order\' are expected to '
                'have the same keys/elements. \'series_objects\' '
                'had \'{object_keys}\'. \'series_order\' had values '
                '\'{order_values}\'. Difference was \'{difference}\''
            ).format(
                order_values=order_values,
                object_keys=object_keys,
                difference=difference,
            )
            raise ValueError(message)

    def add_or_update_series(self, series_object):
        assert_type(series_object, SeriesSettingsObject)
        _id = series_object.id
        if _id not in self.series_order:
            updated_value = self.series_order
            updated_value.append(_id)
            self._series_order = updated_value

        updated_objects = self.series_objects
        updated_objects[_id] = series_object
        self._series_objects = updated_objects

    def delete_series(self, series_id):
        assert_string(series_id)
        if series_id in self.series_order:
            updated_value = self.series_order
            updated_value.pop(series_id)
            self._series_order = updated_value

        if series_id in self.series_objects:
            updated_objects = self.series_objects
            updated_objects.pop(series_id)
            self._series_objects = updated_objects

    def set_series_order(self, new_order):
        old_order_set = set(self.series_order)
        new_order_set = set(new_order)
        difference = old_order_set.difference(new_order_set)
        if difference:
            message = (
                'The new value for \'series_order\' and is expected to '
                'have the same elements as the previous value. Only the ordering '
                'may differ. The new version had \'{new_order}\'. The old version '
                'had \'{old_order}\'. The difference was \'{difference}\''
            ).format(
                new_order=new_order, old_order=self.series_order, difference=difference
            )
            raise ValueError(message)


class SeriesObjectAxis(Enum):
    Y1_AXIS = 0
    Y2_AXIS = 1


DEFAULT_SERIES_DATA_LABEL_FONT_SIZE = '12px'
DEFAULT_SERIES_DATA_IS_VISIBLE = True
DEFAULT_SERIES_DATA_LABEL_FORMAT = '0%'
DEFAULT_SERIES_DATA_LABEL = 'Other'
DEFAULT_SERIES_SHOW_CONSTITUENTS = False
DEFAULT_SERIES_SHOW_SERIES_VALUE = False


class SeriesSettingsObject(PythonModel):
    def __init__(self, values=None):
        values = values or {}
        if not values.get('color'):
            # We want the generated colour to be stable as opposed to something
            # that changes for each property invocation
            values['color'] = generate_random_colour()
        super(SeriesSettingsObject, self).__init__(values)

    @classmethod
    def registry(cls):
        return SeriesObjectProperty

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(
            value, 'color', COLOR_PATTERN
        ),
    )
    def color(self):
        # TODO(vedant) - Replace all the misspelled references to 'color' with
        # the proper spelling of 'colour'. (TONGUE IN CHEEK, DON'T TAKE
        # LITERALLY)
        return self.get('color')

    @color.setter
    @SeriesObjectProperty.setter()
    def color(self, value):
        self['color'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_DATA_LABEL_FONT_SIZE,
        value_validate_function=lambda value: assert_font_size(
            value, 'data_label_font_size'
        ),
    )
    def data_label_font_size(self):
        return self.get('dataLabelFontSize')

    @data_label_font_size.setter
    @SeriesObjectProperty.setter()
    def data_label_font_size(self, value):
        self['dataLabelFontSize'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_DATA_LABEL_FORMAT,
        value_validate_function=lambda value: assert_string(value, 'data_label_format'),
    )
    def data_label_format(self):
        return self.get('dataLabelFormat')

    @data_label_format.setter
    @SeriesObjectProperty.setter()
    def data_label_format(self, value):
        self['dataLabelFormat'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @SeriesObjectProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_DATA_IS_VISIBLE,
        value_validate_function=lambda value: assert_boolean(value, 'is_visible'),
    )
    def is_visible(self):
        return self.get('isVisible')

    @is_visible.setter
    @SeriesObjectProperty.setter()
    def is_visible(self, value):
        self['isVisible'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_DATA_LABEL,
        value_validate_function=lambda value: assert_string(value, 'label'),
    )
    def label(self):
        return self.get('label')

    @label.setter
    @SeriesObjectProperty.setter()
    def label(self, value):
        self['label'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_SHOW_CONSTITUENTS,
        value_validate_function=lambda value: assert_boolean(
            value, 'show_constituents'
        ),
    )
    def show_constituents(self):
        return self.get('showConstituents')

    @show_constituents.setter
    @SeriesObjectProperty.setter()
    def show_constituents(self, value):
        self['showConstituents'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=DEFAULT_SERIES_SHOW_SERIES_VALUE,
        value_validate_function=lambda value: assert_boolean(
            value, 'show_series_value'
        ),
    )
    def show_series_value(self):
        return self.get('showSeriesValue')

    @show_series_value.setter
    @SeriesObjectProperty.setter()
    def show_series_value(self, value):
        self['showSeriesValue'] = value

    @property
    @SeriesObjectProperty.getter(
        nullable=False,
        default_value=SeriesObjectAxis.Y1_AXIS,
        value_validate_function=lambda value: assert_enum(
            value, SeriesObjectAxis, 'SeriesObjectAxis', 'series_axis'
        ),
        value_formatter_function=lambda value: camelcase(value.name.lower()),
    )
    def series_axis(self):
        return self.get('yAxis')

    @series_axis.setter
    @SeriesObjectProperty.setter(
        value_parser_function=lambda value: SeriesObjectAxis[snakecase(value).upper()]
    )
    def series_axis(self, value):
        self['yAxis'] = value
