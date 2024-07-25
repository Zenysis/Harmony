// @flow
import CustomField from 'models/core/Field/CustomField';
import Formula from 'models/core/Field/CustomField/Formula';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import I18N from 'lib/I18N';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';

export class ValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationException';
  }
}

const invalidCalculation = I18N.text('Custom calculations must be valid');
const calculationExists = I18N.text('This custom calculation already exists');

export const validateCalculationForSubmit = (
  calculationName: string,
  formulaMetadata: FormulaMetadata,
  seriesSettings: SeriesSettings,
): Formula => {
  // Do not allow calculations to be submitted if they have no name
  if (calculationName === '') {
    throw new ValidationException(
      I18N.text('Custom calculations must have a name'),
    );
  }

  // Do not allow two custom calculations to have the same name
  const seriesObjects = seriesSettings.seriesObjects();
  const alreadyExists = Object.keys(seriesObjects).some(
    id => seriesObjects[id].label() === calculationName,
  );

  if (alreadyExists) {
    throw new ValidationException(calculationExists);
  }

  if (!formulaMetadata.lines().some(line => line.trim() !== '')) {
    throw new ValidationException(
      I18N.text('Custom calculations cannot be empty'),
    );
  }

  try {
    return Formula.create({ metadata: formulaMetadata });
  } catch (e) {
    throw new ValidationException(invalidCalculation);
  }
};

export const validateCalculationForSubmitEdit = (
  customFields: $ReadOnlyArray<CustomField>,
  customFieldToEdit: CustomField,
  formulaMetadata: FormulaMetadata,
  id: string,
  calculationName: string,
): CustomField => {
  // check for duplicates:
  const duplicate = customFields.find(
    field => field.label() === calculationName && field.id() !== id,
  );
  if (duplicate) {
    throw new ValidationException(calculationExists);
  }

  if (customFields.find(f => f.id() === id)) {
    try {
      const formula = Formula.create({ metadata: formulaMetadata });
      return customFieldToEdit.modelValues({
        formula,
        label: calculationName,
      });
    } catch (e) {
      throw new ValidationException(invalidCalculation);
    }
  }
  throw new Error('Custom field not found');
};
