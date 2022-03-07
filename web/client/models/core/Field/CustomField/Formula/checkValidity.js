// @flow
import memoizeOne from 'memoize-one';

import Formula from 'models/core/Field/CustomField/Formula';
import type FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import type { DataFrame } from 'models/core/Field/CustomField/Formula/types';

const TEXT = t('QueryApp.CustomCalculationsModal');

function _checkValidity(
  metadata: FormulaMetadata,
): { isValid: boolean, message: string } {
  const fields = metadata.fields();
  const dimensions = metadata.dimensions();

  // create a single-row dataframe
  const singleRow: { [string]: string | number | void, ... } = {};
  const fieldValues: {
    [fieldId: string]: Array<number | void>,
    ...,
  } = {};
  fields.forEach(f => {
    // Put valid # for field and check to see if calc will work
    singleRow[f.id()] = 1;
    fieldValues[f.id()] = [1];
  });
  dimensions.forEach(dim => {
    singleRow[dim] = 'Some dimension value';
  });

  const fakeDataframe: DataFrame = {
    rows: [singleRow],
    values: fieldValues,
  };

  // Skip if an editor has nothing inside,
  // so we don't print an error message
  const lines = metadata._.lines();
  const skip = lines.size() <= 1 && lines.first() === '';

  if (!skip) {
    let message: string = TEXT.ValidityMessages.invalidSymbol;
    try {
      const formula = Formula.create({
        metadata,
      });
      message = TEXT.ValidityMessages.unassignedVar;
      const result = formula.evaluateFormula(fakeDataframe);
      if (result === Infinity) {
        message = TEXT.ValidityMessages.cannotEval;
        throw new Error(message);
      }
    } catch (error) {
      return { isValid: false, message };
    }
  }
  return { isValid: true, message: TEXT.ValidityMessages.validFormula };
}

const checkValidity: typeof _checkValidity = memoizeOne(_checkValidity);
export default checkValidity;
