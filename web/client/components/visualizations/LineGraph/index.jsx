// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';
import LineGraphLegend from 'components/visualizations/LineGraph/LineGraphLegend';
import LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import PlotlyTooltip from 'components/visualizations/common/PlotlyTooltip';
import ProgressBar from 'components/ui/ProgressBar';
import QueryResultGrouping, {
  TIMESTAMP_GROUPING_ID,
} from 'models/core/QueryResultSpec/QueryResultGrouping';
import Visualization from 'components/visualizations/common/Visualization';
import buildColoredBandLines from 'components/visualizations/LineGraph/buildColoredBandLines';
import computeLineGraphMargins from 'components/visualizations/LineGraph/computeLineGraphMargins';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  BACKEND_GRANULARITIES,
  buildPlotlyDateLabels,
} from 'components/QueryResult/timeSeriesUtil';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  Y1_AXIS,
  // eslint-disable-next-line max-len
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { ZEN_GRAPH_FORMAT_LABEL } from 'vendor/registry/patches';
import { autobind, memoizeOne } from 'decorators';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { BandSetting } from 'models/visualizations/LineGraph/LineGraphSettings';
import type {
  DataPoint,
  FieldId,
  LineGraphLines,
  RawTimestamp,
} from 'models/visualizations/LineGraph/types';
import type { LegendItem } from 'components/visualizations/LineGraph/LineGraphLegend/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

const DEFAULT_LINE_WIDTH = 2;

const PLOTLY_CONFIG = {
  modeBarButtonsToRemove: [
    'zoomIn2d',
    'zoomOut2d',
    'sendDataToCloud',
    'hoverCompareCartesian',
    'hoverClosestCartesian',
  ],
};

const DASH_STYLES = [
  'solid',
  'dashdot',
  'dot',
  'dash',
  'longdashdot',
  'longdash',
];

type PlotlyDashStyle =
  | 'dot'
  | 'dash'
  | 'dashdot'
  | 'longdash'
  | 'longdashdot'
  | 'solid';

// HACK(stephen): This is all just a mess. Creating a new line type type
// definition since we don't have an exact plotly type.
type PlotlyLineShape = {
  name: string,
  x: $ReadOnlyArray<string>,
  y: $ReadOnlyArray<?number>,
  xaxis: 'x',
  yaxis: 'y' | 'y2',
  mode: 'line' | 'marker',
  hoverinfo: 'none',
  type: 'scatter',
  showlegend: true,
  line: {
    color: string,
    dash: PlotlyDashStyle,
    width: number,
  },
  connectgaps: true,
  tooltipData: {
    fieldId: string,
    key: string,
    yAxis: 'y1Axis' | 'y2Axis',
  },
};

type LegendItems = {
  coloredBands: $ReadOnlyArray<LegendItem>,
  lines: $ReadOnlyArray<LegendItem>,
  metrics: $ReadOnlyArray<LegendItem>,
};

type HoverData = {
  x: number,
  y: number,
  fieldId: string,
  key: string,
  yAxis: 'y1Axis' | 'y2Axis',
};

// NOTE(stephen): To the person that refactors the LineGraph to stop using
// Plotly, don't just copy this type without thinking about it. It might be tied
// to Plotly usage in some areas.
type Metric = {
  colorOverride: string | void,
  id: string,
  label: string,
  plotlyDashStyle: PlotlyDashStyle,
  shape: $PropertyType<LegendItem, 'shape'>,
  yAxis: 'y1Axis' | 'y2Axis',
};

type Props = VisualizationProps<'TIME'>;
type State = {
  disabledLegendItems: {
    coloredBands: $ReadOnlyArray<string>,
    metrics: $ReadOnlyArray<string>,
    lines: $ReadOnlyArray<string>,
  },
  hoverData: HoverData | void,
  legendSize: {
    height: number,
    width: number,
  },
};

const HACK_USE_SERIES_SETTING_COLOR = false;

function seriesIdsChanged(
  prevSeriesOrder: $ReadOnlyArray<string>,
  seriesOrder: $ReadOnlyArray<string>,
): boolean {
  if (prevSeriesOrder === seriesOrder) {
    return false;
  }

  if (prevSeriesOrder.length !== seriesOrder.length) {
    return true;
  }

  const prevIds = new Set(prevSeriesOrder);
  return !seriesOrder.every(id => prevIds.has(id));
}

class LineGraph extends React.PureComponent<Props, State> {
  static defaultProps: VisualizationDefaultProps<'TIME'> = {
    ...visualizationDefaultProps,
    queryResult: LineGraphQueryResultData.create({}),
  };

  ref: $ElementRefObject<'div'> = React.createRef();
  legendResizeRegistration = ElementResizeService.register(this.onLegendResize);
  state = {
    disabledLegendItems: {
      coloredBands: [],
      metrics: [],
      lines: [],
    },
    hoverData: undefined,
    legendSize: {
      height: 0,
      width: 0,
    },
  };

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.queryResult !== this.props.queryResult ||
      seriesIdsChanged(
        prevProps.seriesSettings.seriesOrder(),
        this.props.seriesSettings.seriesOrder(),
      )
    ) {
      this.clearDisabledLegendItems();
    }
  }

  clearDisabledLegendItems() {
    this.setState({
      disabledLegendItems: {
        coloredBands: [],
        metrics: [],
        lines: [],
      },
    });
  }

  // HACK(stephen): Just going full-on hack mode at this point with Plotly
  // line graph. We need access to the width/height that the plot will render in
  // and it is easy enough to receive it as a callback from the <Visualization>
  // during rendering. However, we only want to redraw the plot when the
  // dimensions have changed or if the props have changed. By memoizing this
  // in this style, we can avoid the need to use componentDidMount/Update and
  // can just freely call `createPlot` in the render path.
  @memoizeOne
  createPlot(
    data: $ReadOnlyArray<PlotlyLineShape>,
    height: number,
    width: number,
    elt: ?HTMLDivElement,
    props: Props, // eslint-disable-line no-unused-vars
  ) {
    // Only render the plot if we have an element to render on and the
    // dimensions are big enough.
    if (!elt || height <= 10 || width <= 10) {
      return;
    }

    const layout = this.maybeAddAnotations(
      this.getGraphLayout(height, width),
      data,
    );
    layout.margin = computeLineGraphMargins(layout, data);

    window.Plotly.newPlot(elt, data, layout, PLOTLY_CONFIG);
    // Plotly attaches an `on` listener to the div element that Flow cannot
    // detect.
    // $FlowExpectedError[prop-missing]
    elt.on('plotly_hover', this.onHoverStart);

    // $FlowExpectedError[prop-missing]
    elt.on('plotly_unhover', this.onHoverEnd);
  }

  @memoizeOne
  buildMetricOrder(
    seriesSettings: SeriesSettings,
    hasSingleQueryResultRow: boolean,
  ): $ReadOnlyArray<Metric> {
    const output = [];

    let metricCount = 0;
    seriesSettings.visibleSeriesOrder().forEach(fieldId => {
      const seriesObject = seriesSettings.getSeriesObject(fieldId);
      if (seriesObject !== undefined) {
        // Each series object should use a different shape since the unique
        // dimension values all use the same color.
        // NOTE(stephen): If there is only a single row in the query result, we
        // want to *color by series* instead of coloring by dimension value.
        let colorOverride = hasSingleQueryResultRow
          ? SERIES_COLORS[metricCount % SERIES_COLORS.length]
          : undefined;
        const plotlyDashStyle = hasSingleQueryResultRow
          ? 'solid'
          : DASH_STYLES[metricCount % DASH_STYLES.length];

        // TODO(stephen): Improve Flow's refinement of this.
        // $FlowExpectedError[incompatible-type]
        const shape: $PropertyType<Metric, 'shape'> = `line-${plotlyDashStyle}`;

        // HACK(stephen): BR COVID has very specific requirements around the
        // usage of color in the line graph when there is only a single query
        // result row. For that specific deployment, use the color set in the
        // series settings. For all other deployments, sequentially choose a
        // color from the SERIES_COLORS.
        if (hasSingleQueryResultRow && HACK_USE_SERIES_SETTING_COLOR) {
          // NOTE(stephen): The series object color should never be missing, but
          // just to be safe, default to the original color override.
          colorOverride = seriesObject.color() || colorOverride;
        }

        output.push({
          colorOverride,
          plotlyDashStyle,
          shape,
          id: seriesObject.id(),
          label: seriesObject.label(),
          yAxis: seriesObject.yAxis() === Y1_AXIS ? 'y1Axis' : 'y2Axis',
        });
        metricCount++;
      }
    });
    return output;
  }

  getMetricOrder(): $ReadOnlyArray<Metric> {
    const { queryResult, seriesSettings } = this.props;
    return this.buildMetricOrder(
      seriesSettings,
      queryResult.lines().length === 1,
    );
  }

  @memoizeOne
  buildLegendItems(
    lineColors: { +[string]: string },
    bandSettings: $ReadOnlyArray<BandSetting>,
    metricOrder: $ReadOnlyArray<Metric>,
    disabledLegendItems: $PropertyType<State, 'disabledLegendItems'>,
  ): LegendItems {
    const output = {
      coloredBands: [],
      metrics: metricOrder.map(({ colorOverride, id, label, shape }) => ({
        color: colorOverride !== undefined ? colorOverride : '#313234',
        enabled: !disabledLegendItems.metrics.includes(id),
        id,
        label,
        shape,
      })),
      lines: Object.keys(lineColors).map(key => ({
        color: lineColors[key],
        enabled: !disabledLegendItems.lines.includes(key),
        id: key,
        label: key,
        shape: 'line-solid',
      })),
    };

    bandSettings.forEach(({ areaColor, areaLabel }, idx) => {
      if (
        areaColor !== undefined &&
        areaLabel !== undefined &&
        areaLabel.length > 0
      ) {
        const id = `${areaColor}--${areaLabel}--${idx}`;
        output.coloredBands.push({
          id,
          color: areaColor,
          enabled: !disabledLegendItems.coloredBands.includes(id),
          label: areaLabel,
          shape: 'block',
        });
      }
    });

    return output;
  }

  getLegendItems(): LegendItems {
    const { controls, queryResult } = this.props;
    return this.buildLegendItems(
      this.buildLineColors(queryResult.lines()),
      controls.bands(),
      this.getMetricOrder(),
      this.state.disabledLegendItems,
    );
  }

  @memoizeOne
  buildColoredBands(
    bands: $ReadOnlyArray<BandSetting>,
    dates: $ReadOnlyArray<RawTimestamp>,
    dateLabels: $ReadOnlyArray<string>,
    lines: LineGraphLines,
    metricOrder: $ReadOnlyArray<Metric>,
  ): $ReadOnlyArray<mixed> {
    if (bands.length === 0) {
      return [];
    }

    const y2AxisFieldIds = [];
    metricOrder.forEach(({ id, yAxis }) => {
      if (yAxis === 'y2Axis') {
        y2AxisFieldIds.push(id);
      }
    });
    return buildColoredBandLines(
      bands,
      dates,
      dateLabels,
      lines,
      y2AxisFieldIds,
    );
  }

  getPlotlyLineObject(
    lineData: $ReadOnlyArray<DataPoint>,
    fieldId: FieldId,
    dates: $ReadOnlyArray<RawTimestamp>,
    color: string,
    yAxis: 'y1Axis' | 'y2Axis' = 'y1Axis',
    dashStyleIdx: number,
  ): $FlowTODO {
    const { key } = lineData[0];

    const timestampToDataPoints = {};
    lineData.forEach(datapoint => {
      timestampToDataPoints[datapoint[TIMESTAMP_GROUPING_ID]] = datapoint;
    });

    const numericValues = dates.map(timestamp =>
      timestampToDataPoints[timestamp]
        ? timestampToDataPoints[timestamp][fieldId]
        : undefined,
    );

    return {
      name: key || 'null',
      x: this.getDateLabels(),
      y: numericValues,
      xaxis: 'x',
      yaxis: yAxis === 'y1Axis' ? 'y' : 'y2',
      mode: dates.length === 1 ? 'markers' : 'lines',
      hoverinfo: 'none',
      type: 'scatter',
      showlegend: true,
      line: {
        color,
        dash: DASH_STYLES[dashStyleIdx % DASH_STYLES.length],
        width: DEFAULT_LINE_WIDTH,
      },
      connectgaps: true,
      tooltipData: { key, fieldId, yAxis },
    };
  }

  /**
   * Create a QueryResultGrouping for the currently selected bucket type in
   * settings. This is used when the `groupBySettings` does not contain a
   * setting for the timestamp grouping. This should only happen in SQT where
   * the date granularity is chosen through the settings modal.
   * TODO(stephen, vinh): Remove this method when the timestamp grouping is
   * guaranteed to exist (i.e. when SQT is sunsetted).
   */
  @memoizeOne
  buildDefaultDateQueryResultGrouping(bucketType: string): QueryResultGrouping {
    return QueryResultGrouping.create({
      id: bucketType,
      type: 'DATE',
      // HACK(stephen): Under rare circumstances, this path can get hit in AQT.
      // Ensure that a valid string is provided here in case the bucket type
      // provided does not exist in the legacy BACKEND_GRANULARITIES constant.
      displayValueFormat:
        BACKEND_GRANULARITIES[bucketType.toUpperCase()] || bucketType,
      label: bucketType,
    });
  }

  @memoizeOne
  buildDateGrouping(
    groupBySettings: GroupBySettings,
    // NOTE(stephen): This parameter only matters for SQT. Remove it when SQT
    // querying style is removed.
    bucketType: string,
  ): QueryResultGrouping {
    return groupBySettings
      .groupings()
      .get(
        TIMESTAMP_GROUPING_ID,
        this.buildDefaultDateQueryResultGrouping(bucketType),
      );
  }

  getDateGrouping(): QueryResultGrouping {
    const { controls, groupBySettings } = this.props;
    return this.buildDateGrouping(groupBySettings, controls.bucketType());
  }

  @memoizeOne
  buildDateLabels(
    dates: $ReadOnlyArray<RawTimestamp>,
    useEthiopianDates: boolean,
    grouping: QueryResultGrouping,
  ): $ReadOnlyArray<string> {
    const labels = grouping.formatGroupingValues(
      dates,
      true,
      useEthiopianDates,
      true,
    );

    return buildPlotlyDateLabels(labels);
  }

  getDateLabels() {
    const { controls, queryResult } = this.props;
    return this.buildDateLabels(
      queryResult.dates(),
      controls.useEthiopianDates(),
      this.getDateGrouping(),
    );
  }

  /**
   * Build mapping from dimension value key to the color for that dimension
   * value.
   */
  @memoizeOne
  buildLineColors(lines: LineGraphLines): { +[string]: string } {
    const output = {};
    let colorIdx = 0;
    lines.forEach(lineData => {
      if (lineData.length === 0) {
        return;
      }
      output[lineData[0].key] = SERIES_COLORS[colorIdx % SERIES_COLORS.length];
      colorIdx++;
    });
    return output;
  }

  /**
   * Use QueryResultData to generate Plotly specific data
   */
  // HACK(stephen): Memoizing purely based on the props since this code is a
  // mess and it is hard to specifically whitelist certain props.
  @memoizeOne
  buildPlotlyData(
    queryResult: LineGraphQueryResultData,
    dateLabels: $ReadOnlyArray<string>,
    metricOrder: $ReadOnlyArray<Metric>,
    lineColors: { +[string]: string },
    coloredBands: $ReadOnlyArray<any>,
    disabledLegendItems: $PropertyType<State, 'disabledLegendItems'>,
  ): $ReadOnlyArray<PlotlyLineShape> {
    const dates = queryResult.dates();
    const lines = queryResult.lines();

    if (!lines || lines.length === 0) {
      return coloredBands;
    }

    const dateIndexMap = {};
    dates.forEach((date, idx) => {
      dateIndexMap[date] = idx;
    });

    // TODO(stephen): Something about coloring lines differently if no grouping
    // exists (otherwise default behavior would be changing style of line).
    const outputLines = [];
    const lineMode = dates.length > 1 ? 'lines' : 'markers';
    lines.forEach(lineData => {
      if (lineData.length === 0) {
        return;
      }

      const { key } = lineData[0];
      if (disabledLegendItems.lines.includes(key)) {
        return;
      }

      const lineColor = lineColors[key];
      metricOrder.forEach(({ colorOverride, id, plotlyDashStyle, yAxis }) => {
        if (disabledLegendItems.metrics.includes(id)) {
          return;
        }

        const numericValues = new Array(dates.length);
        lineData.forEach(dataPoint => {
          const dateIdx = dateIndexMap[dataPoint[TIMESTAMP_GROUPING_ID]];
          numericValues[dateIdx] = dataPoint[id];
        });

        outputLines.push({
          name: key || 'null',
          x: dateLabels,
          y: numericValues,
          xaxis: 'x',
          yaxis: yAxis === 'y1Axis' ? 'y' : 'y2',
          mode: lineMode,
          hoverinfo: 'none',
          type: 'scatter',
          showlegend: true,
          line: {
            color: colorOverride !== undefined ? colorOverride : lineColor,
            dash: plotlyDashStyle,
            width: DEFAULT_LINE_WIDTH,
          },
          connectgaps: true,
          tooltipData: { key, yAxis, fieldId: id },
        });
      });
    });

    // NOTE(stephen): Draw the lines *last* so that they appear on top of
    // everything non-line (like shaded areas).
    return [...coloredBands, ...outputLines];
  }

  getPlotlyData(): $ReadOnlyArray<PlotlyLineShape> {
    const { controls, queryResult } = this.props;
    const dateLabels = this.getDateLabels();

    const metricOrder = this.getMetricOrder();
    const coloredBands = this.buildColoredBands(
      controls.bands(),
      queryResult.dates(),
      dateLabels,
      queryResult.lines(),
      metricOrder,
    );
    return this.buildPlotlyData(
      queryResult,
      dateLabels,
      metricOrder,
      this.buildLineColors(queryResult.lines()),
      coloredBands,
      this.state.disabledLegendItems,
    );
  }

  maybeAddAnotations(layout, data): $FlowTODO {
    const { controls, seriesSettings } = this.props;
    if (data.length === 0) {
      return layout;
    }

    const logScaling = controls.logScaling();
    const textValues = [];
    // Have the annotations hover above the series' by an amount scaled by
    // the maximum value.
    let yMax = 0;
    data.forEach(series => {
      series.y.forEach(val => {
        if (val !== undefined && val !== null && val > yMax) {
          yMax = val;
        }
      });
    });

    const textPadding = 0.02 * yMax;
    data.forEach(dataPoint => {
      const fieldId =
        dataPoint.tooltipData !== undefined
          ? dataPoint.tooltipData.fieldId
          : '';
      const seriesObject = seriesSettings.getSeriesObject(fieldId);
      if (seriesObject === undefined || !seriesObject.showSeriesValue()) {
        return;
      }

      for (let i = 0; i < dataPoint.y.length; i++) {
        const yValue = dataPoint.y[i];
        if (yValue === null || yValue === undefined) {
          continue;
        }

        const labelAdjustment = this.getDataPointAdjustments(
          dataPoint.y[i - 1] || undefined,
          yValue || undefined,
          dataPoint.y[i + 1] || undefined,
        );

        // Retrieve y value adjustments.
        const { adjustYDirection } = labelAdjustment;
        let adjustedTextPadding = 0;
        if (adjustYDirection === 'top') {
          adjustedTextPadding = textPadding;
        } else {
          adjustedTextPadding = -textPadding;
        }

        const t = {
          x: dataPoint.x[i],

          // HACK(stephen): We have to adjust log scale the y-value ourselves
          // to work around a bug in the Plotly library.
          // NOTE(stephen): The text padding adjustment doesn't do very much
          // in log scale mode and was not able to calculate a good alternative
          // that would work.
          y: logScaling ? Math.log10(yValue) : yValue + adjustedTextPadding,
          text: `${seriesObject.formatFieldValue(yValue)}`,
          textangle: -45,
          font: {
            family: 'Arial',
            size: seriesObject.dataLabelFontSize().split('px')[0],
            color: 'black',
          },
          showarrow: false,
          // Always setting xanchor to center now so that it aligns with the
          // data point when rotated. We may go back to using the xanchor
          // value from getDataPointAdjustments
          xanchor: 'center',
          yanchor: 'middle',
          borderpad: 5,
        };

        textValues.push(t);
      }
    });

    return {
      ...layout,
      annotations: textValues,
    };
  }

  /**
   * Returns an object containing the xanchor value and whether to offset the y value
   * the xanchor value for data annotations. Anchor values are determined
   * by calculating the slope with y values. Note that we don't use x values
   * because they are usually string values and not integers.
   * @param{y2} the data point for which we are calculating the anchor value
   * @param{y1} the data point before y2
   * @param{y3} the data point after y2
   */
  getDataPointAdjustments(
    y1: number | void,
    y2: number | void,
    y3: number | void,
  ): { xAnchor: string, adjustYDirection: 'top' | 'bottom' | '' } {
    const top = { xAnchor: 'center', adjustYDirection: 'top' };
    const bottom = { xAnchor: 'center', adjustYDirection: 'bottom' };
    const rightSide = { xAnchor: 'left', adjustYDirection: '' };
    const leftSide = { xAnchor: 'right', adjustYDirection: '' };

    if ((y1 === undefined && y3 === undefined) || y2 === undefined) {
      return top;
    }
    if (y1 === undefined) {
      return leftSide;
    }
    if (y3 === undefined) {
      return rightSide;
    }

    const slope1 = y2 - y1;
    const slope2 = y3 - y2;
    if (slope1 > 0 && slope2 > 0) {
      return leftSide;
    }
    if (slope1 < 0 && slope2 < 0) {
      return rightSide;
    }
    if (slope1 > 0 && slope2 < 0) {
      return top;
    }
    if (slope1 < 0 && slope2 > 0) {
      return bottom;
    }
    return top;
  }

  // HACK(stephen): Manually compute the tick labels to display instead of
  // letting Plotly do it for us. This is necessary because Plotly will
  // potentially omit key date labels (like ones that have year included) that
  // would make the graph harder to understand.
  @memoizeOne
  buildTickValues(
    axesSettings: AxesSettings,
    dateLabels: $ReadOnlyArray<string>,
    xAxisWidth: number,
  ): $ReadOnlyArray<string> {
    // NOTE(stephen): This spacing calculation is copied from Plotly.
    const xAxis = axesSettings.xAxis();
    const fontSize = parseInt(xAxis.labelsFontSize(), 10);
    const minPixels = fontSize * 1.2;
    const tickCount = xAxisWidth / minPixels;
    let tickSpacing = Math.ceil(dateLabels.length / tickCount) || 1;

    // HACK(stephen): Try to space the date values cleanly when bucketing by
    // month. Even though we might not be grouping by month, this formula is
    // "good enough" for the rare cases where we have lots of date labels and
    // are not grouping by month.
    if (12 % tickSpacing !== 0) {
      if (tickSpacing > 12) {
        tickSpacing = 12 * Math.ceil(tickSpacing / 12);
      } else {
        tickSpacing = 12 / Math.floor(12 / tickSpacing);
      }
    }

    // Track the next date index to show so that when we interrupt the normal
    // spacing to display a date label with a year, we can still draw the labels
    // after that year consistently.
    let nextIdx = 0;
    return dateLabels.filter((label, idx) => {
      // HACK(stephen): Parse the simple date string and determine if the year
      // is included in the label. Only some date labels will have the year, and
      // it will always be the last piece of the string.
      const pieces = label.trim().split(' ');
      const hasYear =
        pieces.length > 1 &&
        Number.isFinite(Number.parseInt(pieces[pieces.length - 1], 10));

      // Always show labels with a year. If the label does not have a year, only
      // include it if it is the next label we should include based on the
      // spacing calculated.
      if (!hasYear && idx !== nextIdx) {
        return false;
      }
      nextIdx = idx + tickSpacing;
      return true;
    });
  }

  getYAxisTickFormat(
    visibleSeries: $ReadOnlyArray<QueryResultSeries>,
  ): string | void {
    return visibleSeries.length === 0 ||
      visibleSeries[0].dataLabelFormat() === 'none'
      ? undefined
      : `${ZEN_GRAPH_FORMAT_LABEL}${visibleSeries[0].dataLabelFormat()}`;
  }

  getGraphLayout(height: number, width: number): $FlowTODO {
    const {
      axesSettings,
      controls,
      queryResult,
      seriesSettings,
      smallMode,
    } = this.props;
    const dateCount = queryResult.dates().length;
    const xAxis = axesSettings.xAxis();
    const y1Axis = axesSettings.y1Axis();

    const { current } = this.ref;
    let xAxisWidth = 100;
    if (current) {
      // Try to use the width of the center plot (the actual line graph) to
      // determine the desired xAxisWidth. If the plot has not yet been drawn,
      // use the parent container width and subtract some padding to account
      // for y-axis and legend.
      const plotElt = current.getElementsByClassName('plot')[0];
      xAxisWidth =
        plotElt !== undefined
          ? plotElt.getBoundingClientRect().width
          : Math.max(width - 170, 10);
    }

    const layout = {
      font: {
        size: smallMode ? 11 : 14,
      },
      xaxis: {
        title: xAxis.title(),
        titlefont: {
          size: parseInt(xAxis.titleFontSize(), 10),
          color: xAxis.titleFontColor(),
          family: xAxis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        autotick: true,
        ticks: '',
        showticklabels: true,
        tickfont: {
          size: parseInt(xAxis.labelsFontSize(), 10),
          color: xAxis.labelsFontColor(),
          family: xAxis.labelsFontFamily(),
        },
        tickangle: controls.rotateLabels() ? 45 : 0,
        tickmode: 'array',
        tickvals: this.buildTickValues(
          axesSettings,
          this.getDateLabels(),
          xAxisWidth,
        ),
        type: 'category',
        range: dateCount > 1 ? [-1, dateCount] : undefined,
      },
      // NOTE(stephen): Disabling plotly's legend since we render our own
      // version.
      showlegend: false,
      hovermode: 'closest',

      // We are directly supplying chart size so Plotly does not need to derive
      // it.
      autosize: false,
      yaxis: undefined,
      yaxis2: undefined,
      height,
      width,
    };

    const scalingType = controls.logScaling() ? 'log' : 'linear';
    const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();
    if (y1AxisSeries.length > 0) {
      const visibleSeries = y1AxisSeries.filter(series => series.isVisible());

      layout.yaxis = {
        range: [y1Axis.rangeFrom(), y1Axis.rangeTo()],
        type: scalingType,
        overlaying: 'y2',
        title: y1Axis.title(),
        titlefont: {
          size: parseInt(y1Axis.titleFontSize(), 10),
          color: y1Axis.titleFontColor(),
          family: y1Axis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        showline: false,
        ticks: '',
        showticklabels: true,
        tickformat: this.getYAxisTickFormat(visibleSeries),
        exponentformat: 'none',
        tickfont: {
          size: parseInt(y1Axis.labelsFontSize(), 10),
          color: y1Axis.labelsFontColor(),
          family: y1Axis.labelsFontFamily(),
        },
      };
    } else {
      // NOTE(pablo): Plotly can't have yaxis be undefined
      delete layout.yaxis;
    }

    if (y2AxisSeries.length > 0) {
      const y2Axis = axesSettings.y2Axis();
      const visibleSeries = y2AxisSeries.filter(series => series.isVisible());

      layout.yaxis2 = {
        range: [y2Axis.rangeFrom(), y2Axis.rangeTo()],
        type: scalingType,
        title: y2Axis.title(),
        titlefont: {
          size: parseInt(y2Axis.titleFontSize(), 10),
          color: y2Axis.titleFontColor(),
          family: y2Axis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        showline: false,
        ticks: '',
        side: 'right',
        showticklabels: true,
        tickformat: this.getYAxisTickFormat(visibleSeries),
        exponentformat: 'none',
        tickfont: {
          size: parseInt(y2Axis.labelsFontSize(), 10),
          color: y2Axis.labelsFontColor(),
          family: y2Axis.labelsFontFamily(),
        },
      };
    } else {
      // NOTE(toshi): Plotly can't have yaxis2 be undefined
      delete layout.yaxis2;
    }
    return layout;
  }

  @autobind
  onHoverStart({
    points,
  }: {
    points: $ReadOnlyArray<{
      data: {
        tooltipData: {
          fieldId: string,
          key: string,
          yAxis: 'y1Axis' | 'y2Axis',
        },
      },
      pointNumber: number,
      y: number,
    }>,
  }) {
    if (points.length === 0) {
      return;
    }
    const { data, pointNumber, y } = points[0];
    this.setState({
      hoverData: {
        x: pointNumber,
        y,
        ...data.tooltipData,
      },
    });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined });
  }

  @autobind
  onLegendResize({ contentRect }) {
    const { height, width } = contentRect;
    this.setState({ legendSize: { height, width } });
  }

  @autobind
  onLegendLineClick(id: string) {
    this.onLegendItemClick('lines', id);
  }

  @autobind
  onLegendLineDoubleClick(id: string) {
    this.onLegendItemDoubleClick('lines', id);
  }

  @autobind
  onLegendMetricClick(id: string) {
    this.onLegendItemClick('metrics', id);
  }

  @autobind
  onLegendMetricDoubleClick(id: string) {
    this.onLegendItemDoubleClick('metrics', id);
  }

  onLegendItemClick(type: 'coloredBands' | 'lines' | 'metrics', id: string) {
    this.setState(prevState => {
      const disabledLegendItems = { ...prevState.disabledLegendItems };
      disabledLegendItems[type] = disabledLegendItems[type].includes(id)
        ? disabledLegendItems[type].filter(v => v !== id)
        : [...disabledLegendItems[type], id];

      return { disabledLegendItems };
    });
  }

  /**
   * When a user double clicks a legend item, one of these things will happen:
   * - If the item being clicked is enabled, then all items will be disabled
   *   except for the selected ID.
   * - If the item being clicked is disabled, then all items will be reenabled.
   * - If the item being clicked is enabled and all other items are disabled,
   *   reenable all items.
   */
  onLegendItemDoubleClick(
    type: 'coloredBands' | 'lines' | 'metrics',
    id: string,
  ) {
    const allIdsForType = this.getLegendItems()[type].map(item => item.id);
    this.setState(prevState => {
      const disabledLegendItems = { ...prevState.disabledLegendItems };
      const disabledIds = disabledLegendItems[type];
      // If the item being clicked is not disabled and it is also not the only
      // item enabled, then disable everything except for this ID.
      if (
        !disabledIds.includes(id) &&
        disabledIds.length !== allIdsForType.length - 1
      ) {
        disabledLegendItems[type] = allIdsForType.filter(v => v !== id);
      } else {
        // Otherwise, reenable all items.
        disabledLegendItems[type] = [];
      }
      return { disabledLegendItems };
    });
  }

  maybeRenderTooltip() {
    const { hoverData } = this.state;
    if (hoverData === undefined) {
      return null;
    }

    const { controls, queryResult, seriesSettings } = this.props;
    const { fieldId, key, x, y, yAxis } = hoverData;
    const seriesObject = seriesSettings.getSeriesObject(fieldId);
    const rawDate = queryResult.dates()[x];
    if (seriesObject === undefined || rawDate === undefined) {
      return null;
    }

    const dateGrouping = this.getDateGrouping();
    const rows = [
      {
        label: dateGrouping.label() || '',
        value: dateGrouping.formatGroupingValue(
          rawDate,
          true,
          controls.useEthiopianDates(),
        ),
      },
      {
        label: seriesObject.label(),
        value: seriesObject.formatFieldValue(y),
      },
    ];
    return (
      <PlotlyTooltip
        plotContainer={this.ref.current}
        rows={rows}
        title={key}
        x={x}
        y={y}
        yAxis={yAxis}
      />
    );
  }

  @autobind
  renderPlot(height: number, width: number) {
    // HACK(stephen): This is so dirty. But I've given up on making the Plotly
    // line graph nice.
    const legendItems = this.getLegendItems();

    const orientation =
      legendItems.lines.length <= 12 ? 'horizontal' : 'vertical';

    const { legendSize } = this.state;
    const chartSize = { height, width };

    // NOTE(stephen): Since the Plotly plot requires height/width values to be
    // built, we need to ensure there is space for the legend when plotly
    // renders. Also, include some padding.
    if (orientation === 'vertical') {
      chartSize.width -= legendSize.width + 8;
    } else {
      chartSize.height -= legendSize.height + 8;
    }

    // Have Plotly render some stuff.
    this.createPlot(
      this.getPlotlyData(),
      chartSize.height,
      chartSize.width,
      this.ref.current,
      this.props,
    );

    const showMetricsLegend =
      legendItems.metrics.length > 1 ||
      (legendItems.lines.length === 1 && legendItems.metrics.length === 1);
    return (
      <div className={`line-graph-viz line-graph-viz--legend-${orientation}`}>
        <div ref={this.ref} />
        <div
          className="line-graph-viz__legend"
          ref={this.legendResizeRegistration.setRef}
        >
          {showMetricsLegend && (
            <LineGraphLegend
              items={legendItems.metrics}
              onClick={this.onLegendMetricClick}
              onDoubleClick={this.onLegendMetricDoubleClick}
              orientation={orientation}
            />
          )}
          {legendItems.lines.length > 1 && (
            <LineGraphLegend
              className="line-graph-viz__legend-lines-section"
              items={legendItems.lines}
              onClick={this.onLegendLineClick}
              onDoubleClick={this.onLegendLineDoubleClick}
              orientation={orientation}
            />
          )}
          {legendItems.coloredBands.length > 0 && (
            <LineGraphLegend
              items={legendItems.coloredBands}
              orientation={orientation}
            />
          )}
        </div>
        {this.maybeRenderTooltip()}
      </div>
    );
  }

  render() {
    return (
      <Visualization loading={this.props.loading}>
        {this.renderPlot}
      </Visualization>
    );
  }
}

export default (withScriptLoader(LineGraph, {
  scripts: [VENDOR_SCRIPTS.plotly],
  loadingNode: <ProgressBar enabled />,
}): React.AbstractComponent<
  React.Config<Props, VisualizationDefaultProps<'TIME'>>,
>);
