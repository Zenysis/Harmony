// @flow
import * as React from 'react';

import { Layer } from 'components/ui/visualizations/MapCore';
import type { EntityMarkerLayerStyle } from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/types';

export default function buildLayers(
  layers: $ReadOnlyArray<EntityMarkerLayerStyle>,
): $ReadOnlyArray<React.Element<typeof Layer>> {
  return layers.map(layer => {
    const { id, style, ...passThroughProps } = layer;
    return <Layer key={id} id={id} {...style} {...passThroughProps} />;
  });
}
