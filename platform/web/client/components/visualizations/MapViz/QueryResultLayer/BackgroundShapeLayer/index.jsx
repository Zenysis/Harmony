// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
import { GEO_FIELD_ORDERING } from 'components/visualizations/MapViz/QueryResultLayer/defaults';
import { Layer, Source } from 'components/ui/visualizations/MapCore';
import { OUTLINE_WIDTH_TO_PX } from 'components/ui/visualizations/MapCore/defaults';
import type {
  Feature,
  FeatureCollection,
  ShapeOutlineStyle,
} from 'components/ui/visualizations/MapCore/types';

type Props = {
  adminBoundariesColor?: string,
  adminBoundariesWidth?: string,
  beforeLayerId?: string,
  dimension: string,
  filter?: $ReadOnlyArray<mixed> | void,
  id?: string,
  shapes: $ReadOnlyArray<Feature>,
};

export const BACKGROUND_LABEL_ID = 'background-shape';

/**
 * The BackgroundShapeLayer will draw the shapes provided for the given
 * dimension level on the map. This is useful for drawing admin boundaries on a
 * map as a background layer.
 */
function BackgroundShapeLayer({
  dimension,
  shapes,
  adminBoundariesColor = Colors.SLATE,
  adminBoundariesWidth = 'normal',
  beforeLayerId = undefined,
  filter = undefined,
  id = BACKGROUND_LABEL_ID,
}: Props) {
  const featureCollection = React.useMemo<FeatureCollection>(() => {
    const dimensionIdx = GEO_FIELD_ORDERING.indexOf(dimension);
    if (dimensionIdx < 0) {
      return { features: [], type: 'FeatureCollection' };
    }

    const requiredDimensions = GEO_FIELD_ORDERING.slice(0, dimensionIdx + 1);
    const excludedDimensions = GEO_FIELD_ORDERING.slice(dimensionIdx + 1);
    const features = shapes.filter(
      ({ properties }) =>
        requiredDimensions.every(dim => (properties[dim] || '').length > 0) &&
        excludedDimensions.every(dim => (properties[dim] || '').length === 0),
    );
    return { features, type: 'FeatureCollection' };
  }, [dimension, shapes]);

  const shapeOutlineStyle = React.useMemo<ShapeOutlineStyle>(
    () => ({
      layout: {
        visibility: 'visible',
      },
      paint: {
        'line-color': adminBoundariesColor,
        'line-width': OUTLINE_WIDTH_TO_PX[adminBoundariesWidth],
      },
      type: 'line',
    }),
    [adminBoundariesColor, adminBoundariesWidth],
  );

  // NOTE: react-map-gl doesn't remove props like `filter={undefined}`
  // when drawing the layer to Mapbox. This causes mapbox to throw an error
  // stating that `undefined` is invalid.
  const filterStyle = filter !== undefined ? { filter } : undefined;
  return (
    <Source data={featureCollection} type="geojson">
      <Layer
        beforeId={beforeLayerId}
        id={id}
        {...filterStyle}
        {...shapeOutlineStyle}
      />
    </Source>
  );
}

export default (React.memo(
  BackgroundShapeLayer,
): React.AbstractComponent<Props>);
