// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab_ColorRulesContainer_DataActionRulesSelector from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesSelector/i18n';
import i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab_ColorRulesContainer_TransformedTextBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/TransformedTextBlock/i18n';
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
    'Rule %(ruleIdx)s': 'Rule %(ruleIdx)s',
  },
  am: {},
  fr: {},
  pt: {
    'Regra %(ruleIdx)s': 'Rule %(ruleIdx)s',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab_ColorRulesContainer_DataActionRulesSelector,
  i18n_components_visualizations_common_SettingsModal_SeriesSettingsTab_ColorRulesContainer_TransformedTextBlock,
]);
export default translations;
