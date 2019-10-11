// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { parseQueryResult } from 'components/visualizations/BumpChart/models/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { LineData } from 'components/ui/visualizations/BumpChart/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type {
  RawTimestamp,
  SerializedDataPoint,
} from 'components/visualizations/BumpChart/types';
import type { Serializable } from 'lib/Zen';
import type { ViewSpecificSettings } from 'components/visualizations/common/commonTypes';

type DefaultValues = {|
  data: $ReadOnlyArray<SerializedDataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  lines: $ReadOnlyArray<LineData>,
|};

// The serialized result is identical to the deserialized version.
type SerializedBumpChartQueryResult = DefaultValues;

class BumpChartQueryResultData
  extends Zen.BaseModel<BumpChartQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BumpChartQueryResultData>,
    Serializable<SerializedBumpChartQueryResult> {
  static defaultValues = {
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

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<SerializedDataPoint> {
    return this._.data().map(dataObj => {
      const newDataObj = { ...dataObj };
      customFields.forEach(field => {
        const { id, formula } = field.modelValues();
        newDataObj[id] = formula.evaluateFormula(newDataObj);
      });
      return newDataObj;
    });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BumpChartQueryResultData> {
    return this.modelValues({
      data: this._calculateNewData(customFields),
    });
  }

  // NOTE(stephen): Not supporting result filters right now since I'm not sure
  // of how the use case looks.
  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<BumpChartQueryResultData> {
    return this._;
  }

  applySettings(
    controls: ViewSpecificSettings<'BUMP_CHART'>,
  ): Zen.Model<BumpChartQueryResultData> {
    const { resultLimit, selectedField, sortOrder } = controls;
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

  serialize(): SerializedBumpChartQueryResult {
    return this.modelValues();
  }
}

export default ((BumpChartQueryResultData: any): Class<
  Zen.Model<BumpChartQueryResultData>,
>);
