import QueryInterface from 'components/visualizations/common/QueryInterface';
import { API_VERSION } from 'services/APIService';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { processQueryResponse } from 'components/QueryResult/resultUtil';

const ENDPOINT = 'aggregate';

function getFiltersFromSelection(filters) {
  const output = [];

  if (!filters) {
    return output;
  }

  Object.keys(filters).forEach(filterName => {
    const filterObj = Object.assign({}, filters[filterName]);

    // If the filter object is a color filter then do *not*
    // add it to the db Query, otherwise it will break things in the backend
    if ('colorFilters' in filterObj) {
      return;
    }

    // Remove client metadata
    Object.keys(filterObj).forEach(key => {
      if (key[0] === '_' || !filterObj[key]) {
        delete filterObj[key];
      }
    });
    output.push(filterObj);
  });
  return output;
}

export default class Query extends QueryInterface {
  constructor() {
    super(API_VERSION.V1, ENDPOINT);
  }

  buildRequest(selections, timeGranularities = [BACKEND_GRANULARITIES.ALL]) {
    // This one is really easy because the legacy API and the selections
    // object were created in tandem
    const request = {
      granularity: selections.granularity,
      fields: selections.fields,
      denominator: selections.denominator,
      start_date: selections.startDate,
      end_date: selections.endDate,
      demo: window.__JSON_FROM_BACKEND.IS_DEMO,
      filters: getFiltersFromSelection(selections.filters),
    };

    if (timeGranularities) {
      request.granularities = timeGranularities;
    }
    this.setRequest(request);

    // Need to store the selectioned filters and fields since they are
    // needed for processing the server response
    this._fields = selections.fields;
    this._filters = selections.filters;
    this._timeGranularities = timeGranularities;
    return this;
  }

  // Override the populateCache method so that we can store the processed
  // query response in the cache instead of the raw oversion
  populateCache(cacheKey, value) {
    // HACK(stephen): Need to tell processQueryResponse which date bucket
    // returned by GTA is our "time series" bucket since IT ONLY SUPPORTS ONE.
    let timeSeriesBucket;
    if (this._timeGranularities.length) {
      // Find the first granularity that is not ALL, if it exists.
      timeSeriesBucket = this._timeGranularities.find(
        b => b !== BACKEND_GRANULARITIES.ALL,
      );
    }
    const response = processQueryResponse(
      value,
      this._fields,
      this._filters,
      timeSeriesBucket,
    );

    // Store the original response returned by the server. It is needed
    // for exporting to CSV.
    response.rawResponse = value;
    return super.populateCache(cacheKey, response);
  }
}
