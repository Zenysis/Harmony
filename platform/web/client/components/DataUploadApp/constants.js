// @flow

export const DATE_FORMAT = 'MMM D, YYYY';

export const DATE_TIME_FORMAT = `${DATE_FORMAT} H:mm`;

// NOTE: Match the graphql ?string type here so flow doesn't complain.
export const FAILED_DATAPREP_STATUSES: Set<?string> = new Set([
  'Failed',
  'Canceled',
]);
export const RUNNING_DATAPREP_STATUSES: Set<?string> = new Set([
  'Created',
  'Pending',
  'InProgress',
]);
