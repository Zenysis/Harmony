// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldDetailsSection_CalculationRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/i18n';
import type { TranslationDictionary } from 'lib/I18N';
/**
 * DO NOT:
 * 1. DO NOT touch the `en` object. AT ALL. This is entirely auto-generated from
 * our code. Do not change the string values. Do not add new keys.
 * 2. DO NOT add new locales manually. These are handled by our internal tools.
 *
 * DO:
 * 1. Update any non-`en` translations. Do not change their keys though.
 * 2. Add new non-`en` translations. But make sure their keys match their
 * English counterpart.
 */

const translations: TranslationDictionary = {
  en: {
    calculatedFieldHelpText:
      'These types of indicators use the field IDs of their constituents to reference the raw data. Please refer to the field IDs of the constituents instead.',
    fieldIdHelpText:
      'This field ID is used to reference the raw data in your integration',
    shortNameHelpText:
      'The short name will appear in the hierarchical selectors in AQT',
    'Field ID': 'Field ID',
    'N/A': 'N/A',
    'Short name': 'Short name',
  },
  am: {},
  fr: {},
  pt: {},
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldDetailsSection_CalculationRow,
]);
export default translations;
