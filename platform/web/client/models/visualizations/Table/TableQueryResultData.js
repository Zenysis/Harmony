// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { groupBy } from 'util/arrayUtil';
import { mixedValueSort } from 'components/ui/visualizations/Table/sorting';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataRow,
  DimensionID,
  TableDataValue,
} from 'models/visualizations/Table/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type SortedValueMap = { [string]: $ReadOnlyArray<string | number>, ... };

type PivotedDimensionValue = {
  // The `children` will contain all the dimension values for the *next
  // level down*. And each of those will contain children for the level
  // after that one.
  child: PivotedDimensionValue | void,
  dimension: string,
  value: TableDataValue,
};

type DefaultValues = {
  data: $ReadOnlyArray<DataRow>,
  dimensions: $ReadOnlyArray<DimensionID>,
};

// The serialized result is identical to the deserialized version.
type SerializedTableQueryResult = DefaultValues;

/**
 * TableQueryResultData represents the data format used to render the Table and
 * Scorecard.
 *
 * data:
 *   array of objects
 *   Each object represents a single row (entry) in the table:
 *     {
 *       [dimension]: string (all geos referring to the location, ie region,
 *                    zone, woreda)
 *       [fieldId]: number (these are the values in each cell in the Table)
 *     }
 *
 * dimensions:
 *   array of Dimensions strings
 */

class TableQueryResultData
  extends Zen.BaseModel<TableQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<TableQueryResultData>,
    Serializable<SerializedTableQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dimensions: [],
  };

  static deserialize(
    values: SerializedTableQueryResult,
  ): Zen.Model<TableQueryResultData> {
    return TableQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<TableQueryResultData> {
    return this._.data(
      applyCustomFieldsToDataObjects(customFields, {
        data: this._.data(),
        dimensionIds: this._.dimensions(),
        useFlatRow: true,
      }),
    );
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<TableQueryResultData> {
    return this._.data(
      filters.filterRows(this._.data(), (row: DataRow, fieldId: string) => {
        const val = row[fieldId];
        invariant(
          typeof val !== 'string',
          `Cannot filter on '${fieldId}' because some values are of type string`,
        );
        return val;
      }),
    );
  }

  /**
   * unPivot unpivots the data that is returned and creates the following structure
   *
   * data:
   *   array of objects
   *   Each object represents a single row (entry) in the table:
   *     {
   *       [dimension]: string (all geos referring to the location, ie region,
   *                    zone, woreda)
   *       field: [fieldId]
   *       value: number(these are the values in each cell in the Table)
   *     }
   */
  @memoizeOne
  unPivot(): $ReadOnlyArray<DataRow> {
    const data = this._.data();
    if (data.length === 0) {
      return [];
    }

    const dimensions = this._.dimensions();
    const nonDimensionProperties = Object.keys(data[0]).filter(
      key => !dimensions.includes(key),
    );

    const output = [];
    data.forEach(row => {
      const dimensionValues = {};
      dimensions.forEach(dimension => {
        dimensionValues[dimension] = row[dimension];
      });

      nonDimensionProperties.forEach(key => {
        // NOTE: We want to define a new object that has
        // properties not defined in DataRow
        const newRow: $AllowAny = {
          ...dimensionValues,
          field: key,
          value: row[key],
        };
        output.push(newRow);
      });
    });

    return output;
  }

  /**
   * getPivotedDimensionValues returns the values for the dimension
   * that are pivoted and these will be new column headers in the table
   */
  getPivotedDimensionValues(
    pivotedDimensions: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<{ dimension: string, dimensionValue: TableDataValue }> {
    const unPivotedData = this.unPivot();
    const result = [];
    const processed = new Set();
    unPivotedData.forEach(row => {
      pivotedDimensions.forEach(dimension => {
        const value = row[dimension];
        if (!processed.has(value)) {
          result.push({ dimension, dimensionValue: value });
          processed.add(value);
        }
      });
    });
    return result;
  }

  /**
   * getUnPivotedDimensions returns a collection of dimensions
   * that have not pivoted out
   */
  getUnPivotedDimensions(
    pivotedDimensions: Set<string>,
  ): $ReadOnlyArray<string> {
    return [
      'field',
      ...this._.dimensions().filter(d => !pivotedDimensions.has(d)),
    ];
  }

  /**
   * pivotTableData returns an array of DataRows pivoted out by
   * selected dimensions
   */
  pivotTableData(
    pivotedDimensions: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<DataRow> {
    const data = [];
    const unPivotedData = this.unPivot();
    const unpivotedDimensions = this.getUnPivotedDimensions(
      new Set(pivotedDimensions),
    );
    if (pivotedDimensions.length === 0) {
      return unPivotedData;
    }

    const output = [];
    unPivotedData.forEach(row => {
      const pivotedDimensionsValue = [];
      pivotedDimensions.forEach(dimension => {
        pivotedDimensionsValue.push(row[dimension]);
      });

      const pivotedDimensionsValueKey = pivotedDimensionsValue.join(':');
      let newRow = {
        field: row.field,
        [pivotedDimensionsValueKey]: row.value,
      };

      unpivotedDimensions.forEach(dimension => {
        newRow = {
          ...newRow,
          [dimension]: row[dimension],
        };
      });

      output.push(newRow);
    });
    const groupingFunction = row =>
      unpivotedDimensions.map(dimension => row[dimension]).join('__');
    const groupedRows = groupBy(output, groupingFunction);
    groupedRows.forEach(group => {
      const pivotedRow = Object.assign({}, ...group);
      data.push(pivotedRow);
    });
    return data;
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<TableQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this._);
    }

    return defaultApplyTransformations(this._, queryResultSpec);
  }

  // Split the stored data into separate sorted columns. The scorecard
  // percentage calculation needs this to compute the position of a given
  // field's value in the greater data set. Exclude null values when building
  // scorecard rankings.
  @memoizeOne
  buildSortedValuesForScorecard(): SortedValueMap {
    const output = {};
    this._.data().forEach(dataObj => {
      Object.keys(dataObj).forEach(key => {
        if (output[key] === undefined) {
          output[key] = [];
        }
        const value = dataObj[key];
        if (value !== null) {
          output[key].push(dataObj[key]);
        }
      });
    });
    Object.keys(output).forEach(key => output[key].sort(mixedValueSort));
    return output;
  }

  getScorecardRank(fieldId: string, value: number | null | string): number {
    const fieldValues = this.buildSortedValuesForScorecard()[fieldId];
    if (
      fieldValues === undefined ||
      fieldValues.length === 0 ||
      value === null
    ) {
      return 0;
    }

    return fieldValues.indexOf(value) / fieldValues.length;
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  // NOTE: Try to detect if the original query issued to the backend
  // requested total values for any of the grouping dimensions. We don't have
  // access to the original query, and the backend response does not indicate
  // whether totals were provided.
  @memoizeOne
  hasDimensionTotals(): boolean {
    return this.getDimensionsWithTotals().length > 0;
  }

  @memoizeOne
  getDimensionsWithTotals(): $ReadOnlyArray<DimensionID> {
    // returned in their order
    return this._.dimensions().filter(dimensionID => {
      return this._.data().some(
        row => row[dimensionID] === TOTAL_DIMENSION_VALUE,
      );
    });
  }

  serialize(): SerializedTableQueryResult {
    return this.modelValues();
  }
}

export default ((TableQueryResultData: $Cast): Class<
  Zen.Model<TableQueryResultData>,
>);
