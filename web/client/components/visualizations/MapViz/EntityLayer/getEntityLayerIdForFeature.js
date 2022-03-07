// @flow
import {
  ENTITY_LAYER_ID,
  DEPLOYMENT_SPECIFIC_LAYER_IDS,
} from 'components/visualizations/MapViz/defaults';
import type { EventFeature } from 'components/ui/visualizations/MapCore/types';

/**
 * Return the layer id that we want to extract the active feature from. This
 * also makes it easier for us to maintain the hacked layers that are
 * deployment-specific.
 */
export default function getEntityLayerIdForFeature(
  activeFeature: EventFeature<{ ... }> | void,
): string {
  if (
    activeFeature !== undefined &&
    DEPLOYMENT_SPECIFIC_LAYER_IDS.includes(activeFeature.layerId)
  ) {
    return activeFeature.layerId;
  }
  return ENTITY_LAYER_ID;
}
