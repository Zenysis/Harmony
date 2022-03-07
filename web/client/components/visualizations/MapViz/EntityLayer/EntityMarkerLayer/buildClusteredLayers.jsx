// @flow
import * as React from 'react';

import buildLayers from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/buildLayers';
import { Layer } from 'components/ui/visualizations/MapCore';
import type { EntityMarkerLayerStyle } from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/types';

export default function buildClusteredLayers(
  layers: $ReadOnlyArray<EntityMarkerLayerStyle>,
): $ReadOnlyArray<React.Element<typeof Layer>> {
  const clusteredLayers = [];
  layers.forEach(layer => {
    const { beforeId, id, style, type } = layer;

    const clusteredLayer: EntityMarkerLayerStyle = {
      beforeId,
      id: `${id}-clusters`,
      type: 'circle',
      style: {
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#fff',
          'circle-opacity': 0.8,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40,
          ],
          'circle-stroke-width': 1,
        },
      },
    };

    const clusterCountLayer: EntityMarkerLayerStyle = {
      beforeId,
      id: `${id}-cluster-count`,
      type: 'symbol',
      style: {
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
      },
    };

    const unclusteredLayer: EntityMarkerLayerStyle = {
      beforeId,
      type,
      id,
      style: {
        ...style,
        filter: ['!', ['has', 'point_count']],
      },
    };

    clusteredLayers.push(clusteredLayer);
    clusteredLayers.push(clusterCountLayer);
    clusteredLayers.push(unclusteredLayer);
  });
  return buildLayers(clusteredLayers);
}
