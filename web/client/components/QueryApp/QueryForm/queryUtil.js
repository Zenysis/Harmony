import { EnabledDimensionsByIndicator } from 'indicator_fields';
import { SELECT_GRANULARITY_BUTTON_ORDER, FILTER_ORDER } from 'backend_config';

// eslint-disable-next-line import/prefer-default-export
export function getEnabledDimensions(fields) {
  // Computes set of enabled dimensions for fields selected by user.
  // If returned NULL, then there are no restrictions.
  if (!fields || fields.length < 1) {
    return new Set();
  }

  const enabledDimensionsForFields = fields
    .map(fieldId => EnabledDimensionsByIndicator[fieldId])
    .filter(dim => !!dim); // Removes invalid fieldId lookups.

  // Enable all granularity filters by default.
  let dimensions = [...SELECT_GRANULARITY_BUTTON_ORDER, ...FILTER_ORDER];
  // Remove elements from dimensions if they are not in enabledDimensions.
  // The list of enabled dimensions for a fieldId is empty if all dimensions
  // are enabled.
  enabledDimensionsForFields.forEach((dimForFields) => {
    if (dimForFields.length > 0) {
      dimensions = dimensions.filter(dim => dimForFields.indexOf(dim) > -1);
    }
  });
  return new Set(dimensions);
}
