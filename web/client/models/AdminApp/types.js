// @flow
import * as Zen from 'lib/Zen';

export const VALIDATION_ERROR = 'error';
export const VALIDATION_WARNING = 'warning';
export const VALIDATION_SUCCESS = 'success';

export type FileValidationResponse = {
  dataCatalogChangesFileKey?: string,
  resultType: 'error' | 'success' | 'warning',
  validationMessage: string,
  validationSummary: Zen.Map<string>,
};
