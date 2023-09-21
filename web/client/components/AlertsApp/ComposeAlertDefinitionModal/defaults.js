// @flow
import type Field from 'models/core/wip/Field';
import type { Operation } from 'models/AlertsApp/AlertCheckUtil';

// NOTE: This can't use the serialized AlertCheck type since the types are slightly
// different to accomodate the user entering the values, but the types are very similar.
export type ModalCheck =
  | {
      +field: Field | void,
      +operation: Operation,
      +threshold: string,
      +type: 'THRESHOLD',
    }
  | {
      +leftField: Field | void,
      +operation: Operation,
      +rightField: Field | void,
      +type: 'COMPARATIVE',
    };

const DEFAULT_OPERATION_OPTION = '=';
export const DEFAULT_THRESHOLD_CHECK: ModalCheck = {
  field: undefined,
  operation: DEFAULT_OPERATION_OPTION,
  threshold: '',
  type: 'THRESHOLD',
};
export const DEFAULT_COMPARATIVE_CHECK: ModalCheck = {
  leftField: undefined,
  operation: DEFAULT_OPERATION_OPTION,
  rightField: undefined,
  type: 'COMPARATIVE',
};

export const DEFAULT_TIME_GRANULARITY_OPTION = 'month';
