// @flow
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';

/**
 * Build mapping from dimension ID to the list of possible dimension values.
 * @param {Array<DimensionValueMap>} dimensionValues The array of dimension
 * values that will be turned into a map
 * @returns {object} dictionary of dimension id to array of dimension values
 */
export default function getDimensionValueMap(
  dimensionValues: $ReadOnlyArray<DimensionValue>,
): { [dimensionid: string]: $ReadOnlyArray<DimensionValue>, ... } {
  const output = {};
  dimensionValues.forEach(dimensionValue => {
    const dimensionId = dimensionValue.dimension();
    if (!output[dimensionId]) {
      output[dimensionId] = [];
    }
    output[dimensionId].push(dimensionValue);
  });
  return output;
}
