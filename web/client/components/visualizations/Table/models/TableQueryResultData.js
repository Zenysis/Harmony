// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { filterQueryResultData } from 'components/visualizations/BarGraph/util';
import { mixedValueSort } from 'components/ui/visualizations/Table/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataRow,
  DimensionID,
} from 'components/visualizations/Table/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type SortedValueMap = { [string]: $ReadOnlyArray<string | number> };

type DefaultValues = {|
  data: $ReadOnlyArray<DataRow>,
  dimensions: $ReadOnlyArray<DimensionID>,
|};

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
  static defaultValues = {
    data: [],
    dimensions: [],
  };

  static deserialize(
    values: SerializedTableQueryResult,
  ): Zen.Model<TableQueryResultData> {
    return TableQueryResultData.create({ ...values });
  }

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DataRow> {
    return this._.data().map(dataObj => {
      const newDataObj = { ...dataObj };
      customFields.forEach(field => {
        newDataObj[field.id()] = field.formula().evaluateFormula(newDataObj);
      });
      return newDataObj;
    });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<TableQueryResultData> {
    return this._.data(this._calculateNewData(customFields));
  }

  applyFilters(filters: Zen.Map<DataFilter>): Zen.Model<TableQueryResultData> {
    const data = this._.data();
    return this._.data(filterQueryResultData(data, filters));
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

  getScorecardRank(fieldId: string, value: number | null): number {
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

  serialize(): SerializedTableQueryResult {
    return this.modelValues();
  }
}

export default ((TableQueryResultData: any): Class<
  Zen.Model<TableQueryResultData>,
>);
