// @flow
import type {
  DataPoint,
  HistogramData,
  Bin,
} from 'components/ui/visualizations/EpiCurve/types';

type Accessor = (a: DataPoint) => number;

type LimitsFormatter = (d: number | string | Date) => Date | number;

type UnProcessedBin = {
  values: Array<DataPoint>,
  lowerBinLimit: number | Date,
  upperBinLimit: number | Date,
};

/**
 * Generates sample data
 * @param {number} length The number of data points to generate
 * @param {number} startYear The year to start with while generating data
 */
function generateSampleData(
  length: number = 100,
  startYear: number = 2000,
): $ReadOnlyArray<DataPoint> {
  const data = [];
  for (let i = 0; i < length; i++) {
    const randomYear = startYear + Math.round(Math.random() * 19);
    const randomMonth = Math.floor(Math.random() * 12);
    const randomDay = Math.floor(Math.random() * 28);
    const date = new Date(randomYear, randomMonth, randomDay);
    data.push({ value: Math.random() * 100, date });
  }
  return data;
}

/**
 * Creates bins when given an array of data
 * @param {Array} data The data to be binned
 * @param {number} binCount The number of bins to generate
 * @param {function} accessor A function to access a value from any of the items
 *  in the data array to look at when binning the data
 * @param {function} limitsFormatter A function to make sure that format the
 * limits such that the correct type of limits is returned
 */
function binData(
  data: $ReadOnlyArray<DataPoint>,
  binCount: number,
  accessor: Accessor,
  limitsFormatter: LimitsFormatter,
): HistogramData {
  const max = Math.max(...data.map(accessor));
  const min = Math.min(...data.map(accessor));
  const binWidth = (max - min) / binCount;

  const bins: Array<UnProcessedBin> = [];
  let x = min;

  // create empty bins
  while (x < max) {
    const lowerBinLimit = x;
    let upperBinLimit = x + binWidth;

    if (Math.abs((upperBinLimit - max) / binWidth) < 0.1) {
      upperBinLimit = max;
    }

    const bin = {
      lowerBinLimit,
      upperBinLimit,
      values: [],
    };
    bins.push(bin);
    x = upperBinLimit;
  }

  // populate the bins with data
  for (let i = 0; i < data.length; i++) {
    const item = accessor(data[i]);

    for (let binIndex = 0; binIndex < bins.length; binIndex += 1) {
      const bin = bins[binIndex];
      if (
        (item >= bin.lowerBinLimit && item < bin.upperBinLimit) ||
        (binIndex === bins.length - 1 && item === bin.upperBinLimit)
      ) {
        bin.values.push(data[i]);
        break;
      }
    }
  }

  // prepare bin data to data expected by the visualization
  const formatedBins: $ReadOnlyArray<Bin> = bins.map(bin => ({
    valuesCount: bin.values.length,
    lowerBinLimit: limitsFormatter(bin.lowerBinLimit),
    upperBinLimit: limitsFormatter(bin.upperBinLimit),
  }));

  // make expected data set
  return {
    bins: formatedBins,
    lowerBound: limitsFormatter(min),
    upperBound: limitsFormatter(max),
  };
}
/**
 * Extracts a date and casts it to a number for proper bin calculation
 * @param {object} d The data point from which a date is to be extracted
 */
function accessDate(d: DataPoint): number {
  return Number(new Date(d.date));
}

/**
 * Convert a limit value to make sure that its of the expected type
 * @param {number| Date | string} limit The limit value to format
 */
function formatLimits(limit: number | Date | string): Date {
  return new Date(limit);
}

/**
 * Creates a sample data set expected by the epi-curve visualization
 * @param {number} totalNumberOfItems The number of data points to create
 * @param {number} numberOfBins The number of bins to generate
 */
export function createSampleData(
  totalNumberOfItems: number = 100,
  numberOfBins: number = 10,
): HistogramData {
  const sampleData = generateSampleData(totalNumberOfItems);
  return binData(sampleData, numberOfBins, accessDate, formatLimits);
}
