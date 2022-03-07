// @flow

import EntityLayerService from 'services/visualizations/Map/EntityLayerService';

export const ENTITY_TYPE_ORDER: $ReadOnlyArray<string> = EntityLayerService.getEntityTypeOrder();
export const ENTITY_LABEL_KEY: string = EntityLayerService.getLabelKey();
export const ENTITY_TILE_URL: string = EntityLayerService.getGeoDataUrl();
export const ENTITY_PROPERTY_LABELS: $ReadOnlyArray<string> = EntityLayerService.getTooltipLabels();

export const ENTITY_LAYER_SUPPORTED = ENTITY_TILE_URL.length > 0;

export const ENTITY_LABEL_LAYER_ID = 'entity-marker-labels';

// HACK(nina): Used for applying a specific color to this value
export const ENTITY_PK_TYPE = 'Final status';
export const ENTITY_PK_OPTION = 'Expired';
