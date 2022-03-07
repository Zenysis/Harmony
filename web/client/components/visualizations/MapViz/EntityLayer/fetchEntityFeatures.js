// @flow
import Promise from 'bluebird';

import {
  ENTITY_TILE_URL,
  ENTITY_TYPE_ORDER,
} from 'components/visualizations/MapViz/EntityLayer/defaults';
import type { Feature } from 'components/ui/visualizations/MapCore/types';

const REQUEST_STATUS: {
  request: Promise<$ReadOnlyArray<Feature>> | void,
  result: $ReadOnlyArray<Feature> | void,
} = {
  request: undefined,
  result: undefined,
};

export default function fetchEntityFeatures(): Promise<
  $ReadOnlyArray<Feature>,
> {
  if (REQUEST_STATUS.result !== undefined) {
    return Promise.resolve(REQUEST_STATUS.result);
  }

  if (REQUEST_STATUS.request !== undefined) {
    return REQUEST_STATUS.request;
  }

  /* eslint-disable no-console */
  REQUEST_STATUS.request = new Promise((resolve, reject) => {
    $.getJSON(ENTITY_TILE_URL)
      .done(data => {
        if (!data.features || data.features.length === 0) {
          console.error('No data returned');
          REQUEST_STATUS.result = [];
        } else {
          REQUEST_STATUS.result = data.features;
        }

        // Add the entity ID to each feature to make usage easier.
        REQUEST_STATUS.result.forEach(({ properties }) => {
          // eslint-disable-next-line no-param-reassign
          properties.entityId = ENTITY_TYPE_ORDER.map(
            entityType => properties[entityType],
          ).join('--');
        });
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
