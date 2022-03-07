// @flow
import type { FeatureGeometry } from 'components/ui/visualizations/MapCore/types';

// The MapDataPoint that we send to Mapbox contains nested objects. These nested
// objects will get JSON serialized into a string when Mapbox stores those
// data points on the map. When an event is triggered on one of those points,
// this serialized properties type will be returned.
export type SerializedDataPointProperties = {
  dimensions?: string,
  metrics?: string,
  ...
};

// TODO(nina): There are multiple definitions of a GeoJSON Feature across the
// codebase. It would be good to standardize their definitions where we can.
export type DataPointFeature = {
  geometry: FeatureGeometry,
  properties: {
    dimensions: {
      [DimensionID: string]: string,
      ...,
    },
    metrics: {
      [FieldID: string]: number | null,
      ...,
    },
    [string]: mixed,
    ...
  },
  type: 'Feature',
};

// NOTE(nina): This type name also exists in MapViz. We should rename this or
// the other type.
export type MapboxGLMapShape = {
  hasImage: string => boolean,
  addImage: (
    string,
    { data: mixed, height: number, width: number },
    {
      content: [number, number, number, number],
      stretchX: mixed,
      stretchY: mixed,
    },
  ) => void,
};
