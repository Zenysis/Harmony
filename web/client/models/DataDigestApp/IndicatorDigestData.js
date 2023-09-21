// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import memoizeOne from 'decorators/memoizeOne';
import type Field from 'models/core/wip/Field';
import type { Cache } from 'services/wip/CachedMapService';
import type { Deserializable } from 'lib/Zen';

export type FieldSummary = {
  +count: number,
  +endDate: Moment,
  +fieldId: string,
  +fieldName: string,
  +startDate: Moment,
};

type RequiredValues = {
  datasourceName: string,
  fieldSummaries: $ReadOnlyArray<FieldSummary>,
  filepath: string,
};

type SerializedIndicatorDigestData = Array<Array<string>>;

type DeserializationConfig = {
  datasourceName: string,
  filepath: string,
};

/**
 * This holds summary statistics for every indicator integrated in a datasource.
 * This model is deserialized from a CSV we pull from s3.
 */
class IndicatorDigestData
  extends Zen.BaseModel<IndicatorDigestData, RequiredValues>
  implements
    Deserializable<SerializedIndicatorDigestData, DeserializationConfig> {
  static deserialize(
    values: SerializedIndicatorDigestData,
    fieldMap: $ReadOnly<Cache<Field>>,
    extraConfig: DeserializationConfig,
  ): Zen.Model<IndicatorDigestData> {
    const { datasourceName, filepath } = extraConfig;
    const [headerRow, ...dataRows] = values;

    const fieldSummaries = [];
    dataRows.forEach(row => {
      // skip any empty rows
      if (row.length > 0) {
        const fieldInfo = {};
        row.forEach((valStr, i) => {
          const colName = headerRow[i];
          const fieldName = fieldMap[valStr];
          switch (colName) {
            case 'indicator_id':
              fieldInfo.fieldId = valStr;
              fieldInfo.fieldName = fieldName ? fieldName.canonicalName() : '';
              break;
            case 'count':
              fieldInfo.count = Number(valStr);
              break;
            case 'start_date':
              fieldInfo.startDate = Moment.utc(valStr);
              break;
            case 'end_date':
              fieldInfo.endDate = Moment.utc(valStr);
              break;
            default:
              break;
          }
        });

        fieldSummaries.push(fieldInfo);
      }
    });
    return IndicatorDigestData.create({
      datasourceName,
      // $FlowExpectedError[incompatible-exact] Error is expected, but it's safe
      fieldSummaries,
      filepath,
    });
  }

  @memoizeOne
  getNumberOfIndicators(): number {
    const indicatorSet = new Set(
      this._.fieldSummaries().map(row => row.fieldId),
    );
    return indicatorSet.size;
  }

  @memoizeOne
  getTotalNumberOfDataPoints(): number {
    return this._.fieldSummaries().reduce(
      (totalSum, row) => totalSum + row.count,
      0,
    );
  }

  @memoizeOne
  getEarliestDate(): Moment | void {
    if (this._.fieldSummaries().length === 0) {
      return undefined;
    }

    return this._.fieldSummaries().reduce(
      (earliestDate, row) =>
        row.startDate.isBefore(earliestDate) ? row.startDate : earliestDate,
      Moment.create('3000-12-31'),
    );
  }

  @memoizeOne
  getLatestDate(): Moment | void {
    if (this._.fieldSummaries().length === 0) {
      return undefined;
    }

    return this._.fieldSummaries().reduce(
      (latestDate, row) =>
        row.endDate.isAfter(latestDate) ? row.endDate : latestDate,
      Moment.create('1500-01-01'),
    );
  }
}

export default ((IndicatorDigestData: $Cast): Class<
  Zen.Model<IndicatorDigestData>,
>);
