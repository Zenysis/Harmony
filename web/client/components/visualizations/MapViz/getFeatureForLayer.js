// @flow
import type { EventFeature } from 'components/ui/visualizations/MapCore/types';

/**
 * Find and (if found) return the event feature from the provided layer.
 */
export default function getFeatureForLayer<SerializedProperties: { ... }>(
  feature: EventFeature<{ ... }> | void,
  layerId: string,
): EventFeature<SerializedProperties> | void {
  if (feature === undefined || feature.layerId !== layerId) {
    return undefined;
  }
  return ((feature: $Cast): EventFeature<SerializedProperties>);
}
