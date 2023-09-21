// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
import buildDataPointFeature from 'components/visualizations/MapViz/QueryResultLayer/buildDataPointFeature';
import buildShapeKey from 'components/visualizations/MapViz/QueryResultLayer/ShapeLayer/buildShapeKey';
import computeFeatureBounds from 'components/visualizations/MapViz/common/computeFeatureBounds';
import { Layer, Source } from 'components/ui/visualizations/MapCore';
import { OUTLINE_WIDTH_TO_PX } from 'components/ui/visualizations/MapCore/defaults';
import type {
  Feature,
  FeatureCollection,
  ShapeOutlineStyle,
} from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';

type Props = {
  beforeLayerId?: string | void,
  dataPoints: $ReadOnlyArray<MapDataPoint>,
  filter?: $ReadOnlyArray<mixed> | void,
  id: string,

  /**
   * If the visibility of the layer has been hidden on the map
   *
   * NOTE: The purpose of this flag is to tell react-map-gl whether
   * to hide or show the layer on the map, rather than simply not rendering
   * this component at all. This is important for cases where other layers
   * may point to this layer's ID as its `beforeLayerId`, but cannot be drawn
   * because this layer cannot be found. So, rather than physically removing
   * this layer from the map when we want to hide it, we let react-map-gl
   * do the work. This component is used by both the AQT and the GIS tool, but
   * this prop is only relevant to the GIS tool because it supports layer
   * ordering. Since we have plans to deprecate service mapping from the
   * AQT, this is fine.
   */
  isLayerVisible?: boolean,
  shapeColor: string | (MapDataPoint => string),
  shapeOutlineWidth: string,
  shapes: $ReadOnlyArray<Feature>,
};

const SHAPE_STYLE = {
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': 0.8,
    // NOTE: The outline color is set to transparent so that we can
    // control the outline width, which is in a separate layer
    'fill-outline-color': 'rgba(255, 255, 255, 0)',
  },
  type: 'fill',
};

function buildMap<T>(
  items: $ReadOnlyArray<T>,
  buildKey: T => string,
): $ReadOnlyMap<string, T> {
  const output = new Map();
  items.forEach(item => output.set(buildKey(item), item));
  return output;
}

function ShapeLayer({
  dataPoints,
  id,
  shapes,
  shapeColor,
  shapeOutlineWidth = 'normal',
  beforeLayerId = undefined,
  filter = undefined,
  isLayerVisible = true,
}: Props) {
  const shapeMap = React.useMemo<$ReadOnlyMap<string, Feature>>(
    () => buildMap(shapes, s => buildShapeKey(s.properties)),
    [shapes],
  );

  const dataPointMap = React.useMemo<$ReadOnlyMap<string, MapDataPoint>>(
    () => buildMap(dataPoints, d => buildShapeKey(d.dimensions)),
    [dataPoints],
  );

  const featureCollection = React.useMemo<FeatureCollection>(() => {
    const buildColor =
      typeof shapeColor === 'function' ? shapeColor : d => shapeColor; // eslint-disable-line no-unused-vars

    const features = [];
    dataPointMap.forEach((dataPoint, key) => {
      const shape = shapeMap.get(key);
      if (shape === undefined) {
        return;
      }

      features.push(
        buildDataPointFeature(dataPoint, shape.geometry, {
          // NOTE: Attach the bounds of this shape directly as
          // properties so that we can get this information when working with a
          // partial feature reference provided to us by mapbox-gl's
          // `queryRenderedFeatures`. This is needed to support the auto-fit
          // behavior. The computation of each feature's bounds should only
          // happen once per page load, since `computeFeatureBounds` caches the
          // result, but if performance is worse, we can remove it.
          bounds: computeFeatureBounds(shape),
          color: buildColor(dataPoint),
        }),
      );
    });
    return { features, type: 'FeatureCollection' };
  }, [dataPointMap, shapeColor, shapeMap]);

  const shapeOutlineStyle = React.useMemo<ShapeOutlineStyle>(
    () => ({
      layout: {
        visibility: isLayerVisible ? 'visible' : 'none',
      },
      paint: {
        'line-color': Colors.WHITE,
        'line-width': OUTLINE_WIDTH_TO_PX[shapeOutlineWidth],
      },
      type: 'line',
    }),
    [isLayerVisible, shapeOutlineWidth],
  );

  // NOTE: react-map-gl doesn't remove props like `filter={undefined}`
  // when drawing the layer to Mapbox. This causes mapbox to throw an error
  // stating that `undefined` is invalid.
  const filterStyle = filter !== undefined ? { filter } : undefined;
  const shapeStyle = {
    layout: {
      visibility: isLayerVisible ? 'visible' : 'none',
    },
    ...SHAPE_STYLE,
  };
  return (
    <Source data={featureCollection} type="geojson">
      <Layer
        beforeId={beforeLayerId}
        id={id}
        {...filterStyle}
        {...shapeStyle}
      />
      <Layer
        beforeId={beforeLayerId}
        id={`${id}--outline`}
        {...filterStyle}
        {...shapeOutlineStyle}
      />
    </Source>
  );
}

export default (React.memo(ShapeLayer): React.AbstractComponent<Props>);
