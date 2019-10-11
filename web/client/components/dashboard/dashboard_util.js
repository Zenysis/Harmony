import { IndicatorLookup } from 'indicator_fields';
import { getPercentChange } from 'components/dashboard/rank_util';
import { sortNumeric } from 'util/util';

export function sortPercentChange(resultA, resultB, granularity) {
  let aVal = getPercentChange(
    resultA.historicalData[granularity],
    resultA.currentData[granularity],
  );
  let bVal = getPercentChange(
    resultB.historicalData[granularity],
    resultB.currentData[granularity],
  );
  aVal *= resultA.decreaseIsGood ? -1 : 1;
  bVal *= resultB.decreaseIsGood ? -1 : 1;

  return sortNumeric(aVal, bVal, true);
}

// Abstract class for processing a query result into the format
// the field and geo dashboards expect.
class DashboardResultBuilder {
  constructor(sortGranularity) {
    this._sortGranularity = sortGranularity;
  }

  /* eslint-disable class-methods-use-this, no-console, no-unused-vars */
  includeField(fieldId) {
    return true;
  }

  includeGeo(geoKey) {
    return true;
  }

  buildEmptyResult(name, geoMetadata, fieldObj) {
    return {
      name,
      decreaseIsGood: !!fieldObj.decreaseIsGood,
      fieldId: fieldObj.id,
      geoName: geoMetadata.name,
      rank: -1,
      currentData: {},
      historicalData: {},
    };
  }

  buildNewResult(geoKey, fieldId) {
    console.error('Method should be provided by subclass');
  }

  getResultKey(geoKey, fieldId) {
    console.error('Method should be provided by subclass');
  }
  /* eslint-enable class-methods-use-this, no-console, no-unused-vars */

  processResponse(response) {
    const results = {};
    Object.keys(response.byGeo).forEach(geoKey => {
      if (!this.includeGeo(geoKey)) {
        return;
      }
      const geoObj = response.byGeo[geoKey];

      response.fieldsToDisplay.forEach(fieldId => {
        if (!this.includeField(fieldId)) {
          return;
        }

        const fieldObj = IndicatorLookup[fieldId];
        if (!fieldObj) {
          // eslint-disable-next-line no-console
          console.error('Server returned data for unknown field: ', fieldId);
          return;
        }

        const resultKey = this.getResultKey(geoKey, fieldId);
        if (!results[resultKey]) {
          results[resultKey] = this.buildNewResult(geoObj.metadata, fieldObj);
        }
        const curResult = results[resultKey];

        Object.keys(geoObj.data).forEach(granularity => {
          const curData = geoObj.data[granularity];

          // TODO(stephen): Need to validate that the dates returned are what
          // we are expecting since it is possible for an indicator to not
          // be reported for all geos at the same time. It may make sense to
          // just have the server return all the dates for the given
          // granularity in the range, since that will make historical value
          // storage simpler.
          const dates = Object.keys(curData);
          const numDates = dates.length;
          if (!numDates) {
            return;
          }
          dates.sort();

          // Record the last date's value as the current data point
          // and store the previous date's value (if it exists) as the
          // historical data point.
          const curDate = dates[numDates - 1];
          curResult.currentData[granularity] = curData[curDate][fieldId];

          // Store the historical value for the given granularity if it exists
          if (numDates > 1) {
            // TODO(stephen): Validate dates (see TODO above).
            const previousDate = dates[numDates - 2];
            curResult.historicalData[granularity] =
              curData[previousDate][fieldId];
          }

          // HACK to calculate month this year vs month last year
          // TODO(stephen): Make this better
          if (granularity === 'month') {
            curResult.currentData.monthOfYear = curResult.currentData.month;

            // TODO(stephen): Need a better way than just assumption to know
            // that the first date in the month date list is the current month
            // of the previous year due to Ethiopian dates.
            if (numDates > 2) {
              curResult.historicalData.monthOfYear = curData[dates[0]][fieldId];
            }
          }
        });
      });
    });

    // The dashboard expects the output to be an array of objects sorted from
    // most improved to least improved for the specified granularity.
    return Object.keys(results)
      .map(key => results[key])
      .sort((a, b) => sortPercentChange(a, b, this._sortGranularity));
  }
}

export class FieldResultBuilder extends DashboardResultBuilder {
  constructor(sortGranularity, fieldId) {
    super(sortGranularity);
    this._fieldId = fieldId;
  }

  includeField(fieldId) {
    return this._fieldId === fieldId;
  }

  buildNewResult(geoMetadata, fieldObj) {
    return this.buildEmptyResult(geoMetadata.name, geoMetadata, fieldObj);
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  getResultKey(geoKey, fieldId) {
    return geoKey;
  }
}

export class GeoResultBuilder extends DashboardResultBuilder {
  constructor(sortGranularity, geoKey) {
    super(sortGranularity);
    this._geoKey = geoKey;
  }

  includeGeo(geoKey) {
    return this._geoKey === geoKey;
  }

  buildNewResult(geoMetadata, fieldObj) {
    return this.buildEmptyResult(fieldObj.text, geoMetadata, fieldObj);
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  getResultKey(geoKey, fieldId) {
    return fieldId;
  }

  processResponse(response) {
    const output = super.processResponse(response);
    const numGeos = output.length;
    output.forEach((geoObj, idx) => {
      geoObj.geoRank = idx + 1; // eslint-disable-line no-param-reassign
      geoObj.numGeos = numGeos; // eslint-disable-line no-param-reassign
    });
    return output;
  }
}

export function buildGroup(groupTitle, groupData, groupUrl = null) {
  return {
    title: groupTitle,
    data: groupData,
    url: groupUrl,
  };
}

// Merge multiple GeoTimeAggregator query results into a single result
export function mergeRawAggregateResults(results) {
  if (results.length === 1) {
    return results[0];
  }

  const geoResults = {};
  const uniqueFields = new Set();
  results.forEach(result => {
    uniqueFields.addAll(result.fieldsToDisplay);
    Object.keys(result.byGeo).forEach(geoKey => {
      const geoResult = result.byGeo[geoKey];
      if (!geoResults[geoKey]) {
        geoResults[geoKey] = {
          data: {},
          metadata: geoResult.metadata,
        };
      }
      const geoData = geoResults[geoKey].data;

      // Copy each granularity's result to the merged output
      Object.keys(geoResult.data).forEach(granularity => {
        if (!geoData[granularity]) {
          geoData[granularity] = {};
        }

        const mergedData = geoData[granularity];
        const granularityData = geoResult.data[granularity];
        Object.keys(granularityData).forEach(date => {
          if (mergedData[date]) {
            // eslint-disable-next-line no-console
            console.error(
              'Attempting to overwrite existing data for granularity. ',
              'GeoKey: ',
              geoKey,
              'Granularity: ',
              granularity,
              'Date: ',
              date,
            );
            return;
          }
          mergedData[date] = granularityData[date];
        });
      });
    });
  });

  return {
    byGeo: geoResults,
    // NOTE(stephen): Returning a set, but it is array-like and should be ok
    fieldsToDisplay: uniqueFields,
  };
}
