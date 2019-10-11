# pylint: disable=invalid-name
from enum import Enum
import related

# pylint: disable=unsubscriptable-object
DEFAULT_OVERLAY_LAYERS = ['Administrative']
DEFAULT_MAP_TOOLTIP_BACKGROUND = {'r': 255, 'g': 255, 'b': 255, 'a': 0.75}

# NOTE(stephen): None of these defaults match our *scss* defaults and variables.
# TODO(stephen, pablo, anyone): Maybe this should be standardized somewhere
# else in the schema.
FONT_FAMILY_DEFAULT = 'Arial'
FONT_COLOR_DEFAULT = 'black'
FONT_12 = '12px'
FONT_14 = '14px'
FONT_16 = '16px'
FONT_18 = '18px'


class BaseMapLayer(Enum):
    SATELLITE = 'Satellite'
    STREETS = 'Streets'
    LIGHT = 'Light'
    BLANK = 'Blank'


class BumpChartTheme(Enum):
    LIGHT = 'light'
    DARK = 'dark'


class TableFormat(Enum):
    TABLE = 'table'
    SCORECARD = 'scorecard'


class SortOrder(Enum):
    ASCENDING = 'ASC'
    DESCENDING = 'DESC'
    ALPHABETICAL = 'ALPH'


class TimeSeriesBucket(Enum):
    NONE = 'NONE'
    WEEK = 'WEEK'
    MONTH = 'MONTH'
    QUARTER = 'QUARTER'
    HALF_YEAR = 'HALF_YEAR'
    YEAR = 'YEAR'
    DAY = 'DAY'


class Coordinates(list):
    def __init__(self, values):
        if len(values) != 2:
            raise ValueError('Coordinates must be length 2: %s' % values)

        super(Coordinates, self).__init__(self)

        # TODO(stephen): Validate that lat/lon are real geo coordinates in the
        # correct range.
        latitude = float(values[0])
        longitude = float(values[1])
        self.extend((latitude, longitude))


@related.mutable(strict=True)
class AnimatedMapSettings:
    base_layer = related.ChildField(BaseMapLayer, BaseMapLayer.STREETS, key='baseLayer')
    current_display = related.StringField('dots', key='currentDisplay')
    map_center = related.ChildField(Coordinates, [0.0, 0.0], key='mapCenter')
    overlay_layers = related.SequenceField(
        str, DEFAULT_OVERLAY_LAYERS, key='overlayLayers'
    )
    selected_field = related.StringField('', key='selectedField')
    selected_geo_tiles = related.StringField('', key='selectedGeoTiles')
    zoom_level = related.FloatField(1.0, key='zoomLevel')


@related.mutable(strict=True)
class BarChartSettings:
    # NOTE(stephen): This is a mapping from field ID to True. That is difficult
    # to represent with `related` and we'd prefer having a set on both the
    # frontend and the backend. Fix this.
    disabled_fields = related.ChildField(dict, {}, key='disabledFields')
    result_limit = related.IntegerField(50, key='resultLimit')
    sort_order = related.ChildField(SortOrder, SortOrder.DESCENDING, key='sortOrder')
    sort_on = related.StringField('', key='sortOn')
    stack_bars = related.BooleanField(False, key='stackBars')
    y2_line_graph = related.BooleanField(False, key='y2LineGraph')
    x_tick_format = related.StringField('YYYY-MM-DD', key='xTickFormat')
    remove_bar_spacing = related.BooleanField(False, key='removeBarSpacing')
    rotate_x_axis_labels = related.BooleanField(True, key='rotateXAxisLabels')
    rotate_data_value_labels = related.BooleanField(True, key='rotateDataValueLabels')
    hide_grid_lines = related.BooleanField(False, key='hideGridLines')
    hide_data_value_zeros = related.BooleanField(False, key='hideDataValueZeros')
    no_data_to_zero = related.BooleanField(False, key='noDataToZero')


@related.mutable(strict=True)
class BoxPlotSettings:
    group_by = related.StringField('', key='groupBy')


@related.mutable(strict=True)
class BubbleChartSettings:
    linear_fit = related.BooleanField(False, key='linearFit')
    result_limit = related.IntegerField(100, key='resultLimit')
    show_legend = related.BooleanField(False, key='showLegend')
    x_axis = related.StringField('', key='xAxis')
    y_axis = related.StringField('', key='yAxis')
    z_axis = related.StringField('', key='zAxis')


@related.mutable(strict=True)
class BumpChartSettings:
    result_limit = related.IntegerField(25, key='resultLimit')
    selected_field = related.StringField('', key='selectedField')

    # NOTE(stephen): This is a mapping from field ID to True. That is difficult
    # to represent with `related` and we'd prefer having a set on both the
    # frontend and the backend. Fix this.
    selected_keys = related.ChildField(dict, {}, key='selectedKeys')
    sort_order = related.ChildField(SortOrder, SortOrder.DESCENDING, key='sortOrder')
    theme = related.ChildField(BumpChartTheme, BumpChartTheme.DARK)
    use_ethiopian_dates = related.BooleanField(False, key='useEthiopianDates')


@related.mutable(strict=True)
class ExpandoTreeSettings:
    selected_field = related.StringField('', key='selectedField')


@related.mutable(strict=True)
class HeatMapSettings:
    selected_field = related.StringField('', key='selectedField')
    base_layer = related.ChildField(BaseMapLayer, BaseMapLayer.STREETS, key='baseLayer')


@related.mutable(strict=True)
class HeatTileSettings:
    divergent_coloration = related.BooleanField(True, key='divergentColoration')
    first_y_axis_selections = related.SequenceField(str, [], key='firstYaxisSelections')
    invert_coloration = related.BooleanField(False, key='invertColoration')
    log_scaling = related.BooleanField(True, key='logScaling')
    result_limit = related.IntegerField(100, key='resultLimit')
    selected_field = related.StringField('', key='selectedField')
    show_time_on_y_axis = related.BooleanField(True, key='showTimeOnYAxis')
    sort_order = related.ChildField(SortOrder, SortOrder.DESCENDING, key='sortOrder')
    sort_on = related.StringField('', key='sortOn')
    use_ethiopian_dates = related.BooleanField(False, key='useEthiopianDates')


@related.mutable(strict=True)
class MapSettings:
    base_layer = related.ChildField(BaseMapLayer, BaseMapLayer.STREETS, key='baseLayer')
    current_display = related.StringField('dots', key='currentDisplay')
    map_center = related.ChildField(Coordinates, [0.0, 0.0], key='mapCenter')
    overlay_layers = related.SequenceField(
        str, DEFAULT_OVERLAY_LAYERS, key='overlayLayers'
    )
    selected_field = related.StringField('', key='selectedField')
    selected_geo_tiles = related.StringField('', key='selectedGeoTiles')
    zoom_level = related.FloatField(1.0, key='zoomLevel')
    show_administrative_boundaries = related.BooleanField(
        True, key='showAdminBoundaries'
    )
    show_labels = related.BooleanField(False, key='showLabels')
    fill_opacity = related.FloatField(0.8, key='fillOpacity')
    tooltip_font_color = related.StringField(FONT_COLOR_DEFAULT, key='tooltipFontColor')
    tooltip_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='tooltipFontFamily'
    )
    tooltip_font_size = related.StringField(FONT_12, key='tooltipFontSize')
    tooltip_bold = related.BooleanField(False, key='tooltipBold')

    # HACK(stephen, moriah): This setting is really poorly designed. It encodes
    # a color value + alpha as a dict instead of rgba or hex + alpha which can
    # be represented as a string. FIX THIS OR REMOVE IT.
    tooltip_background_color = related.ChildField(
        dict, DEFAULT_MAP_TOOLTIP_BACKGROUND, key='tooltipBackgroundColor'
    )


@related.mutable(strict=True)
class TableSettings:
    inverted_fields = related.SequenceField(str, [], key='invertedFields')
    table_format = related.ChildField(TableFormat, TableFormat.TABLE, key='tableFormat')
    enable_pagination = related.BooleanField(True, key='enablePagination')
    row_height = related.FloatField(30, key='rowHeight')
    add_total_row = related.BooleanField(False, key='addTotalRow')
    header_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='headerFontFamily'
    )
    header_color = related.StringField(FONT_COLOR_DEFAULT, key='headerColor')
    header_font_size = related.StringField(FONT_12, key='headerFontSize')
    header_background = related.StringField('#fff', key='headerBackground')
    header_border_color = related.StringField('#d9d9d9', key='headerBorderColor')
    row_font_family = related.StringField(FONT_FAMILY_DEFAULT, key='rowFontFamily')
    row_color = related.StringField(FONT_COLOR_DEFAULT, key='rowColor')
    row_font_size = related.StringField(FONT_12, key='rowFontSize')
    row_background = related.StringField('#fff', key='rowBackground')
    row_alternate_background = related.StringField(
        '#f0f0f0', key='rowAlternateBackground'
    )
    row_border_color = related.StringField('#d9d9d9', key='rowBorderColor')
    footer_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='footerFontFamily'
    )
    footer_color = related.StringField(FONT_COLOR_DEFAULT, key='footerColor')
    footer_font_size = related.StringField(FONT_12, key='footerFontSize')
    footer_background = related.StringField('#fff', key='footerBackground')
    footer_border_color = related.StringField('#fff', key='footerBorderColor')


@related.mutable(strict=True)
class SunburstSettings:
    selected_field = related.StringField('', key='selectedField')


@related.mutable(strict=True)
class TimeSeriesSettings:
    bucket_mean = related.BooleanField(False, key='bucketMean')
    bucket_type = related.ChildField(
        TimeSeriesBucket, TimeSeriesBucket.MONTH, key='bucketType'
    )
    log_scaling = related.BooleanField(False, key='logScaling')
    result_limit = related.IntegerField(5, key='resultLimit')
    sort_order = related.ChildField(SortOrder, SortOrder.DESCENDING, key='sortOrder')
    sort_on = related.StringField('', key='sortOn')
    use_ethiopian_dates = related.BooleanField(False, key='useEthiopianDates')
    show_data_labels = related.BooleanField(False, key='showDataLabels')
    rotate_labels = related.BooleanField(True, key='rotateLabels')
