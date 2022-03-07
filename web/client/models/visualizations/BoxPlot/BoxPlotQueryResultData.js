// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { partition } from 'util/arrayUtil';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint as BackendDataPoint } from 'components/ui/visualizations/BarGraph/types';
import type {
  BinDataPoint,
  BoxPlotBoxData,
  BoxPlotDataPoint,
  BoxPlotSummary,
} from 'components/ui/visualizations/BoxPlot/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  data: $ReadOnlyArray<BackendDataPoint>,
  dimensions: $ReadOnlyArray<string>,
};

// The serialized result is identical to the deserialized version.
type SerializedBoxPlotQueryResult = DefaultValues;

function buildBinData(
  boxMin: number,
  boxMax: number,
  interQuartileRange: number,
  nonOutliers: $ReadOnlyArray<BoxPlotDataPoint>,
): $ReadOnlyArray<BinDataPoint> {
  if (interQuartileRange === 0 || nonOutliers.length === 0) {
    // Can't calculate bins where the is no interquartile range.
    return [];
  }

  // For the violin plot, we need to collapse the many data points into a finite
  // set of bins. These bins will store a count of values that appeared in that
  // bin. From this, we can visualize the distribution of values in the violin
  // plot.
  // Uses the Freedman-Diaconis rule for bin sizing:
  // https://en.wikipedia.org/wiki/Freedman–Diaconis_rule
  const binWidth = (2 * interQuartileRange) / nonOutliers.length ** (1 / 3);
  const binCount = Math.round((boxMax - boxMin) / binWidth);

  // Since we rounded the binCount, we need to recalculate the binWidth so that
  // it fits evenly inside this count.
  const trueBinWidth = (boxMax - boxMin) / binCount;

  // Count the number of values per bin. Add an extra element at the beginning
  // and end so that we can count the values < min and the values > max.
  // The bins go essentially in this order:
  // 0: (theoreticalMin, boxMin]
  // 1: (boxMin, boxMin + trueBinWidth]
  // 2: (boxMin + trueBinWidth, boxMin + trueBinWidth * 2]
  // ...
  // n: (boxMax, theoreticalMax]
  const bins = Array(binCount + 2).fill(0);
  nonOutliers.forEach(({ value }) => {
    const binIdx = Math.floor((value - boxMin) / trueBinWidth) + 1;
    bins[binIdx] += 1;
  });
  const binData: Array<BinDataPoint> = bins.map((count, idx) => ({
    count,
    // Calculate the value that this bin represents to be the midpoint of the
    // bin bounds.
    value: boxMin + trueBinWidth * (idx - 0.5),
  }));

  // Set the first and last bins to be the min/max values.
  binData[0].value = boxMin;
  binData[bins.length - 1].value = boxMax;

  return binData;
}

function buildEmptyResult(
  key: string,
  dataPoints: $ReadOnlyArray<BoxPlotDataPoint>,
): BoxPlotBoxData {
  const sortedValues = dataPoints
    .map(dataPoint => dataPoint.value)
    .sort((a, b) => a - b);

  const boxPlotSummary = {
    firstQuartile: 0,
    max: 0,
    median: 0,
    min: 0,
    thirdQuartile: 0,
  };
  if (sortedValues.length > 0) {
    const count = sortedValues.length;
    const max = sortedValues[count - 1];
    const min = sortedValues[0];
    boxPlotSummary.max = max;
    boxPlotSummary.median = sortedValues[Math.floor(count / 2)];
    boxPlotSummary.min = min;
    boxPlotSummary.firstQuartile = min;
    boxPlotSummary.thirdQuartile = max;
  }

  return {
    data: {
      binData: [],
      boxPlotSummary,
      outliers: [],
    },
    key,
  };
}

function buildBoxPlotData(
  key: string,
  dataPoints: $ReadOnlyArray<BoxPlotDataPoint>,
): BoxPlotBoxData {
  const sortedValues = dataPoints
    .map(dataPoint => dataPoint.value)
    .sort((a, b) => a - b);

  const sampleSize = sortedValues.length;
  if (sampleSize < 4) {
    return buildEmptyResult(key, dataPoints);
  }

  const firstQuartile = sortedValues[Math.round(sampleSize / 4)];
  const thirdQuartile = sortedValues[Math.round((3 * sampleSize) / 4)];
  const interQuartileRange = thirdQuartile - firstQuartile;

  // Use the Turkey method of building the whiskers of the box plot. Find the
  // lowest value still within 1.5 IQR of the lower quartile, and the highest
  // value still within 1.5 IQR of the upper quartile.
  // https://en.wikipedia.org/wiki/Box_plot
  const theoreticalMin = firstQuartile - 1.5 * interQuartileRange;
  const theoreticalMax = thirdQuartile + 1.5 * interQuartileRange;
  const [boxMin, boxMax] = sortedValues.reduce(
    ([min, max], value) => {
      if (value >= theoreticalMin && value <= theoreticalMax) {
        return [Math.min(value, min), Math.max(value, max)];
      }
      return [min, max];
    },
    [Infinity, -Infinity],
  );

  // Split the values into outliers and non-outliers so we can show the
  // distribution of values on the plot.
  const [outliers, nonOutliers] = partition(
    dataPoints,
    dataPoint => dataPoint.value < boxMin || dataPoint.value > boxMax,
  );

  const boxPlotSummary: BoxPlotSummary = {
    firstQuartile,
    thirdQuartile,
    max: boxMax,
    median: sortedValues[Math.round(sampleSize / 2)],
    min: boxMin,
  };

  return {
    data: {
      boxPlotSummary,
      binData: buildBinData(boxMin, boxMax, interQuartileRange, nonOutliers),
      outliers,
    },
    key,
  };
}

// NOTE(stephen): I chose to use the BarGraph endpoint as the data source for
// the BoxPlot because I wanted to support filtering. If I had built an endpoint
// for BoxPlot that did a lot of this work on the server, I wouldn't be able to
// add filtering support since the median/min/max are calculated from the raw
// values and the data sent to the BoxPlot viz are summarized values.
class BoxPlotQueryResultData
  extends Zen.BaseModel<BoxPlotQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BoxPlotQueryResultData>,
    Serializable<SerializedBoxPlotQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dimensions: [],
  };

  static deserialize(
    values: SerializedBoxPlotQueryResult,
  ): Zen.Model<BoxPlotQueryResultData> {
    return BoxPlotQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BoxPlotQueryResultData> {
    return this._.data(
      applyCustomFieldsToDataObjects(customFields, {
        useStandardRow: true,
        data: this._.data(),
      }),
    );
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<BoxPlotQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: BackendDataPoint, fieldId: string) => row.metrics[fieldId],
      ),
    );
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BoxPlotQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  /**
   * Convert the flat list of raw data points into summarized BoxPlotBoxData
   * objects for use in the visualization. Each data point is grouped first by
   * field ID and then the values for each unique dimension are collected. Once
   * the values for each dimension are collected, they can then be summarized
   * and a BoxPlotBoxData object is created.
   */
  @memoizeOne
  bucketDataPoints(): {
    +[fieldId: string]: {
      +dimensions: {
        +[dimensionId: string]: $ReadOnlyArray<BoxPlotBoxData>,
        ...,
      },
      +total: $ReadOnlyArray<BoxPlotBoxData>,
    },
    ...,
  } {
    const dimensionIds = this._.dimensions();
    const output = {};
    // First collect all values for each dimension level and store the data
    // under the dimension value's name.
    const collectedValues: {
      [fieldId: string]: {
        dimensions: {
          [dimensionId: string]: {
            [dimensionValue: string]: Array<BoxPlotDataPoint>,
            ...,
          },
          ...,
        },
        total: Array<BoxPlotDataPoint>,
      },
      ...,
    } = {};

    this._.data().forEach(backendDataPoint => {
      const metricIds = Object.keys(backendDataPoint.metrics);

      metricIds.forEach(metricId => {
        if (collectedValues[metricId] === undefined) {
          // Setup the intermediary storage of values.
          collectedValues[metricId] = {
            dimensions: {},
            total: [],
          };

          // Prepare the output at the same time since we're here.
          output[metricId] = {
            dimensions: {},
            total: [],
          };
        }

        const metricValue = backendDataPoint.metrics[metricId];
        if (metricValue === null || !Number.isFinite(metricValue)) {
          return;
        }

        const boxPlotDataPoint = {
          value: metricValue,
          dimensions: backendDataPoint.dimensions,
        };

        // Collect each unique dimension value's list of data points.
        const collectedMetricValues = collectedValues[metricId].dimensions;
        collectedValues[metricId].total.push(boxPlotDataPoint);
        dimensionIds.forEach(dimensionId => {
          const rawDimensionValue = backendDataPoint.dimensions[dimensionId];
          const dimensionValue =
            rawDimensionValue !== null ? rawDimensionValue : 'null';
          if (collectedMetricValues[dimensionId] === undefined) {
            collectedMetricValues[dimensionId] = {};
          }

          const collectedDimensionValues = collectedMetricValues[dimensionId];
          if (collectedDimensionValues[dimensionValue] === undefined) {
            collectedDimensionValues[dimensionValue] = [];
          }
          collectedDimensionValues[dimensionValue].push(boxPlotDataPoint);
        });
      });
    });

    // Now that we have a list of all data points for each possible BoxPlot, we
    // need to build the BoxPlotBoxData summary object from this list of raw
    // values.
    Object.keys(collectedValues).forEach(metricId => {
      const { dimensions, total } = collectedValues[metricId];
      const metricOutput = output[metricId];
      metricOutput.total = [buildBoxPlotData('Total', total)];
      Object.keys(dimensions).forEach(dimensionId => {
        const dimensionValues = dimensions[dimensionId];
        metricOutput.dimensions[dimensionId] = Object.keys(
          dimensionValues,
        ).map(dimensionValue =>
          buildBoxPlotData(dimensionValue, dimensionValues[dimensionValue]),
        );
      });
    });
    return output;
  }

  @memoizeOne
  getDataPoints(
    fieldId: string,
    dimensionId: string | void,
  ): $ReadOnlyArray<BoxPlotBoxData> {
    if (this.isEmpty()) {
      return [];
    }

    const bucketedDataPoints = this.bucketDataPoints();
    const fieldValues = bucketedDataPoints[fieldId];
    if (fieldValues === undefined) {
      return [];
    }

    if (dimensionId === undefined) {
      return fieldValues.total;
    }

    const dimensionDataPoints = fieldValues.dimensions[dimensionId];
    return dimensionDataPoints !== undefined ? dimensionDataPoints : [];
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  serialize(): SerializedBoxPlotQueryResult {
    return this.modelValues();
  }
}

export default ((BoxPlotQueryResultData: $Cast): Class<
  Zen.Model<BoxPlotQueryResultData>,
>);
