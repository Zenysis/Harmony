// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import {
  SORT_ALPHABETICAL,
  SORT_DESCENDING,
} from 'components/QueryResult/graphUtil';
import { applyCustomFieldsToDataObjects } from 'models/core/Field/CustomField/Formula/formulaUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { sortNumeric, sortAlphabetic } from 'util/arrayUtil';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataPoint,
  RawTimestamp,
  TotalsValue,
} from 'models/visualizations/HeatTiles/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type TotalsMap = {
  // Mapping from data point key (like location) to a mapping from Field ID to
  // total value for that field.
  +[string]: {
    +[string]: number | null,
    ...,
  },
  ...,
};

type DefaultValues = {
  data: $ReadOnlyArray<DataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  totals: $ReadOnlyArray<TotalsValue>,
  totalsMap: TotalsMap,
};

// The raw query result format that is returned by the server.
type SerializedHeatTilesQueryResult = {
  data: $ReadOnlyArray<DataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  totals: TotalsMap,
};

function _buildTotals(
  data: $ReadOnlyArray<DataPoint>,
  totalsMap: TotalsMap,
): Array<TotalsValue> {
  // TODO(nina): $HeatTilesRefactor - Right now, the entries for 'totals'
  // will mimic the style of LegacyQueryResultData. Need to figure out a
  // better way to do this since the point is to move away from Legacy
  // stuff. 'totals' will be an array of dictionaries. Each dictionary
  // corresponds to a particular location. Each dictionary will have the
  // following key-value pairs:
  //    - 'dates': array of unique dates that this location has values for
  //    - '[indicator name]': total value for this indicator
  //    - 'key': name of location (EX: "Beira", a district in MZ)
  //    - 'yValue_date_[indicator name]': array of values for this
  //      indicator that correspond to a particular date. The order of
  //      values matches to the order of dates in 'dates'
  const datePrefix = 'yValue_date';

  // Gets each location
  return Object.keys(totalsMap).map(keyName => {
    const totalsObj = totalsMap[keyName];
    const valDict = {
      dates: [],
      key: keyName,
      totals: {},
    };

    // Restructures the current objects, to later cleanly store in 'totals'
    const indicatorIds = Object.keys(totalsObj);

    indicatorIds.forEach((valKey, idx) => {
      const indicator = indicatorIds[idx];
      valDict.totals[indicator] = totalsObj[indicator];
      const dateKey = `${datePrefix}_${indicator}`;
      const dateVals = [];

      // Looks through original data to store date values in corresponding
      // keys in 'totals'
      data.forEach(point => {
        if (point.key === keyName) {
          dateVals.push(point[indicator]);
          if (!valDict.dates.includes(point.timestamp)) {
            valDict.dates.push(point.timestamp);
          }
        }
      });

      valDict[dateKey] = dateVals;
    });

    return valDict;
  });
}

class HeatTilesQueryResultData
  extends Zen.BaseModel<HeatTilesQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<HeatTilesQueryResultData>,
    Serializable<SerializedHeatTilesQueryResult> {
  static defaultValues: DefaultValues = {
    data: [],
    dates: [],
    totals: [],
    totalsMap: {},
  };

  static deserialize(
    values: SerializedHeatTilesQueryResult,
  ): Zen.Model<HeatTilesQueryResultData> {
    if (!values.totals) {
      return HeatTilesQueryResultData.create(values);
    }

    const { data, dates, totals: totalsMap } = values;
    return HeatTilesQueryResultData.create({
      data,
      dates,
      totalsMap,
      totals: _buildTotals(data, totalsMap),
    });
  }

  _calculateNewTotals(
    customFields: $ReadOnlyArray<CustomField>,
    newData: $ReadOnlyArray<DataPoint>,
  ): TotalsMap {
    // iterate over all our newData, and for each dimension gather a total
    // sum per custom field
    const customFieldTotalsPerDimension: Map<
      string,
      Map<string, number | null>,
    > = new Map();
    newData.forEach(dataObj => {
      Object.keys(dataObj.dimensions).forEach(dimId => {
        const dimVal = dataObj.dimensions[dimId];
        if (dimVal !== null) {
          const totalsPerField =
            customFieldTotalsPerDimension.get(dimVal) ||
            new Map<string, number | null>();

          customFields.forEach(field => {
            const fieldId = field.id();
            const fieldVal = dataObj[fieldId];
            const currentTotal = totalsPerField.get(fieldId) || null;
            const newTotal =
              currentTotal === null && fieldVal === null
                ? null
                : Number(currentTotal) + Number(fieldVal);
            totalsPerField.set(fieldId, newTotal);
          });

          customFieldTotalsPerDimension.set(dimVal, totalsPerField);
        }
      });
    });

    // now add all the totals for each custom field to the current `totalsMap`
    const output = {};
    customFieldTotalsPerDimension.forEach((totalsPerField, dimVal) => {
      const oldTotals = this._.totalsMap()[dimVal];
      const newTotals = { ...oldTotals };
      totalsPerField.forEach((total, fieldId) => {
        newTotals[fieldId] = total;
      });
      output[dimVal] = newTotals;
    });

    return output;
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<HeatTilesQueryResultData> {
    const newData = applyCustomFieldsToDataObjects(customFields, {
      useTimeSeriesRowWithNullableValues: true,
      data: this._.data(),
    });

    return this.modelValues({
      data: newData,
      totalsMap: this._calculateNewTotals(customFields, newData),
    });
  }

  applyFilters(filters: DataFilterGroup): Zen.Model<HeatTilesQueryResultData> {
    return this._.data(
      filters.filterRows(
        this._.data(),
        (row: DataPoint, fieldId: string) => row[fieldId],
      ),
    );
  }

  applySettings(
    queryResultSpec: QueryResultSpec,
  ): Zen.Model<HeatTilesQueryResultData> {
    const controls = queryResultSpec.getVisualizationControls('HEATTILES');
    const {
      selectedField,
      showTimeOnYAxis,
      sortOn,
      sortOrder,
    } = controls.modelValues();
    const isSortingAlpha = sortOrder === SORT_ALPHABETICAL;
    const sortField = showTimeOnYAxis ? selectedField : sortOn;

    // Recreate the totals array based on the modified data and totalsMap.
    const totals = _buildTotals(this._.data(), this._.totalsMap());

    // Sort the totals based on the user settings.
    totals.sort((a, b) =>
      isSortingAlpha
        ? sortAlphabetic(a.key, b.key, sortOrder === SORT_DESCENDING)
        : sortNumeric(
            a.totals[sortField],
            b.totals[sortField],
            sortOrder === SORT_DESCENDING,
          ),
    );
    return this._.totals(totals);
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<HeatTilesQueryResultData>> {
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

  serialize(): SerializedHeatTilesQueryResult {
    const serializedTotals = {};
    this._.totals().forEach(({ key, totals }) => {
      serializedTotals[key] = { ...totals };
    });

    return {
      data: this._.data(),
      dates: this._.dates(),
      totals: serializedTotals,
    };
  }
}

export default ((HeatTilesQueryResultData: $Cast): Class<
  Zen.Model<HeatTilesQueryResultData>,
>);
