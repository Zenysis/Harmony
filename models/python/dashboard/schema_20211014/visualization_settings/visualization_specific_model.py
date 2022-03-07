# pylint: disable=invalid-name
from enum import Enum
import related

from .table_theme import TableTheme

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
    DARK = 'Dark'


class BarDirection(Enum):
    HORIZONTAL = 'horizontal'
    VERTICAL = 'vertical'


class BarTreatment(Enum):
    OVERLAID = 'overlaid'
    OVERLAPPING = 'overlapping'
    SEQUENTIAL = 'sequential'
    STACKED = 'stacked'


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


class TableThemeId(Enum):
    CUSTOM = 'Custom'
    DEFAULT = 'Default'
    LEAF = 'Leaf'
    LINED = 'Lined'
    KP_TRACKER = 'KP Tracker'
    MINIMAL = 'Minimal'
    NIGHT = 'Night'
    OCEAN = 'Ocean'


class Coordinates(list):
    def __init__(self, values):
        if len(values) != 2:
            raise ValueError('Coordinates must be length 2: %s' % values)

        super().__init__(self)

        # TODO(stephen): Validate that lat/lon are real geo coordinates in the
        # correct range.
        latitude = float(values[0])
        longitude = float(values[1])
        self.extend((latitude, longitude))


@related.mutable(strict=True)
class BarGraphSettings:
    @related.mutable(strict=True)
    class GoalLine:
        id = related.StringField()
        axis = related.StringField('y1Axis')
        font_size = related.IntegerField(12, key='fontSize')
        font_color = related.StringField('black', key='fontColor')
        label = related.StringField('')
        line_style = related.StringField('dashed', key='lineStyle')
        line_thickness = related.IntegerField(2, key='lineThickness')
        value = related.FloatField(0)

    always_show_focus_window = related.BooleanField(False, key='alwaysShowFocusWindow')
    apply_minimum_bar_height = related.BooleanField(True, key='applyMinimumBarHeight')
    bar_direction = related.ChildField(
        BarDirection, BarDirection.VERTICAL, key='barDirection'
    )
    bar_treatment = related.ChildField(
        BarTreatment, BarTreatment.SEQUENTIAL, key='barTreatment'
    )
    goal_lines = related.SequenceField(GoalLine, [], key='goalLines')
    result_limit = related.IntegerField(50, key='resultLimit')
    rotate_inner_group_labels = related.BooleanField(True, key='rotateInnerGroupLabels')
    sort_order = related.ChildField(SortOrder, SortOrder.DESCENDING, key='sortOrder')
    sort_on = related.StringField('', key='sortOn')
    value_text_angle = related.StringField('auto', key='valueTextAngle')


@related.mutable(strict=True)
class BoxPlotSettings:
    result_limit = related.IntegerField(15, key='resultLimit')
    selected_dimension = related.StringField(required=False, key='selectedDimension')
    selectedField = related.StringField('', key='selectedField')
    show_distribution = related.BooleanField(True, key='showDistribution')
    show_outliers = related.BooleanField(True, key='showOutliers')
    theme = related.StringField('light')


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
class EpiCurveSettings:
    always_show_focus_window = related.BooleanField(False, key='alwaysShowFocusWindow')
    bar_treatment = related.ChildField(
        BarTreatment, BarTreatment.STACKED, key='barTreatment'
    )
    breakdown = related.StringField('field')
    display_borders = related.BooleanField(True, key='displayBorders')
    goal_lines = related.SequenceField(BarGraphSettings.GoalLine, [], key='goalLines')
    hide_zero_value_labels = related.BooleanField(False, key='hideZeroValueLabels')

    # NOTE(stephen): Defaulting to the Tableau 10 color scheme.
    palette = related.SequenceField(
        str,
        [
            '#4e79a7',
            '#f28e2c',
            '#e15759',
            '#76b7b2',
            '#59a14f',
            '#edc949',
            '#af7aa1',
            '#ff9da7',
            '#9c755f',
            '#bab0ab',
        ],
    )
    result_limit = related.IntegerField(50, key='resultLimit')
    rotate_data_value_labels = related.BooleanField(True, key='rotateDataValueLabels')
    rotate_x_axis_labels = related.BooleanField(True, key='rotateXAxisLabels')
    selected_field = related.StringField('', key='selectedField')
    # TODO(sophie, stephen): Remove this property once GroupBySettings are exposed to
    # the user in the settings modal.
    x_tick_format = related.StringField('Default', key='xTickFormat')


@related.mutable(strict=True)
class ExpandoTreeSettings:
    selected_field = related.StringField('', key='selectedField')


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
    @related.mutable(strict=True)
    class MapLabelProperties:
        id = related.StringField()
        color = related.StringField()
        label = related.StringField()

    @related.mutable(strict=True)
    class PlaybackSettings:
        playback_speed = related.StringField('normal', key='playbackSpeed')
        reverse_playback = related.BooleanField(False, key='reversePlayback')
        start_most_recent_date = related.BooleanField(
            False, key='startFromMostRecentDate'
        )

    admin_boundaries_color = related.StringField('#313234', key='adminBoundariesColor')
    admin_boundaries_width = related.StringField('normal', key='adminBoundariesWidth')
    base_layer = related.ChildField(BaseMapLayer, BaseMapLayer.STREETS, key='baseLayer')
    current_display = related.StringField('dots', key='currentDisplay')
    entity_layer_properties = related.ChildField(dict, {}, key='entityLayerProperties')
    fill_opacity = related.FloatField(0.8, key='fillOpacity')
    map_center = related.ChildField(Coordinates, [0.0, 0.0], key='mapCenter')
    playback_settings = related.ChildField(PlaybackSettings, {}, key='playbackSettings')
    overlay_layers = related.SequenceField(
        str, DEFAULT_OVERLAY_LAYERS, key='overlayLayers'
    )
    selected_field = related.StringField('', key='selectedField')
    selected_geo_tiles = related.StringField('', key='selectedGeoTiles')
    selected_labels_to_display = related.MappingField(
        MapLabelProperties, 'id', {}, key='selectedLabelsToDisplay'
    )
    shape_outline_width = related.StringField('normal', key='shapeOutlineWidth')
    show_administrative_boundaries = related.BooleanField(
        True, key='showAdminBoundaries'
    )
    show_labels = related.BooleanField(False, key='showLabels')
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
    visible_marker_layers = related.SequenceField(str, [], key='visibleMarkerLayers')
    zoom_level = related.FloatField(1.0, key='zoomLevel')


@related.mutable(strict=True)
class NumberTrendSettings:
    display_value_as_pill = related.BooleanField(False, key='displayValueAsPill')
    secondary_selected_field = related.StringField(
        required=False, key='secondarySelectedField'
    )
    selected_field = related.StringField('', key='selectedField')
    show_last_value = related.BooleanField(False, key='showLastValue')


@related.mutable(strict=True)
class PieChartSettings:
    breakdown = related.StringField('field')
    display_label_type = related.StringField('percent', key='displayLabelType')
    drilldown_selection = related.ChildField(
        dict, required=False, key='drilldownSelection'
    )
    # NOTE(stephen): Defaulting to the Tableau 10 color scheme.
    palette = related.SequenceField(
        str,
        [
            '#4e79a7',
            '#f28e2c',
            '#e15759',
            '#76b7b2',
            '#59a14f',
            '#edc949',
            '#af7aa1',
            '#ff9da7',
            '#9c755f',
            '#bab0ab',
        ],
    )
    selected_segments = related.SequenceField(str, [], key='selectedSegments')


@related.mutable(strict=True)
class TableSettings:
    @related.mutable(strict=True)
    class SortState:
        sort_columns = related.StringField('', key='sortColumn')
        sort_direction_map = related.StringField('ASC', key='sortDirection')

    active_theme = related.ChildField(
        TableThemeId, TableThemeId.CUSTOM, key='activeTheme'
    )
    custom_theme = related.ChildField(TableTheme, required=False, key='customTheme')
    inverted_fields = related.SequenceField(str, [], key='invertedFields')
    table_format = related.ChildField(TableFormat, TableFormat.TABLE, key='tableFormat')
    enable_case_page_linking = related.BooleanField(False, key='enableCasePageLinking')
    enable_pagination = related.BooleanField(True, key='enablePagination')
    fit_width = related.BooleanField(True, key='fitWidth')
    row_height = related.FloatField(30, key='rowHeight')
    add_total_row = related.BooleanField(False, key='addTotalRow')
    header_border_color = related.StringField('#d9d9d9', key='headerBorderColor')
    footer_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='footerFontFamily'
    )
    footer_color = related.StringField(FONT_COLOR_DEFAULT, key='footerColor')
    footer_font_size = related.StringField(FONT_12, key='footerFontSize')
    footer_background = related.StringField('#fff', key='footerBackground')
    footer_border_color = related.StringField('#fff', key='footerBorderColor')
    max_column_width = related.StringField('500', key='maxColumnWidth')
    min_column_width = related.StringField('150', key='minColumnWidth')
    merge_table_cells = related.BooleanField(False, key='mergeTableCells')
    user_sort = related.ChildField(SortState, key='userSort', required=False)
    wrap_column_titles = related.BooleanField(False, key='wrapColumnTitles')


@related.mutable(strict=True)
class SunburstSettings:
    selected_field = related.StringField('', key='selectedField')


# TODO(yitian): Remove show_data_labels, it has been moved to series settings.
@related.mutable(strict=True)
class TimeSeriesSettings:
    # TODO(stephen): Define the real structure of the BandSettings as a full model.
    bands = related.ChildField(list, [])
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
