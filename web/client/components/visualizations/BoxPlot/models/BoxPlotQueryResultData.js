// @flow
import * as Zen from 'lib/Zen';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DataPoint } from 'components/visualizations/BoxPlot/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  data: $ReadOnlyArray<DataPoint>,
  groupableKeys: $ReadOnlyArray<string>,
|};

// The serialized result is identical to the deserialized version.
type SerializedBoxPlotQueryResult = DefaultValues;

/**
 * BoxPlotQueryResultData  represents the data format used to render the BoxPlot
 * data:
 *   array of objects
 *   Each object represents a data point that can be grouped into a box
 *     {
 *       [dimensionName]: number (e.g. subrecipient, RegionName, ZoneName, etc.)
 *       date: string
 *       field: string
 *       val: number
 *     }
 *   All data is groupable by date, field, or a dimension
 *   They are not groupable by 'val'
 * groupableKeys:
 *   array of string
 *   An array of keys by which we can group the data objects
 *
 */

class BoxPlotQueryResultData
  extends Zen.BaseModel<BoxPlotQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BoxPlotQueryResultData>,
    Serializable<SerializedBoxPlotQueryResult> {
  static defaultValues = {
    data: [],
    groupableKeys: [],
  };

  static deserialize(
    values: SerializedBoxPlotQueryResult,
  ): Zen.Model<BoxPlotQueryResultData> {
    return BoxPlotQueryResultData.create({ ...values });
  }

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DataPoint> {
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
  ): Zen.Model<BoxPlotQueryResultData> {
    return this._.data(this._calculateNewData(customFields));
  }

  // NOTE(stephen): Filter application is currently not supported for BoxPlot.
  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<BoxPlotQueryResultData> {
    return this._;
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BoxPlotQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  serialize(): SerializedBoxPlotQueryResult {
    return this.modelValues();
  }
}

export default ((BoxPlotQueryResultData: any): Class<
  Zen.Model<BoxPlotQueryResultData>,
>);
