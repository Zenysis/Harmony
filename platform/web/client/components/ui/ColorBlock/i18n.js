// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_ui_ColorBlock_internal from 'components/ui/ColorBlock/internal/i18n';
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
    'Color block': 'Color block',
  },
  pt: {
    'Color block': 'Bloco de cores',
  },
  vn: {
    'Color block': 'Kh\u1ED1i m\xE0u',
  },
  am: {
    'Color block': 'የቀለም እገዳ',
  },
  fr: {
    'Color block': 'Bloc de couleur',
  },
  br: {
    'Color block': 'Bloco de cores',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_ui_ColorBlock_internal,
]);
export default translations;
