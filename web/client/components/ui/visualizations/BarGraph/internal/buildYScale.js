// @flow
import { scaleLinear } from '@vx/scale';

import { getNiceTickCount } from 'components/ui/visualizations/common/MetricAxis';
import type {
  DataPoint,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';
import type { LinearScale } from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

function buildLinearScale(
  { max, min }: { max: number, min: number, ... },
  height: number,
): LinearScale {
  return scaleLinear({
    domain: [min, max],
    range: [height, 0],
  }).nice(getNiceTickCount(height));
}

// Compute the minimum and maximum values that will be displayed on a y-axis.
// Build a LinearScale that will map points within this range to absolute
// coordinates in the SVG. If the bars are being stacked, compute the minimum
// and maximum *accumulated values* for each data point and use  that to set the
// scale. The values are accumulated since bars are *stacked* and the combined
// value of the stack is what should dictate the axis scale.  This means the
// maximum value will be the sum of all positive values within the group. And
// the minimum value will be the sum of all negative values within the group.
export default function buildYScale(
  dataPoints: $ReadOnlyArray<DataPoint>,
  metricOrder: $ReadOnlyArray<Metric>,
  height: number,
  stack: boolean,
  initialMin: number = 0,
  initialMax: number = 0,
): LinearScale | void {
  if (dataPoints.length === 0 || metricOrder.length === 0) {
    return undefined;
  }

  const axisData = {
    max: initialMax,
    min: initialMin,

    // Convenience accumulators used when computing the total positive/negative
    // sum for an individual data point.
    stackNegativeTotal: 0,
    stackPositiveTotal: 0,
  };
  dataPoints.forEach(({ metrics }: DataPoint) => {
    metricOrder.forEach(({ visualDisplayShape, id }) => {
      // NOTE(stephen): Even though Number.isFinite properly refines the
      // value, flow does not recognize this.
      const value = metrics[id];
      if (Number.isFinite(value) && value !== null) {
        // Accumulate the positive and negative values separately since we need
        // their *totals* when building stacked bars.
        if (stack && visualDisplayShape === 'bar') {
          if (value < 0) {
            axisData.stackNegativeTotal += value;
          } else {
            axisData.stackPositiveTotal += value;
          }
        } else {
          // If not stacking, store the min and max directly.
          axisData.min = Math.min(axisData.min, value);
          axisData.max = Math.max(axisData.max, value);
        }
      }
    });

    // Update the min/max for the axis and reset the accumulators.
    if (stack) {
      axisData.min = Math.min(axisData.min, axisData.stackNegativeTotal);
      axisData.max = Math.max(axisData.max, axisData.stackPositiveTotal);
      axisData.stackNegativeTotal = 0;
      axisData.stackPositiveTotal = 0;
    }
  });

  // If the min and max values are the same, we need to increment the max value
  // by one. Otherwise, the y-axis will have the min/max value be the center of
  // the axis and it will look weird.
  // NOTE(stephen): I believe the only way this is possible is if the min and
  // max are both 0.
  if (axisData.min === axisData.max) {
    axisData.max = axisData.min + 1;
  }

  return buildLinearScale(axisData, height);
}
