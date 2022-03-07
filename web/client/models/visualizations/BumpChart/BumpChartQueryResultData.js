// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { parseQueryResult } from 'models/visualizations/BumpChart/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { LineData } from 'components/ui/visualizations/BumpChart/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type {
  RawTimestamp,
  SerializedDataPoint,
} from 'models/visualizations/BumpChart/types';
import type { Serializable } from 'lib/Zen';
import type { ViewSpecificSettings } from 'models/visualizations/common/types';

type DefaultValues = {
  data: $ReadOnlyArray<SerializedDataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  lines: $ReadOnlyArray<LineData>,
};

// The serialized result is identical to the deserialized version.
type SerializedBumpChartQueryResult = DefaultValues;

class BumpChartQueryResultData
  extends Zen.BaseModel<BumpChartQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BumpChartQueryResultData>,
    Serializable<SerializedBumpChartQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dates: [],
    lines: [],
  };

  static deserialize(
    values: SerializedBumpChartQueryResult,
  ): Zen.Model<BumpChartQueryResultData> {
    if (values.data === undefined) {
      return this.create({ ...values });
    }

    // HACK(stephen): With AQT, BumpChart's response can include keys with
    // null as the name. In the simple query form, this is prevented with a
    // filter. Temporarily convert those null keys to 'null' and fix later.
    // TODO(stephen): This should be refactored so that the component layer
    // can call QueryResultGrouping.formatGroupingValue.
    const data = values.data.map(d => {
      if (d.key === null) {
        return {
          ...d,
          key: 'null',
        };
      }
      return d;
    });
    return BumpChartQueryResultData.create({
      data,
      dates: values.dates,
      lines: values.lines,
    });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BumpChartQueryResultData> {
    return this._.data(
      applyCustomFieldsToDataObjects(customFields, {
        useTimeSeriesRow: true,
        data: this._.data(),
      }),
    );
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<BumpChartQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: SerializedDataPoint, fieldId: string) => row[fieldId],
      ),
    );
  }

  applySettings(
    controls: ViewSpecificSettings<'BUMP_CHART'>,
  ): Zen.Model<BumpChartQueryResultData> {
    const { resultLimit, selectedField, sortOrder } = controls.modelValues();
    return this._.lines(
      parseQueryResult(
        this._.data(),
        this._.dates(),
        selectedField,
        resultLimit,
        sortOrder === SORT_DESCENDING,
      ),
    );
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BumpChartQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this._);
    }

    return defaultApplyTransformations(this._, queryResultSpec).then(
      queryResult => {
        const controls = queryResultSpec.getVisualizationControls(
          RESULT_VIEW_TYPES.BUMP_CHART,
        );
        return queryResult.applySettings(controls);
      },
    );
  }

  isEmpty(): boolean {
    return this._.data().length === 0;
  }

  serialize(): SerializedBumpChartQueryResult {
    return this.modelValues();
  }
}

export default ((BumpChartQueryResultData: $Cast): Class<
  Zen.Model<BumpChartQueryResultData>,
>);
