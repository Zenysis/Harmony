// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_ui_visualizations_Table_internal from 'components/ui/visualizations/Table/internal/i18n';
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
    'No rows': 'No rows',
  },
  pt: {
    'No rows': 'Sem linhas',
  },
  vn: {
    'No rows': 'Kh\xF4ng c\xF3 h\xE0ng',
  },
  am: {
    'No rows': 'ምንም ረድፎች የሉም',
  },
  fr: {
    'No rows': 'Pas de lignes',
  },
  br: {
    'No rows': 'Sem linhas',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_ui_visualizations_Table_internal,
]);
export default translations;
