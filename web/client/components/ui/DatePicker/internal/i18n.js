// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_ui_DatePicker_internal_BetweenDateEditor from 'components/ui/DatePicker/internal/BetweenDateEditor/i18n';
import i18n_components_ui_DatePicker_internal_SinceDateEditor from 'components/ui/DatePicker/internal/SinceDateEditor/i18n';
import i18n_components_ui_DatePicker_internal_YearToDateEditor from 'components/ui/DatePicker/internal/YearToDateEditor/i18n';
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
    'Ethiopian month selector': 'Ethiopian month selector',
    'Ethiopian year selector': 'Ethiopian year selector',
    'Number of units': 'Number of units',
    'Select date modifier': 'Select date modifier',
  },
  am: {},
  fr: {},
  pt: {},
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_ui_DatePicker_internal_BetweenDateEditor,
  i18n_components_ui_DatePicker_internal_SinceDateEditor,
  i18n_components_ui_DatePicker_internal_YearToDateEditor,
]);
export default translations;
