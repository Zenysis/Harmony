// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataQualityApp_OutlierAnalysisTab from 'components/DataQualityApp/OutlierAnalysisTab/i18n';
import i18n_components_DataQualityApp_ReportingCompletenessTab from 'components/DataQualityApp/ReportingCompletenessTab/i18n';
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
    'Select indicator': 'Select indicator',
  },
  am: {},
  fr: {},
  pt: {
    'Select indicator': 'Selecione o indicador',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataQualityApp_OutlierAnalysisTab,
  i18n_components_DataQualityApp_ReportingCompletenessTab,
]);
export default translations;
