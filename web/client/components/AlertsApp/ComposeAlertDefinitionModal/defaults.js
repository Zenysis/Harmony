// @flow
import type Field from 'models/core/wip/Field';
import type { Operation } from 'models/AlertsApp/AlertCheckUtil';

// NOTE(abby): This can't use the serialized AlertCheck type since the types are slightly
// different to accomodate the user entering the values, but the types are very similar.
export type ModalCheck =
  | {
      +type: 'THRESHOLD',
      +field: Field | void,
      +operation: Operation,
      +threshold: string,
    }
  | {
      +type: 'COMPARATIVE',
      +leftField: Field | void,
      +operation: Operation,
      +rightField: Field | void,
    };

const DEFAULT_OPERATION_OPTION = '=';
export const DEFAULT_THRESHOLD_CHECK: ModalCheck = {
  type: 'THRESHOLD',
  field: undefined,
  operation: DEFAULT_OPERATION_OPTION,
  threshold: '',
};
export const DEFAULT_COMPARATIVE_CHECK: ModalCheck = {
  type: 'COMPARATIVE',
  leftField: undefined,
  operation: DEFAULT_OPERATION_OPTION,
  rightField: undefined,
};

export const DEFAULT_TIME_GRANULARITY_OPTION = 'month';
