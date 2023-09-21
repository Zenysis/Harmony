// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_Table_DimensionTableCell from 'components/visualizations/Table/DimensionTableCell/i18n';
import i18n_components_visualizations_Table_TableControlsBlock from 'components/visualizations/Table/TableControlsBlock/i18n';
import i18n_components_visualizations_Table_TableThemesSettingsTab from 'components/visualizations/Table/TableThemesSettingsTab/i18n';
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
    'No Data': 'No Data',
  },
  pt: {
    'No Data': 'Sem Dados',
  },
  vn: {
    'No Data': 'Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u',
  },
  am: {
    'No Data': '\u121D\u1295\u121D \u12F3\u1273 \u12E8\u1208\u121D',
  },
  fr: {
    'No Data': 'Pas de donn\xE9es',
  },
  br: {
    'No Data': 'Sem dados',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_Table_DimensionTableCell,
  i18n_components_visualizations_Table_TableControlsBlock,
  i18n_components_visualizations_Table_TableThemesSettingsTab,
]);
export default translations;
