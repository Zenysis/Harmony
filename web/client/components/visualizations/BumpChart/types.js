// @flow

// The timestamp string encoded in UTC format.
export type RawTimestamp = string;

// The individual data point that represents a single point on a line.
export type SerializedDataPoint = {
  +key: string,
  +timestamp: RawTimestamp,
  +[string]: number,
};

// NOTE(stephen): This is reusable. It is the props passed from the
// @vx/responsive <ParentSize> component.
export type ChartSize = {
  +height: number,
  +width: number,
};
