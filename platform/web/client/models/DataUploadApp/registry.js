// @flow

export const COLUMN_TYPE = Object.freeze({
  DATE: 'DATE',
  DIMENSION: 'DIMENSION',
  FIELD: 'FIELD',
});

export const COLUMN_TYPE_ORDER = [
  COLUMN_TYPE.DIMENSION,
  COLUMN_TYPE.DATE,
  COLUMN_TYPE.FIELD,
];
