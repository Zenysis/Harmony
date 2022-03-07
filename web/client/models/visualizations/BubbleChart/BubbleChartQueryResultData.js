// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'models/visualizations/BubbleChart/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnlyArray<string>,
};

// The serialized result is identical to the deserialized version.
type SerializedBubbleChartQueryResult = DefaultValues;

class BubbleChartQueryResultData
  extends Zen.BaseModel<BubbleChartQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BubbleChartQueryResultData>,
    Serializable<SerializedBubbleChartQueryResult> {
  static defaultValues: DefaultValues = {
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
      applyCustomFieldsToDataObjects(customFields, {
        useStandardRow: true,
        data: this._.data(),
      }),
    );
  }

  applyFilters(
    filters: DataFilterGroup,
  ): Zen.Model<BubbleChartQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: DataPoint, fieldId: string) => row.metrics[fieldId],
      ),
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
  maxValues(): { [string]: number, ... } {
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

export default ((BubbleChartQueryResultData: $Cast): Class<
  Zen.Model<BubbleChartQueryResultData>,
>);
