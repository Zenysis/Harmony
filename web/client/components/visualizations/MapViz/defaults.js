// @flow

export const QUERY_RESULT_LAYER_ID = 'query-result-layer';

// The possible layer IDs that support click/hover interactions.
const mutableInteractiveLayerIds = [QUERY_RESULT_LAYER_ID];

// TODO: We have a control setting that holds the list of visible
// marker layers. We should consolidate these two similar properties.
export const INTERACTIVE_LAYER_IDS = mutableInteractiveLayerIds;
