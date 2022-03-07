// @flow
import getCustomFieldsInEvaluationOrder from 'models/core/Field/CustomField/getCustomFieldsInEvaluationOrder';
import type CustomField from 'models/core/Field/CustomField';
import type { DataFrame } from 'models/core/Field/CustomField/Formula/types';

/**
 * A StandardRow is the normalized way we represent rows in our query results.
 * Each row is an object consisting of two objects:
 *   - `metrics`: contains numeric values, such as field ids mapping to field
 *     values.
 *   - `dimensions`: contains string values, and maps dimension ids to dimension
 *     values.
 */
type StandardRow = {
  metrics: {
    +[metricId: string]: number | null,
    ...,
  },
  dimensions: {
    +[dimensionId: string]: string | null,
    ...,
  },
  ...
};

/**
 * A FlatRow is a row format that puts all fields and dimensions at the same
 * level in the object. This is less recommended than our `StandardRow`. This
 * is used in our Table.
 */
type FlatRow = {
  +[fieldOrDimensionId: string]: string | number | null,
  ...,
};

/**
 * A TimeSeriesRow is a row format to represent data for time series
 * visualizations, such as a LineGraph. It includes all fields flattened
 * in the object (not ideal, this is a legacy decision), and the `dimensions`
 * encapsulated within their own object.
 */
type TimeSeriesRow = {
  +key: string,
  +timestamp: string,
  +dimensions: {
    +[dimensionId: string]: string | null,
    ...,
  },
  +[fieldId: string]: number,
  ...
};

/**
 * A TimeSeriesRow, but it allows `null` values for field values.
 */
type NullableTimeSeriesRow = {
  +key: string,
  +timestamp: string,
  +dimensions: {
    +[dimensionId: string]: string | null,
    ...,
  },
  +[fieldId: string]: number | null,
  ...
};

/**
 * The result of applying custom fields on a DataFrame. We get an array of
 * tuples: a custom field id, and an array of all its calculated values.
 */
type CustomFieldResults = $ReadOnlyArray<{
  fieldId: string,
  values: $ReadOnlyArray<number | null>,
}>;

/**
 * Expand a data frame to include an array of values for a given field id.
 *
 * NOTE(pablo): This function has SIDE EFFECTS and modifies a given data frame
 * in place. This is not type-safe, but is important for performance reasons,
 * so we are doing it safely.
 */
function _extendDataFrame(
  dataFrame: DataFrame,
  fieldId: string,
  values: $ReadOnlyArray<number | null>,
): void {
  const cleanedVals = values.map(v => (v === null ? undefined : v));

  /* eslint-disable no-param-reassign */
  cleanedVals.forEach((val, i) => {
    // Flow is right to call this out, but we're being really safe
    // $FlowExpectedError[cannot-write]
    dataFrame.rows[i][fieldId] = val;
  });

  dataFrame.values[fieldId] = cleanedVals;
}

/**
 * This function iterates over an array of custom fields and evaluates
 * all the custom fields in the correct order, sorted topologically
 * by their dependencies.
 * This returns an array of tuples, where each tuple includes the custom
 * field's `fieldId`, and an array of all the calculated `values` for that
 * fieldId.
 */
export function evaluateCustomFields(
  customFields: $ReadOnlyArray<CustomField>,
  dataFrame: DataFrame,
): CustomFieldResults {
  const sortedCustomFields = getCustomFieldsInEvaluationOrder(customFields);
  return sortedCustomFields.map(field => {
    const results = field.formula().evaluateFormula(dataFrame);

    // SIDE EFFECT: extend the data frame with this new column
    _extendDataFrame(dataFrame, field.id(), results);
    return {
      fieldId: field.id(),
      values: results,
    };
  });
}

/**
 * Build a data frame from row objects that contain fields and dimensions
 * values.
 *
 * This function requires a set or array of dimensionIds, so that we know
 * which dimensions to exclude from the dataFrame's `values` object, which
 * should only contain field values.
 *
 * NOTE(pablo): if the rows include timestamps, we do not do any special
 * treatment to detect these. These should be treated as dimensions, so
 * so the key representing a timestamp (which should be 'timestamp') should
 * be included in the `dimensionIds`.
 */
export function buildDataFrameFromFlatRows(
  rows: $ReadOnlyArray<FlatRow>,
  dimensionIds: $ReadOnlyArray<string> | $ReadOnlySet<string>,
): DataFrame {
  const dimensionSet = Array.isArray(dimensionIds)
    ? new Set(dimensionIds)
    : dimensionIds;
  const allValues: {
    [fieldId: string]: Array<number | void>,
    ...,
  } = {};
  const dataFrame = { rows: [], values: allValues };

  // using a lot of mutability to populate `values` and `rows`
  // to keep things efficient
  rows.forEach(dataObj => {
    const newRow = {};

    // collect all values for this row
    Object.keys(dataObj).forEach(key => {
      const rawValue = dataObj[key];

      // only non-dimension values go into the `allValues` array
      if (!dimensionSet.has(key)) {
        // theoretically it should never be the case that a field value is a
        // string, but just in case we will convert to undefined in those cases.
        // If the value was `null` then we will also convert to `undefined`
        // as this is a requirement for the DataFrame type.
        const val =
          typeof rawValue === 'string' || rawValue === null
            ? undefined
            : rawValue;

        if (dataFrame.values[key]) {
          dataFrame.values[key].push(val);
        } else {
          dataFrame.values[key] = [val];
        }

        newRow[key] = val;
      } else {
        newRow[key] = rawValue;
      }
    });

    dataFrame.rows.push(newRow);
  });

  return dataFrame;
}

/**
 * Build a data frame from row objects that split their fields (metrics)
 * and dimensions into separate objects per row.
 *
 * NOTE(pablo): if the rows include timestamps, we do not do any special
 * treatment to detect these. These should be treated as dimensions, so
 * so the key representing a timestamp (which should be 'timestamp') should
 * be in the `dimensions` object in each row.
 */
export function buildDataFrameFromStandardRows(
  rows: $ReadOnlyArray<StandardRow>,
): DataFrame {
  const allValues: {
    [fieldId: string]: Array<number | void>,
    ...,
  } = {};
  const dataFrame = { rows: [], values: allValues };

  // using a lot of mutability to keep things efficient
  rows.forEach(dataObj => {
    const row: { [id: string]: string | number | void, ... } = {};

    // collect all dimension values for this row
    Object.keys(dataObj.dimensions).forEach(dimId => {
      const rawValue = dataObj.dimensions[dimId];
      row[dimId] = rawValue === null ? undefined : rawValue;
    });

    // collect all field values for this row
    Object.keys(dataObj.metrics).forEach(metricKey => {
      const rawValue = dataObj.metrics[metricKey];
      const val = rawValue === null ? undefined : rawValue;
      row[metricKey] = val;

      // add the value to dataFrame.values for this indicator
      if (dataFrame.values[metricKey]) {
        dataFrame.values[metricKey].push(val);
      } else {
        dataFrame.values[metricKey] = [val];
      }
    });

    dataFrame.rows.push(row);
  });

  return dataFrame;
}

/**
 * Build a data frame from row objects formatted for time-series visualizations
 * that have a 'timestamp' value separate from the 'dimension' object.
 * All field values are expected to be spread in the object, instead of in a
 * nested 'metrics' object.
 */
export function buildDataFrameFromTimeSeriesRows(
  rows: $ReadOnlyArray<NullableTimeSeriesRow>,
): DataFrame {
  const allValues: {
    [fieldId: string]: Array<number | void>,
    ...,
  } = {};
  const dataFrame = { rows: [], values: allValues };

  // using a lot of mutability to keep things efficient
  rows.forEach(dataObj => {
    const { timestamp, dimensions, key, ...fieldValues } = dataObj;
    const row: { [id: string]: string | number | void, ... } = {};

    // add the 'timestamp' dimension
    row.timestamp = timestamp;

    // collect all dimension values for this row
    Object.keys(dimensions).forEach(dimId => {
      const rawValue = dimensions[dimId];
      row[dimId] = rawValue === null ? undefined : rawValue;
    });

    // collect all field values for this row
    Object.keys(fieldValues).forEach(fieldId => {
      const rawValue = fieldValues[fieldId];
      const val = rawValue === null ? undefined : rawValue;
      row[fieldId] = val;

      // add the value to dataFrame.values for this indicator
      if (dataFrame.values[fieldId]) {
        dataFrame.values[fieldId].push(val);
      } else {
        dataFrame.values[fieldId] = [val];
      }
    });

    dataFrame.rows.push(row);
  });

  return dataFrame;
}

/**
 * Extend an existing array of StandardRows with new field values.
 * Think of it like adding new columns to a table.
 */
function _extendStandardRowsWithNewFields(
  rows: $ReadOnlyArray<StandardRow>,
  newFieldsAndValues: CustomFieldResults,
): $ReadOnlyArray<StandardRow> {
  return rows.map((rowObj, i) => {
    const { metrics, ...restOfObj } = rowObj;
    const newMetrics = { ...metrics };
    newFieldsAndValues.forEach(({ fieldId, values }) => {
      newMetrics[fieldId] = values[i];
    });
    return { ...restOfObj, metrics: newMetrics };
  });
}

/**
 * Extend an existing array of FlatRows with new field values.
 */
function _extendFlatRowsWithNewFields(
  rows: $ReadOnlyArray<FlatRow>,
  newFieldsAndValues: CustomFieldResults,
): $ReadOnlyArray<FlatRow> {
  return rows.map((rowObj, i) => {
    const newRowObj = { ...rowObj };
    newFieldsAndValues.forEach(({ fieldId, values }) => {
      newRowObj[fieldId] = values[i];
    });
    return newRowObj;
  });
}

/**
 * Extend an existing array of NullableTimeSeriesRows with new field values.
 */
function _extendNullableTimeSeriesRowsWithNewFields(
  rows: $ReadOnlyArray<NullableTimeSeriesRow>,
  newFieldsAndValues: CustomFieldResults,
): $ReadOnlyArray<NullableTimeSeriesRow> {
  return rows.map((rowObj, i) => {
    const newRowObj = { ...rowObj };
    newFieldsAndValues.forEach(({ fieldId, values }) => {
      newRowObj[fieldId] = values[i];
    });
    return newRowObj;
  });
}

/**
 * Extend an existing array of TimeSeriesRow with new field values.
 */
function _extendTimeSeriesRowWithNewFields(
  rows: $ReadOnlyArray<TimeSeriesRow>,
  newFieldsAndValues: CustomFieldResults,
): $ReadOnlyArray<TimeSeriesRow> {
  return rows.map((rowObj, i) => {
    const newRowObj = { ...rowObj };
    newFieldsAndValues.forEach(({ fieldId, values }) => {
      // default any null values to 0
      newRowObj[fieldId] = values[i] || 0;
    });
    return newRowObj;
  });
}

/**
 * For most XXQueryResultData models this is the only function you should
 * need to apply custom fields to an array of rows. The `config` object
 * is where you specify the type of row to expect, and pass in the array
 * of rows as well.
 */
/*::
declare function applyCustomFieldsToDataObjects<Row: StandardRow>(
  customFields: $ReadOnlyArray<CustomField>,
  config: {
    useStandardRow: true,
    data: $ReadOnlyArray<Row>,
  },
): $ReadOnlyArray<Row>;

declare function applyCustomFieldsToDataObjects<Row: FlatRow>(
  customFields: $ReadOnlyArray<CustomField>,
  config: {
    useFlatRow: true,
    dimensionIds: $ReadOnlyArray<string> | $ReadOnlySet<string>,
    data: $ReadOnlyArray<Row>,
  },
): $ReadOnlyArray<Row>;

declare function applyCustomFieldsToDataObjects<Row: TimeSeriesRow>(
  customFields: $ReadOnlyArray<CustomField>,
  config: {
    useTimeSeriesRow: true,
    data: $ReadOnlyArray<Row>,
  },
): $ReadOnlyArray<Row>;

declare function applyCustomFieldsToDataObjects<
  Row: NullableTimeSeriesRow,
>(
  customFields: $ReadOnlyArray<CustomField>,
  config: {
    useTimeSeriesRowWithNullableValues: true,
    data: $ReadOnlyArray<Row>,
  },
): $ReadOnlyArray<Row>;
*/
export function applyCustomFieldsToDataObjects(
  customFields: $ReadOnlyArray<CustomField>,
  config:
    | {
        useStandardRow: true,
        data: $ReadOnlyArray<StandardRow>,
      }
    | {
        useFlatRow: true,
        dimensionIds: $ReadOnlyArray<string> | $ReadOnlySet<string>,
        data: $ReadOnlyArray<FlatRow>,
      }
    | {
        useTimeSeriesRow: true,
        data: $ReadOnlyArray<TimeSeriesRow>,
      }
    | {
        useTimeSeriesRowWithNullableValues: true,
        data: $ReadOnlyArray<NullableTimeSeriesRow>,
      },
): $ReadOnlyArray<
  StandardRow | FlatRow | TimeSeriesRow | NullableTimeSeriesRow,
> {
  // 1. build the dataframe
  let dataframe: DataFrame;
  if (config.useStandardRow) {
    dataframe = buildDataFrameFromStandardRows(config.data);
  } else if (config.useFlatRow) {
    dataframe = buildDataFrameFromFlatRows(config.data, config.dimensionIds);
  } else {
    dataframe = buildDataFrameFromTimeSeriesRows(config.data);
  }

  // 2. evaluate custom fields
  const customFieldResults = evaluateCustomFields(customFields, dataframe);

  // 3. extend the rows
  if (config.useStandardRow) {
    return _extendStandardRowsWithNewFields(config.data, customFieldResults);
  }
  if (config.useFlatRow) {
    return _extendFlatRowsWithNewFields(config.data, customFieldResults);
  }
  if (config.useTimeSeriesRow) {
    return _extendTimeSeriesRowWithNewFields(config.data, customFieldResults);
  }
  return _extendNullableTimeSeriesRowsWithNewFields(
    config.data,
    customFieldResults,
  );
}
