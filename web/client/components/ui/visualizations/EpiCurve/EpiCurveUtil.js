// @flow
import moment from 'moment';
import { scaleLinear, scaleTime } from '@vx/scale';

import type { Bin, Margin } from 'components/ui/visualizations/EpiCurve/types';

export function accessDate(dataPoint: { date: Date }): Date {
  return dataPoint.date;
}

export function computeInnerWidth(width: number, margin: Margin): number {
  return width - margin.left - margin.right;
}

export function computeInnerHeight(height: number, margin: Margin): number {
  return height - margin.top - margin.bottom;
}

export function computeXScale(
  lowerBound: Date | number,
  upperBound: Date | number,
  graphWidth: number,
) {
  let buildScale = scaleTime;
  if (typeof lowerBound === 'number' && typeof upperBound === 'number') {
    buildScale = scaleLinear;
  }

  const scale = buildScale({
    domain: [lowerBound, upperBound],
    range: [0, graphWidth],
  });

  return scale;
}

export function computeYScale(bins: $ReadOnlyArray<Bin>, graphHeight: number) {
  const max = Math.max(...bins.map(bin => bin.valuesCount));
  const domain = [0, max];
  const scale = scaleLinear({
    domain,
    range: [graphHeight, 0],
  });
  return scale;
}

export function createTimeFormatter(dateFormat: string) {
  return (date: Date): string => moment(date).format(dateFormat);
}
