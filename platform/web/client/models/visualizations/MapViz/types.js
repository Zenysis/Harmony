// @flow
import type { Color } from 'components/ui/Colors';

export type MapDataPoint = {
  color: Color,

  dimensions: {
    [DimensionID: string]: string,
    ...,
  },

  key: string,
  lat: string | number,
  lng: string | number,
  metrics: {
    [FieldID: string]: number | null,
    ...,
  },
};

// A list of data points that occur for a particular date
// If using a static map, date will default to the earliest date of the query
export type DatedDataPoint = {
  date: string,
  datedData: $ReadOnlyArray<MapDataPoint>,
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

// $COVID19Hack - The backend now sends a mapping of geo dimensions that should
// be filtered on the frontend.
export type AdminBoundaryFilterLocation = {
  +[DimensionID: string]: string,
  ...,
};

export type MapLabelProperties = {
  [labelId: string]: { color: string, label: string },
};
