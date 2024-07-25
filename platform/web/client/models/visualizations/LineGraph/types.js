// @flow

export type KeyName = string;
export type FieldId = string;

// The timestamp string encoded in UTC format.
export type RawTimestamp = string;

export type DataPoint = {
  // TODO: Make data point a ZenModel and deserialize this to a Map to
  // avoid using inexact object type.
  dimensions: { +[dimensionName: string]: string | null, ... },
  // TODO: Remove usage of key from LineGraph users and switch
  // to displaying dimensions.
  key: KeyName,
  timestamp: RawTimestamp,
  [FieldId]: number,
};

export type TotalForKey = {
  [KeyName]: {
    [FieldId]: number,
  },
};

export type LineGraphLines = $ReadOnlyArray<$ReadOnlyArray<DataPoint>>;
