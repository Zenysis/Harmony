# pylint: disable=invalid-name
from enum import Enum

import related


from .visualization_specific_model import (  # pylint: disable=line-too-long
    BarGraphSettings,
    BoxPlotSettings,
    BubbleChartSettings,
    BumpChartSettings,
    EpiCurveSettings,
    ExpandoTreeSettings,
    FONT_12,
    FONT_14,
    FONT_16,
    FONT_18,
    FONT_COLOR_DEFAULT,
    FONT_FAMILY_DEFAULT,
    HeatTileSettings,
    MapSettings,
    NumberTrendSettings,
    PieChartSettings,
    SunburstSettings,
    TableSettings,
    TimeSeriesSettings,
)


class SeriesObjectAxis(Enum):
    Y1_AXIS = 'y1Axis'
    Y2_AXIS = 'y2Axis'


class ValueDisplayShape(Enum):
    BAR = 'bar'
    LINE = 'line'
    DOTTED = 'dotted'


class ViewType(Enum):
    BAR_GRAPH = 'BAR_GRAPH'
    BOX_PLOT = 'BOX_PLOT'
    BUBBLE_CHART = 'BUBBLE_CHART'
    BUMP_CHART = 'BUMP_CHART'
    EPICURVE = 'EPICURVE'
    EXPANDOTREE = 'EXPANDOTREE'
    HEATTILES = 'HEATTILES'
    MAP = 'MAP'
    NUMBER_TREND = 'NUMBER_TREND'
    PIE = 'PIE'
    TABLE = 'TABLE'
    SUNBURST = 'SUNBURST'
    TIME = 'TIME'


class VisualizationType(Enum):
    '''VisualizationTypes are more specific versions of a ViewType.
    For example, a BAR_STACKED and BAR_OVERLAPPING are both BAR_GRAPH
    ViewTypes, but they have different settings configurations.
    '''

    BAR = 'BAR'
    BAR_LINE = 'BAR_LINE'
    BAR_OVERLAPPING = 'BAR_OVERLAPPING'
    BAR_STACKED = 'BAR_STACKED'
    BAR_HORIZONTAL = 'BAR_HORIZONTAL'
    BAR_HORIZONTAL_LINE = 'BAR_HORIZONTAL_LINE'
    BAR_HORIZONTAL_OVERLAPPING = 'BAR_HORIZONTAL_OVERLAPPING'
    BAR_HORIZONTAL_STACKED = 'BAR_HORIZONTAL_STACKED'
    BOXPLOT = 'BOXPLOT'
    EPICURVE = 'EPICURVE'
    HEATTILES = 'HEATTILES'
    HIERARCHY = 'HIERARCHY'
    LINE = 'LINE'
    MAP = 'MAP'
    MAP_ANIMATED = 'MAP_ANIMATED'
    MAP_HEATMAP = 'MAP_HEATMAP'
    MAP_HEATMAP_ANIMATED = 'MAP_HEATMAP_ANIMATED'
    NUMBER_TREND = 'NUMBER_TREND'
    NUMBER_TREND_SPARK_LINE = 'NUMBER_TREND_SPARK_LINE'
    PIE = 'PIE'
    RANKING = 'RANKING'
    SCATTERPLOT = 'SCATTERPLOT'
    SUNBURST = 'SUNBURST'
    TABLE = 'TABLE'
    TABLE_SCORECARD = 'TABLE_SCORECARD'


@related.mutable(strict=True)
class DataAction:
    '''This class represents a data action that can be applied to a series. This is
    equivalent to the frontend DataAction model. An array of these are converted into
    a frontend DataActionGroup model when deserialized.
    '''

    rule = related.ChildField(dict)
    color = related.StringField(required=False)
    label = related.StringField(required=False)
    transformedText = related.StringField(required=False)


@related.mutable(strict=True)
class DataActionRule:
    '''A DataActionRule contains a series of DataActions and the fields
    that those DataActions are applied to.
    '''

    id = related.StringField(required=True)
    data_actions = related.SequenceField(DataAction, [], key='dataActions')
    series = related.SetField(str, default=set())


class LegendPlacement(Enum):
    TOP = 'top'
    TOP_RIGHT = 'topRight'
    LEFT = 'left'
    RIGHT = 'right'
    BOTTOM = 'bottom'


@related.mutable(strict=True)
class LegendSettings:
    legend_font_color = related.StringField(FONT_COLOR_DEFAULT, key='legendFontColor')
    legend_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='legendFontFamily'
    )
    legend_font_size = related.StringField(FONT_16, key='legendFontSize')
    legend_placement = related.ChildField(
        LegendPlacement, LegendPlacement.BOTTOM, key='legendPlacement'
    )
    overlap_legend_with_chart = related.BooleanField(
        False, key='overlapLegendWithChart'
    )
    show_legend = related.BooleanField(True, key='showLegend')


@related.mutable(strict=True)
class XAxisSettings:
    labels_font_size = related.StringField(FONT_16, key='labelsFontSize')
    title = related.StringField('')
    title_font_size = related.StringField(FONT_18, key='titleFontSize')
    title_font_color = related.StringField(FONT_COLOR_DEFAULT, key='titleFontColor')
    title_font_family = related.StringField(FONT_FAMILY_DEFAULT, key='titleFontFamily')
    labels_font_color = related.StringField(FONT_COLOR_DEFAULT, key='labelsFontColor')
    labels_font_family = related.StringField(
        FONT_FAMILY_DEFAULT, key='labelsFontFamily'
    )
    additional_axis_title_distance = related.StringField(
        '0px', key='additionalAxisTitleDistance'
    )


@related.mutable(strict=True)
class YAxisSettings(XAxisSettings):
    range_from = related.FloatField(required=False, key='rangeFrom')
    range_to = related.FloatField(required=False, key='rangeTo')


# General Settings that apply to each visualization but whose values are unique
# to that specific visualization
@related.mutable(strict=True)
class AxesSettings:
    x_axis_settings = related.ChildField(XAxisSettings, XAxisSettings(), key='xAxis')
    y1_axis_settings = related.ChildField(YAxisSettings, YAxisSettings(), key='y1Axis')
    y2_axis_settings = related.ChildField(YAxisSettings, YAxisSettings(), key='y2Axis')


@related.mutable(strict=True)
class SeriesSettingsObject:
    id = related.StringField()
    color = related.StringField()
    data_label_font_size = related.StringField(FONT_12, key='dataLabelFontSize')
    data_label_format = related.StringField('0%', key='dataLabelFormat')
    is_visible = related.BooleanField(True, key='isVisible')
    label = related.StringField('Other')
    bar_label_position = related.StringField('top', key='barLabelPosition')
    null_value_display = related.StringField('No data', key='nullValueDisplay')
    show_series_value = related.BooleanField(False, key='showSeriesValue')
    visual_display_shape = related.ChildField(
        ValueDisplayShape, ValueDisplayShape.BAR, key='visualDisplayShape'
    )
    y_axis = related.ChildField(SeriesObjectAxis, SeriesObjectAxis.Y1_AXIS, key='yAxis')


@related.mutable(strict=True)
class SeriesSettings:
    series_objects = related.MappingField(
        SeriesSettingsObject, 'id', {}, key='seriesObjects'
    )
    series_order = related.SequenceField(str, [], key='seriesOrder')
    data_action_rules = related.SequenceField(DataActionRule, [], key='dataActionRules')


@related.mutable(strict=True)
class BarGraph:
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BarGraphSettings, BarGraphSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('BAR_GRAPH', key='viewType')


@related.mutable(strict=True)
class BoxPlot:
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BoxPlotSettings, BoxPlotSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('BOX_PLOT', key='viewType')


@related.mutable(strict=True)
class BubbleChart:
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BubbleChartSettings, BubbleChartSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('BUBBLE_CHART', key='viewType')


@related.mutable(strict=True)
class BumpChart:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BumpChartSettings, BumpChartSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('BUMP_CHART', key='viewType')


@related.mutable(strict=True)
class EpiCurve:
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        EpiCurveSettings, EpiCurveSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('EPICURVE', key='viewType')


@related.mutable(strict=True)
class ExpandoTree:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        ExpandoTreeSettings, ExpandoTreeSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('EXPANDOTREE', key='viewType')


@related.mutable(strict=True)
class HeatTile:
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        HeatTileSettings, HeatTileSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('HEATTILES', key='viewType')


@related.mutable(strict=True)
class Map:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
    view_specific_settings = related.ChildField(
        MapSettings, MapSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('MAP', key='viewType')


@related.mutable(strict=True)
class NumberTrend:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        NumberTrendSettings, NumberTrendSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('NUMBER_TREND', key='viewType')


@related.mutable(strict=True)
class PieChart:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        PieChartSettings, PieChartSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('PIE', key='viewType')


@related.mutable(strict=True)
class Sunburst:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        SunburstSettings, SunburstSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('SUNBURST', key='viewType')


@related.mutable(strict=True)
class Table:
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        TableSettings, TableSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('TABLE', key='viewType')


@related.mutable(strict=True)
class TimeSeries:
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        TimeSeriesSettings, TimeSeriesSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('TIME', key='viewType')


# Extract the constant view type stored on the visualization settings class
# so that it does not have to be redefined.


def view_type(visualization_cls):
    return visualization_cls.__attrs_attrs__.view_type.default


# NOTE(nina)/HACK(nina): Currently both AQT and GIS dashboard models make use
# of the ViewTypeSettings class. Upgrade specification functions that modify
# this model (or its descendants) and therefore Query settings should also
# make sure to update GIS items with these changes. The
# _upgrade_2021_04_16_specification function is a good example of this
@related.mutable(strict=True)
class ViewTypeSettings:
    bar_graph = related.ChildField(BarGraph, required=False, key=view_type(BarGraph))
    box_plot = related.ChildField(BoxPlot, required=False, key=view_type(BoxPlot))
    bubble_chart = related.ChildField(
        BubbleChart, required=False, key=view_type(BubbleChart)
    )
    bump_chart = related.ChildField(BumpChart, required=False, key=view_type(BumpChart))
    epicurve = related.ChildField(EpiCurve, required=False, key=view_type(EpiCurve))
    expando_tree = related.ChildField(
        ExpandoTree, required=False, key=view_type(ExpandoTree)
    )
    heat_tile = related.ChildField(HeatTile, required=False, key=view_type(HeatTile))
    map = related.ChildField(Map, required=False, key=view_type(Map))
    number_trend = related.ChildField(
        NumberTrend, required=False, key=view_type(NumberTrend)
    )
    pie_chart = related.ChildField(PieChart, required=False, key=view_type(PieChart))
    sunburst = related.ChildField(Sunburst, required=False, key=view_type(Sunburst))
    table = related.ChildField(Table, required=False, key=view_type(Table))
    time_series = related.ChildField(
        TimeSeries, required=False, key=view_type(TimeSeries)
    )


@related.mutable(strict=True)
class TitleSettings:
    subtitle = related.StringField('')
    subtitle_font_size = related.StringField(FONT_18, key='subtitleFontSize')
    title = related.StringField('')
    title_font_size = related.StringField(FONT_16, key='titleFontSize')
    title_font_color = related.StringField(FONT_COLOR_DEFAULT, key='titleFontColor')
    title_font_family = related.StringField(FONT_FAMILY_DEFAULT, key='titleFontFamily')


@related.mutable(strict=True)
class GroupByObject:
    id = related.StringField()
    type = related.StringField()
    display_value_format = related.StringField(key='displayValueFormat')
    label = related.StringField(required=False, default=None, key='label')
    null_value_display = related.StringField('null', key='nullValueDisplay')


@related.mutable(strict=True)
class GroupBySettings:
    groupings = related.MappingField(GroupByObject, 'id', {}, key='groupings')


# TODO(pablo): make this naming consistent with the frontend model, which
# is DashboardItemSettings. The ViewTypeSettings model should then be renamed
# to VisualizationSettings
@related.mutable(strict=True)
class VisualizationSettings:
    id = related.StringField()
    title_settings = related.ChildField(TitleSettings, key='titleSettings')
    group_by_settings = related.ChildField(GroupBySettings, key='groupBySettings')
    view_type_settings = related.ChildField(ViewTypeSettings, key='viewTypeSettings')
