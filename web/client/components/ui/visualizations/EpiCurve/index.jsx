// @flow
import * as React from 'react';
import {
  AxisBottom as AxisBottomOriginal,
  AxisLeft as AxisLeftOriginal,
} from '@vx/axis';
import { scaleBand, scaleLinear } from '@vx/scale';

import EpiCurveTooltip from 'components/ui/visualizations/EpiCurve/internal/EpiCurveToolTip';
import ResponsiveContainer from 'components/ui/visualizations/common/ResponsiveContainer';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';
import { autobind, memoizeOne } from 'decorators';
// TODO(sophie): consider using full MetricAxis component
import { getNiceTickCount } from 'components/ui/visualizations/common/MetricAxis';
import type {
  AxisTickLabelProps,
  BarStyle,
  Bucket,
  DimensionID,
  EpiCurveTheme,
  MetricID,
  Padding,
} from 'components/ui/visualizations/EpiCurve/types';
import type { ChartSize, HoverPoint } from 'components/ui/visualizations/types';

// TODO(sophie): fix once scale types are defined
type BandScale = $FlowTODO;
type LinearScale = $FlowTODO;

type Props = {
  /* Data required to draw the histogram, buckets must be in sorted order */
  data: $ReadOnlyArray<Bucket>,
  height: number,
  width: number,

  axisTitles: {
    xAxis: string,
    yAxis: string,
  },
  metricFormatter: (metricID: MetricID) => string,
  metricValueFormatter: (
    metricID: MetricID,
    metricValue: number | null,
  ) => string,
  // metricValueFormatter: (number | null ) => string,
  // Adjusts the padding for the entire visualization to prevent bottom axis
  // tick labels and bar value labels from getting cut off
  padding: Padding,
  showValue: boolean,
  /* Formats the bottom axis dimension (currently only time) */
  timeFormatter: DimensionID => string,
  theme: EpiCurveTheme,
};

type State = {
  innerChartSize: ChartSize,

  /** The data to show in the tooltip */
  tooltipData: {
    bucket: Bucket,
    point: HoverPoint,
  } | void,
};

export const DEFAULT_THEME: EpiCurveTheme = {
  // NOTE(sophie): epicurve only displays one series so all bars have the same
  // styling; once multi-series are introduced, update this
  barStyle: {
    fill: SERIES_COLORS[0],
    fillOpacity: 1,
    stroke: SERIES_COLORS[0],
    strokeOpacity: 1,
  },
  valueAngle: -45,
  valueFontSize: 12,
  xAxis: {
    tickLabelProps: {
      angle: 45,
      dx: '-0.5em',
      dy: '-0.25em',
      fill: '#000000',
      fontSize: 12,
      textAnchor: 'start',
      verticalAnchor: 'end',
    },
    titleLabelProps: {
      fill: 'black',
      fontSize: '12px',
    },
  },
  yAxis: {
    tickLabelProps: {
      angle: 0,
      dx: '-0.25em',
      dy: '0.25em',
      fill: '#000000',
      fontSize: '12px',
      textAnchor: 'end',
      verticalAnchor: 'end',
    },
    titleLabelProps: {
      fill: 'black',
      fontSize: '12px',
    },
  },
};

const CONTAINER_STYLE = {
  position: 'relative',
};

// Convert the functional Axis components to PureComponents so that we don't
// needlessly rerender all the Text nodes (which are quite nonperformant).
const AxisBottom = (React.memo(AxisBottomOriginal): React.AbstractComponent<
  React.ElementConfig<typeof AxisBottomOriginal>,
>);

const AxisLeft = (React.memo(AxisLeftOriginal): React.AbstractComponent<
  React.ElementConfig<typeof AxisLeftOriginal>,
>);

export default class EpiCurveCore extends React.PureComponent<Props, State> {
  static defaultProps: $AllowZenModelDefaultProp = {
    axisTitles: {
      xAxis: '',
      yAxis: '',
    },
    metricFormatter: (metricID: MetricID) => metricID,
    metricValueFormatter: (metricID: string, value: number) => String(value),
    padding: {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
    },
    showValue: false,
    theme: DEFAULT_THEME,
    timeFormatter: (time: DimensionID) => time,
  };

  state: State = {
    tooltipData: undefined,
    innerChartSize: {
      height: 10,
      width: 10,
    },
  };

  @memoizeOne
  computeXScale(data: $ReadOnlyArray<Bucket>, graphWidth: number): BandScale {
    const domainBuckets = data.map(bucket => bucket.timestamp);
    const scale = scaleBand({
      domain: domainBuckets,
      range: [0, graphWidth],
    });

    return scale;
  }

  @memoizeOne
  computeYScale(
    data: $ReadOnlyArray<Bucket>,
    graphHeight: number,
  ): LinearScale {
    let maxValue = Number.NEGATIVE_INFINITY;
    let minValue = 0;
    data.forEach(({ bars }: Bucket) => {
      bars.forEach(({ metrics }) => {
        Object.keys(metrics).forEach(metricId => {
          const value = metrics[metricId] || 0;
          if (value > maxValue) {
            maxValue = value;
          }
          if (value < minValue) {
            minValue = value;
          }
        });
      });
    });
    const scale = scaleLinear({
      domain: [minValue, maxValue],
      // maps from top of window to bottom
      range: [graphHeight, 0],
    }).nice(getNiceTickCount(graphHeight));
    return scale;
  }

  getInnerWidth(): number {
    return this.state.innerChartSize.width;
  }

  getInnerHeight(): number {
    return this.state.innerChartSize.height;
  }

  getXScale(): BandScale {
    return this.computeXScale(this.props.data, this.getInnerWidth());
  }

  getYScale(): LinearScale {
    return this.computeYScale(this.props.data, this.getInnerHeight());
  }

  @autobind
  getLeftAxisTickLabelProps(): AxisTickLabelProps {
    return this.props.theme.yAxis.tickLabelProps;
  }

  @autobind
  getBottomAxisTickLabelProps(): AxisTickLabelProps {
    return this.props.theme.xAxis.tickLabelProps;
  }

  // NOTE(sophie): right padding added because the responsive container doesn't
  // account for the full width of the bottom axis ticks; top padding added so
  // that the bar value labels don't get cut off
  getPadding(): Padding {
    const { padding, showValue } = this.props;
    // HACK(sophie): approximate values to display text with width <= 40px
    const offsetTop = showValue ? 20 : 0;
    const offsetRight = this.getXScale().bandwidth() < 50 ? 30 : 0;
    return {
      ...padding,
      right: padding.right + offsetRight,
      top: padding.top + offsetTop,
    };
  }

  getBarStyle(timestamp: string): BarStyle {
    const { barStyle } = this.props.theme;
    const { tooltipData } = this.state;
    // style stays the same when no bars are being hovered and for the bar that
    // is being hovered
    if (
      tooltipData === undefined ||
      timestamp === tooltipData.bucket.timestamp
    ) {
      return barStyle;
    }
    // fade bars that are not being hovered
    const opacityOffset = -0.25;
    return {
      ...barStyle,
      fillOpacity: barStyle.fillOpacity + opacityOffset,
      // HACK(sophie): make borders low opacity so they blend into bar
      strokeOpacity: 0.1,
    };
  }

  @autobind
  onInnerChartResize(height: number, width: number) {
    this.setState(prevState => {
      const prevWidth = prevState.innerChartSize.width;
      const prevHeight = prevState.innerChartSize.height;
      if (prevWidth === width && prevHeight === height) {
        return prevState;
      }
      return {
        innerChartSize: { height, width },
      };
    });
  }

  @autobind
  onHoverEnd() {
    this.setState({
      tooltipData: undefined,
    });
  }

  @autobind
  onHoverStart(bucket: Bucket, event: SyntheticMouseEvent<SVGElement>) {
    const { offsetX, offsetY } = event.nativeEvent;
    this.setState({
      tooltipData: {
        bucket,
        point: {
          x: offsetX,
          y: offsetY,
        },
      },
    });
  }

  maybeRenderTooltip(): React.Node {
    const { tooltipData } = this.state;
    if (!tooltipData) {
      return null;
    }

    const { metricFormatter, metricValueFormatter, timeFormatter } = this.props;
    return (
      <EpiCurveTooltip
        metricFormatter={metricFormatter}
        metricValueFormatter={metricValueFormatter}
        timeFormatter={timeFormatter}
        tooltipData={tooltipData}
      />
    );
  }

  maybeRenderValue(
    metric: MetricID,
    value: number | null,
    timestamp: string,
  ): React.Node {
    const { metricValueFormatter, showValue, theme } = this.props;
    if (!showValue) {
      return null;
    }
    const { valueAngle } = theme;
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    // anchor text at the middle of the top of the bar
    const x = xScale(timestamp) + xScale.bandwidth() / 2;
    const y = yScale(value);
    return (
      <text
        fontSize={theme.valueFontSize}
        textAnchor="start"
        transform={`rotate(${valueAngle}, ${x}, ${y})`}
        x={x}
        y={y}
      >
        {metricValueFormatter(metric, value)}
      </text>
    );
  }

  renderAxisBottom(): React.Element<typeof AxisBottom> {
    // TODO(sophie): add collision detection for labels
    const { axisTitles, timeFormatter, theme } = this.props;
    const xScale = this.getXScale();
    const xAxisSettings = theme.xAxis;
    return (
      <AxisBottom
        label={axisTitles.xAxis}
        labelProps={xAxisSettings.titleLabelProps}
        labelOffset={50}
        scale={xScale}
        tickFormat={timeFormatter}
        tickLabelProps={this.getBottomAxisTickLabelProps}
      />
    );
  }

  renderAxisLeft(): React.Element<typeof AxisLeft> {
    const { axisTitles, theme } = this.props;
    const yScale = this.getYScale();
    const yAxisSettings = theme.yAxis;
    return (
      <AxisLeft
        label={axisTitles.yAxis}
        labelProps={yAxisSettings.titleLabelProps}
        labelOffset={70}
        scale={yScale}
        tickLabelProps={this.getLeftAxisTickLabelProps}
      />
    );
  }

  renderBar(value: number | null, bucket: Bucket): React.Element<'rect'> {
    const { timestamp } = bucket;
    const barStyle = this.getBarStyle(timestamp);
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const binWidth = xScale.bandwidth();
    const yValue = yScale(value);
    const binHeight = this.getInnerHeight() - yValue;
    const key = `${yValue}-${timestamp}`;
    const transform = `translate(${xScale(timestamp)},${yValue})`;

    return (
      <rect
        key={key}
        {...barStyle}
        height={binHeight}
        onMouseLeave={this.onHoverEnd}
        onMouseMove={event => this.onHoverStart(bucket, event)}
        transform={transform}
        width={binWidth}
      />
    );
  }

  // render all bars for a given timestamp
  renderBucket(bucket: Bucket): React.Node {
    const { timestamp, bars } = bucket;
    return bars.map(({ metrics }) =>
      Object.keys(metrics).map(metric => {
        const value = metrics[metric];
        return (
          <React.Fragment key={timestamp}>
            {this.renderBar(value, bucket)}
            {this.maybeRenderValue(metric, value, timestamp)}
          </React.Fragment>
        );
      }),
    );
  }

  renderInnerChart(): React.Element<'g'> {
    const { data } = this.props;
    // NOTE(sophie): Render the bars in reverse order to ensure that text
    // annotations do not get covered up by a subsequent bar.
    return (
      <g>
        {data.map((_, idx) => this.renderBucket(data[data.length - idx - 1]))}
      </g>
    );
  }

  renderGraph(): React.Node {
    const { height, width } = this.props;
    return (
      <ResponsiveContainer
        axisBottom={this.renderAxisBottom()}
        axisLeft={this.renderAxisLeft()}
        chart={this.renderInnerChart()}
        height={height}
        onChartResize={this.onInnerChartResize}
        padding={this.getPadding()}
        width={width}
      />
    );
  }

  render(): React.Element<'div'> {
    return (
      <div className="epi-curve" style={CONTAINER_STYLE}>
        {this.renderGraph()}
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}
