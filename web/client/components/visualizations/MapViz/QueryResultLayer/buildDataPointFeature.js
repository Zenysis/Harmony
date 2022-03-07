// @flow
import type { DataPointFeature } from 'components/visualizations/MapViz/QueryResultLayer/types';
import type { FeatureGeometry } from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';

export default function buildDataPointFeature(
  { dimensions, metrics }: MapDataPoint,
  geometry: FeatureGeometry,
  additionalProperties: { ... } | void = undefined,
): DataPointFeature {
  return {
    geometry,
    properties: {
      // NOTE(stephen): Introducing additional properties first because flow
      // doesn't like the inexact spread coming after the required properties
      // since in theory dimensions/metrics could get overwritten with the wrong
      // type.
      ...additionalProperties,
      dimensions,
      metrics,
    },
    type: 'Feature',
  };
}
