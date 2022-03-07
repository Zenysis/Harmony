// @flow
import * as React from 'react';
import type { RGBColor } from 'react-color';

import buildLabelBackground from 'components/visualizations/MapViz/buildLabelBackground';
import { ENTITY_LABEL_KEY } from 'components/visualizations/MapViz/EntityLayer/defaults';
import {
  Layer,
  Source,
  MapContext,
} from 'components/ui/visualizations/MapCore';
import type {
  Feature,
  FeatureCollection,
} from 'components/ui/visualizations/MapCore/types';

type Props = {
  backgroundColor: RGBColor,
  entityFeatures: $ReadOnlyArray<Feature>,
  fontColor: string,
  fontFamily: string,
  fontSize: number,
  fontStyle: 'regular' | 'bold' | 'italic',
  id: string,
  visibleEntityIds: $ReadOnlyArray<string>,
};

/**
 * The EntityMarkerLabelLayer provides a way to render text labels for a set of
 * entity data points on the map. These labels are collision avoidant and won't
 * overlap.
 */
function EntityMarkerLabelLayer({
  backgroundColor,
  entityFeatures,
  fontColor,
  fontSize,
  fontStyle,
  visibleEntityIds,
  id,
}: Props) {
  const { map } = React.useContext(MapContext);

  // Create a layer of points to add to the map. The text labels will use these
  // points as their primary position.
  // NOTE(nina): We could just reference an existence source, like in
  // EntityMarkerLayer, because we won't have a bug of drawing multiple labels
  // on a ShapeLayer (because entities are only shown as dots). However,
  // drawing this separately will support us in the future when we want to draw
  // labels for different types of layers.
  const featureCollection = React.useMemo<FeatureCollection>(
    () => ({
      features: entityFeatures,
      type: 'FeatureCollection',
    }),
    [entityFeatures],
  );

  if (ENTITY_LABEL_KEY === '') {
    return null;
  }

  const alpha = backgroundColor.a;

  // TODO(stephen, nina): Figure out how to customize the fonts for mapboxgl. They
  // have to be loaded by the library (and into the canvas) when the map is
  // initialized, and it appears the best way to set it is using custom tiles
  // on mapbox studio. For now, just apply font-weight customizations.
  const capitalizedFontStyle = fontStyle[0].toUpperCase() + fontStyle.slice(1);
  const layerStyle = {
    id,
    filter: ['in', ['get', 'entityId'], ['literal', visibleEntityIds]],
    layout: {
      'icon-text-fit': 'both',
      'icon-image': buildLabelBackground(backgroundColor, map),
      'text-field': ['format', ['get', ENTITY_LABEL_KEY]],
      'text-font': [`DIN Offc Pro ${capitalizedFontStyle}`],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 1,
      'text-justify': 'auto',
      'text-size': fontSize,
    },
    paint: {
      'text-color': fontColor,
      'icon-opacity': alpha !== null && alpha !== undefined ? alpha : 1,
    },
    type: 'symbol',
  };

  return (
    <Source type="geojson" data={featureCollection}>
      <Layer id={id} {...layerStyle} />
    </Source>
  );
}

export default (React.memo(
  EntityMarkerLabelLayer,
): React.AbstractComponent<Props>);
