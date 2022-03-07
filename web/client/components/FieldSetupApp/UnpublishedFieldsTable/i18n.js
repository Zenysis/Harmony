// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_FieldSetupApp_UnpublishedFieldsTable_UnpublishedFieldTableRows from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/i18n';
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
    Calculation: 'Calculation',
    Category: 'Category',
    Name: 'Name',
    'Indicator ID': 'Indicator ID',
    'Short Name': 'Short Name',
  },
  am: {},
  fr: {
    Name: 'Nom',
  },
  pt: {
    Calculation: 'Cálculo',
    Category: 'Categoria',
    Name: 'Nome',
    'Indicator ID': 'ID do indicador',
    'Short Name': 'Nome curto',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_FieldSetupApp_UnpublishedFieldsTable_UnpublishedFieldTableRows,
]);
export default translations;
