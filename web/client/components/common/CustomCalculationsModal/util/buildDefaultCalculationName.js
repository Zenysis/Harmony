// @flow
import CustomField from 'models/core/Field/CustomField';
import I18N from 'lib/I18N';

export default function buildDefaultCalculationName(
  customFields: $ReadOnlyArray<CustomField>,
): string {
  let currentMax = 0;
  const defaultCalculationNamePrefix = I18N.textById('Calculation');
  customFields.forEach(f => {
    const name = f.getCanonicalName();
    if (name.startsWith(defaultCalculationNamePrefix)) {
      if (name.length > defaultCalculationNamePrefix.length) {
        const currNum = parseInt(
          name.substring(defaultCalculationNamePrefix.length, name.length),
          10,
        );
        if (Number.isInteger(currNum) && currNum > currentMax) {
          currentMax = currNum;
        }
      }
    }
  });

  return `${defaultCalculationNamePrefix}${currentMax + 1}`;
}
