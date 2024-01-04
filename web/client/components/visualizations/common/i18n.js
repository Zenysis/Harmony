// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_common_SettingsModal from 'components/visualizations/common/SettingsModal/i18n';
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
    more: 'more',
    unableToCompleteQuery: 'The server was unable to complete the query.',
  },
  pt: {
    more: 'mais',
    unableToCompleteQuery: 'O servidor n\xE3o conseguiu completar a consulta.',
  },
  vn: {
    more: 'h\u01A1n',
    unableToCompleteQuery:
      'M\xE1y ch\u1EE7 kh\xF4ng th\u1EC3 ho\xE0n th\xE0nh truy v\u1EA5n.',
  },
  am: {
    more: 'ተጨማሪ',
    unableToCompleteQuery:
      '\u12A0\u1308\u120D\u130B\u12E9 \u1218\u1320\u12ED\u1241\u1295 \u121B\u1320\u1293\u1240\u1245 \u12A0\u120D\u127B\u1208\u121D\u1362',
  },
  fr: {
    more: 'plus',
    unableToCompleteQuery: "Le serveur n'a pas pu terminer la requ\xEAte.",
  },
  br: {
    more: 'mais',
    unableToCompleteQuery: 'O servidor n\xE3o conseguiu completar a consulta.',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_common_SettingsModal,
  i18n_components_visualizations_common_controls,
]);
export default translations;
