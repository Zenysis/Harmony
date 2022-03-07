// @flow

import {
  ENTITY_LAYER_SUPPORTED,
} from 'components/visualizations/MapViz/EntityLayer/defaults';

export const QUERY_RESULT_LAYER_ID = 'query-result-layer';
export const ENTITY_LAYER_ID = 'entity-layer';

// The possible layer IDs that support click/hover interactions.
const mutableInteractiveLayerIds = [QUERY_RESULT_LAYER_ID];
if (ENTITY_LAYER_SUPPORTED) {
  mutableInteractiveLayerIds.push(ENTITY_LAYER_ID);
}

export const DEPLOYMENT_SPECIFIC_LAYER_IDS = [];

// TODO(nina): We have a control setting that holds the list of visible
// marker layers. We should consolidate these two similar properties.
export const INTERACTIVE_LAYER_IDS = mutableInteractiveLayerIds;
