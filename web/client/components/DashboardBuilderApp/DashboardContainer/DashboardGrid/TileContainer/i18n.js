// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer_EditItemView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer_TileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/i18n';
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
    'Add iFrame': 'Add iFrame',
    'Click and drag to move tile': 'Click and drag to move tile',
  },
  am: {},
  fr: {},
  pt: {
    'Add iFrame': 'Adicionar quadro',
    'Click and drag to move tile': 'Clique e arraste para mover ',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer_EditItemView,
  i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer_TileMenu,
]);
export default translations;
