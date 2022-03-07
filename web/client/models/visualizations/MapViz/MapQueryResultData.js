// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import {
  buildDataFrameFromStandardRows,
  evaluateCustomFields,
} from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  AdminBoundaryFilterLocation,
  DatedDataPoint,
  HeatMapData,
  MapDataPoint,
} from 'models/visualizations/MapViz/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  data: $ReadOnlyArray<DatedDataPoint>,

  // HACK(stephen): Include a simplified way for the map viz to be able to
  // filter admin boundaries based on the user's query. This is passed by the
  // backend so that we don't need to parse the user's query filter on the
  // frontend.
  adminBoundaryExcludeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
  adminBoundaryIncludeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
};

// The serialized result is identical to the deserialized version.
type SerializedMapQueryResult = DefaultValues;

type FieldValues = {
  // Mapping from FieldId to a 2D array. Each value in the outer array is the
  // full set of values for a date index in the query result.
  [FieldId: string]: $ReadOnlyArray<$ReadOnlyArray<number | null>>,
  ...,
};

// NOTE(stephen): Defining an empty read-only array so that methods that need to
// return an empty value can reuse this array. This helps methods that need to
// return an empty value not break memoization by redefining an empty array each
// time.
const EMPTY_ARRAY: $ReadOnlyArray<number | null> = [];

class MapQueryResultData
  extends Zen.BaseModel<MapQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<MapQueryResultData>,
    Serializable<SerializedMapQueryResult> {
  static defaultValues: DefaultValues = {
    adminBoundaryExcludeLocations: [],
    adminBoundaryIncludeLocations: [],
    data: [],
  };

  static deserialize(
    values: SerializedMapQueryResult,
  ): Zen.Model<MapQueryResultData> {
    const {
      adminBoundaryExcludeLocations,
      adminBoundaryIncludeLocations,
      data,
    } = values;
    return MapQueryResultData.create({
      adminBoundaryExcludeLocations,
      adminBoundaryIncludeLocations,
      data,
    });
  }

  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DatedDataPoint> {
    const customFieldResults = evaluateCustomFields(
      customFields,

      // original data is grouped by date, but we can flatten this to a single
      // array of rows so we can reuse one of our `buildDataFrameFromX`
      // functions
      buildDataFrameFromStandardRows(
        this._.data().flatMap(({ date, datedData }) =>
          datedData.map(dataPoint => ({
            ...dataPoint,
            dimensions: {
              ...dataPoint.dimensions,
              // add 'timestamp' as a dimension which is a requirement for our
              // custom calc evaluation
              timestamp: date,
            },
          })),
        ),
      ),
    );

    let dataPointIdxOffset = 0;
    const newData = this._.data().map(datedDataObj => {
      const { date, datedData: currDatedData } = datedDataObj;

      // update the `metrics` (i.e. field data) for each data object with
      // the results from our custom fields
      const newDatedData = currDatedData.map((dataObj, dataPointIdx) => {
        const metrics = { ...dataObj.metrics };

        // remember our `customFieldResults` are a flattened array of all data,
        // so we need to keep track of a `dataPointIdxOffset` to get the results
        // for this date
        customFieldResults.forEach(({ fieldId, values }) => {
          metrics[fieldId] = values[dataPointIdxOffset + dataPointIdx];
        });

        return { ...dataObj, metrics };
      });

      dataPointIdxOffset += currDatedData.length;

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

  applyFilters(filters: DataFilterGroup): Zen.Model<MapQueryResultData> {
    // maps are tough to filter because the data is grouped by date, so to
    // collect all values per field we have to go through every date, and
    // then through every data point per date, and extract the values.
    const newData = filters
      .filters()
      .reduce((currData, { fieldId, filter }) => {
        // go through all dates, and iterate through every data point per date
        // to extract all values for this field
        const allValues = currData.flatMap(dataPoint =>
          dataPoint.datedData.map(
            mapDataPoint => mapDataPoint.metrics[fieldId],
          ),
        );

        return currData.map(dataPoint => ({
          date: dataPoint.date,
          datedData: dataPoint.datedData.filter(mapDataPoint =>
            filter.shouldValueBeKept(mapDataPoint.metrics[fieldId], allValues),
          ),
        }));
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

  _forEachValue(
    callback: (
      fieldId: string,
      value: number | null | void,
      dateIdx: number,
      MapDataPoint,
    ) => void,
  ): void {
    this._.data().forEach(({ datedData }: DatedDataPoint, dateIdx: number) => {
      datedData.forEach((dataPoint: MapDataPoint) => {
        Object.keys(dataPoint.metrics).forEach(fieldId => {
          callback(fieldId, dataPoint.metrics[fieldId], dateIdx, dataPoint);
        });
      });
    });
  }

  // Calculate the maximum field value for each date.
  @memoizeOne
  getFieldMaximumLookup(): { +[FieldId: string]: number, ... } {
    const output = {};
    this._forEachValue((fieldId, value) => {
      if (value === null || value === undefined) {
        return;
      }

      if (output[fieldId] === undefined) {
        output[fieldId] = -Infinity;
      }
      output[fieldId] = Math.max(value, output[fieldId]);
    });
    return output;
  }

  fieldMaximum(fieldId: string): number {
    return this.getFieldMaximumLookup()[fieldId];
  }

  getFieldDataForDate(
    fieldId: string,
    dateIndex: number,
  ): $ReadOnlyArray<number | null> {
    const allFieldData = this.getAllFieldData();
    const fieldData = allFieldData[fieldId];
    if (fieldData === undefined || !this.hasDataForDateIndex(dateIndex)) {
      return EMPTY_ARRAY;
    }

    return fieldData[dateIndex];
  }

  @memoizeOne
  getAllFieldData(): FieldValues {
    const output = {};
    const dateCount = this._.data().length;
    this._forEachValue((fieldId, value, dateIdx) => {
      if (output[fieldId] === undefined) {
        output[fieldId] = new Array(dateCount).fill().map(() => []);
      }
      output[fieldId][dateIdx].push(value);
    });
    return output;
  }

  @memoizeOne
  getHeatMapData(): HeatMapData {
    const output = {};
    const dateCount = this._.data().length;
    this._forEachValue((fieldId, value, dateIdx, dataPoint) => {
      if (output[fieldId] === undefined) {
        output[fieldId] = new Array(dateCount).fill().map(() => []);
      }
      output[fieldId][dateIdx].push([dataPoint.lat, dataPoint.lng, value]);
    });
    return output;
  }

  hasDataForDateIndex(dateIndex: number): boolean {
    const dateCount = this._.data().length;
    return dateCount > dateIndex;
  }

  isEmpty(): boolean {
    return this._.data().length === 0 || !this._.hasDataForDateIndex(0);
  }

  serialize(): SerializedMapQueryResult {
    return this.modelValues();
  }
}

export default ((MapQueryResultData: $Cast): Class<
  Zen.Model<MapQueryResultData>,
>);
