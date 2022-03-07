// @flow
import * as React from 'react';

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
type BandScale = $FlowTODO;
type LinearScale = $FlowTODO;

type DefaultProps = {
  barTreatment: 'overlaid' | 'overlapping' | 'sequential' | 'stacked',

  // Enable displaying of bar values if the Metric has been marked to show the
  // value.
  enableValueDisplay: boolean,
  minBarHeight: number,
  onHoverEnd: (SyntheticMouseEvent<SVGElement>) => void,
  onHoverStart: (DataPoint, Metric, SyntheticMouseEvent<SVGElement>) => void,
};

type Props = {
  ...DefaultProps,
  barDirection: 'horizontal' | 'vertical',
  dataPoint: DataPoint,
  metricOrder: $ReadOnlyArray<Metric>,
  scales: ScaleMap,
  stroke: string,
  strokeWidth: number,
};

type HorizontalPosition = {
  width: number,
  x: number,
};

type VerticalPosition = {
  height: number,
  y: number,
};

type BarPosition = { ...HorizontalPosition, ...VerticalPosition };

type MetricAxisOrderMap = {
  y1Axis: $ReadOnlyArray<Metric>,
  y2Axis: $ReadOnlyArray<Metric>,
};

type StackedXAxisOffset = {
  start: number,
  width: number,
};

type VerticalPositionMap = {
  +[MetricID]: VerticalPosition,
  ...,
};

type OverlappingBarsPositionMap = {
  +[MetricID]: HorizontalPosition,
  ...,
};

function getBarHeight(
  dataPoint: DataPoint,
  metric: Metric,
  yScale: LinearScale,
  midpoint: number,
  end: number,
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
  const yPos = yScale(value) || 0;
  if (value < 0) {
    return yPos - midpoint;
  }
  return midpoint - end - yPos;
}

// Calculate the Y coordinate position and bar height for an individual
// DataPoint's metric value.
function buildVerticalPosition(
  dataPoint: DataPoint,
  metrics: $ReadOnlyArray<Metric>,
  yScale: LinearScale | void,
  stack: boolean,
  minBarHeight: number,
): VerticalPositionMap {
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

  const [, endValue] = yScale.domain();
  const end = yScale(endValue);

  // NOTE(stephen): If we are stacking bars, continuously update the start
  // points with the value from the previous bar. This is needed because we
  // draw each bar above/below the previous bar in the stack. If we are
  // *not* stacking, always draw from the midpoint.
  metrics.forEach((_, idx) => {
    const metric = metrics[idx];
    const barHeight = Math.max(
      getBarHeight(dataPoint, metric, yScale, midpoint, end),
      minBarHeight,
    );
    const val = dataPoint.metrics[metric.id] || 0;

    // NOTE(stephen): The coordinate system can be a little confusing. The
    // yPosition we want to return is the *top* of the bar being drawn.
    // If stacking bars, continuously update the start point so that
    // NOTE(stephen): If the bar height was clambed to the minimum height, and
    // all values on this axis are negative, then draw the bar downwards, in the
    // negative direction. Otherwise, draw the bar upwards.
    let yPos;
    if (val < 0 || (barHeight === minBarHeight && midpoint === 0)) {
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
    output[metric.id] = {
      height: barHeight,
      y: yPos,
    };
  });

  return output;
}

// Sort two values where the largest absolute value will come before the
// smallest absolute value. Null values will come last.
function sortAbsoluteHighToLow(a: number | null, b: number | null) {
  if (a === b) {
    return 0;
  }

  if (a === null || b === null) {
    return a !== null ? -1 : 1;
  }

  return Math.abs(a) > Math.abs(b) ? -1 : 1;
}

export default class BarGroup extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    barTreatment: 'sequential',
    enableValueDisplay: true,
    minBarHeight: 2,
    onHoverEnd: noop,
    onHoverStart: noop,
  };

  // Split the metrics into ordered arrays based on the axis they should be
  // drawn on. If a data point is provided, sort the metrics by value from
  // largest to smallest.
  @memoizeOne
  buildMetricOrderByAxis(
    metricOrder: $ReadOnlyArray<Metric>,
    dataPoint: DataPoint | void,
  ): MetricAxisOrderMap {
    const output = {
      y1Axis: [],
      y2Axis: [],
    };
    metricOrder.forEach(metric => output[metric.axis].push(metric));

    // When a data point is provided, order the metrics such that the tallest
    // bar is drawn first, and the shortest bar is drawn last.
    if (dataPoint !== undefined) {
      // NOTE(stephen): Taking the absolute value since we care about bar
      // length.
      const { metrics } = dataPoint;
      output.y1Axis.sort((a, b) =>
        sortAbsoluteHighToLow(metrics[a.id], metrics[b.id]),
      );
      output.y2Axis.sort((a, b) =>
        sortAbsoluteHighToLow(metrics[a.id], metrics[b.id]),
      );
    }

    return output;
  }

  getMetricOrderByAxis(): MetricAxisOrderMap {
    const { barTreatment, dataPoint, metricOrder } = this.props;

    // If the bar treatment is overlaid, we need to draw the bars in order from
    // largest metric value to smallest value.
    return this.buildMetricOrderByAxis(
      metricOrder,
      barTreatment === 'overlaid' ? dataPoint : undefined,
    );
  }

  // Calculate the offset start and width for the stacked bar groups. If there
  // are values on both y-axes, the width should be half of the full width.
  @memoizeOne
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

  // Calculate the width and x position for all metrics such that each metric's
  // bar will be overlapping and inset with the previous metric's bar.
  @memoizeOne
  buildOverlappingBarsPositionMap(
    barScale: BandScale,
    metricOrder: $ReadOnlyArray<Metric>,
    hasDualYAxis: boolean,
  ): OverlappingBarsPositionMap {
    const [start, end] = barScale.range();
    const groupWidth = end - start;
    const widthPerAxis = hasDualYAxis ? groupWidth / 2 : groupWidth;

    // Percentage of the widthPerAxis that the first overlapping bar will
    // use. Each overlapping bar will be half of the previous overlapping bar's
    // width.
    // NOTE(stephen): This is a best guess at a clean way for applying overlap
    // without the inner bar being too small or large. This will likely change
    // over time and might need to be parameterized.
    const initialOverlap = 0.75;

    // Track the number of metrics per axis we have processed so far.
    const metricAxisIndex = {
      y1Axis: 0,
      y2Axis: 0,
    };
    const output = {};
    metricOrder.forEach(({ axis, id }) => {
      const startOffset = hasDualYAxis && axis === 'y2Axis' ? widthPerAxis : 0;
      const axisIdx = metricAxisIndex[axis];
      const overlap = axisIdx === 0 ? 1 : initialOverlap / axisIdx;
      output[id] = {
        width: overlap * widthPerAxis,
        x: start + startOffset + (widthPerAxis * (1 - overlap)) / 2,
      };
      metricAxisIndex[axis] += 1;
    });
    return output;
  }

  getOverlappingBarsPositionMap(): OverlappingBarsPositionMap {
    const { metricOrder, scales } = this.props;
    return this.buildOverlappingBarsPositionMap(
      scales.barScale,
      metricOrder,
      this.hasDualYAxis(),
    );
  }

  // Compute the Y coordinate position for the given metric.
  @memoizeOne
  buildBarVerticalPositions(
    dataPoint: DataPoint,
    metricsByAxis: MetricAxisOrderMap,
    scales: ScaleMap,
    stack: boolean,
    minBarHeight: number,
  ): VerticalPositionMap {
    return {
      ...buildVerticalPosition(
        dataPoint,
        metricsByAxis.y1Axis,
        scales.y1Scale,
        stack,
        minBarHeight,
      ),
      ...buildVerticalPosition(
        dataPoint,
        metricsByAxis.y2Axis,
        scales.y2Scale,
        stack,
        minBarHeight,
      ),
    };
  }

  getBarVerticalPosition(metric: Metric): VerticalPosition {
    const { barTreatment, dataPoint, minBarHeight, scales } = this.props;
    const barVerticalPositions = this.buildBarVerticalPositions(
      dataPoint,
      this.getMetricOrderByAxis(),
      scales,
      barTreatment === 'stacked',
      minBarHeight,
    );
    return barVerticalPositions[metric.id];
  }

  // Check if metrics exist on both the Y1 and Y2 axes.
  hasDualYAxis(): boolean {
    const metricsByAxis = this.getMetricOrderByAxis();
    return metricsByAxis.y1Axis.length > 0 && metricsByAxis.y2Axis.length > 0;
  }

  // Compute the width/height and x/y position for an individual bar within
  // the group.
  getBarPosition(metric: Metric, barScale: BandScale): BarPosition {
    const { barTreatment } = this.props;
    const verticalPosition = this.getBarVerticalPosition(metric);
    if (barTreatment === 'sequential') {
      return {
        ...verticalPosition,
        width: barScale.bandwidth(),
        x: barScale(metric.id),
      };
    }

    if (barTreatment === 'overlapping') {
      return {
        ...verticalPosition,
        ...this.getOverlappingBarsPositionMap()[metric.id],
      };
    }

    const { start, width } = this.getStackedXAxisOffset();
    const dualAxis = this.hasDualYAxis();
    const xPos = dualAxis && metric.axis === 'y2Axis' ? start + width : start;
    return {
      ...verticalPosition,
      width,
      x: xPos,
    };
  }

  renderBar(metric: Metric): React.Element<typeof Bar> {
    const {
      barDirection,
      barTreatment,
      dataPoint,
      enableValueDisplay,
      onHoverEnd,
      onHoverStart,
      scales,
      stroke,
      strokeWidth,
    } = this.props;
    const position = this.getBarPosition(metric, scales.barScale);

    return (
      <Bar
        key={metric.id}
        barDirection={barDirection}
        dataPoint={dataPoint}
        enableValueDisplay={enableValueDisplay}
        fill={metric.color}
        metric={metric}
        onHoverEnd={onHoverEnd}
        onHoverStart={onHoverStart}
        rx={barTreatment === 'stacked' ? 0 : 2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        {...position}
      />
    );
  }

  render(): $ReadOnlyArray<React.Element<typeof Bar>> {
    // NOTE(stephen): add bars to DOM in reverse order to ensure that text
    // annotations do not get covered up by a subsequent bar.
    // HACK(stephen): If the bars are overlaid or overlapping, we want to add to
    // the DOM in the original order.
    const { barTreatment } = this.props;
    const originalOrder =
      barTreatment === 'overlaid' || barTreatment === 'overlapping';

    // The y2Axis bars should always be drawn before the y1Axis bars so that
    // any text annotations from the y1Axis bars are not covered up by the
    // y2Axis bars.
    const { y1Axis, y2Axis } = this.getMetricOrderByAxis();
    return [
      ...y2Axis.map((_, idx) =>
        this.renderBar(y2Axis[originalOrder ? idx : y2Axis.length - idx - 1]),
      ),
      ...y1Axis.map((_, idx) =>
        this.renderBar(y1Axis[originalOrder ? idx : y1Axis.length - idx - 1]),
      ),
    ];
  }
}
