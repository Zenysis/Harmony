// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'components/ui/visualizations/BarGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
|};

// The serialized result is identical to the deserialized version.
type SerializedBarGraphQueryResult = DefaultValues;

class BarGraphQueryResultData
  extends Zen.BaseModel<BarGraphQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BarGraphQueryResultData>,
    Serializable<SerializedBarGraphQueryResult> {
  static defaultValues = {
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
      this._.data().map(({ dimensions, metrics }: DataPoint) => {
        const newMetrics = { ...metrics };
        customFields.forEach(field => {
          const formula = field.formula();
          newMetrics[field.id()] = formula.evaluateFormula(newMetrics);
        });
        return { dimensions, metrics: newMetrics };
      }),
    );
  }

  applyFilters(
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<BarGraphQueryResultData> {
    if (filterMap.isEmpty()) {
      return this._;
    }

    return this._.data(
      filterMap
        .values()
        .reduce((newData: $ReadOnlyArray<DataPoint>, filter: DataFilter) => {
          const fieldID = filter.fieldId();
          // Need to recompute `allValues` each loop iteration since the
          // previous filter might have filtered out certain values. Each filter
          // is applied in order, so a later filter uses the previous filter's
          // context instead of the original context.
          const allValues = newData.map(({ metrics }) => metrics[fieldID]);
          return newData.filter(({ metrics }) =>
            filter.shouldValueBeKept(metrics[fieldID], allValues),
          );
        }, this._.data()),
    );
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BarGraphQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  serialize(): SerializedBarGraphQueryResult {
    return this.modelValues();
  }
}

export default ((BarGraphQueryResultData: any): Class<
  Zen.Model<BarGraphQueryResultData>,
>);
