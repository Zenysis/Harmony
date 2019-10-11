// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DatedDataPoint } from 'components/visualizations/Map/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  data: $ReadOnlyArray<DatedDataPoint>,
|};

// The serialized result is identical to the deserialized version.
type SerializedMapQueryResult = DefaultValues;

class MapQueryResultData
  extends Zen.BaseModel<MapQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<MapQueryResultData>,
    Serializable<SerializedMapQueryResult> {
  static defaultValues = {
    data: [],
  };

  static deserialize(
    values: SerializedMapQueryResult,
  ): Zen.Model<MapQueryResultData> {
    const { data } = values;
    return MapQueryResultData.create({ data });
  }

  _fieldMaxCache: { [string]: number } = {};

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DatedDataPoint> {
    const newData = this._.data().map(datedDataObj => {
      const { date } = datedDataObj;
      const currDatedData = datedDataObj.datedData;
      const newDatedData = currDatedData.map(dataObj => {
        const metrics = { ...dataObj.metrics };
        customFields.forEach(field => {
          const { id, formula } = field.modelValues();
          metrics[id] = formula.evaluateFormula(metrics);
        });
        return {
          ...dataObj,
          metrics,
        };
      });

      return {
        date,
        datedData: newDatedData,
      };
    });

    return newData;
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<MapQueryResultData> {
    return this._.data(this._calculateNewData(customFields));
  }

  applyFilters(filterMap: Zen.Map<DataFilter>): Zen.Model<MapQueryResultData> {
    const newData = filterMap.reduce((currDataList, dataFilter) => {
      const fieldId = dataFilter.fieldId();
      const newDataList = currDataList.map(datedDataObj => {
        const currData = datedDataObj.datedData;
        const vals = currData.map(dataObj => dataObj.metrics[fieldId]);
        return {
          date: datedDataObj.date,
          datedData: currData.filter(dataObj =>
            dataFilter.shouldValueBeKept(dataObj.metrics[fieldId], vals),
          ),
        };
      });
      return newDataList;
    }, this._.data());
    return this._.data(newData);
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<MapQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this._);
    }

    return defaultApplyTransformations(this._, queryResultSpec);
  }

  // Calculate the maximum value for the given field ID. Cache the maximum
  // values found to avoid recomputation. The cache will be rebuilt any time
  // the object changes.
  fieldMaximum(field: string, idx: number): number {
    if (this._fieldMaxCache[field] === undefined) {
      this._fieldMaxCache[field] = this._.data()[idx].datedData.reduce(
        (curMax, { metrics }) => {
          const curVal = metrics[field];
          if (curVal !== undefined && curVal !== null) {
            return Math.max(curMax, curVal);
          }
          return curMax;
        },
        -Infinity,
      );
    }
    return this._fieldMaxCache[field];
  }

  serialize(): SerializedMapQueryResult {
    return this.modelValues();
  }
}

export default ((MapQueryResultData: any): Class<
  Zen.Model<MapQueryResultData>,
>);
