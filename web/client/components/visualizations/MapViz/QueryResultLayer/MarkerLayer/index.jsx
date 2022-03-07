// @flow
import * as React from 'react';

import buildDataPointFeature from 'components/visualizations/MapViz/QueryResultLayer/buildDataPointFeature';
import { Layer, Source } from 'components/ui/visualizations/MapCore';
import type {
  FeatureCollection,
  LayerStyle,
} from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';

const DEFAULT_CIRCLE_RADIUS = 7;

type Props = {
  beforeLayerId?: string | void,
  dataPoints: $ReadOnlyArray<MapDataPoint>,
  /** Default radius of circle marker when layer is displaying dots */
  defaultCircleRadius?: number,
  fieldMaximum?: number,

  filter?: $ReadOnlyArray<mixed> | void,
  id: string,
  /**
   * If the visibility of the layer has been hidden on the map
   *
   * NOTE(nina): The purpose of this flag is to tell react-map-gl whether
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
  markerColor: string | (MapDataPoint => string),
  scaleMarker?: boolean,
  selectedField: string,
};

function MarkerLayer({
  dataPoints,
  id,
  markerColor,
  selectedField,
  beforeLayerId = undefined,
  defaultCircleRadius = DEFAULT_CIRCLE_RADIUS,
  fieldMaximum = 0,
  filter = undefined,
  isLayerVisible = true,
  scaleMarker = false,
}: Props) {
  const featureCollection = React.useMemo<FeatureCollection>(() => {
    const buildColor =
      typeof markerColor === 'function' ? markerColor : d => markerColor; // eslint-disable-line no-unused-vars
    const features = dataPoints.map(dataPoint =>
      buildDataPointFeature(
        dataPoint,
        {
          coordinates: [Number(dataPoint.lng), Number(dataPoint.lat)],
          type: 'Point',
        },
        { color: buildColor(dataPoint) },
      ),
    );
    return { features, type: 'FeatureCollection' };
  }, [dataPoints, markerColor]);

  const circleLayer = React.useMemo<LayerStyle>(() => {
    // TODO(nina): Handle case where we are trying to scale up the radius
    // based on the size of the map (in GIS)
    let radius = defaultCircleRadius;

    // If the markers are being scaled, apply the scaling formula inside Mapbox
    // instead of manually on the dataPoint. This allows us to keep the feature
    // collection pure and let Mapbox do the work in a more efficient way.
    //
    // NOTE(stephen): This applies the same scaling formula that was used on
    // the previous Map viz implementation. Review if this is accurate.
    //
    // NOTE(nina): Added scale factor that incorporates the "default" radius
    // that a user wants a circle to show up with, if any.
    if (scaleMarker && fieldMaximum !== 0) {
      // (Math.sqrt(1000 * (val / maxval)) + 5)*(default radius/user-inputted default radius);
      radius = [
        '*',
        [
          '+',
          [
            'sqrt',
            [
              '*',
              ['/', ['get', selectedField, ['get', 'metrics']], fieldMaximum],
              1000,
            ],
          ],
          5,
        ],
        defaultCircleRadius / DEFAULT_CIRCLE_RADIUS,
      ];
    }

    return {
      layout: {
        visibility: isLayerVisible ? 'visible' : 'none',
      },
      paint: {
        'circle-radius': radius,
        'circle-opacity': 0.6,
        'circle-color': ['get', 'color'],
      },
      type: 'circle',
    };
  }, [
    defaultCircleRadius,
    fieldMaximum,
    isLayerVisible,
    scaleMarker,
    selectedField,
  ]);

  // HACK(stephen): react-map-gl doesn't remove props like `filter={undefined}`
  // when drawing the layer to Mapbox. This causes mapbox to throw an error
  // stating that `undefined` is invalid.
  const filterStyle = filter !== undefined ? { filter } : undefined;
  return (
    <Source data={featureCollection} type="geojson">
      <Layer
        beforeId={beforeLayerId}
        id={id}
        {...filterStyle}
        {...circleLayer}
      />
    </Source>
  );
}

export default (React.memo(MarkerLayer): React.AbstractComponent<Props>);
