// @flow

// The timestamp string encoded in UTC format.
export type RawTimestamp = string;

// The individual data point that represents a single tile.
export type DataPoint = {
  +dimensions: { +[dimensionName: string]: string | null, ... },
  +key: string,
  +timestamp: RawTimestamp,
  +[string]: number | null,
};

export type TotalsValue = {
  +dates: $ReadOnlyArray<RawTimestamp>,
  +key: string,

  // Mapping of Field ID to total value.
  totals: {
    +[string]: number,
  },

  // Mapping of Field ID to ordered list of date values for that field.
  +[string]: $ReadOnlyArray<number>,
};
