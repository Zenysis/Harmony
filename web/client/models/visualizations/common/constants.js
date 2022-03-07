// @flow

// When the sets a grouping item in the query form to `includeTotal`, the
// backend will include the total value for that group in the query result with
// the dimension value as `TOTAL`.
// NOTE(stephen): It is possible for this value to conflict with an actual
// dimension value in the database, so it might be worth choosing a more unique
// value to represent totals.
export const TOTAL_DIMENSION_VALUE = 'TOTAL';
