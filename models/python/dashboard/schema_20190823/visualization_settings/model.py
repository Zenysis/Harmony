# pylint: disable=invalid-name
from enum import Enum

import related

from .visualization_specific_model import (  # pylint: disable=line-too-long
    AnimatedMapSettings,
    BarChartSettings,
    BoxPlotSettings,
    BubbleChartSettings,
    BumpChartSettings,
    ExpandoTreeSettings,
    FONT_12,
    FONT_14,
    FONT_16,
    FONT_18,
    FONT_COLOR_DEFAULT,
    FONT_FAMILY_DEFAULT,
    HeatMapSettings,
    HeatTileSettings,
    MapSettings,
    SunburstSettings,
    TableSettings,
    TimeSeriesSettings,
)


class SeriesObjectAxis(Enum):
    Y1_AXIS = 'y1Axis'
    Y2_AXIS = 'y2Axis'


class VisualizationType(Enum):
    ANIMATED_MAP = 'ANIMATED_MAP'
    BOX = 'BOX'
    BUBBLE_CHART = 'BUBBLE_CHART'
    BUMP_CHART = 'BUMP_CHART'
    CHART = 'CHART'
    EXPANDOTREE = 'EXPANDOTREE'
    HEATMAP = 'HEATMAP'
    HEATTILES = 'HEATTILES'
    MAP = 'MAP'
    TABLE = 'TABLE'
    SUNBURST = 'SUNBURST'
    TIME = 'TIME'


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
    goal_line = related.StringField('', key='goalLine')
    goal_line_font_size = related.StringField(FONT_14, key='goalLineFontSize')
    goal_line_label = related.StringField('', key='goalLineLabel')
    goal_line_color = related.StringField('black', key='goalLineColor')
    goal_line_thickness = related.StringField('1', key='goalLineThickness')
    goal_line_style = related.StringField('Solid', key='goalLineStyle')
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
    show_constituents = related.BooleanField(False, key='showConstituents')
    show_series_value = related.BooleanField(False, key='showSeriesValue')
    y_axis = related.ChildField(SeriesObjectAxis, SeriesObjectAxis.Y1_AXIS, key='yAxis')


@related.mutable(strict=True)
class SeriesSettings:
    series_objects = related.MappingField(
        SeriesSettingsObject, 'id', {}, key='seriesObjects'
    )
    series_order = related.SequenceField(str, [], key='seriesOrder')


@related.mutable(strict=True)
class AnimatedMap:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
    view_specific_settings = related.ChildField(
        AnimatedMapSettings, AnimatedMapSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('ANIMATED_MAP', key='viewType')


@related.mutable(strict=True)
class BarChart:
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
    axes_settings = related.ChildField(AxesSettings, AxesSettings(), key='axesSettings')
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BarChartSettings, BarChartSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('CHART', key='viewType')


@related.mutable(strict=True)
class BoxPlot:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        BoxPlotSettings, BoxPlotSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('BOX', key='viewType')


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
class ExpandoTree:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        ExpandoTreeSettings, ExpandoTreeSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('EXPANDOTREE', key='viewType')


@related.mutable(strict=True)
class HeatMap:
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        HeatMapSettings, HeatMapSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('HEATMAP', key='viewType')


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
    series_settings = related.ChildField(
        SeriesSettings, SeriesSettings(), key='seriesSettings'
    )
    view_specific_settings = related.ChildField(
        TableSettings, TableSettings(), key='viewSpecificSettings'
    )
    view_type = related.StringField('TABLE', key='viewType')


@related.mutable(strict=True)
class TimeSeries:
    legend_settings = related.ChildField(
        LegendSettings, LegendSettings(), key='legendSettings'
    )
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


@related.mutable(strict=True)
class ViewTypeSettings:
    animated_map = related.ChildField(
        AnimatedMap, required=False, key=view_type(AnimatedMap)
    )
    bar_chart = related.ChildField(BarChart, required=False, key=view_type(BarChart))
    box_plot = related.ChildField(BoxPlot, required=False, key=view_type(BoxPlot))
    bubble_chart = related.ChildField(
        BubbleChart, required=False, key=view_type(BubbleChart)
    )
    bump_chart = related.ChildField(BumpChart, required=False, key=view_type(BumpChart))
    expando_tree = related.ChildField(
        ExpandoTree, required=False, key=view_type(ExpandoTree)
    )
    heat_map = related.ChildField(HeatMap, required=False, key=view_type(HeatMap))
    heat_tile = related.ChildField(HeatTile, required=False, key=view_type(HeatTile))
    map = related.ChildField(Map, required=False, key=view_type(Map))
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
