// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_AlertsApp_ComposeAlertDefinitionModal from 'components/AlertsApp/ComposeAlertDefinitionModal/i18n';
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
    Trigger: 'Trigger',
    'Alert Definitions': 'Alert Definitions',
    'Alert Notifications': 'Alert Notifications',
    'Created by': 'Created by',
    'Delete Alert': 'Delete Alert',
    'Delete this alert?': 'Delete this alert?',
    'Group By': 'Group By',
    'Group By Values': 'Group By Values',
    'Remove Alert': 'Remove Alert',
    'Successfully deleted alert': 'Successfully deleted alert',
    'There are no Alert Definitions': 'There are no Alert Definitions',
    'There are no Alert Notifications': 'There are no Alert Notifications',
    'Time Frequency': 'Time Frequency',
  },
  am: {},
  fr: {
    'Alert Definitions': "Définitions d'Alertes",
    'Alert Notifications': "Notifications d'Alerte",
    'Delete this alert?': 'Supprimer cette alerte ?',
    'Successfully deleted alert': 'Alerte supprimée',
    'There are no Alert Definitions': 'Il n’y a pas de définitions d’alertes',
    'There are no Alert Notifications':
      'Il n’y a pas de Notifications d’Alerte',
  },
  pt: {
    Trigger: 'Desencadear',
    'Alert Definitions': 'Definições de Alerta',
    'Alert Notifications': 'Notificações de Alerta',
    'Created by': 'Criado por',
    'Delete Alert': 'Apagar Alerta',
    'Delete this alert?': 'Tem certeza?',
    'Group By': 'Agrupar por',
    'Group By Values': 'Agrupar por valores',
    'Remove Alert': 'Remover Alerta',
    'Successfully deleted alert': 'Alerta deletado com sucesso',
    'There are no Alert Definitions': 'Não ha definições de alerta',
    'There are no Alert Notifications': 'Nenhuma notificação de alertas',
    'Time Frequency': 'Frequência de Tempo',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_AlertsApp_ComposeAlertDefinitionModal,
]);
export default translations;
