// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_Table_TableThemesSettingsTab_ThemeCustomizer from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/i18n';
import i18n_components_visualizations_Table_TableThemesSettingsTab_ThemeSelector from 'components/visualizations/Table/TableThemesSettingsTab/ThemeSelector/i18n';
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
    Continue: 'Continue',
    Customize: 'Customize',
    Done: 'Done',
    'Continue?': 'Continue?',
    'Current Theme': 'Current Theme',
    'You will lose your existing custom theme':
      'You will lose your existing custom theme',
  },
  am: {},
  fr: {},
  pt: {
    Continue: 'Continuar',
    Customize: 'Customizar',
    Done: 'Completo',
    'Continue?': 'Continuar?',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_Table_TableThemesSettingsTab_ThemeCustomizer,
  i18n_components_visualizations_Table_TableThemesSettingsTab_ThemeSelector,
]);
export default translations;
