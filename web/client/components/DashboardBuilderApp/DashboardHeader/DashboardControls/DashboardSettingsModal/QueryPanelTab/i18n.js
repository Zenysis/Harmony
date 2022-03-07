// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_QueryPanelTab_hooks from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/hooks/i18n';
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
    Filters: 'Filters',
    disableFilterItemError:
      'You cannot disable the only filter item, instead disable filtering on the dashboard',
    disableGroupingItemError:
      'You cannot disable the only group by item, instead disable grouping on the dashboard',
    'Allow users to use filters on this dashboard':
      'Allow users to use filters on this dashboard',
    'Allow users to use group bys on this dashboard':
      'Allow users to use group bys on this dashboard',
    'Choose which filters to enable': 'Choose which filters to enable',
    'Choose which group bys to enable': 'Choose which group bys to enable',
  },
  am: {},
  fr: {},
  pt: {
    Filters: 'Filtros',
    'Allow users to use filters on this dashboard':
      'Permitir que os usuários usem filtros neste painel',
    'Allow users to use group bys on this dashboard':
      'Permitir que os usuários usem agrupar por neste painel',
    'Choose which filters to enable': 'Escolha quais filtros activar',
    'Choose which group bys to enable': 'Escolha quais agrupar por activar',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal_QueryPanelTab_hooks,
]);
export default translations;
