// @flow
import * as React from 'react';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { Group } from '@vx/group';
import { Line, LinePath } from '@vx/shape';

import LineGraphTheme from 'components/ui/visualizations/LineGraph/models/LineGraphTheme';
import LineGraphTooltip from 'components/ui/visualizations/LineGraph/LineGraphTooltip';
import { autobind, memoizeOne } from 'decorators';
import {
  extractDate,
  extractValue,
  computeColorScale,
  computeXScale,
  computeYScale,
  createDateFormatter,
} from 'components/ui/visualizations/LineGraph/LineGraphUtil';
import type {
  TooltipData,
  DataPoint,
  DataPointWithName,
  VerticalAxisStartPoint,
  TimeSeries,
} from 'components/ui/visualizations/LineGraph/types';

type Margin = {
  top: number,
  left: number,
  right: number,
  bottom: number,
};

type Props = {|
  /**
   * The start point of the vertical axis. Can be "zero" for the vertical axis
   * to start at zero or "min" to start at the minimum data point in the dataset
   */
  verticalAxisStartPoint: VerticalAxisStartPoint,

  /** The overall height of the graph */
  height: number,

  /** The width of the graph */
  width: number,

  /**
   * The Space the graph should leave on the left, right, top and bottom of
   * the all SVG plot
   */
  margin: Margin,

  /** The data to be used to draw the line graph */
  data: $ReadOnlyArray<TimeSeries>,

  /**
   * The date format of the tooltip. For valid formats see moments docs
   * (https://momentjs.com/docs/#/parsing/string-format/)
   */
  tooltipDateFormat: string,

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

  /** The label to the date in the tooltip */
  tooltipDateLabel: string | void,

  /** The label of the value in the tooltip */
  tooltipValueLabel: string | void,
|};

type State = {
  tooltipData: TooltipData | void,
  tooltipLeft: number,
  tooltipTop: number,
  tooltipRight: number,
};

class LineGraph extends React.PureComponent<Props, State> {
  state = {
    tooltipData: undefined,
    tooltipLeft: 0,
    tooltipTop: 0,
    tooltipRight: 0,
  };

  static defaultProps = {
    tooltipDateFormat: 'MMM Do, YYYY',
    horizontalAxisDateFormat: 'MMM YYYY',
    verticalAxisStartPoint: 'zero',
    height: 400,
    margin: {
      // left and bottom a bit large to cater for axes
      bottom: 50,
      left: 90,

      // Note(Dennis) to protect bottom axis right most and left axis top most
      // labels from being clipped
      // can be removed once we switch to the  CollisionAvoidantAxis
      right: 15,
      top: 10,
    },
    onDataPointClick: undefined,
    theme: LineGraphTheme.LightTheme,
    tooltipDateLabel: undefined,
    tooltipValueLabel: undefined,
  };

  @memoizeOne
  computeXScale = computeXScale;

  @memoizeOne
  computeYScale = computeYScale;

  @memoizeOne
  computeColorScale = computeColorScale;

  @memoizeOne
  createDateFormatter = createDateFormatter;

  @autobind
  getBottomAxisTickLabelProps() {
    return {
      fill: this.props.theme.axisLabelFill(),
      fontWeight: 'bold',
      fontSize: 13,
      fontFamily: 'Lato, sans-serif',

      // default styles from vx docs
      dy: '0.25em',
      textAnchor: 'middle',
    };
  }

  @autobind
  getLeftAxisTickLabelProps() {
    return {
      fill: this.props.theme.axisLabelFill(),
      fontWeight: 'bold',
      fontSize: 13,
      fontFamily: 'Lato, sans-serif',

      // default styles from vx docs
      dx: '-0.25em',
      dy: '0.25em',
      textAnchor: 'end',
    };
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

  getColorScale() {
    return this.computeColorScale(
      this.getAllTimeSeriesNames(this.props.data),
      this.props.theme.linesColorRange(),
    );
  }

  getXScale() {
    return this.computeXScale(
      this.getAllDataPoints(this.props.data),
      this.getInnerWidth(),
    );
  }

  getYScale() {
    const { data, verticalAxisStartPoint } = this.props;
    return this.computeYScale(
      this.getAllDataPoints(data),
      this.getInnerHeight(),
      verticalAxisStartPoint,
    );
  }

  getInnerWidth() {
    const { margin, width } = this.props;
    const innerWidth = width - margin.left - margin.right;
    return innerWidth;
  }

  getInnerHeight() {
    const { margin, height } = this.props;
    const innerHeight = height - margin.top - margin.bottom;
    return innerHeight;
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

  maybeRenderToolTip() {
    const { tooltipData, tooltipLeft, tooltipTop, tooltipRight } = this.state;
    const {
      tooltipDateLabel,
      tooltipValueLabel,
      tooltipDateFormat,
    } = this.props;

    if (!tooltipData) {
      return null;
    }

    const formatDate = this.createDateFormatter(tooltipDateFormat);

    return (
      <LineGraphTooltip
        formatDate={formatDate}
        graphHeight={this.getInnerHeight()}
        graphWidth={this.getInnerWidth()}
        tooltipData={tooltipData}
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        tooltipRight={tooltipRight}
        dateLabel={tooltipDateLabel}
        valueLabel={tooltipValueLabel}
      />
    );
  }

  maybeRenderHoveredDataPointHighlight() {
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

  renderBackground() {
    return (
      <rect
        width={this.props.width}
        height={this.props.height}
        fill={this.props.theme.backgroundColor()}
      />
    );
  }

  renderDataPoint(dataPointData: DataPoint, seriesName: string): React.Node {
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
    const tooltipData = { ...dataPointData, seriesName };

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

  renderDataPoints() {
    const { data } = this.props;
    const dataPoints = data.map(series => (
      <g key={series.name}>
        {series.data.map(dataPoint =>
          this.renderDataPoint(dataPoint, series.name),
        )}
      </g>
    ));

    return <React.Fragment>{dataPoints}</React.Fragment>;
  }

  renderBottomAxis() {
    const { margin, horizontalAxisDateFormat } = this.props;
    const xScale = this.getXScale();
    const formatDate = this.createDateFormatter(horizontalAxisDateFormat);
    return (
      <AxisBottom
        scale={xScale}
        top={this.getInnerHeight() + margin.top}
        left={margin.left - margin.right}
        stroke={this.props.theme.axisLineStroke()}
        tickStroke={this.props.theme.axisTickStroke()}
        tickLabelProps={this.getBottomAxisTickLabelProps}
        tickFormat={formatDate}
      />
    );
  }

  renderLeftAxis() {
    const { margin } = this.props;
    const yScale = this.getYScale();
    return (
      <AxisLeft
        scale={yScale}
        left={margin.left - margin.right}
        top={margin.top}
        stroke={this.props.theme.axisLineStroke()}
        tickStroke={this.props.theme.axisTickStroke()}
        tickLabelProps={this.getLeftAxisTickLabelProps}
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

  render() {
    const { margin, width, height } = this.props;

    return (
      <div className="line-graph__visualization-container">
        <svg width={width} height={height}>
          {this.renderBackground()}
          <Group top={margin.top} left={margin.left - margin.right}>
            {this.renderLineGraphs()}
            {this.maybeRenderHoveredDataPointHighlight()}
            {this.renderDataPoints()}
          </Group>
          {this.renderBottomAxis()}
          {this.renderLeftAxis()}
        </svg>
        {this.maybeRenderToolTip()}
      </div>
    );
  }
}

export default LineGraph;
