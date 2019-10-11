// @flow
import { randomNormal } from 'd3-random';

import type {
  BinDataPoint,
  BoxPlotData,
  BoxPlotSummary,
} from 'components/ui/visualizations/BoxPlot/types';

/* eslint-disable */
/*
 * This implementation is similar to the genStats function from @vx/mocks see
 * https://github.com/hshoff/vx/blob/master/packages/vx-mock-data/src/generators/genStats.js
 *  Except that this is modified to return data in a way we modal it in our
 *  use case
 */
/* eslint-enable */

const random = randomNormal(4, 3);
const randomOffset = () => Math.random() * 10;

/**
 * Generates normally distributed data points to use while drawing the histogram
 * @param {number} sampleSize The number of data points to generate
 * @param {number} offSet The offset of the data points
 */
function generateGroupDataPoints(
  sampleSize: number,
  offSet: number,
): Array<number> {
  const points = [];
  for (let j = 0; j < sampleSize; j += 1) {
    points.push(offSet + random());
  }
  return points;
}

/**
 * Generates sample data required to draw BixPlots
 * @param {number} number The number of categories to generate
 * @param {number} sampleSize The number of data points in each category
 */
export function generateBoxPlotData(
  numberOfGroups: number,
  sampleSize: number = 1000,
): $ReadOnlyArray<BoxPlotData> {
  const sampleData = [];

  for (let group = 0; group < numberOfGroups; group += 1) {
    const offset = randomOffset();
    const points = generateGroupDataPoints(sampleSize, offset);

    points.sort((a, b) => a - b);

    const firstQuartile = points[Math.round(sampleSize / 4)];
    const thirdQuartile = points[Math.round((3 * sampleSize) / 4)];
    const IQR = thirdQuartile - firstQuartile;

    const min = firstQuartile - 1.5 * IQR;
    const max = thirdQuartile + 1.5 * IQR;

    const outliers: Array<number> = points.filter(
      (p: number): boolean => p < min || p > max,
    );
    const binWidth = 2 * IQR * (sampleSize - outliers.length) ** (-1 / 3);
    const binNum = Math.round((max - min) / binWidth);
    const actualBinWidth = (max - min) / binNum;

    const bins: Array<number> = Array(binNum + 2).fill(0);
    const values: Array<number> = Array(binNum + 2).fill(min);

    for (let ii = 1; ii <= binNum; ii += 1) {
      values[ii] += actualBinWidth * (ii - 0.5);
    }

    values[values.length - 1] = max;

    points
      .filter(p => p >= min && p <= max)
      .forEach(p => {
        bins[Math.floor((p - min) / actualBinWidth) + 1] += 1;
      });

    const binData: $ReadOnlyArray<BinDataPoint> = values.map(
      (value: number, index: number): BinDataPoint => ({
        value,
        count: bins[index],
      }),
    );

    const boxPlotSummary: BoxPlotSummary = {
      min,
      firstQuartile,
      median: points[Math.round(sampleSize / 2)],
      thirdQuartile,
      max,
    };

    sampleData.push({
      data: { boxPlotSummary, binData, outliers },
      key: `Group ${group}`,
    });
  }
  return sampleData;
}
