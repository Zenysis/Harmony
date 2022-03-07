// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_FieldSetupApp_FieldSetupPageHeaderActions_BatchPublishAction from 'components/FieldSetupApp/FieldSetupPageHeaderActions/BatchPublishAction/i18n';
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
    'Successfully updated categories!': 'Successfully updated categories!',
    'Successfully updated datasources!': 'Successfully updated datasources!',
    'Update Calculation': 'Update Calculation',
    'Update Category': 'Update Category',
    'Update Datasource': 'Update Datasource',
  },
  am: {},
  fr: {},
  pt: {
    'Successfully updated categories!': 'Categorias atualizadas com sucesso!',
    'Successfully updated datasources!':
      'Fontes de dados atualizadas com sucesso!',
    'Update Calculation': 'Atualizar cálculo',
    'Update Category': 'Atualizar categoria',
    'Update Datasource': 'Atualizar fonte de dados',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_FieldSetupApp_FieldSetupPageHeaderActions_BatchPublishAction,
]);
export default translations;
