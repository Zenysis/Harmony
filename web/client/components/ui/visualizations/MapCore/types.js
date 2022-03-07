// @flow
import type { Props as LayerProps } from 'components/ui/visualizations/MapCore/internal/Layer';

export type MapEvent = $FlowTODO;

/**
 * A tuple representing the coordinates of a Point Feature object that can be
 * plotted on a map. The tuple is in [longitude, latitude] format.
 */
export type LonLatPointFeaturePair = [number, number];

/**
 * An object representing the properties required to populate the geometry
 * property in a GeoJSON Feature.
 */
export type FeatureGeometry = {
  coordinates: LonLatPointFeaturePair | mixed,
  type: string,
};

/**
 * A Feature is a GeoJSON object. It can represent a Point, a Polygon,
 * a MultiPolygon, etc.
 */
export type Feature = {
  geometry: FeatureGeometry,
  properties: {
    [string]: any,
    ...,
  },
  type: 'Feature',
};

export type FeatureCollection = {
  features: $ReadOnlyArray<Feature>,
  type: 'FeatureCollection',
};

export type EventFeature<SerializedProperties: { ... }> = {
  event: MapEvent,
  latitude: number,
  layerId: string,
  longitude: number,
  properties: SerializedProperties,
};

export type LayerStyle = LayerProps;

type MapboxGLStyleShape = {
  getLayer: string => mixed | void,
};

type MapboxGLMapShape = {
  off: (string, ({ style: MapboxGLStyleShape }) => void) => void,
  on: (string, ({ style: MapboxGLStyleShape }) => void) => void,
  style: MapboxGLStyleShape,
};

export type MapLoadEvent = {
  target: MapboxGLMapShape,
  type: 'load',
};

export type Viewport = {
  bearing: number,
  latitude: number,
  longitude: number,
  pitch: number,
  zoom: number,
};

export type ShapeOutlineStyle = {
  layout: {
    visibility: 'visible' | 'none',
  },
  paint: {
    'line-color': string,
    'line-width': number,
  },
  type: 'line',
};

/** A tuple of coordinates representing the SW and NE corners of a map's
 * viewport, respectively.
 */
export type MapBounds = [LonLatPointFeaturePair, LonLatPointFeaturePair];
