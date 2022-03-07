// @flow
import CustomField from 'models/core/Field/CustomField';

const TEXT = t('QueryApp.CustomCalculationsModal');

export default function buildDefaultCalculationName(
  customFields: $ReadOnlyArray<CustomField>,
): string {
  let currentMax = 0;
  customFields.forEach(f => {
    const name = f.getCanonicalName();
    if (name.startsWith(TEXT.defaultCalculationNamePrefix)) {
      if (name.length > TEXT.defaultCalculationNamePrefix.length) {
        const currNum = parseInt(
          name.substring(TEXT.defaultCalculationNamePrefix.length, name.length),
          10,
        );
        if (Number.isInteger(currNum) && currNum > currentMax) {
          currentMax = currNum;
        }
      }
    }
  });

  return `${TEXT.defaultCalculationNamePrefix}${currentMax + 1}`;
}
