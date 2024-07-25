// @flow

import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'components/ui/visualizations/BarGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
};

// The serialized result is identical to the deserialized version.
type SerializedBarGraphQueryResult = DefaultValues;

class BarGraphQueryResultData
  extends Zen.BaseModel<BarGraphQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BarGraphQueryResultData>,
    Serializable<SerializedBarGraphQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dimensions: [],
  };

  static deserialize(
    values: SerializedBarGraphQueryResult,
  ): Zen.Model<BarGraphQueryResultData> {
    return BarGraphQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BarGraphQueryResultData> {
    return this._.data(
      applyCustomFieldsToDataObjects(customFields, {
        data: this._.data(),
        useStandardRow: true,
      }),
    );
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<BarGraphQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: DataPoint, fieldId: string) => row.metrics[fieldId],
      ),
    );
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BarGraphQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  @memoizeOne
  getUnPivotedDimensions(
    dimensions: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<string> {
    const pivotDimensionId = dimensions[0];
    const nonPivotDimensions = dimensions.filter(d => d !== pivotDimensionId);
    return ['field', ...nonPivotDimensions];
  }

  @memoizeOne
  getUnPivotedDimensionValues(
    dimensions: $ReadOnlyArray<string>,
  ): [$ReadOnlyArray<string | null>, string] {
    const dataPoints = this._.data();
    const uniqueDimensionValues = new Set();
    const pivotedDimensionId = dimensions[0] || '';

    dataPoints.forEach(point => {
      const metricId = !pivotedDimensionId
        ? 'value'
        : point.dimensions[pivotedDimensionId];
      uniqueDimensionValues.add(metricId);
    });
    return [Array.from(uniqueDimensionValues), pivotedDimensionId];
  }

  // Pivot the unique dimension values to become metrics where each dimension
  // value points to the field value for the selected field. Returns an array
  // of pivoted data points and the unique dimension values found for the
  // pivot dimension.
  // Example: If the user had grouped by `Gender`, then there might be 3 unique
  // dimension values: Male, Female, Unknown. To pivot by the `Gender`
  // dimension, a new list of data points will be created where each data point
  // will have the `Gender` dimension removed. The `Gender` dimension value
  // (like Male) will now be moved to the `metrics` object of the data point and
  // the metric value will be the value of the selected field for the original
  // data point. All unique gender values will be collapsed into a single data
  // point containing the unique values of the non-pivot dimensions.
  @memoizeOne
  pivotByDimension(
    pivotDimensionId: string,
    nullDimensionValueReplacement: string,
    hiddenSeries: $ReadOnlySet<string>,
  ): $ReadOnlyArray<DataPoint> {
    // If the result data is empty or the data points do not contain the
    // selected dimension, we cannot continue.
    if (this._.isEmpty()) {
      return [];
    }

    // If the data points do not contain the selected field, we also cannot
    // continue.
    const dataPoints = this._.data();

    // Since the BarGraph does not allow `null` to be stored as a DataPoint
    // dimension or metric *key*, we need to substitute any null values with
    // their display version.
    const buildDisplayDimensionValue = (dimensionValue: string | null) =>
      dimensionValue !== null ? dimensionValue : nullDimensionValueReplacement;

    // Collect the unique dimension values seen so we can sort it in a stable
    // way when displaying them to the user.
    const uniqueDimensionValues = new Set();

    // Create a data point for each unique group of dimensions, excluding the
    // pivot dimension. This will allow us to collect a metric value for each
    // unique value of the pivot dimension inside the same data point.
    const dataPointsByNonPivotDimensions = {};
    const nonPivotDimensions = this._.dimensions().filter(
      d => d !== pivotDimensionId,
    );
    const buildDataPointKey = (
      dimensions: $PropertyType<DataPoint, 'dimensions'>,
    ) =>
      nonPivotDimensions
        .map(d => buildDisplayDimensionValue(dimensions[d]))
        .join('__');

    dataPoints.forEach(({ dimensions, metrics }) => {
      const dimensionValue = dimensions[pivotDimensionId];
      uniqueDimensionValues.add(dimensionValue);

      Object.keys(metrics).forEach(fieldId => {
        const newKey = `${buildDataPointKey(dimensions)}__${fieldId}`;

        if (hiddenSeries.has(fieldId)) {
          return;
        }

        // If the pivoted data point does not exist yet, we need to create one.
        // It will contain all the non-pivot dimensions and a metrics object for
        // storing dimension values for the selected field.
        if (dataPointsByNonPivotDimensions[newKey] === undefined) {
          const newDimensions = {};
          nonPivotDimensions.forEach(d => {
            newDimensions[d] = dimensions[d];
          });
          dataPointsByNonPivotDimensions[newKey] = {
            dimensions: { ...newDimensions, field: fieldId },
            metrics: {},
          };
        }

        // NOTE: Converting the dimension value into its display value to
        // store as the metric ID since we cannot store `null` as a key. This also
        // means we will not need to format the metric ID later.
        const pivotDataPoint = dataPointsByNonPivotDimensions[newKey];
        const metricId = !pivotDimensionId
          ? 'value'
          : buildDisplayDimensionValue(dimensionValue);
        pivotDataPoint.metrics[metricId] = metrics[fieldId];
      });
    });

    const newDataPoints = Object.keys(dataPointsByNonPivotDimensions).map(
      key => dataPointsByNonPivotDimensions[key],
    );
    return newDataPoints;
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  serialize(): SerializedBarGraphQueryResult {
    return this.modelValues();
  }
}

export default ((BarGraphQueryResultData: $Cast): Class<
  Zen.Model<BarGraphQueryResultData>,
>);
