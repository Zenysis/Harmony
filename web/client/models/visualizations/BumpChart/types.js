// @flow

// The timestamp string encoded in UTC format.
export type RawTimestamp = string;

// The individual data point that represents a single point on a line.
export type SerializedDataPoint = {
  +dimensions: { +[dimensionName: string]: string | null, ... },
  +key: string,
  +timestamp: RawTimestamp,
  +[string]: number,
};
