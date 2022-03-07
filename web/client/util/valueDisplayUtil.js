// @flow
import numeral from 'numeral';

const NO_DATA_TEXT = t('visualizations.common.noData');

const FIELD_VALUE_TYPES = {
  CURRENCY: 'CURRENCY',
  NUMBER: 'NUMBER',
  PERCENT: 'PERCENT',
};

const FIELD_VALUE_DEFAULT_TYPE: string = FIELD_VALUE_TYPES.NUMBER;

function getFieldValueType(): string {
  // If this info is stored in data catalog at some point, switch to use that.
  return FIELD_VALUE_DEFAULT_TYPE;
}

export function formatFieldValueForDisplay(value: ?(number | string)): string {
  // TODO(stephen): Potentially translate or make configurable.
  if (value === undefined || value === null || value === '') {
    return NO_DATA_TEXT;
  }

  let numberValue = value;
  // HACK(sophie): There is a bug in numeral formatting that formats numbers less than
  // 1e-6 into NaNs. Round them to zero here. See https://github.com/elastic/numeral-js/issues/19
  if (Math.abs(parseFloat(value)) < 1e-6) {
    numberValue = 0;
  }

  const valueType = getFieldValueType();
  let numberFormat = '0[.][000]';
  if (valueType === FIELD_VALUE_TYPES.PERCENT) {
    numberFormat = '0[.][00]%';
  } else if (valueType === FIELD_VALUE_TYPES.CURRENCY) {
    // If currency type is added to data catalog, use that.
    numberFormat = '0,0[.]00';
    return `${numeral(numberValue).format(numberFormat)}`;
  }

  return numeral(numberValue).format(numberFormat);
}
