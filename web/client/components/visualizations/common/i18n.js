// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/i18n';
import i18n_components_visualizations_common_controls from 'components/visualizations/common/controls/i18n';
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
    unableToCompleteQuery: 'The server was unable to complete the query.',
  },
  am: {},
  fr: {},
  pt: {
    unableToCompleteQuery: 'O servidor não conseguiu completar a consulta.',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab,
  i18n_components_visualizations_common_controls,
]);
export default translations;
