// @flow
import * as React from 'react';
import invariant from 'invariant';

import Bar from 'components/ui/visualizations/BarGraph/internal/Bar';
import memoizeOne from 'decorators/memoizeOne';
import { noop } from 'util/util';
import type {
  DataPoint,
  Metric,
  MetricID,
  ScaleMap,
} from 'components/ui/visualizations/BarGraph/types';

// TODO(stephen): FIX THIS.
type BandScale = any;
type LinearScale = any;

type Props = {
  dataPoint: DataPoint,
  metricOrder: $ReadOnlyArray<Metric>,
  scales: ScaleMap,

  onHoverEnd: $Prop<Bar, 'onHoverEnd'>,
  onHoverStart: $Prop<Bar, 'onHoverStart'>,
  stack: boolean,
};

type BarPosition = {
  height: number,
  width: number,
  x: number,
  y: number,
};

type MetricAxisOrderMap = {
  y1Axis: $ReadOnlyArray<Metric>,
  y2Axis: $ReadOnlyArray<Metric>,
};

type StackedXAxisOffset = {
  start: number,
  width: number,
};

type HeightMap = {
  +[MetricID]: number,
};

function getBarHeight(
  dataPoint: DataPoint,
  metric: Metric,
  yScale: LinearScale,
): number {
  const value = dataPoint.metrics[metric.id];
  // Annoying flow issue where Number.isFinite should refine but doesn't.
  if (!Number.isFinite(value) || value === null) {
    return 0;
  }

  // Calculate height based on 0 value of y-scale. If we just use the chart
  // height, then we won't compute the correct height when there are both
  // positive and negative values. We need the height above (or below) the 0
  // value midpoint.
  const midpoint = yScale(0);
  const [, end] = yScale.domain();
  const yPos = yScale(value) || 0;
  if (value < 0) {
    return yPos - midpoint;
  }
  return midpoint - yScale(end) - yPos;
}

// Calculate the Y coordinate position for an individual DataPoint's metric
// value.
function buildYPosition(
  dataPoint: DataPoint,
  metrics: $ReadOnlyArray<Metric>,
  yScale: LinearScale | void,
  stack: boolean,
): HeightMap {
  const output = {};
  if (yScale === undefined) {
    return output;
  }

  // Segment bars into the positive bars on top and the negative bars on the
  // bottom.
  const midpoint = yScale(0);
  const start = {
    positive: midpoint,
    negative: midpoint,
  };

  // NOTE(stephen): Looping over metrics in reverse order. If we are stacking
  // bars, continuously update the start points with the value from the previous
  // bar. This is needed because we draw each bar above/below the previous bar
  // in the stack. If we are *not* stacking, always draw from the midpoint.
  metrics.forEach((_, idx) => {
    const metric = metrics[metrics.length - idx - 1];
    const barHeight = getBarHeight(dataPoint, metric, yScale);
    const val = dataPoint.metrics[metric.id] || 0;

    // NOTE(stephen): The coordinate system can be a little confusing. The
    // yPosition we want to return is the *top* of the bar being drawn.
    // If stacking bars, continuously update the start point so that
    let yPos;
    if (val < 0) {
      // Draw downward from the current y-position since we are negative.
      yPos = start.negative;

      if (stack) {
        start.negative = yPos + barHeight;
      }
    } else {
      // The yPosition is above the previous bar and should be calculated as
      // (previous-bar-yPosition - new-bar-height) so that the new bar when
      // drawn extends downwards to meet the previous bar.
      yPos = start.positive - barHeight;

      if (stack) {
        start.positive = yPos;
      }
    }
    output[metric.id] = yPos;
  });

  return output;
}

export default class BarGroup extends React.PureComponent<Props> {
  static defaultProps = {
    onHoverEnd: noop,
    onHoverStart: noop,
    stack: false,
  };

  // Split the metrics into ordered arrays based on the axis they should be
  // drawn on.
  @memoizeOne
  buildMetricOrderByAxis(
    metricOrder: $ReadOnlyArray<Metric>,
  ): MetricAxisOrderMap {
    const output = {
      y1Axis: [],
      y2Axis: [],
    };
    // $FlowIssue - Flow deduces the type of output which is read-only.
    metricOrder.forEach(metric => output[metric.axis].push(metric));
    return output;
  }

  getMetricOrderByAxis(): MetricAxisOrderMap {
    return this.buildMetricOrderByAxis(this.props.metricOrder);
  }

  // Calculate the offset start and width for the stacked bar groups. If there
  // are values on both y-axes, the width should be half of the full width.
  buildStackedXAxisOffset(
    barScale: BandScale,
    hasDualYAxis: boolean,
  ): StackedXAxisOffset {
    const domain = barScale.domain();
    const start = barScale(domain[0]);
    const bandwidth = barScale.bandwidth();
    if (domain.length === 1) {
      return { start, width: bandwidth };
    }
    const end = barScale(domain[domain.length - 1]) + bandwidth;
    const fullWidth = end - start;
    return {
      start,
      width: hasDualYAxis ? fullWidth / 2 : fullWidth,
    };
  }

  getStackedXAxisOffset(): StackedXAxisOffset {
    return this.buildStackedXAxisOffset(
      this.props.scales.barScale,
      this.hasDualYAxis(),
    );
  }

  // Compute the Y coordinate position for the given metric.
  @memoizeOne
  buildBarYPositions(
    dataPoint: DataPoint,
    metricsByAxis: MetricAxisOrderMap,
    scales: ScaleMap,
    stack: boolean,
  ): HeightMap {
    return {
      ...buildYPosition(dataPoint, metricsByAxis.y1Axis, scales.y1Scale, stack),
      ...buildYPosition(dataPoint, metricsByAxis.y2Axis, scales.y2Scale, stack),
    };
  }

  getBarYPosition(metric: Metric) {
    const { dataPoint, scales, stack } = this.props;
    const barYPositions = this.buildBarYPositions(
      dataPoint,
      this.getMetricOrderByAxis(),
      scales,
      stack,
    );
    return barYPositions[metric.id];
  }

  // Check if metrics exist on both the Y1 and Y2 axes.
  hasDualYAxis(): boolean {
    const metricsByAxis = this.getMetricOrderByAxis();
    return metricsByAxis.y1Axis.length > 0 && metricsByAxis.y2Axis.length > 0;
  }

  // Compute the width/height and x/y position for an individual bar within
  // the group.
  getBarPosition(
    dataPoint: DataPoint,
    metric: Metric,
    barScale: BandScale,
    yScale: LinearScale,
  ): BarPosition {
    const barHeight = getBarHeight(dataPoint, metric, yScale);
    const yPos = this.getBarYPosition(metric);
    if (!this.props.stack) {
      return {
        height: barHeight,
        width: barScale.bandwidth(),
        x: barScale(metric.id),
        y: yPos,
      };
    }

    const { start, width } = this.getStackedXAxisOffset();
    const dualAxis = this.hasDualYAxis();
    const xPos = dualAxis && metric.axis === 'y2Axis' ? start + width : start;
    return {
      width,
      height: barHeight,
      x: xPos,
      y: yPos,
    };
  }

  renderBar(metric: Metric): React.Element<typeof Bar> {
    const { dataPoint, onHoverEnd, onHoverStart, scales, stack } = this.props;
    const { barScale, y1Scale, y2Scale } = scales;
    const yScale = metric.axis === 'y1Axis' ? y1Scale : y2Scale;
    invariant(yScale !== undefined, 'yScale cannot be missing');

    const position = this.getBarPosition(dataPoint, metric, barScale, yScale);
    return (
      <Bar
        key={metric.id}
        dataPoint={dataPoint}
        fill={metric.color}
        metric={metric}
        onHoverEnd={onHoverEnd}
        onHoverStart={onHoverStart}
        rx={stack ? 0 : 2}
        {...position}
      />
    );
  }

  render(): $ReadOnlyArray<React.Element<typeof Bar>> {
    return this.props.metricOrder.map(metric => this.renderBar(metric));
  }
}
