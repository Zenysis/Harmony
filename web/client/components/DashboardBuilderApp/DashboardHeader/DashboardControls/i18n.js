// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/i18n';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/i18n';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_FormControls from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/i18n';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_ShareDashboardLinkForm from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/ShareDashboardLinkForm/i18n';
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
    Save: 'Save',
    cloneDashboardError:
      'An error occurred while saving dashboard specification. Details were written to the console.',
    editMode: 'Edit',
    legacy_warning:
      'You are currently viewing the legacy version of this dashboard. This legacy version will be discontinued in %(daysUntilRemoval)s days.',
    presentMode: 'Present',
    'Dashboard cannot be cloned with the same name':
      'Dashboard cannot be cloned with the same name',
    'Provide a name for your new dashboard':
      'Provide a name for your new dashboard',
    'This legacy dashboard can only be viewed':
      'This legacy dashboard can only be viewed',
    'View Latest Dashboard': 'View Latest Dashboard',
  },
  am: {},
  fr: {
    cloneDashboardError:
      'Une erreur s’est produite lors de l’enregistrement des spécifications du tableau de bord. Les détails ont été écrits sur la console.',
    'Provide a name for your new dashboard':
      'Donnez un nom à votre nouveau tableau de bord',
    editMode: 'Mode édition',
    presentMode: 'Mode lecteure seul',
    Save: 'Enregistrer',
  },
  pt: {
    Save: 'Salvar',
    cloneDashboardError:
      'Ocorreu um erro ao salvar especificação painel. Detalhes foram escritos para o console.',
    editMode: 'Modo de Edição',
    presentMode: 'Modo de Visualização',
    'Dashboard cannot be cloned with the same name':
      'Painel não pode ser clonado com o mesmo nome',
    'Provide a name for your new dashboard':
      'Forneça um nome para o seu novo painel',
    'View Latest Dashboard': 'Ver o painel mais recente',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardControlButton,
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_DashboardSettingsModal,
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_FormControls,
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls_ShareDashboardModal_ShareDashboardLinkForm,
]);
export default translations;
