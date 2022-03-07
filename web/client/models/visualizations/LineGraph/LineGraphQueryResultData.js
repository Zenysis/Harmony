// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import parseResultsAndApplySettings from 'models/visualizations/LineGraph/util';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataPoint,
  LineGraphLines,
  RawTimestamp,
  TotalForKey,
} from 'models/visualizations/LineGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  data: $ReadOnlyArray<DataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  lines: LineGraphLines,
  totals: TotalForKey,
};

type SerializedLineGraphQueryResult = {
  data: $ReadOnlyArray<DataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  totals: TotalForKey,
};

class LineGraphQueryResultData
  extends Zen.BaseModel<LineGraphQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<LineGraphQueryResultData>,
    Serializable<SerializedLineGraphQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dates: [],
    lines: [],
    totals: {},
  };

  static deserialize(
    values: SerializedLineGraphQueryResult,
  ): Zen.Model<LineGraphQueryResultData> {
    return LineGraphQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<LineGraphQueryResultData> {
    return this._.data(
      applyCustomFieldsToDataObjects(customFields, {
        useTimeSeriesRowWithNullableValues: true,
        data: this._.data(),
      }),
    );
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<LineGraphQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: DataPoint, fieldId: string) => row[fieldId],
      ),
    );
  }

  /**
   * Collect data for each line.
   */
  applySettings(
    queryResultSpec: QueryResultSpec,
  ): Zen.Model<LineGraphQueryResultData> {
    const parsedLines = parseResultsAndApplySettings(
      this._.data(),
      this._.totals(),
      queryResultSpec,
    );
    return this._.lines(parsedLines);
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<LineGraphQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this._);
    }

    return defaultApplyTransformations(
      this._,
      queryResultSpec,
    ).then(queryResult => queryResult.applySettings(queryResultSpec));
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
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
    const { lines, ...valuesToSerialize } = this.modelValues();
    return valuesToSerialize;
  }
}

export default ((LineGraphQueryResultData: $Cast): Class<
  Zen.Model<LineGraphQueryResultData>,
>);
