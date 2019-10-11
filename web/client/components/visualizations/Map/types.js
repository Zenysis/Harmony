// @flow

export type MapDataPoint = {
  metrics: {
    [FieldID: string]: ?number,
  },

  dimensions: {
    [DimensionID: string]: string,
  },

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

// A list of timestamps (1 if using Map, not Animated Map), each with
// a list of data points
export type SerializedMapQueryResult = {
  data: $ReadOnlyArray<DatedDataPoint>,
};
