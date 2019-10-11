// @flow
import memoizeOne from 'memoize-one';

import Formula from 'models/core/Field/CustomField/Formula';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';

const TEXT = t('QueryApp.CustomCalculationsModal');

function _checkValidity(
  metadata: FormulaMetadata,
): { isValid: boolean, message: string } {
  const fakeEnvironment = {};
  const fields = metadata._.fields();
  const lines = metadata._.lines();

  fields.forEach(f => {
    // Put valid # for field and check to see if calc will work
    fakeEnvironment[f.id()] = 1;
  });

  // Skip if an editor has nothing inside,
  // so we don't print an error message
  const skip = lines.size() <= 1 && lines.first() === '';

  if (!skip) {
    let message: string = TEXT.ValidityMessages.invalidSymbol;
    try {
      const formula = Formula.create({
        metadata,
      });
      message = TEXT.ValidityMessages.unassignedVar;
      const result = formula.evaluateFormula(fakeEnvironment);
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

const checkValidity = memoizeOne(_checkValidity);
export default checkValidity;
