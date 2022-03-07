// @flow
import Promise from 'bluebird';

import type { Feature } from 'components/ui/visualizations/MapCore/types';

const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;

const REQUEST_STATUS: {
  request: Promise<$ReadOnlyArray<Feature>> | void,
  result: $ReadOnlyArray<Feature> | void,
} = {
  request: undefined,
  result: undefined,
};

export default function fetchGeoJsonTiles(): Promise<$ReadOnlyArray<Feature>> {
  if (REQUEST_STATUS.result !== undefined) {
    return Promise.resolve(REQUEST_STATUS.result);
  }

  if (REQUEST_STATUS.request !== undefined) {
    return REQUEST_STATUS.request;
  }

  /* eslint-disable no-console */
  REQUEST_STATUS.request = new Promise((resolve, reject) => {
    $.getJSON(GEOJSON_TILE_URL)
      .done(data => {
        if (!data.features || data.features.length === 0) {
          console.error('No data returned');
          REQUEST_STATUS.result = [];
        } else {
          REQUEST_STATUS.result = data.features;
        }
        resolve(REQUEST_STATUS.result);
      })
      .fail((jqxhr, textStatus, error) => {
        console.error('Cannot process GeoJson data');
        console.error(`{Error: ${error}}`);
        reject();
      });
  });
  /* eslint-enable no-console */
  return REQUEST_STATUS.request;
}
