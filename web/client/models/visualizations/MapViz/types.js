// @flow
import type { Color } from 'components/ui/Colors';

export type MapDataPoint = {
  metrics: {
    [FieldID: string]: number | null,
    ...,
  },

  dimensions: {
    [DimensionID: string]: string,
    ...,
  },

  color: Color,
  key: string,
  lat: string | number,
  lng: string | number,
};

// A list of data points that occur for a particular date
// If using a static map, date will default to the earliest date of the query
export type DatedDataPoint = {
  datedData: $ReadOnlyArray<MapDataPoint>,
  date: string,
};

export type HeatMapPoint = [
  number, // Latitude
  number, // Longitude
  number, // Metric value
];

export type HeatMapData = {
  // Mapping from field ID to 2D array. Each value in the outer array is a
  // set of points for a specific date in the query result.
  [FieldId: string]: $ReadOnlyArray<$ReadOnlyArray<HeatMapPoint>>,
  ...,
};

export type EntityNode = {
  children: { +[string]: EntityNode },
  color: string,
  id: string,
  name: string,
  parent: EntityNode | void,
  type: string,
};

export type GroupedEntityMap = {
  +[EntityType: string]: $ReadOnlyArray<EntityNode>,
  ...,
};

export type AdminBoundaryFilterLocation = {
  +[DimensionID: string]: string,
  ...,
};

export type MapLabelProperties = {
  [labelId: string]: { color: string, label: string },
};
