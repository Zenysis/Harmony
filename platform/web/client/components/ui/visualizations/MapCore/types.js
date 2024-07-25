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

// NOTE: This is just the rough shape of the MapboxGL map instance and
// does not contain all possible properties or full method definitions. Only the
// ones that we currently use have been exposed.
// See the full docs for the signatures: https://docs.mapbox.com/mapbox-gl-js/api/map/#map
export type MapboxGLMap = {
  _fullyLoaded: boolean,
  getBounds: () => { getSouthEast: () => mixed },
  getLayer: string => mixed | void,
  off: (string, ({ style: MapboxGLStyleShape }) => void) => void,
  on: (string, ({ style: MapboxGLStyleShape }) => void) => void,
  project: mixed => { round: () => { x: number, y: number } },
  queryRenderedFeatures: (
    [[number, number], [number, number]] | void,
    { layers: $ReadOnlyArray<string> },
  ) => $ReadOnlyArray<Feature>,
  style: MapboxGLStyleShape,
};

export type MapLoadEvent = {
  target: MapboxGLMap,
  type: 'load',
};

export type Viewport = {
  bearing: number,
  latitude: number,
  longitude: number,
  pitch: number,
  zoom: number,
};

// When the user directly interacts with the map and causes a change to the
// viewport (via clicking/dragging/zooming), react-map-gl will set some of these
// values to indicate how the user interacted with the map. If the viewport
// changed *not* because of user interaction (like the browser width changing),
// then these values will not be set.
export type ReactMapGLInteractionState = {
  isDragging?: boolean,
  isPanning?: boolean,
  isZooming?: boolean,
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
