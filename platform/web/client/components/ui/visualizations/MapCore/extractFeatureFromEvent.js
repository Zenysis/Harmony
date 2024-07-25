// @flow
import type {
  EventFeature,
  MapEvent,
} from 'components/ui/visualizations/MapCore/types';

export default function extractFeatureFromEvent<SerializedProperties: { ... }>({
  features,
  lngLat,
  srcEvent,
}: MapEvent): EventFeature<SerializedProperties> | void {
  if (!features || features.length === 0) {
    return undefined;
  }
  const eventFeature = features[0];
  return {
    event: srcEvent,
    latitude: lngLat[1],
    layerId: eventFeature.layer.id,
    longitude: lngLat[0],
    properties: eventFeature.properties,
  };
}
