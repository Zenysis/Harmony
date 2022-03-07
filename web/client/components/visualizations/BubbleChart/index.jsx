// @flow
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import ElementResizeService from 'services/ui/ElementResizeService';
import PlotlyTooltip from 'components/visualizations/common/PlotlyTooltip';
import ProgressBar from 'components/ui/ProgressBar';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  X_AXIS,
  Y1_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { Z_AXIS_NONE } from 'components/visualizations/BubbleChart/BubbleChartControlsBlock';
import { autobind, memoizeOne } from 'decorators';
import type BubbleChartQueryResultData from 'models/visualizations/BubbleChart/BubbleChartQueryResultData';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { DataPoint } from 'models/visualizations/BubbleChart/types';
import type { StyleObject } from 'types/jsCore';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type LinearRegressionData = {
  intercept: number,
  r2: number,
  slope: number,
};

type HoverData = {
  dataPointIdx: number,
  x: number,
  y: number,
};

type Props = VisualizationProps<'BUBBLE_CHART'>;
type State = {
  hoverData: HoverData | void,
};

const DEFAULT_BUBBLE_OPACITY = 1;
const DEFAULT_BUBBLE_COLOR = SERIES_COLORS[0];

const UNSIZED_BUBBLE_SIZE = 10;

// See github.com/plotly/plotly.js/blob/master/src/components/modebar/buttons.js
const PLOTLY_CONFIG = {
  modeBarButtonsToRemove: [
    'zoomIn2d',
    'zoomOut2d',
    'sendDataToCloud',
    'hoverCompareCartesian',
    'hoverClosestCartesian',
  ],
};

function _formatYIntercept(value: number): string {
  if (value >= 0) {
    return `+ ${value.toFixed(3)}`;
  }
  return `- ${Math.abs(value).toFixed(3)}`;
}

function getRadius(val: number | null, maxVal: number): number {
  return val ? Math.sqrt(4000 * (val / maxVal)) + 10 : 10;
}

function getLegendStyles(
  radius: number,
): { legendBubble: StyleObject, legendText: StyleObject } {
  const legendBubble = {
    height: `${radius}px`,
    width: `${radius}px`,
    border: '1px solid black',
    borderRadius: `${radius}px`,
    left: `${250 - (radius / 2)}px`, // prettier-ignore
    position: 'absolute',
  };
  const legendText = {
    position: 'relative',
    top: `${radius - 20}px`,
    textAlign: 'center',
  };
  return { legendBubble, legendText };
}

function calculateLinearRegression(
  y: $ReadOnlyArray<number>,
  x: $ReadOnlyArray<number>,
): LinearRegressionData {
  // Function is derived from:
  // trentrichardson.com/2010/04/06/compute-linear-regressions-in-javascript
  // Fn arguments are the list of total x and y values for a graph.
  // Returns object with properties of slope, y-intercept, and r^2.
  const n = y.length;
  let sumX = 0;
  let sumY = 0;
  let sumXy = 0;
  let sumXx = 0;
  let sumYy = 0;

  for (let i = 0; i < y.length; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXy += x[i] * y[i];
    sumXx += x[i] * x[i];
    sumYy += y[i] * y[i];
  }

  const slope = (n * sumXy - sumX * sumY) / (n * sumXx - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const r2 =
    ((n * sumXy - sumX * sumY) /
      Math.sqrt((n * sumXx - sumX * sumX) * (n * sumYy - sumY * sumY))) **
    2;

  return { intercept, r2, slope };
}

class BubbleChart extends React.PureComponent<Props, State> {
  elt: ?HTMLDivElement;
  resizeRegistration = ElementResizeService.register<HTMLDivElement>(
    this.onResize,
    (elt: HTMLDivElement | null | void) => {
      this.elt = elt;
    },
  );

  state = {
    hoverData: undefined,
  };

  componentDidMount() {
    this.createPlot();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      this.createPlot();
    }
  }

  @autobind
  createPlot() {
    if (!this.canShowScatterPlot() || !this.elt) {
      return;
    }

    window.Plotly.newPlot(
      this.elt,
      this.getGraphData(),
      this.getGraphLayout(),
      PLOTLY_CONFIG,
    );
    // Plotly attaches an `on` listener to the div element that Flow cannot
    // detect.
    // $FlowExpectedError[incompatible-use]
    // $FlowExpectedError[prop-missing]
    this.elt.on('plotly_hover', this.onHoverStart);

    // $FlowExpectedError[incompatible-use]
    // $FlowExpectedError[prop-missing]
    this.elt.on('plotly_unhover', this.onHoverEnd);
  }

  getGraphLayout(): { ... } {
    const { axesSettings, controls, seriesSettings } = this.props;
    const xAxis = axesSettings[X_AXIS]();
    const yAxis = axesSettings[Y1_AXIS]();
    const seriesObjects = seriesSettings.seriesObjects();

    const xSeries = seriesObjects[controls.xAxis()];
    const ySeries = seriesObjects[controls.yAxis()];

    const xAxisTitle = xAxis.title() || (xSeries && xSeries.label());
    const yAxisTitle = yAxis.title() || (ySeries && ySeries.label());
    return {
      font: {
        size: 14,
      },
      xaxis: {
        title: xAxisTitle || '',
        titlefont: {
          size: Number.parseInt(xAxis.titleFontSize(), 10),
        },
        rangemode: 'normal',
        zeroline: true,
        autotick: true,
        ticks: '',
        showticklabels: true,
        tickfont: {
          size: Number.parseInt(xAxis.labelsFontSize(), 10),
        },
      },
      yaxis: {
        title: yAxisTitle || '',
        titlefont: {
          size: Number.parseInt(yAxis.titleFontSize(), 10),
        },
        range: [yAxis.rangeFrom(), yAxis.rangeTo()],
        rangemode: 'normal',
        zeroline: true,
        ticks: 'inside',
        showticklabels: true,
        tickfont: {
          size: Number.parseInt(yAxis.labelsFontSize(), 10),
        },
      },
      showlegend: false,
      hovermode: 'closest',
      autosize: true,
    };
  }

  getTooltip(
    xAxis: string,
    yAxis: string,
    zAxis: string,
    dataPoint: DataPoint,
  ): string {
    return ReactDOMServer.renderToStaticMarkup(
      <span>
        {this.renderTooltipDimensionLines(dataPoint)}
        {this.maybeRenderTooltipFieldLine(xAxis, dataPoint)}
        {this.maybeRenderTooltipFieldLine(yAxis, dataPoint)}
        {this.maybeRenderTooltipFieldLine(zAxis, dataPoint)}
      </span>,
    ).replace(/<br\/>/g, '<br />'); // Plotly has a really annoying bug
    // where it doesn't recognized
    // condensed break tags (<br/>).
    // React converts all break tags into
    // the condensed version.
    // Adding a space to the tag allows
    // Plotly's regex to match correctly.
  }

  getGraphData(): $ReadOnlyArray<{ ... }> {
    const { controls, queryResult } = this.props;
    const {
      linearFit,
      resultLimit,
      xAxis,
      yAxis,
      zAxis,
    } = controls.modelValues();
    const output = [];

    // Collect the values of each DataPoint that is plotted.
    const xValues = [];
    const yValues = [];
    const colors = [];
    const sizes = [];
    const dataPointIndexes = [];

    queryResult.data().every((dataPoint, idx) => {
      const { metrics } = dataPoint;
      const xVal = metrics[xAxis];
      const yVal = metrics[yAxis];
      const zVal = metrics[zAxis];

      if (xVal !== null && yVal !== null) {
        xValues.push(xVal);
        yValues.push(yVal);
        colors.push(this.getColorForDataPoint(dataPoint));
        sizes.push(this.scaleMarkerSizeByCount(zAxis, zVal));
        dataPointIndexes.push(idx);
      }

      // Testing the output values length instead of slicing the input data to
      // match the `resultLimit`. This ensures that we display at most
      // `resultLimit` values. Sometimes, the first N values in the input data
      // array have `null` and cannot be drawn.
      return resultLimit === -1 || xValues.length < resultLimit;
    });

    output.push({
      dataPointIndexes,
      hoverinfo: 'none',
      marker: {
        color: '#fff',
        line: {
          color: colors,
          width: 1.75,
        },
        opacity: DEFAULT_BUBBLE_OPACITY,
        size: sizes,
      },
      mode: 'markers',
      x: xValues,
      y: yValues,
      yaxis: 'y',
    });

    if (linearFit) {
      const bestFitLineObj = calculateLinearRegression(yValues, xValues);
      // For each value in the cumulative x range,
      // we multiply by the slope and add the y-intercept value.
      const line = xValues.map(
        // prettier-ignore
        xVal => (xVal * bestFitLineObj.slope) + bestFitLineObj.intercept,
      );
      const yintercept = _formatYIntercept(bestFitLineObj.intercept);
      // Displaying the equation.
      // Putting the text on the second element because then we won't run into
      // cutoff issue with the numbers.
      // NOTE: Not aligned because it messes up formatting on the front-end.
      const text = [
        '',
        `R<sup>2</sup> = ${bestFitLineObj.r2.toFixed(3)}<br />
            Y = ${bestFitLineObj.slope.toFixed(3)}X ${yintercept}`,
      ];
      const bestFitLine = {
        text,
        hoverinfo: 'text',
        marker: {
          color: SERIES_COLORS[16],
        },
        mode: 'lines+text',
        textposition: 'top',
        type: 'scatter',
        x: xValues,
        y: line,
      };
      output.push(bestFitLine);
    }

    return output;
  }

  // ColorFilter requires the full list of values to be passed in when
  // evaluating what color a data point should be assigned. Memoize the
  // collection of these values since it can be costly and we might need it
  // inside a loop.
  @memoizeOne
  buildAllValuesForColorValueFilter(
    queryResult: BubbleChartQueryResultData,
    metricID: string,
  ): $ReadOnlyArray<number | null> {
    return queryResult.data().map(({ metrics }) => metrics[metricID]);
  }

  // Determine the color for the drawn point. The Z-Axis is used to determine
  // what color rules should apply to the DataPoint. Use the color filter rule
  // is set for that field if one exists, otherwise use the default color.
  // TODO(stephen, nina): Add a new control so the user can choose wich field
  // dictates the color. Potentially allow Dimensions to be selected too and
  // generate the colors from the unique values.
  getColorForDataPoint(dataPoint: DataPoint): string {
    const { controls, queryResult, seriesSettings } = this.props;
    const zAxis = controls.zAxis();
    if (zAxis === Z_AXIS_NONE) {
      return DEFAULT_BUBBLE_COLOR;
    }

    const dataActionGroup = seriesSettings.getSeriesDataActionGroup(zAxis);
    if (dataActionGroup === undefined) {
      return DEFAULT_BUBBLE_COLOR;
    }

    const value = dataPoint.metrics[zAxis];
    return (
      dataActionGroup.getValueColor(
        value,
        this.buildAllValuesForColorValueFilter(queryResult, zAxis),
      ) || DEFAULT_BUBBLE_COLOR
    );
  }

  getTransformedTextForDataPoint(
    dataPoint: DataPoint,
    fieldId: string,
  ): string | void {
    const { controls, queryResult, seriesSettings } = this.props;
    const zAxis = controls.zAxis();
    if (zAxis === Z_AXIS_NONE) {
      return undefined;
    }

    if (zAxis !== fieldId) {
      return undefined;
    }

    const dataActionGroup = seriesSettings.getSeriesDataActionGroup(zAxis);
    if (dataActionGroup === undefined) {
      return undefined;
    }

    const value = dataPoint.metrics[zAxis];
    return dataActionGroup.getTransformedText(
      value,
      this.buildAllValuesForColorValueFilter(queryResult, zAxis),
    );
  }

  scaleMarkerSizeByCount(fieldID: string, val: number | null): number {
    const maxVal = this.props.queryResult.maxValues()[fieldID];
    if (!maxVal || !Number.isFinite(maxVal)) {
      return UNSIZED_BUBBLE_SIZE;
    }
    return getRadius(val, maxVal);
  }

  canShowScatterPlot(): boolean {
    return this.props.seriesSettings.seriesOrder().length >= 2;
  }

  @memoizeOne
  buildTooltipRows(
    { dimensions, metrics }: DataPoint,
    groupBySettings: GroupBySettings,
    seriesSettings: SeriesSettings,
  ) {
    const output = [];
    groupBySettings.groupings().forEach(grouping => {
      const dimensionValue = dimensions[grouping.id()];
      if (dimensionValue !== undefined) {
        output.push({
          label: grouping.label() || '',
          value: grouping.formatGroupingValue(dimensionValue),
        });
      }
    });
    seriesSettings.seriesOrder().forEach(id => {
      const seriesObject = seriesSettings.getSeriesObject(id);
      const value = metrics[id];

      if (seriesObject !== undefined && value !== undefined) {
        output.push({
          label: seriesObject.label(),
          value:
            this.getTransformedTextForDataPoint({ dimensions, metrics }, id) ||
            seriesObject.formatFieldValue(value),
        });
      }
    });
    return output;
  }

  @autobind
  onHoverStart({
    points,
  }: {
    points: $ReadOnlyArray<{
      data: { dataPointIndexes: $ReadOnlyArray<number> },
      pointNumber: number,
      x: number,
      y: number,
    }>,
  }) {
    if (points.length === 0) {
      return;
    }
    const { data, pointNumber, x, y } = points[0];
    const { dataPointIndexes } = data;
    if (dataPointIndexes.length === 0 || dataPointIndexes === undefined) {
      return;
    }

    this.setState({
      hoverData: {
        dataPointIdx: dataPointIndexes[pointNumber],
        x,
        y,
      },
    });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined });
  }

  @autobind
  onResize() {
    if (this.elt && this.canShowScatterPlot()) {
      window.Plotly.Plots.resize(this.elt);
    }
  }

  maybeRenderReturnError() {
    if (this.canShowScatterPlot()) {
      return null;
    }

    return (
      <span>
        <h3>{t('query_result.bubblechart.error_message')}</h3>
      </span>
    );
  }

  maybeRenderTooltipFieldLine(fieldID: string, dataPoint: DataPoint) {
    const seriesObject = this.props.seriesSettings.seriesObjects()[fieldID];
    if (fieldID === 'None' || seriesObject === undefined) {
      return null;
    }

    return (
      <span>
        <br />
        <b>{seriesObject.label()}: </b>
        {seriesObject.formatFieldValue(dataPoint.metrics[fieldID])}
      </span>
    );
  }

  maybeRenderLegend() {
    const { controls, queryResult } = this.props;
    const { showLegend, zAxis } = controls.modelValues();
    if (!this.canShowScatterPlot() || !showLegend || !zAxis) {
      return null;
    }

    const maxVal = queryResult.data().reduce((currentMax, dataPoint) => {
      const val = dataPoint.metrics[zAxis] || 0;
      return Math.max(val, currentMax);
    }, 0);

    // TODO(stephen): I do not know why the logic is this way and I do not know
    // how it works. In the interest of backwards compatibility, I will leave
    // this alone for now, but it would be really useful to improve this.
    let step = 10 ** (Math.ceil(maxVal).toString().length - 1) * 4;
    if (Number(String(maxVal).charAt(0)) < 2) {
      step /= 4;
    } else if (Number(String(maxVal).charAt(0)) < 5) {
      step /= 2;
    }

    let curBubbleValue = Math.ceil(maxVal / step) * step;
    const legendBubbleValues = [curBubbleValue];
    while (curBubbleValue > step) {
      curBubbleValue -= step;
      legendBubbleValues.push(curBubbleValue);
    }

    const labelDivs = legendBubbleValues.map(val => {
      const radius = getRadius(val, maxVal);
      const { legendBubble, legendText } = getLegendStyles(radius);
      return (
        <div key={val} style={legendBubble}>
          <div style={legendText}>{val}</div>
        </div>
      );
    });

    return <div className="bubblechart-legend">{labelDivs}</div>;
  }

  maybeRenderTooltip() {
    const { hoverData } = this.state;
    if (hoverData === undefined) {
      return null;
    }

    const { groupBySettings, queryResult, seriesSettings } = this.props;
    const { dataPointIdx, x, y } = hoverData;
    const dataPoint = queryResult.data()[dataPointIdx];
    if (dataPoint === undefined) {
      return null;
    }

    const rows = this.buildTooltipRows(
      dataPoint,
      groupBySettings,
      seriesSettings,
    );

    return <PlotlyTooltip plotContainer={this.elt} rows={rows} x={x} y={y} />;
  }

  renderTooltipDimensionLines({ dimensions }: DataPoint) {
    const { groupBySettings } = this.props;
    const groupings = groupBySettings.groupings();
    return groupings.keys().map(id => {
      if (!(id in dimensions)) {
        return null;
      }

      const grouping = groupings.forceGet(id);
      return (
        <span key={id}>
          <br />
          <b>{grouping.displayLabel()}: </b>
          {grouping.formatGroupingValue(dimensions[id])}
        </span>
      );
    });
  }

  render() {
    return (
      <Visualization loading={this.props.loading}>
        <div className="bubblechart-viz" ref={this.resizeRegistration.setRef}>
          {this.maybeRenderReturnError()}
          {this.maybeRenderLegend()}
        </div>
        {this.maybeRenderTooltip()}
      </Visualization>
    );
  }
}

export default (withScriptLoader(BubbleChart, {
  scripts: [VENDOR_SCRIPTS.plotly],
  loadingNode: <ProgressBar enabled />,
}): React.AbstractComponent<
  React.Config<Props, VisualizationDefaultProps<'BUBBLE_CHART'>>,
>);
