// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import parseResultsAndApplySettings from 'components/visualizations/LineGraph/models/util';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataPoint,
  LineGraphLine,
  RawTimestamp,
  TotalForKey,
} from 'components/visualizations/LineGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  data: $ReadOnlyArray<DataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  lines: LineGraphLine,
  totals: TotalForKey,
|};

// The serialized result is identical to the deserialized version.
type SerializedLineGraphQueryResult = DefaultValues;

class LineGraphQueryResultData
  extends Zen.BaseModel<LineGraphQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<LineGraphQueryResultData>,
    Serializable<SerializedLineGraphQueryResult> {
  static defaultValues = {
    data: [],
    dates: [],
    lines: [],
    totals: [],
  };

  static deserialize(
    values: SerializedLineGraphQueryResult,
  ): Zen.Model<LineGraphQueryResultData> {
    return LineGraphQueryResultData.create({ ...values });
  }

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DataPoint> {
    return this._.data().map(dataObj => {
      let newDataObj = dataObj;
      customFields.forEach(field => {
        const { id, formula } = field.modelValues();
        newDataObj = {
          ...newDataObj,
          [id]: formula.evaluateFormula(newDataObj),
        };
      });
      return newDataObj;
    });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<LineGraphQueryResultData> {
    return this._.data(this._calculateNewData(customFields));
  }

  // NOTE(toshi): Not supporting result filters for now.
  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<LineGraphQueryResultData> {
    return this._;
  }

  /**
   * Collect data for each line.
   */
  applySettings(
    queryResultSpec: QueryResultSpec,
  ): Zen.Model<LineGraphQueryResultData> {
    const parsedLines = parseResultsAndApplySettings(this._, queryResultSpec);
    return this._.lines(parsedLines);
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<LineGraphQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this._);
    }

    return defaultApplyTransformations(this._, queryResultSpec).then(
      queryResult => queryResult.applySettings(queryResultSpec),
    );
  }

  @memoizeOne
  uniqueDimensionValueCount(): number {
    const dimensionValues = new Set(
      this._.lines().map(lineGroup =>
        lineGroup.length > 0 ? lineGroup[0].key : '',
      ),
    );
    return dimensionValues.size;
  }

  serialize(): SerializedLineGraphQueryResult {
    return this.modelValues();
  }
}

export default ((LineGraphQueryResultData: any): Class<
  Zen.Model<LineGraphQueryResultData>,
>);
