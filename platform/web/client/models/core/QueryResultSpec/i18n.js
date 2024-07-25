// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_models_core_QueryResultSpec_ValueRule from 'models/core/QueryResultSpec/ValueRule/i18n';
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
    'No data': 'No data',
    'Not a Number': 'Not a Number',
  },
  pt: {
    'No data': 'Sem dados',
    'Not a Number': 'N\xE3o \xE9 um n\xFAmero',
  },
  vn: {
    'No data': 'Kh\xF4ng d\u1EEF li\u1EC7u',
    'Not a Number': 'Kh\xF4ng ph\u1EA3i s\u1ED1',
  },
  am: {
    'No data': 'ምንም ዳታ የለም',
    'Not a Number': 'ቁጥር አይደለም',
  },
  fr: {
    'No data': 'Pas de données',
    'Not a Number': 'Pas un nombre',
  },
  br: {
    'No data': 'Sem dados',
    'Not a Number': 'Não é um número',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_models_core_QueryResultSpec_ValueRule,
]);
export default translations;
