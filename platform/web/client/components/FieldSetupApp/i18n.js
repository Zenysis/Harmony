// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_FieldSetupApp_FieldSetupPageHeaderActions from 'components/FieldSetupApp/FieldSetupPageHeaderActions/i18n';
import i18n_components_FieldSetupApp_UnpublishedFieldsTable from 'components/FieldSetupApp/UnpublishedFieldsTable/i18n';
import i18n_components_FieldSetupApp_UnpublishedFieldsTableContainer from 'components/FieldSetupApp/UnpublishedFieldsTableContainer/i18n';
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
    Loading: 'Loading...',
    'Indicator Setup': 'Indicator Setup',
  },
  pt: {
    Loading: 'Carregando...',
    'Indicator Setup': 'Triagem do indicador',
  },
  vn: {
    Loading: '\u0110ang t\u1EA3i...',
    'Indicator Setup': 'Thi\u1EBFt l\u1EADp ch\u1EC9 s\u1ED1',
  },
  am: {
    Loading: '\u1260\u1218\u132B\u1295 \u120B\u12ED ...',
    'Indicator Setup':
      '\u12E8\u12A0\u1218\u120D\u12AB\u127D \u121B\u12CB\u1240\u122D',
  },
  fr: {
    Loading: 'Chargement en cours...',
    'Indicator Setup': "Configuration de l'indicateur",
  },
  br: {
    Loading: 'Carregando...',
    'Indicator Setup': 'Triagem do indicador',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_FieldSetupApp_FieldSetupPageHeaderActions,
  i18n_components_FieldSetupApp_UnpublishedFieldsTable,
  i18n_components_FieldSetupApp_UnpublishedFieldsTableContainer,
]);
export default translations;
