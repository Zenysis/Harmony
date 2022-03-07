// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_DashboardUsersTable from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable/i18n';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_QueryPanelTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/i18n';
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
    pasteJSON:
      'Paste the JSON representation of the Dashboard Specification below',
    'Clone Dashboard': 'Clone Dashboard',
    'Legacy dashboard': 'Legacy dashboard',
    'View legacy dashboard': 'View legacy dashboard',
  },
  am: {},
  fr: {
    pasteJSON:
      'Collez la représentation JSON de la spécification de tableau de bord ci-dessous',
    'Clone Dashboard': 'Copier le tableau de bord',
  },
  pt: {
    pasteJSON:
      'Cole a representação de JSON na especificação do paínel abaixo.',
    'Clone Dashboard': 'Clonar Painel',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_DashboardUsersTable,
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_QueryPanelTab,
]);
export default translations;
