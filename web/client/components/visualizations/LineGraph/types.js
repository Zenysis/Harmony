// @flow

export type KeyName = string;
export type FieldId = string;

// The timestamp string encoded in UTC format.
export type RawTimestamp = string;

export type DataPoint = {
  key: KeyName,
  timestamp: RawTimestamp,
  [FieldId]: number,
};

export type TotalForKey = {
  [KeyName]: {
    [FieldId]: number,
  },
};

export type LineGraphLine = $ReadOnlyArray<$ReadOnlyArray<DataPoint>>;
