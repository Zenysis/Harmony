// @flow

type ColumnTypeMap = {
  dimension: 'dimension',
  metric: 'metric',
};

export type ColumnType = $Keys<ColumnTypeMap>;

export const COLUMN_TYPE: ColumnTypeMap = {
  dimension: 'dimension',
  metric: 'metric',
};
