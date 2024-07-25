// @flow
export type DimensionID = string;
export type FieldID = string;

export type TableDataValue = string | number | null;

export type DataRow = {
  +[string]: TableDataValue,
  ...,
};
