// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'components/visualizations/BubbleChart/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
|};

// The serialized result is identical to the deserialized version.
type SerializedBubbleChartQueryResult = DefaultValues;

class BubbleChartQueryResultData
  extends Zen.BaseModel<BubbleChartQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BubbleChartQueryResultData>,
    Serializable<SerializedBubbleChartQueryResult> {
  static defaultValues = {
    data: [],
    dimensions: [],
  };

  static deserialize(
    values: SerializedBubbleChartQueryResult,
  ): Zen.Model<BubbleChartQueryResultData> {
    return BubbleChartQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BubbleChartQueryResultData> {
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
  ): Zen.Model<BubbleChartQueryResultData> {
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
  ): Promise<Zen.Model<BubbleChartQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  @memoizeOne
  maxValues(): { [string]: number } {
    const output = {};
    this._.data().forEach(({ metrics }) => {
      Object.keys(metrics).forEach(metricID => {
        if (output[metricID] === undefined) {
          output[metricID] = -Infinity;
        }
        const value = metrics[metricID];
        if (value !== null) {
          output[metricID] = Math.max(output[metricID], value);
        }
      });
    });
    return output;
  }

  serialize(): SerializedBubbleChartQueryResult {
    return this.modelValues();
  }
}

export default ((BubbleChartQueryResultData: any): Class<
  Zen.Model<BubbleChartQueryResultData>,
>);
