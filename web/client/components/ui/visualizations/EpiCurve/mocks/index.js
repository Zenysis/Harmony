// @flow
import moment from 'moment';

import type {
  Bucket,
  DataPoint,
} from 'components/ui/visualizations/EpiCurve/types';

const START_DATE = 'JAN 2014';
const DATE_FORMAT = 'MMM YYYY';
const MAX_VALUE = 500;

/**
 * Generates sample data
 * @param {number} numberOfBins The number of timestamps to generate
 */
function generateSampleData(numberOfBins: number): $ReadOnlyArray<Bucket> {
  const currentDate = moment(START_DATE, DATE_FORMAT);
  const data = [];
  for (let i = 0; i < numberOfBins; i++) {
    const datapoint: DataPoint = {
      dimensions: { key: 'region1' },
      metrics: {
        cases: Math.floor(Math.random() * MAX_VALUE),
      },
    };
    data.push({
      timestamp: currentDate.format(DATE_FORMAT),
      bars: [datapoint],
    });
    currentDate.add(1, 'months');
  }
  return data;
}

/**
 * Creates a sample data set expected by the epi-curve visualization
 * @param {number} maxValue The max value for generated data points
 * @param {number} numberOfBins The number of bins to generate
 */
export function createSampleData(
  numberOfBins: number = 10,
): $ReadOnlyArray<Bucket> {
  return generateSampleData(numberOfBins);
}
