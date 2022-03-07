// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'components/ui/visualizations/BarGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  dimensionBreakdownData: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
  fieldBreakdownData: $ReadOnlyArray<DataPoint>,
};

// The serialized result is identical to the deserialized version.
type SerializedHistogramQueryResult = {
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
};

class HistogramQueryResultData
  extends Zen.BaseModel<HistogramQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<HistogramQueryResultData>,
    Serializable<SerializedHistogramQueryResult> {
  static defaultValues: DefaultValues = {
    dimensionBreakdownData: [],
    dimensions: [],
    fieldBreakdownData: [],
  };

  static deserialize({
    data,
    dimensions,
  }: SerializedHistogramQueryResult): Zen.Model<HistogramQueryResultData> {
    // NOTE(stephen): This shouldn't be possible, but we want to be safe.
    if (
      dimensions.length === 0 ||
      dimensions.length > 2 ||
      !dimensions.includes(TIMESTAMP_GROUPING_ID)
    ) {
      return HistogramQueryResultData.create({
        dimensionBreakdownData: [],
        dimensions: [],
        fieldBreakdownData: [],
      });
    }

    // To support two breakdown options for the user to choose from (breakdown
    // by field and by dimension value) the query result will contain data
    // points containing the total values for each date. If the user selected an
    // additional grouping other than date, then there will also be data points
    // colocated in the `data` array from the server for each unique `date` +
    // `dimension value` combination (just like any other time you group by two
    // items).

    // If there is only one dimension grouping (deduced to be date based on
    // earlier checks) then use those values as the field breakdown values.
    if (dimensions.length === 1) {
      return HistogramQueryResultData.create({
        dimensions,
        dimensionBreakdownData: [],
        fieldBreakdownData: data,
      });
    }

    const fieldBreakdownData = [];
    const dimensionBreakdownData = [];
    const [nonDateDimensionId] = dimensions.filter(
      d => d !== TIMESTAMP_GROUPING_ID,
    );

    // When there is a second grouping in the query, then the total values for
    // each date will be stored under the dimension value `TOTAL` for the
    // non-date dimension ID. The values by dimension will be all data points
    // that are *not* the total value.
    data.forEach(dataPoint => {
      if (dataPoint.dimensions[nonDateDimensionId] === TOTAL_DIMENSION_VALUE) {
        // Remove the non-date dimension from the data point so that the data
        // point shape is consistent whether there is a non-date grouping or
        // not.
        fieldBreakdownData.push({
          dimensions: {
            [TIMESTAMP_GROUPING_ID]:
              dataPoint.dimensions[TIMESTAMP_GROUPING_ID],
          },
          metrics: dataPoint.metrics,
        });
      } else {
        dimensionBreakdownData.push(dataPoint);
      }
    });

    return HistogramQueryResultData.create({
      dimensionBreakdownData,
      dimensions,
      fieldBreakdownData,
    });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<HistogramQueryResultData> {
    return this._.modelValues({
      fieldBreakdownData: applyCustomFieldsToDataObjects(customFields, {
        useStandardRow: true,
        data: this._.fieldBreakdownData(),
      }),
      dimensionBreakdownData: applyCustomFieldsToDataObjects(customFields, {
        useStandardRow: true,
        data: this._.dimensionBreakdownData(),
      }),
    });
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<HistogramQueryResultData> {
    const applyFiltersToDataPoints = data =>
      filters.filterRows(
        data,
        (row: DataPoint, fieldId: string) => row.metrics[fieldId],
      );

    return this._.modelValues({
      fieldBreakdownData: applyFiltersToDataPoints(this._.fieldBreakdownData()),
      dimensionBreakdownData: applyFiltersToDataPoints(
        this._.dimensionBreakdownData(),
      ),
    });
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<HistogramQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
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
  breakdownDimensionForField(
    pivotDimensionId: string,
    selectedFieldId: string,
    nullDimensionValueReplacement: string,
  ): [$ReadOnlyArray<DataPoint>, $ReadOnlyArray<string | null>] {
    // If the result data is empty or the data points do not contain the
    // selected dimension, we cannot continue.
    if (
      this._.dimensionBreakdownData().length === 0 ||
      !this._.dimensions().includes(pivotDimensionId)
    ) {
      return [[], []];
    }

    // If the data points do not contain the selected field, we also cannot
    // continue.
    const dataPoints = this._.dimensionBreakdownData();
    if (dataPoints[0].metrics[selectedFieldId] === undefined) {
      return [[], []];
    }

    // Since the Histogram (BarGraph) does not allow `null` to be stored as a
    // DataPoint dimension or metric *key*, we need to substitute any null
    // values with their display version.
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
      const key = buildDataPointKey(dimensions);
      const dimensionValue = dimensions[pivotDimensionId];
      uniqueDimensionValues.add(dimensionValue);

      // If the pivoted data point does not exist yet, we need to create one.
      // It will contain all the non-pivot dimensions and a metrics object for
      // storing dimension values for the selected field.
      if (dataPointsByNonPivotDimensions[key] === undefined) {
        const newDimensions = {};
        nonPivotDimensions.forEach(d => {
          newDimensions[d] = dimensions[d];
        });
        dataPointsByNonPivotDimensions[key] = {
          dimensions: newDimensions,
          metrics: {},
        };
      }

      // NOTE(stephen): Converting the dimension value into its display value to
      // store as the metric ID since we cannot store `null` as a key. This also
      // means we will not need to format the metric ID later.
      const pivotDataPoint = dataPointsByNonPivotDimensions[key];
      const metricId = buildDisplayDimensionValue(dimensionValue);
      pivotDataPoint.metrics[metricId] = metrics[selectedFieldId];
    });

    const newDataPoints = Object.keys(dataPointsByNonPivotDimensions).map(
      key => dataPointsByNonPivotDimensions[key],
    );

    return [newDataPoints, Array.from(uniqueDimensionValues)];
  }

  isEmpty(): boolean {
    const dimensionCount = this._.dimensions().length;
    return (
      dimensionCount === 0 ||
      (dimensionCount === 1 && this._.fieldBreakdownData().length === 0) ||
      (dimensionCount === 2 && this._.dimensionBreakdownData().length === 0)
    );
  }

  serialize(): SerializedHistogramQueryResult {
    // NOTE(stephen): There is no need to ever serialize the query result data.
    return {
      data: [],
      dimensions: [],
    };
  }
}

export default ((HistogramQueryResultData: $Cast): Class<
  Zen.Model<HistogramQueryResultData>,
>);
