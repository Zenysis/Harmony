// @flow
import * as React from 'react';
import { AxisBottom } from '@vx/axis';
import { Line, LinePath } from '@vx/shape';

import LineGraphTheme from 'components/ui/visualizations/LineGraph/models/LineGraphTheme';
import LineGraphTooltip from 'components/ui/visualizations/LineGraph/internal/LineGraphTooltip';
import MetricAxis from 'components/ui/visualizations/common/MetricAxis';
import ResponsiveContainer from 'components/ui/visualizations/common/ResponsiveContainer';
import { autobind, memoizeOne } from 'decorators';
import {
  extractDate,
  extractValue,
  computeColorScale,
  computeXScale,
  computeYScale,
  createDateFormatter,
} from 'components/ui/visualizations/LineGraph/LineGraphUtil';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';
import type {
  TooltipData,
  DataPoint,
  DataPointWithName,
  VerticalAxisStartPoint,
  TimeSeries,
} from 'components/ui/visualizations/LineGraph/types';

type DefaultProps = {
  /**
   * Goal lines to display on the line graph
   */
  goalLines: $ReadOnlyArray<GoalLineData>,

  /** The overall height of the graph */
  height: number,

  /**
   * The date format of the horizontal axis. For valid formats see moments docs
   * (https://momentjs.com/docs/#/parsing/string-format/)
   */
  horizontalAxisDateFormat: string,

  /**
   * A function to run when a data point is clicked.
   * It receives the data point details of the clicked data point
   */
  onDataPointClick: void | ((data: DataPointWithName) => void),

  /** The visualization color theme  */
  theme: LineGraphTheme,

  /**
   * The date format of the tooltip. For valid formats see moments docs
   * (https://momentjs.com/docs/#/parsing/string-format/)
   */
  tooltipDateFormat: string,

  /** The label to the date in the tooltip */
  tooltipDateLabel: string | void,

  /** Function to format a tooltip value */
  tooltipValueFormatter: (value: number) => number | string,

  /** The label of the value in the tooltip */
  tooltipValueLabel: string | void,

  /**
   * The start point of the vertical axis. Can be "zero" for the vertical axis
   * to start at zero or "min" to start at the minimum data point in the dataset
   */
  verticalAxisStartPoint: VerticalAxisStartPoint,

  /** Text for the x axis label */
  xAxisLabel: string | void,

  /** Text for the y axis label */
  yAxisLabel: string | void,
};

type Props = {
  ...DefaultProps,

  /** The data to be used to draw the line graph */
  data: $ReadOnlyArray<TimeSeries>,

  /** The width of the graph */
  width: number,
};

type State = {
  innerChartSize: ChartSize,
  tooltipData: TooltipData | void,
  tooltipLeft: number,
  tooltipTop: number,
  tooltipRight: number,
};

const LABEL_FONT_SIZE = 13;
const LABEL_FONT = 'Lato, sans-serif';

class LineGraph extends React.PureComponent<Props, State> {
  state: State = {
    innerChartSize: {
      height: 10,
      width: 10,
    },
    tooltipData: undefined,
    tooltipLeft: 0,
    tooltipTop: 0,
    tooltipRight: 0,
  };

  static defaultProps: DefaultProps = {
    goalLines: [],
    height: 400,
    horizontalAxisDateFormat: 'MMM YYYY',
    onDataPointClick: undefined,
    theme: LineGraphTheme.LightTheme,
    tooltipDateFormat: 'MMM Do, YYYY',
    tooltipDateLabel: undefined,
    tooltipValueFormatter: (value: number) => value,
    tooltipValueLabel: undefined,
    verticalAxisStartPoint: 'zero',
    xAxisLabel: undefined,
    yAxisLabel: undefined,
  };

  @memoizeOne
  computeXScale: typeof computeXScale = computeXScale;

  @memoizeOne
  computeYScale: typeof computeYScale = computeYScale;

  @memoizeOne
  computeColorScale: typeof computeColorScale = computeColorScale;

  @memoizeOne
  createDateFormatter: typeof createDateFormatter = createDateFormatter;

  @memoizeOne
  buildYScale(
    data: $ReadOnlyArray<TimeSeries>,
    goalLines: $ReadOnlyArray<GoalLineData>,
    innerChartHeight: number,
    verticalAxisStartPoint: VerticalAxisStartPoint,
  ): $FlowTODO {
    // We include the goal lines as data points to ensure that they are
    // included in axis scale
    const goalLineDataPoints = goalLines.map(goalLine => ({
      value: goalLine.value,
      date: new Date(),
    }));

    const dataPoints = [...this.getAllDataPoints(data), ...goalLineDataPoints];

    return computeYScale(dataPoints, innerChartHeight, verticalAxisStartPoint);
  }

  @memoizeOne
  buildAxisLabelProps(theme: LineGraphTheme): { ... } {
    return {
      textAnchor: 'middle',
      fontFamily: LABEL_FONT,
      fontSize: LABEL_FONT_SIZE,
      fill: theme.axisLabelFill(),
    };
  }

  @memoizeOne
  buildLeftAxisTickLabelProps(theme: LineGraphTheme): { ... } {
    return {
      fill: theme.axisLabelFill(),
      fontWeight: 'bold',
      fontSize: LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT,

      // default styles from vx docs
      dx: '-0.25em',
      dy: '0.25em',
      textAnchor: 'end',
    };
  }

  @memoizeOne
  buildBottomAxisTickLabelProps(theme: LineGraphTheme): { ... } {
    return {
      fill: theme.axisLabelFill(),
      fontWeight: 'bold',
      fontSize: LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT,

      // default styles from vx docs
      dy: '0.25em',
      textAnchor: 'middle',
    };
  }

  @memoizeOne
  buildBackgroundProps(theme: LineGraphTheme): { +fill: string } {
    return { fill: theme.backgroundColor() };
  }

  getAxisLabelProps(): { ... } {
    return this.buildAxisLabelProps(this.props.theme);
  }

  getBackgroundProps(): { +fill: string } {
    return this.buildBackgroundProps(this.props.theme);
  }

  @autobind
  getBottomAxisTickLabelProps(): { ... } {
    return this.buildBottomAxisTickLabelProps(this.props.theme);
  }

  getLeftAxisTickLabelProps(): { ... } {
    return this.buildLeftAxisTickLabelProps(this.props.theme);
  }

  @memoizeOne
  getAllDataPoints(
    timeSeries: $ReadOnlyArray<TimeSeries>,
  ): $ReadOnlyArray<DataPoint> {
    const dataPoints = [];
    timeSeries.forEach(series => {
      dataPoints.push(...series.data);
    });
    return dataPoints;
  }

  @memoizeOne
  getAllTimeSeriesNames(
    timeSeries: $ReadOnlyArray<TimeSeries>,
  ): $ReadOnlyArray<string> {
    return timeSeries.map(series => series.name);
  }

  @memoizeOne
  getY1AxisGoalLines(
    goalLines: $ReadOnlyArray<GoalLineData>,
  ): $ReadOnlyArray<GoalLineData> {
    // NOTE(david): Currently the line graph only has one y axis so this should
    // be all goal lines. In future we will likely add a y2axis.
    return goalLines.filter(goalLine => goalLine.axis === 'y1Axis');
  }

  getColorScale(): $FlowTODO {
    return this.computeColorScale(
      this.getAllTimeSeriesNames(this.props.data),
      this.props.theme.linesColorRange(),
    );
  }

  getXScale(): $FlowTODO {
    return this.computeXScale(
      this.getAllDataPoints(this.props.data),
      this.state.innerChartSize.width,
    );
  }

  getYScale(): $FlowTODO {
    const { data, goalLines, verticalAxisStartPoint } = this.props;
    const { innerChartSize } = this.state;

    return this.buildYScale(
      data,
      this.getY1AxisGoalLines(goalLines),
      innerChartSize.height,
      verticalAxisStartPoint,
    );
  }

  @autobind
  onDataPointMouseLeave() {
    this.setState({
      tooltipData: undefined,
      tooltipLeft: 0,
      tooltipTop: 0,
      tooltipRight: 0,
    });
  }

  @autobind
  onInnerChartResize(height: number, width: number) {
    this.setState({ innerChartSize: { height, width } });
  }

  maybeRenderToolTip(): React.Node {
    const {
      innerChartSize,
      tooltipData,
      tooltipLeft,
      tooltipTop,
      tooltipRight,
    } = this.state;
    const {
      tooltipDateLabel,
      tooltipValueLabel,
      tooltipValueFormatter,
      tooltipDateFormat,
    } = this.props;

    if (!tooltipData) {
      return null;
    }

    const formatDate = this.createDateFormatter(tooltipDateFormat);

    return (
      <LineGraphTooltip
        formatDate={formatDate}
        formatValue={tooltipValueFormatter}
        graphHeight={innerChartSize.height}
        graphWidth={innerChartSize.width}
        tooltipData={tooltipData}
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        tooltipRight={tooltipRight}
        dateLabel={tooltipDateLabel}
        valueLabel={tooltipValueLabel}
      />
    );
  }

  maybeRenderHoveredDataPointHighlight(): React.Node {
    const { tooltipLeft, tooltipData, tooltipTop } = this.state;

    if (!tooltipData) {
      return null;
    }

    const yScale = this.getYScale();
    const colorScale = this.getColorScale();
    const [minCount, maxCount] = yScale.range();

    return (
      <React.Fragment>
        <Line
          from={{ x: tooltipLeft, y: maxCount }}
          to={{ x: tooltipLeft, y: minCount }}
          stroke={colorScale(tooltipData.seriesName)}
          strokeDasharray="2 2"
        />
        <circle
          r="6"
          cx={tooltipLeft}
          cy={tooltipTop}
          fill={colorScale(tooltipData.seriesName)}
          fillOpacity="0.4"
          className="line-graph__data-point-highlight"
        />
      </React.Fragment>
    );
  }

  renderDataPoint(
    dataPointData: DataPoint,
    seriesName: string,
    seriesDimensions: $ReadOnly<{
      [dimensionName: string]: string | null,
      ...,
    }>,
  ): React.Node {
    const { onDataPointClick } = this.props;
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const colorScale = this.getColorScale();
    const xCoordinate = xScale(extractDate(dataPointData));
    const yCoordinate = yScale(extractValue(dataPointData));
    const maxXCoordinate = xScale.range()[1];
    const key = `${seriesName}-${extractDate(
      dataPointData,
    ).toDateString()}-${extractValue(dataPointData)}`;
    const tooltipData = { ...dataPointData, seriesDimensions, seriesName };

    return (
      <g key={key}>
        <circle
          r={3}
          cx={xCoordinate}
          cy={yCoordinate}
          fill={colorScale(seriesName)}
        />
        {/**
         * The circle below is invisible but exists to increase the hover over
         * area for a better user experience
         */}
        <circle
          r={6}
          cx={xCoordinate}
          cy={yCoordinate}
          fill="transparent"
          className="line-graph__data-point-overlay"
          onMouseEnter={() => {
            this.setState({
              tooltipData,
              tooltipLeft: xCoordinate,
              tooltipTop: yCoordinate,
              tooltipRight: maxXCoordinate - xCoordinate,
            });
          }}
          onMouseLeave={this.onDataPointMouseLeave}
          onClick={() => {
            if (onDataPointClick) {
              onDataPointClick(tooltipData);
            }
          }}
        />
      </g>
    );
  }

  renderDataPoints(): React.Node {
    const { data } = this.props;
    const dataPoints = data.map(series => (
      <g key={series.name}>
        {series.data.map(dataPoint =>
          this.renderDataPoint(dataPoint, series.name, series.dimensions),
        )}
      </g>
    ));

    return <React.Fragment>{dataPoints}</React.Fragment>;
  }

  renderBottomAxis(): React.Element<typeof AxisBottom> {
    const { horizontalAxisDateFormat, theme, xAxisLabel } = this.props;
    const xScale = this.getXScale();
    const formatDate = this.createDateFormatter(horizontalAxisDateFormat);
    return (
      <AxisBottom
        label={xAxisLabel}
        labelOffset={16}
        labelProps={this.getAxisLabelProps()}
        scale={xScale}
        stroke={theme.axisLineStroke()}
        tickFormat={formatDate}
        tickLabelProps={this.getBottomAxisTickLabelProps}
        tickStroke={theme.axisTickStroke()}
      />
    );
  }

  @autobind
  renderLeftAxis(
    innerRef: (React.ElementRef<'g'> | null) => void,
  ): React.Element<typeof MetricAxis> {
    const { goalLines, theme, yAxisLabel } = this.props;
    const { innerChartSize } = this.state;
    const yScale = this.getYScale();
    const leftAxisGoalLines = this.getY1AxisGoalLines(goalLines);

    return (
      <MetricAxis
        axisOrientation="left"
        chartWidth={innerChartSize.width}
        goalLines={leftAxisGoalLines}
        height={innerChartSize.height}
        innerRef={innerRef}
        stroke={theme.axisLineStroke()}
        tickColor={theme.axisTickStroke()}
        tickLabelProps={this.getLeftAxisTickLabelProps()}
        title={yAxisLabel}
        titleLabelProps={this.getAxisLabelProps()}
        yScale={yScale}
      />
    );
  }

  renderLineGraphs(): React.Node {
    const { data } = this.props;
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const colorScale = this.getColorScale();

    const lineGraphs = data.map(series => (
      <LinePath
        key={series.name}
        data={series.data}
        x={d => xScale(extractDate(d))}
        y={d => yScale(extractValue(d))}
        stroke={colorScale(series.name)}
      />
    ));

    return lineGraphs;
  }

  renderInnerChart(): React.Element<'g'> {
    return (
      <g>
        {this.renderLineGraphs()}
        {this.maybeRenderHoveredDataPointHighlight()}
        {this.renderDataPoints()}
      </g>
    );
  }

  render(): React.Element<'div'> {
    const { width, height } = this.props;

    return (
      <div className="line-graph__visualization-container">
        <ResponsiveContainer
          axisBottom={this.renderBottomAxis()}
          axisLeft={this.renderLeftAxis}
          backgroundProps={this.getBackgroundProps()}
          chart={this.renderInnerChart()}
          height={height}
          onChartResize={this.onInnerChartResize}
          width={width}
        />
        {this.maybeRenderToolTip()}
      </div>
    );
  }
}

export default LineGraph;
