import numeral from 'numeral';

import {
  BACKEND_GRANULARITIES,
  BUCKET_TYPE,
} from 'components/QueryResult/timeSeriesUtil';
import { capitalizeEachWord } from 'util/stringUtil';
import { sortNumeric } from 'util/arrayUtil';

export function passesFilter(filters, fieldId, value) {
  if (filters && value !== undefined) {
    const fieldFilter = filters[fieldId];
    if (!fieldFilter) {
      // No filter added for this field.
      return true;
    }
    if (fieldFilter.removeZeroes && value === 0) {
      return false;
    }
    if (fieldFilter.removeNulls && value === null) {
      return false;
    }
    if (value < fieldFilter.removeMin || value > fieldFilter.removeMax) {
      return false;
    }
    if (!Number.isFinite(value)) {
      return false;
    }
  }
  return true;
}

// Return the structure of the processed query response
export function getEmptyLegacyResult() {
  return {
    errorMessage: null,
    hasError: false,
    metadata: {
      first_quartile: {},
      max: {},
      mean: {},
      median: {},
      min: {},
      num_nonzero: {},
      std: {},
      third_quartile: {},
      totals: {},
      variance: {},
    },
    series: [],
    unfilteredSeries: [],
  };
}

// Total values are stored in the "all" granularity
// of the geo data. There should only be one date
// registered in this bucket (since the db rolls
// everything into a single date for the "all"
// granularity)
function extractTotalValues(geoData) {
  const keys = Object.keys(geoData.all);
  if (keys.length > 1) {
    console.error('"all" object contains more than one date!');
  }
  return geoData.all[keys[0]];
}

// Convert a data response into series, aka "bars".
export function processQueryResponse(
  data,
  fieldIds,
  filters,
  timeSeriesBucket = BACKEND_GRANULARITIES[BUCKET_TYPE.MONTH],
) {
  console.log('Processing query data...', fieldIds, filters, data);
  const output = getEmptyLegacyResult();
  let numNonzeroValues = 0;

  Object.keys(data.byGeo).forEach(geoKey => {
    const apiGeoObj = data.byGeo[geoKey];

    // TODO(ian): Send the correct display name and object structure from
    // server. In general, shouldn't need to do all this manipulation here.
    const dataSeries = apiGeoObj.metadata;
    dataSeries.lat = parseFloat(dataSeries.lat) || 0.0;
    dataSeries.lng = parseFloat(dataSeries.lng) || 0.0;
    dataSeries.geoName = capitalizeEachWord(apiGeoObj.metadata.name);
    dataSeries.geoKey = geoKey;
    dataSeries.dates = [];

    let shouldPublishThisSeries = true;
    fieldIds.forEach(fieldId => {
      let totalIndicatorValue;
      if (apiGeoObj.data[BACKEND_GRANULARITIES.ALL]) {
        const totalValues = extractTotalValues(apiGeoObj.data);
        totalIndicatorValue = totalValues[fieldId];
        // Total value.
        if (!Number.isFinite(totalIndicatorValue)) {
          // There's no value for this (geo, field) pair.
          return;
        }

        // Should we filter it out?
        if (!passesFilter(filters, fieldId, totalIndicatorValue)) {
          shouldPublishThisSeries = false;
        }

        if (totalIndicatorValue) {
          numNonzeroValues++;
        }
      }
      dataSeries[`yValue_${fieldId}`] = totalIndicatorValue;

      // Time series value.
      if (apiGeoObj.data[timeSeriesBucket]) {
        const geoData = apiGeoObj.data[timeSeriesBucket];
        const timeSeries = Object.keys(geoData)
          .map(dateKey => {
            const datePoint = geoData[dateKey];
            datePoint.Real_Date = dateKey;
            return datePoint;
          })
          .sort((datePointA, datePointB) =>
            datePointA.Real_Date.localeCompare(datePointB.Real_Date),
          );
        dataSeries[`yValue_date_${fieldId}`] = [];

        timeSeries.forEach(datePoint => {
          dataSeries.dates.push(datePoint.Real_Date);
          dataSeries[`yValue_date_${fieldId}`].push(datePoint[fieldId]);
        });
      }
    });
    output.unfilteredSeries.push(dataSeries);
    if (shouldPublishThisSeries) {
      output.series.push(dataSeries);
    }
  });

  // Sort series by greatest value first, by the first indicator.
  const key = `yValue_${fieldIds[0]}`;
  output.series.sort((a, b) => sortNumeric(a[key], b[key], true));

  output.metadata = data.overall;

  // Error handling.
  if (numNonzeroValues < 1) {
    output.hasError = true;
    output.errorMessage = 'Your selection returned no results.';
  }

  return output;
}

export const formatNum = num => numeral(num).format('0,0.[00000000]');
