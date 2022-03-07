// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_FormControls_AttachmentSettingsFormSection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/AttachmentSettingsFormSection/i18n';
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
    useSingleThread: 'Include all recipients on a single thread',
    useSingleThreadInfoTooltip:
      'Selecting this option will CC all recipients listed in "To". Doing so will add all recipients to the same thread and enable collaborative follow up via email.',
    'Share with current filters': 'Share with current filters',
    'Check this box to share this dashboard with the current dashboard wide filters and group bys':
      'Check this box to share this dashboard with the current dashboard wide filters and group bys',
  },
  am: {},
  fr: {},
  pt: {
    'Share with current filters': 'Compartilhar com filtros actuais',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_FormControls_AttachmentSettingsFormSection,
]);
export default translations;
