// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import {
  SORT_ALPHABETICAL,
  SORT_DESCENDING,
} from 'components/QueryResult/graphUtil';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { sortNumeric, sortAlphabetic } from 'util/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
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
    +[string]: number,
  },
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
  static defaultValues = {
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

  _calculateNewTotals(customFields: $ReadOnlyArray<CustomField>): TotalsMap {
    const output = {};
    const curTotalsMap = this._.totalsMap();
    Object.keys(curTotalsMap).forEach(key => {
      const newTotals = { ...curTotalsMap[key] };
      customFields.forEach(field => {
        newTotals[field.id()] = field.formula().evaluateFormula(newTotals);
      });
      output[key] = newTotals;
    });
    return output;
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
  ): Zen.Model<HeatTilesQueryResultData> {
    return this.modelValues({
      data: this._calculateNewData(customFields),
      totalsMap: this._calculateNewTotals(customFields),
    });
  }

  // TODO(nina, stephen): Support filtering for HeatTiles.
  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<HeatTilesQueryResultData> {
    return this._;
  }

  applySettings(
    queryResultSpec: QueryResultSpec,
  ): Zen.Model<HeatTilesQueryResultData> {
    const controls = queryResultSpec.getVisualizationControls(
      RESULT_VIEW_TYPES.HEATTILES,
    );
    const { selectedField, showTimeOnYAxis, sortOn, sortOrder } = controls;
    const isSortingAlpha = sortOrder === SORT_ALPHABETICAL;
    const sortFn = isSortingAlpha ? sortAlphabetic : sortNumeric;
    const sortField = showTimeOnYAxis ? selectedField : sortOn;

    // Recreate the totals array based on the modified data and totalsMap.
    const totals = _buildTotals(this._.data(), this._.totalsMap());

    // Sort the totals based on the user settings.
    totals.sort((a, b) =>
      sortFn(
        isSortingAlpha ? a.key : a.totals[sortField],
        isSortingAlpha ? b.key : b.totals[sortField],
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

    return defaultApplyTransformations(this._, queryResultSpec).then(
      queryResult => queryResult.applySettings(queryResultSpec),
    );
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

export default ((HeatTilesQueryResultData: any): Class<
  Zen.Model<HeatTilesQueryResultData>,
>);
